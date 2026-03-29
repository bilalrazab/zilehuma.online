import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, Search, Plus, ArrowLeft, Clock, Copy, Trash2, Users } from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const TEMPLATES = [
  { name: 'Session Reminder', text: 'Hi! Just a reminder about your upcoming session. Please let me know if you need to reschedule.' },
  { name: 'Homework Check-in', text: 'How is the assigned homework going? Feel free to share any thoughts or questions.' },
  { name: 'Follow-up', text: "I wanted to check in with you. How have you been feeling since our last session?" },
  { name: 'Reschedule', text: 'I need to reschedule our upcoming session. Could you suggest some alternative times that work for you?' },
  { name: 'Resource Shared', text: 'I\'ve shared a new resource with you in the portal. Please take a look when you get a chance.' },
];

const MessagingPage = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showThreadList, setShowThreadList] = useState(true);
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadThreads();
    if (isStaff) loadClients();
    else loadDoctors();
  }, []);

  useEffect(() => {
    if (!activeThread) return;
    loadMessages(activeThread);
    const channel = supabase.channel(`msgs-${activeThread}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${activeThread}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as any]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeThread]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadThreads = async () => {
    const { data } = await db.from('message_threads').select('*').order('last_message_at', { ascending: false });
    if (!data) return;
    const enriched = await Promise.all(data.map(async (t: any) => {
      const otherId = t.participant_one === user?.id ? t.participant_two : t.participant_one;
      const { data: prof } = await db.from('profiles').select('full_name, email, avatar_url').eq('id', otherId).single();
      const { count } = await db.from('messages').select('*', { count: 'exact', head: true })
        .eq('thread_id', t.id).eq('read', false).neq('sender_id', user?.id);
      const { data: lastMsg } = await db.from('messages').select('content, created_at').eq('thread_id', t.id).order('created_at', { ascending: false }).limit(1);
      return {
        ...t,
        otherName: prof?.full_name || prof?.email || 'Unknown User',
        otherEmail: prof?.email,
        otherAvatar: prof?.avatar_url,
        unread: count || 0,
        lastMessage: lastMsg?.[0]?.content || '',
        lastMessageTime: lastMsg?.[0]?.created_at,
      };
    }));
    setThreads(enriched);
  };

  const loadClients = async () => {
    const { data } = await db.from('clients').select('id, full_name, user_id').eq('status', 'active').order('full_name');
    setClients((data || []).filter((c: any) => c.user_id));
  };

  const loadDoctors = async () => {
    // Client finds their assigned therapist via the clients table (doctor_id)
    const { data: clientRows } = await db.from('clients').select('doctor_id').eq('user_id', user?.id);
    if (!clientRows || clientRows.length === 0) return;
    const doctorIds = [...new Set(clientRows.map((c: any) => c.doctor_id).filter(Boolean))];
    if (doctorIds.length === 0) return;
    const { data: profiles } = await db.from('profiles').select('id, full_name, email, avatar_url').in('id', doctorIds);
    setDoctors(profiles || []);
  };

  const loadMessages = async (threadId: string) => {
    const { data } = await db.from('messages').select('*').eq('thread_id', threadId).order('created_at');
    setMessages(data || []);
    await db.from('messages').update({ read: true }).eq('thread_id', threadId).neq('sender_id', user?.id).eq('read', false);
    loadThreads();
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeThread) return;
    try {
      const { error } = await db.from('messages').insert({ thread_id: activeThread, sender_id: user?.id, content: newMsg.trim() });
      if (error) throw error;
      await db.from('message_threads').update({ last_message_at: new Date().toISOString() }).eq('id', activeThread);
      setNewMsg('');

      // Create notification for recipient
      const thread = threads.find(t => t.id === activeThread);
      if (thread) {
        const recipientId = thread.participant_one === user?.id ? thread.participant_two : thread.participant_one;
        await db.from('notifications').insert({
          user_id: recipientId,
          title: 'New Message',
          message: `${(await db.from('profiles').select('full_name').eq('id', user?.id).single()).data?.full_name || 'Someone'} sent you a message`,
          type: 'info',
          link: '/dashboard/messages',
        });
      }
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    }
  };

  const createThread = async () => {
    let targetUserId: string;

    if (isStaff) {
      if (!selectedContactId) { toast({ title: "Select a client", variant: "destructive" }); return; }
      const client = clients.find(c => c.id === selectedContactId);
      if (!client?.user_id) { toast({ title: "Client has no portal account", variant: "destructive" }); return; }
      targetUserId = client.user_id;
    } else {
      // Client initiating chat with doctor
      if (!selectedContactId) { toast({ title: "Select your therapist", variant: "destructive" }); return; }
      targetUserId = selectedContactId;
    }

    // Check existing thread
    const { data: existing } = await db.from('message_threads').select('id')
      .or(`and(participant_one.eq.${user?.id},participant_two.eq.${targetUserId}),and(participant_one.eq.${targetUserId},participant_two.eq.${user?.id})`);
    if (existing && existing.length > 0) {
      setActiveThread(existing[0].id);
      setShowThreadList(false);
      setNewThreadOpen(false);
      return;
    }
    const { data: thread, error } = await db.from('message_threads').insert({ participant_one: user?.id, participant_two: targetUserId }).select().single();
    if (error) {
      toast({ title: "Failed to create conversation", description: error.message, variant: "destructive" });
      return;
    }
    if (thread) {
      setActiveThread(thread.id);
      setShowThreadList(false);
      loadThreads();
    }
    setNewThreadOpen(false);
  };

  const useTemplate = (text: string) => {
    setNewMsg(text);
  };

  const deleteMessage = async (msgId: string) => {
    await db.from('messages').delete().eq('id', msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied" });
  };

  const activeThreadData = threads.find(t => t.id === activeThread);
  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Messages</h1>
          {totalUnread > 0 && <p className="text-sm text-primary font-medium">{totalUnread} unread</p>}
        </div>
        {/* Both staff AND clients can start chats */}
        <Dialog open={newThreadOpen} onOpenChange={setNewThreadOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> New Chat</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{isStaff ? 'Message a Client' : 'Message Your Therapist'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {isStaff ? (
                <div>
                  <Label>Select Client</Label>
                  <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                    <SelectTrigger><SelectValue placeholder="Choose a client..." /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Only clients with portal accounts are shown</p>
                </div>
              ) : (
                <div>
                  <Label>Select Therapist</Label>
                  {doctors.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">No therapists available</p>
                  ) : (
                    <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                      <SelectTrigger><SelectValue placeholder="Choose your therapist..." /></SelectTrigger>
                      <SelectContent>
                        {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              <Button onClick={createThread} className="w-full">Start Chat</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* Thread List */}
        <Card className={`w-72 flex-shrink-0 flex flex-col overflow-hidden ${!showThreadList && activeThread ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.filter(t => t.otherName?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No conversations</p>
                <p className="text-[10px] text-muted-foreground mt-1">Start a new chat to begin</p>
              </div>
            ) : threads.filter(t => t.otherName?.toLowerCase().includes(search.toLowerCase())).map(t => (
              <button key={t.id} onClick={() => { setActiveThread(t.id); setShowThreadList(false); }}
                className={`w-full text-left p-3 border-b transition-colors ${activeThread === t.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}>
                <div className="flex items-center gap-2">
                  <Avatar className={`h-9 w-9 flex-shrink-0 ${t.unread > 0 ? 'ring-2 ring-primary' : ''}`}>
                    {t.otherAvatar && <AvatarImage src={t.otherAvatar} />}
                    <AvatarFallback className={`text-xs font-bold ${t.unread > 0 ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                      {t.otherName?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${t.unread > 0 ? 'font-bold' : 'font-medium'}`}>{t.otherName}</p>
                      {t.unread > 0 && <Badge variant="destructive" className="text-[10px] h-4 min-w-4 px-1 ml-1">{t.unread}</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{t.lastMessage || 'No messages yet'}</p>
                    {t.lastMessageTime && <p className="text-[10px] text-muted-foreground/60">{formatDistanceToNow(parseISO(t.lastMessageTime), { addSuffix: true })}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Chat Panel */}
        <Card className={`flex-1 flex flex-col overflow-hidden ${showThreadList && !activeThread ? 'hidden md:flex' : 'flex'}`}>
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground/10 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Select a conversation</p>
                <p className="text-xs text-muted-foreground mt-1">Choose from the list or start a new chat</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => { setActiveThread(null); setShowThreadList(true); }}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  {activeThreadData?.otherAvatar && <AvatarImage src={activeThreadData.otherAvatar} />}
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                    {activeThreadData?.otherName?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{activeThreadData?.otherName}</p>
                  {activeThreadData?.otherEmail && <p className="text-[10px] text-muted-foreground">{activeThreadData.otherEmail}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground">{messages.length} messages</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                )}
                {messages.map(m => {
                  const isMine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl text-sm relative ${isMine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                          <p className={`text-[10px] ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                            {format(parseISO(m.created_at), 'h:mm a')}
                          </p>
                          {isMine && m.read && <span className="text-[10px] text-primary-foreground/60">✓✓</span>}
                        </div>
                        <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                          <button onClick={() => copyMessage(m.content)} className="h-5 w-5 rounded bg-background/20 flex items-center justify-center hover:bg-background/40">
                            <Copy className="h-2.5 w-2.5" />
                          </button>
                          {isMine && (
                            <button onClick={() => deleteMessage(m.id)} className="h-5 w-5 rounded bg-background/20 flex items-center justify-center hover:bg-destructive/40">
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t">
                {isStaff && (
                  <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                    {TEMPLATES.map(t => (
                      <Button key={t.name} size="sm" variant="outline" className="text-[10px] h-6 whitespace-nowrap flex-shrink-0" onClick={() => useTemplate(t.text)}>
                        {t.name}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..."
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none" rows={1} />
                  <Button size="icon" onClick={sendMessage} disabled={!newMsg.trim()} className="self-end"><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MessagingPage;
