import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User } from "lucide-react";
import { cn } from "@/lib/utils";

const db = supabase as any;

const MessagingPage = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [threadProfiles, setThreadProfiles] = useState<Record<string, any>>({});
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadThreads(); }, [user]);

  useEffect(() => {
    if (!selectedThread) return;
    loadMessages(selectedThread);
    const channel = supabase.channel(`messages-${selectedThread}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${selectedThread}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedThread]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadThreads = async () => {
    const { data } = await db.from('message_threads').select('*').order('last_message_at', { ascending: false });
    setThreads(data || []);
    const profileIds = new Set<string>();
    data?.forEach((t: any) => { profileIds.add(t.participant_1); profileIds.add(t.participant_2); });
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
    if (!newMessage.trim() || !selectedThread) return;
    await db.from('messages').insert({ thread_id: selectedThread, sender_id: user?.id, content: newMessage });
    await db.from('message_threads').update({ last_message_at: new Date().toISOString() }).eq('id', selectedThread);
    setNewMessage("");
  };

  const getOtherUser = (thread: any) => {
    const otherId = thread.participant_1 === user?.id ? thread.participant_2 : thread.participant_1;
    return threadProfiles[otherId]?.full_name || 'User';
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 flex-col md:flex-row">
      {/* Thread list */}
      <div className="w-full md:w-72 flex-shrink-0 space-y-2 overflow-auto">
        <h2 className="font-heading font-bold text-lg mb-3">Messages</h2>
        {threads.map(t => (
          <Card key={t.id} className={cn("cursor-pointer transition-colors", selectedThread === t.id && "border-primary bg-primary/5")} onClick={() => setSelectedThread(t.id)}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-4 w-4 text-primary" /></div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{getOtherUser(t)}</p>
                <p className="text-xs text-muted-foreground">{new Date(t.last_message_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {threads.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet</p>}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col border rounded-lg bg-background min-h-[300px]">
        {selectedThread ? (
          <>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={cn("flex", m.sender_id === user?.id ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[70%] rounded-2xl px-4 py-2 text-sm", m.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t flex gap-2">
              <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && sendMessage()} />
              <Button size="icon" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation</div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;
