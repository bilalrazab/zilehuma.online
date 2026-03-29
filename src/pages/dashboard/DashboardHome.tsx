import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, CheckSquare, DollarSign, Clock, AlertTriangle, ArrowRight, Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import StatsCard from "@/components/dashboard/StatsCard";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const DoctorDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ clients: 0, todaySessions: 0, pendingTasks: 0, unpaid: 0 });
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { count: clientCount } = await db.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { data: sessions } = await db.from('appointments').select('*, clients(full_name)')
      .gte('start_time', today + 'T00:00:00').lte('start_time', today + 'T23:59:59').order('start_time');
    const { data: tasks } = await db.from('tasks').select('*, clients(full_name)')
      .eq('status', 'pending').lte('due_date', today).order('priority');
    const { count: unpaidCount } = await db.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'unpaid');
    setStats({ clients: clientCount || 0, todaySessions: sessions?.length || 0, pendingTasks: tasks?.length || 0, unpaid: unpaidCount || 0 });
    setTodaySessions(sessions || []);
    setTodayTasks(tasks || []);
    const { data: overdue } = await db.from('tasks').select('*, clients(full_name)').eq('status', 'pending').lt('due_date', today).limit(5);
    setAlerts(overdue || []);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">{greeting}, {profile?.full_name?.split(' ')[0] || 'Doctor'}</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Active Clients" value={stats.clients} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Today's Sessions" value={stats.todaySessions} icon={<Calendar className="h-5 w-5" />} />
        <StatsCard title="Pending Tasks" value={stats.pendingTasks} icon={<CheckSquare className="h-5 w-5" />} />
        <StatsCard title="Unpaid" value={stats.unpaid} icon={<DollarSign className="h-5 w-5" />} />
      </div>
      {alerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /> Overdue Tasks</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span>{a.title} — <span className="text-muted-foreground">{a.clients?.full_name}</span></span>
                <Badge variant="outline" className="text-xs">{a.due_date}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Today's Sessions</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/dashboard/calendar')}>View all <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {todaySessions.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No sessions today</p> : (
              <div className="space-y-3">
                {todaySessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/dashboard/clients/${s.client_id}`)}>
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{s.clients?.full_name?.charAt(0) || '?'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.clients?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(s.start_time), 'h:mm a')} · {s.type}</p>
                    </div>
                    <Badge variant={s.status === 'completed' ? 'default' : 'outline'} className="text-xs">{s.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Pending Tasks</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/dashboard/tasks')}>View all <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No pending tasks</p> : (
              <div className="space-y-3">
                {todayTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Badge className="text-[10px] px-1.5 bg-primary text-primary-foreground">{t.priority}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.clients?.full_name} · {t.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ClientPortalHome = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nextSession, setNextSession] = useState<any>(null);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [moodValue, setMoodValue] = useState(5);
  const [moodNote, setMoodNote] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: clientRow } = await db.from('clients').select('id').eq('user_id', user?.id).single();
    if (!clientRow) return;
    const now = new Date().toISOString();
    const { data: session } = await db.from('appointments').select('*').eq('client_id', clientRow.id)
      .gte('start_time', now).eq('status', 'scheduled').order('start_time').limit(1).single();
    setNextSession(session);
    const { count: tc } = await db.from('tasks').select('*', { count: 'exact', head: true }).eq('client_id', clientRow.id).eq('status', 'pending');
    setPendingTasks(tc || 0);
    const { count: mc } = await db.from('messages').select('*', { count: 'exact', head: true }).eq('read', false).neq('sender_id', user?.id);
    setUnreadMessages(mc || 0);
  };

  const logMood = async () => {
    await db.from('mood_entries').insert({ user_id: user?.id, mood: moodValue, note: moodNote || null });
    toast({ title: "Mood logged ✓" });
    setMoodNote('');
  };

  const moodEmojis = ['😞', '😟', '😐', '🙂', '😊', '😄', '🤩', '🥳', '✨', '🌟'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Welcome, {profile?.full_name?.split(' ')[0] || 'there'}</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/sessions')}>
          <CardContent className="p-5">
            <Clock className="h-8 w-8 text-primary mb-2" />
            <p className="font-semibold text-sm">Next Session</p>
            <p className="text-xs text-muted-foreground mt-1">{nextSession ? format(parseISO(nextSession.start_time), 'MMM d, h:mm a') : 'None scheduled'}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/tasks')}>
          <CardContent className="p-5">
            <CheckSquare className="h-8 w-8 text-primary mb-2" />
            <p className="font-semibold text-sm">Pending Tasks</p>
            <p className="text-2xl font-bold mt-1">{pendingTasks}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/messages')}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Smile className="h-8 w-8 text-primary" />
              {unreadMessages > 0 && <Badge variant="destructive" className="text-xs">{unreadMessages} new</Badge>}
            </div>
            <p className="font-semibold text-sm mt-2">Messages</p>
            <p className="text-xs text-muted-foreground mt-1">{unreadMessages > 0 ? `${unreadMessages} unread` : 'All caught up'}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">How are you feeling today?</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            {moodEmojis.map((emoji, i) => (
              <button key={i} onClick={() => setMoodValue(i + 1)}
                className={`text-xl p-1 rounded transition-transform ${moodValue === i + 1 ? 'scale-125 bg-primary/10' : 'opacity-50 hover:opacity-100'}`}>{emoji}</button>
            ))}
          </div>
          <Textarea value={moodNote} onChange={e => setMoodNote(e.target.value)} placeholder="Any notes about how you're feeling..." rows={2} className="mb-3" />
          <Button size="sm" onClick={logMood}>Log Mood</Button>
        </CardContent>
      </Card>
    </div>
  );
};

const DashboardHome = () => {
  const { role } = useAuth();
  if (role === 'client') return <ClientPortalHome />;
  return <DoctorDashboard />;
};

export default DashboardHome;
