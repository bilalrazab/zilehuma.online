import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, MessageSquare, Search, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const db = supabase as any;

const MessagingPage = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [threadProfiles, setThreadProfiles] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadThreads(); }, [user]);

  useEffect(() => {
    if (!selectedThread) return;
    loadMessages(selectedThread);
    // Mark messages as read
    db.from('messages').update({ read: true }).eq('thread_id', selectedThread).neq('sender_id', user?.id).eq('read', false);
    
    const channel = supabase.channel(`messages-${selectedThread}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${selectedThread}` }, (payload: any) => {
        setMessages(prev => [...prev, payload.new]);
        // Mark incoming as read immediately
        if (payload.new.sender_id !== user?.id) {
          db.from('messages').update({ read: true }).eq('id', payload.new.id);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedThread]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadThreads = async () => {
    const { data } = await db.from('message_threads').select('*').order('last_message_at', { ascending: false });
    setThreads(data || []);
    const profileIds = new Set<string>();
    data?.forEach((t: any) => { profileIds.add(t.participant_one); profileIds.add(t.participant_two); });
    profileIds.delete(undefined);
    if (profileIds.size > 0) {
      const { data: profiles } = await db.from('profiles').select('id, full_name, avatar_url').in('id', Array.from(profileIds));
      const map: Record<string, any> = {};
      profiles?.forEach((p: any) => { map[p.id] = p; });
      setThreadProfiles(map);
    }
  };

  const loadMessages = async (threadId: string) => {
    const { data } = await db.from('messages').select('*').eq('thread_id', threadId).order('created_at');
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || sending) return;
    setSending(true);
    await db.from('messages').insert({ thread_id: selectedThread, sender_id: user?.id, content: newMessage });
    await db.from('message_threads').update({ last_message_at: new Date().toISOString() }).eq('id', selectedThread);
    setNewMessage("");
    setSending(false);
  };

  const getOtherUser = (thread: any) => {
    const otherId = thread.participant_one === user?.id ? thread.participant_two : thread.participant_one;
    return threadProfiles[otherId]?.full_name || 'User';
  };

  const getOtherInitial = (thread: any) => {
    const name = getOtherUser(thread);
    return name.charAt(0).toUpperCase();
  };

  const filteredThreads = threads.filter(t =>
    !searchQuery || getOtherUser(t).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const selectedThreadData = threads.find(t => t.id === selectedThread);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 flex-col md:flex-row rounded-xl border overflow-hidden bg-background">
      {/* Thread list */}
      <div className={cn(
        "w-full md:w-80 flex-shrink-0 border-r flex flex-col",
        selectedThread ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b">
          <h2 className="font-heading font-bold text-lg mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-9 h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filteredThreads.map(t => (
            <div key={t.id}
              className={cn("flex items-center gap-3 p-4 cursor-pointer border-b hover:bg-muted/50 transition-colors",
                selectedThread === t.id && "bg-primary/5 border-l-2 border-l-primary"
              )}
              onClick={() => setSelectedThread(t.id)}>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary flex-shrink-0">
                {getOtherInitial(t)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{getOtherUser(t)}</p>
                <p className="text-xs text-muted-foreground">{t.last_message_at ? formatMessageTime(t.last_message_at) : 'No messages'}</p>
              </div>
            </div>
          ))}
          {filteredThreads.length === 0 && (
            <div className="text-center py-12 px-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No conversations</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={cn(
        "flex-1 flex flex-col min-h-0",
        !selectedThread ? "hidden md:flex" : "flex"
      )}>
        {selectedThread && selectedThreadData ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b flex items-center gap-3 bg-background">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedThread(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                {getOtherInitial(selectedThreadData)}
              </div>
              <div>
                <p className="font-semibold text-sm">{getOtherUser(selectedThreadData)}</p>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </div>
              )}
              {messages.map((m, i) => {
                const isMe = m.sender_id === user?.id;
                const showTime = i === 0 || new Date(m.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 300000;
                return (
                  <div key={m.id}>
                    {showTime && (
                      <p className="text-center text-xs text-muted-foreground my-4">{formatMessageTime(m.created_at)}</p>
                    )}
                    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                      )}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            
            {/* Input */}
            <div className="p-3 border-t flex gap-2 bg-background">
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="rounded-full"
              />
              <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim() || sending} className="rounded-full flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="font-medium text-lg">Select a conversation</p>
            <p className="text-sm mt-1">Choose from your existing conversations</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;
