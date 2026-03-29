import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import StatsCard from "@/components/dashboard/StatsCard";
import {
  Users, Calendar, FileText, BookOpen, Clock, MessageSquare,
  Smile, TrendingUp, ArrowRight, Activity, CheckCircle2, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

const db = supabase as any;

const DashboardHome = () => {
  const { role, user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ clients: 0, todaySessions: 0, totalSessions: 0, resources: 0 });
  const [upcomingAppts, setUpcomingAppts] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (role === 'doctor' || role === 'super_admin') loadDoctorData();
    else if (role === 'client') loadClientData();
  }, [role]);

  const loadDoctorData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [clients, todayAppts, notes, resources, upcoming, msgs] = await Promise.all([
      db.from('clients').select('id', { count: 'exact', head: true }),
      db.from('appointments').select('*').gte('start_time', today).lte('start_time', today + 'T23:59:59'),
      db.from('session_notes').select('id', { count: 'exact', head: true }),
      db.from('resources').select('id', { count: 'exact', head: true }),
      db.from('appointments').select('*, clients(full_name)').gte('start_time', new Date().toISOString()).order('start_time').limit(5),
      db.from('messages').select('id', { count: 'exact', head: true }).eq('read', false).neq('sender_id', user?.id),
    ]);
    setStats({
      clients: clients.count || 0,
      todaySessions: todayAppts.data?.length || 0,
      totalSessions: notes.count || 0,
      resources: resources.count || 0,
    });
    setUpcomingAppts(upcoming.data || []);
    setUnreadMessages(msgs.count || 0);
    const { data: logs } = await db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(8);
    setRecentActivity(logs || []);
  };

  const loadClientData = async () => {
    const { data: clientRecord } = await db.from('clients').select('id').eq('user_id', user?.id).single();
    if (clientRecord) {
      const [appts, msgs] = await Promise.all([
        db.from('appointments').select('*').eq('client_id', clientRecord.id).gte('start_time', new Date().toISOString()).order('start_time').limit(5),
        db.from('messages').select('id', { count: 'exact', head: true }).eq('read', false).neq('sender_id', user?.id),
      ]);
      setUpcomingAppts(appts.data || []);
      setUnreadMessages(msgs.count || 0);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (role === 'client') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">{greeting()}, {profile?.full_name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your care</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300" onClick={() => navigate('/dashboard/appointments')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Appointments</p>
                <p className="text-sm text-muted-foreground">View & manage sessions</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
          <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300" onClick={() => navigate('/dashboard/messages')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors relative">
                <MessageSquare className="h-6 w-6 text-blue-500" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadMessages}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Messages</p>
                <p className="text-sm text-muted-foreground">Chat with your therapist</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
          <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300" onClick={() => navigate('/dashboard/mood')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Smile className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Mood Tracker</p>
                <p className="text-sm text-muted-foreground">Log how you're feeling</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/appointments')}>View all <ArrowRight className="ml-1 h-3 w-3" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming appointments</p>
                <p className="text-sm text-muted-foreground mt-1">Contact your therapist to schedule a session</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppts.map((a, i) => (
                  <div key={a.id} className={`flex items-center gap-4 p-3 rounded-xl ${i === 0 ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/50'} transition-colors`}>
                    <div className="text-center min-w-[3rem]">
                      <p className="text-xs text-muted-foreground font-medium">{formatDate(a.start_time)}</p>
                      <p className="text-lg font-bold text-primary">{formatTime(a.start_time)}</p>
                    </div>
                    <div className="h-10 border-l border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{a.type}</Badge>
                        <Badge variant={a.status === 'scheduled' ? 'default' : 'secondary'} className="text-xs">{a.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resources & Session History Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => navigate('/dashboard/resources')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold">My Resources</p>
                <p className="text-sm text-muted-foreground">View assigned materials</p>
              </div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => navigate('/dashboard/sessions')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <p className="font-semibold">Session History</p>
                <p className="text-sm text-muted-foreground">Review past sessions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Doctor / Super Admin view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">{greeting()}, {profile?.full_name?.split(' ')[0] || 'Doctor'} 👋</h1>
        <p className="text-muted-foreground mt-1">Here's your practice overview for today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Clients" value={stats.clients} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Today's Sessions" value={stats.todaySessions} icon={<Calendar className="h-5 w-5" />} />
        <StatsCard title="Session Notes" value={stats.totalSessions} icon={<FileText className="h-5 w-5" />} />
        <StatsCard title="Resources" value={stats.resources} icon={<BookOpen className="h-5 w-5" />} />
      </div>

      {/* Unread Messages Alert */}
      {unreadMessages > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/messages')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-700 dark:text-blue-300">You have {unreadMessages} unread message{unreadMessages > 1 ? 's' : ''}</p>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70">Click to view your conversations</p>
            </div>
            <ArrowRight className="h-5 w-5 text-blue-500" />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming Appointments - takes 3 cols */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                <CardDescription>Next scheduled sessions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/appointments')}>View all <ArrowRight className="ml-1 h-3 w-3" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">All clear!</p>
                <p className="text-sm text-muted-foreground">No upcoming appointments scheduled</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingAppts.map((a, i) => (
                  <div key={a.id} className={`flex items-center gap-4 p-3 rounded-xl ${i === 0 ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/50'} transition-colors`}>
                    <div className="text-center min-w-[3.5rem]">
                      <p className="text-xs text-muted-foreground font-medium uppercase">{formatDate(a.start_time)}</p>
                      <p className="text-lg font-bold text-primary">{formatTime(a.start_time)}</p>
                    </div>
                    <div className="h-10 border-l border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{a.clients?.full_name || 'Client'}</p>
                      <p className="text-sm text-muted-foreground">{a.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{a.type}</Badge>
                      <Badge variant={a.status === 'scheduled' ? 'default' : 'secondary'} className="text-xs">{a.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - takes 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={() => navigate('/dashboard/clients')}>
                <Users className="h-4 w-4 text-primary" /> Manage Clients
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={() => navigate('/dashboard/appointments')}>
                <Calendar className="h-4 w-4 text-primary" /> Schedule Appointment
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={() => navigate('/dashboard/sessions')}>
                <FileText className="h-4 w-4 text-primary" /> Write Session Note
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={() => navigate('/dashboard/resources')}>
                <BookOpen className="h-4 w-4 text-primary" /> Add Resource
              </Button>
              {role === 'super_admin' && (
                <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={() => navigate('/dashboard/audit-log')}>
                  <Activity className="h-4 w-4 text-primary" /> View Audit Log
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No recent activity yet. Start by adding clients and scheduling appointments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-muted-foreground text-xs">{log.entity_type}</p>
                  </div>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
