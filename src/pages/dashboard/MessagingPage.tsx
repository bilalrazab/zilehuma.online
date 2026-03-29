import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Search } from "lucide-react";
import { format, parseISO } from "date-fns";

const db = supabase as any;

const MessagingPage = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [search, setSearch] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadThreads(); }, []);

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
      const { data: prof } = await db.from('profiles').select('full_name').eq('id', otherId).single();
      const { count } = await db.from('messages').select('*', { count: 'exact', head: true })
        .eq('thread_id', t.id).eq('read', false).neq('sender_id', user?.id);
      return { ...t, otherName: prof?.full_name || 'Unknown', unread: count || 0 };
    }));
    setThreads(enriched);
  };

  const loadMessages = async (threadId: string) => {
    const { data } = await db.from('messages').select('*').eq('thread_id', threadId).order('created_at');
    setMessages(data || []);
    await db.from('messages').update({ read: true }).eq('thread_id', threadId).neq('sender_id', user?.id).eq('read', false);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeThread) return;
    await db.from('messages').insert({ thread_id: activeThread, sender_id: user?.id, content: newMsg.trim() });
    await db.from('message_threads').update({ last_message_at: new Date().toISOString() }).eq('id', activeThread);
    setNewMsg('');
  };

  const activeThreadData = threads.find(t => t.id === activeThread);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-heading font-bold">Messages</h1>
      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        <Card className="w-72 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.filter(t => t.otherName?.toLowerCase().includes(search.toLowerCase())).map(t => (
              <button key={t.id} onClick={() => setActiveThread(t.id)}
                className={`w-full text-left p-3 border-b transition-colors ${activeThread === t.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{t.otherName?.charAt(0)?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.otherName}</p>
                    {t.last_message_at && <p className="text-[10px] text-muted-foreground">{format(parseISO(t.last_message_at), 'MMM d, h:mm a')}</p>}
                  </div>
                  {t.unread > 0 && <Badge variant="destructive" className="text-[10px] h-4 min-w-4 px-1">{t.unread}</Badge>}
                </div>
              </button>
            ))}
            {threads.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No conversations</p>}
          </div>
        </Card>
        <Card className="flex-1 flex flex-col overflow-hidden">
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center"><MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Select a conversation</p></div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{activeThreadData?.otherName?.charAt(0)?.toUpperCase()}</div>
                <p className="font-semibold text-sm">{activeThreadData?.otherName}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => {
                  const isMine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                        <p>{m.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{format(parseISO(m.created_at), 'h:mm a')}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t flex gap-2">
                <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1" />
                <Button size="icon" onClick={sendMessage} disabled={!newMsg.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MessagingPage;
