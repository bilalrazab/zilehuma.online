import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Calendar, CheckSquare, DollarSign, Clock, AlertTriangle,
  ArrowRight, Smile, TrendingUp, Activity, Bell, Plus, UserPlus,
  Target, BookOpen, MessageSquare, BarChart3, Zap, FileText, Star,
  CheckCircle2, Trash2, XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const db = supabase as any;

/* ─── DOCTOR DASHBOARD ─── */
const DoctorDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({ clients: 0, todaySessions: 0, pendingTasks: 0, unpaid: 0, revenue: 0, overdue: 0, pendingRequests: 0 });
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [upcomingWeek, setUpcomingWeek] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [weeklyChart, setWeeklyChart] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [tasksByType, setTasksByType] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingTestimonials, setPendingTestimonials] = useState<any[]>([]);
  const [pendingComments, setPendingComments] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const [clientsRes, sessionsRes, tasksRes, unpaidRes, paymentsRes, overdueRes, pipelineRes, weekSessionsRes, notifRes, recentClientsRes, allTasksRes, timelineRes, pendingReqRes] = await Promise.all([
      db.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('appointments').select('*, clients(full_name)').gte('start_time', today + 'T00:00:00').lte('start_time', today + 'T23:59:59').order('start_time'),
      db.from('tasks').select('*, clients(full_name)').eq('status', 'pending').lte('due_date', today).order('priority'),
      db.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'unpaid'),
      db.from('payments').select('amount').eq('status', 'paid'),
      db.from('tasks').select('*, clients(full_name)').eq('status', 'pending').lt('due_date', today).limit(10),
      db.from('clients').select('pipeline_stage'),
      db.from('appointments').select('*, clients(full_name)').gte('start_time', weekStart.toISOString()).lte('start_time', weekEnd.toISOString()).order('start_time'),
      db.from('notifications').select('*').eq('user_id', user?.id).eq('read', false).order('created_at', { ascending: false }).limit(5),
      db.from('clients').select('*').order('created_at', { ascending: false }).limit(5),
      db.from('tasks').select('type, status'),
      db.from('timeline_logs').select('*, clients:client_id(full_name)').order('created_at', { ascending: false }).limit(15),
      db.from('appointments').select('*, clients(full_name, email)').eq('status', 'pending_approval').order('start_time'),
    ]);

    const totalRevenue = (paymentsRes.data || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    setStats({
      clients: clientsRes.count || 0,
      todaySessions: sessionsRes.data?.length || 0,
      pendingTasks: tasksRes.data?.length || 0,
      unpaid: unpaidRes.count || 0,
      revenue: totalRevenue,
      overdue: overdueRes.data?.length || 0,
      pendingRequests: (pendingReqRes.data || []).length,
    });

    setPendingRequests(pendingReqRes.data || []);

    setTodaySessions(sessionsRes.data || []);
    setOverdueTasks(overdueRes.data || []);
    setUpcomingWeek(weekSessionsRes.data || []);
    setNotifications(notifRes.data || []);
    setRecentClients(recentClientsRes.data || []);
    setRecentActivity(timelineRes.data || []);

    // Pipeline chart data
    const stages = ['new_inquiry', 'contacted', 'intake_started', 'intake_completed', 'booked', 'active', 'inactive', 'closed'];
    const stageLabels: Record<string, string> = { new_inquiry: 'New', contacted: 'Contacted', intake_started: 'Intake', intake_completed: 'Intake Done', booked: 'Booked', active: 'Active', inactive: 'Inactive', closed: 'Closed' };
    const pipelineCounts = stages.map(s => ({ name: stageLabels[s] || s, value: (pipelineRes.data || []).filter((c: any) => c.pipeline_stage === s).length })).filter(s => s.value > 0);
    setPipelineData(pipelineCounts);

    // Task breakdown
    const allTasks = allTasksRes.data || [];
    const typeMap: Record<string, number> = {};
    allTasks.filter((t: any) => t.status === 'pending').forEach((t: any) => { typeMap[t.type] = (typeMap[t.type] || 0) + 1; });
    setTasksByType(Object.entries(typeMap).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })));

    // Weekly session chart
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekData = weekDays.map(day => ({
      day: format(day, 'EEE'),
      sessions: (weekSessionsRes.data || []).filter((s: any) => isSameDay(parseISO(s.start_time), day)).length,
      today: isToday(day),
    }));
    setWeeklyChart(weekData);
  };

  const markNotifRead = async (id: string) => {
    await db.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const approveRequest = async (session: any) => {
    try {
      await db.from('appointments').update({ status: 'scheduled' }).eq('id', session.id);
      if (session.client_id) {
        const { data: cl } = await db.from('clients').select('user_id, full_name').eq('id', session.client_id).single();
        if (cl?.user_id) {
          await db.from('notifications').insert({
            user_id: cl.user_id, title: 'Session Approved ✅',
            message: `Your session for ${format(parseISO(session.start_time), 'MMM d, h:mm a')} has been approved.`,
            type: 'info', link: '/dashboard/sessions',
          });
        }
      }
      toast({ title: "✅ Session approved" }); load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const rejectRequest = async (session: any) => {
    try {
      await db.from('appointments').update({ status: 'cancelled' }).eq('id', session.id);
      const { data: cl } = await db.from('clients').select('user_id').eq('id', session.client_id).single();
      if (cl?.user_id) {
        await db.from('notifications').insert({
          user_id: cl.user_id, title: 'Session Request Declined',
          message: `Your session request for ${format(parseISO(session.start_time), 'MMM d')} was declined. Please try another time.`,
          type: 'info', link: '/dashboard/sessions',
        });
      }
      toast({ title: "Request declined" }); load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const COLORS = ['hsl(var(--primary))', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">{greeting}, {profile?.full_name?.split(' ')[0] || 'Doctor'}</h1>
          <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate('/dashboard/clients')}><UserPlus className="h-3.5 w-3.5 mr-1.5" /> New Client</Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/calendar')}><Calendar className="h-3.5 w-3.5 mr-1.5" /> Schedule</Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/tasks')}><CheckSquare className="h-3.5 w-3.5 mr-1.5" /> New Task</Button>
        </div>
      </div>

      {/* Notifications Bar */}
      {notifications.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{notifications.length} Notifications</span>
            </div>
            <div className="space-y-1">
              {notifications.map(n => (
                <div key={n.id} className="flex items-center justify-between text-sm bg-background/80 rounded-md p-2">
                  <span className="text-xs">{n.title}: {n.message}</span>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => markNotifRead(n.id)}>Dismiss</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/clients')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Users className="h-4 w-4 text-blue-500" /></div>
            </div>
            <p className="text-2xl font-bold">{stats.clients}</p>
            <p className="text-xs text-muted-foreground">Active Clients</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/calendar')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Calendar className="h-4 w-4 text-emerald-500" /></div>
            </div>
            <p className="text-2xl font-bold">{stats.todaySessions}</p>
            <p className="text-xs text-muted-foreground">Today's Sessions</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/tasks')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><CheckSquare className="h-4 w-4 text-amber-500" /></div>
            </div>
            <p className="text-2xl font-bold">{stats.pendingTasks}</p>
            <p className="text-xs text-muted-foreground">Pending Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-violet-500" /></div>
            </div>
            <p className="text-2xl font-bold">Rs. {stats.revenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-pink-500" /></div>
            </div>
            <p className="text-2xl font-bold">{stats.unpaid}</p>
            <p className="text-xs text-muted-foreground">Unpaid Sessions</p>
          </CardContent>
        </Card>
        <Card className={stats.overdue > 0 ? 'border-destructive/50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
            </div>
            <p className="text-2xl font-bold">{stats.overdue}</p>
            <p className="text-xs text-muted-foreground">Overdue Tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alerts */}
      {overdueTasks.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> {overdueTasks.length} Overdue Tasks — Require Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueTasks.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-background/60 cursor-pointer hover:bg-background"
                onClick={() => a.client_id && navigate(`/dashboard/clients/${a.client_id}`)}>
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] bg-destructive text-destructive-foreground">{a.priority}</Badge>
                  <span className="font-medium">{a.title}</span>
                  {a.clients?.full_name && <span className="text-muted-foreground">— {a.clients.full_name}</span>}
                </div>
                <span className="text-xs text-destructive">{a.due_date}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending Session Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Calendar className="h-4 w-4" /> {pendingRequests.length} Pending Session Request{pendingRequests.length > 1 ? 's' : ''}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/dashboard/calendar')}>View Calendar <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.clients?.full_name || 'Client'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{format(parseISO(r.start_time), 'MMM d, h:mm a')}</span>
                    <span className="capitalize">{r.type}</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs" onClick={() => approveRequest(r)}>Approve</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => rejectRequest(r)}>Decline</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Weekly Sessions Chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">This Week's Sessions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyChart}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Distribution */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Client Pipeline</CardTitle></CardHeader>
          <CardContent>
            {pipelineData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No clients yet</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                      {pipelineData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1">
                  {pipelineData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="flex-1">{s.name}</span>
                      <span className="font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Task Breakdown</CardTitle></CardHeader>
          <CardContent>
            {tasksByType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No pending tasks</p>
            ) : (
              <div className="space-y-3">
                {tasksByType.map(t => (
                  <div key={t.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize">{t.name}</span>
                      <span className="font-medium">{t.value}</span>
                    </div>
                    <Progress value={Math.min((t.value / Math.max(...tasksByType.map(x => x.value))) * 100, 100)} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today's Sessions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Today's Schedule</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/dashboard/calendar')}>View all <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {todaySessions.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No sessions scheduled today</p>
                <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => navigate('/dashboard/calendar')}>
                  <Plus className="h-3 w-3 mr-1" /> Schedule Session
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/dashboard/clients/${s.client_id}`)}>
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {s.clients?.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.clients?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(s.start_time), 'h:mm a')} · {s.duration_minutes || 50}m · {s.type}</p>
                    </div>
                    <Badge variant={s.status === 'completed' ? 'default' : s.status === 'no_show' ? 'destructive' : 'outline'} className="text-[10px]">{s.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Week */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> This Week ({upcomingWeek.length} sessions)</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingWeek.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No sessions this week</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {upcomingWeek.map(s => (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-sm"
                    onClick={() => navigate(`/dashboard/clients/${s.client_id}`)}>
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isToday(parseISO(s.start_time)) ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                    <span className="text-xs text-muted-foreground w-16">{format(parseISO(s.start_time), 'EEE h:mm a')}</span>
                    <span className="font-medium truncate flex-1">{s.clients?.full_name}</span>
                    <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Recent Clients</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/dashboard/clients')}>All <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentClients.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/dashboard/clients/${c.id}`)}>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {c.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.email}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{c.pipeline_stage?.replace(/_/g, ' ') || 'active'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {recentActivity.map(a => {
                const typeIcon: Record<string, any> = { session: Clock, payment: DollarSign, task: CheckSquare, note: FileText, system: Zap, checklist: CheckSquare };
                const Icon = typeIcon[a.type] || Activity;
                return (
                  <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border text-sm">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      a.type === 'session' ? 'bg-blue-500/10 text-blue-500' :
                      a.type === 'payment' ? 'bg-emerald-500/10 text-emerald-500' :
                      a.type === 'task' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed">{a.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {(a as any).clients?.full_name && <span className="text-[10px] text-primary font-medium">{(a as any).clients.full_name}</span>}
                        <span className="text-[10px] text-muted-foreground">{format(parseISO(a.created_at), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* ─── CLIENT PORTAL HOME ─── */
const ClientPortalHome = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nextSession, setNextSession] = useState<any>(null);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [moodValue, setMoodValue] = useState(5);
  const [moodNote, setMoodNote] = useState('');
  const [recentMoods, setRecentMoods] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [pendingResources, setPendingResources] = useState<any[]>([]);
  const [recentTimeline, setRecentTimeline] = useState<any[]>([]);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: clientRow } = await db.from('clients').select('id').eq('user_id', user?.id).single();
    if (!clientRow) return;
    const cid = clientRow.id;
    const now = new Date().toISOString();

    const [sessionRes, tasksRes, msgRes, moodRes, goalsRes, resourcesRes, timelineRes, sessionCountRes] = await Promise.all([
      db.from('appointments').select('*').eq('client_id', cid).gte('start_time', now).eq('status', 'scheduled').order('start_time').limit(1),
      db.from('tasks').select('*').eq('client_id', cid),
      db.from('messages').select('*', { count: 'exact', head: true }).eq('read', false).neq('sender_id', user?.id),
      db.from('mood_entries').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(14),
      db.from('goals').select('*').eq('client_id', cid),
      db.from('resource_assignments').select('*, resources(title, type)').eq('client_id', cid).eq('status', 'pending'),
      db.from('timeline_logs').select('*').eq('client_id', cid).order('created_at', { ascending: false }).limit(10),
      db.from('appointments').select('*', { count: 'exact', head: true }).eq('client_id', cid).eq('status', 'completed'),
    ]);

    setNextSession(sessionRes.data?.[0] || null);
    const allTasks = tasksRes.data || [];
    setPendingTasks(allTasks.filter((t: any) => t.status === 'pending').length);
    setCompletedTasks(allTasks.filter((t: any) => t.status === 'completed').length);
    setUnreadMessages(msgRes.count || 0);
    setRecentMoods((moodRes.data || []).reverse().map((m: any) => ({ date: format(parseISO(m.created_at), 'MMM d'), mood: m.mood })));
    setGoals(goalsRes.data || []);
    setPendingResources(resourcesRes.data || []);
    setRecentTimeline(timelineRes.data || []);
    setSessionCount(sessionCountRes.count || 0);
  };

  const logMood = async () => {
    await db.from('mood_entries').insert({ user_id: user?.id, mood: moodValue, note: moodNote || null });
    toast({ title: "Mood logged ✓" });
    setMoodNote('');
    load();
  };

  const moodEmojis = ['😞', '😟', '😐', '🙂', '😊', '😄', '🤩', '🥳', '✨', '🌟'];
  const totalTasks = pendingTasks + completedTasks;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const achievedGoals = goals.filter(g => g.status === 'achieved').length;
  const goalProgress = goals.length > 0 ? Math.round((achievedGoals / goals.length) * 100) : 0;

  const affirmations = [
    "Every step forward is progress, no matter how small.",
    "You are worthy of the time and space you take up.",
    "Healing is not linear, and that's okay.",
    "Be gentle with yourself; you're doing the best you can.",
    "Your feelings are valid. All of them.",
  ];
  const dailyAffirmation = affirmations[new Date().getDate() % affirmations.length];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Daily Affirmation */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Star className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Today's Affirmation</p>
            <p className="text-sm italic text-foreground/80">{dailyAffirmation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/sessions')}>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Next Session</p>
            <p className="text-sm font-bold mt-1">{nextSession ? format(parseISO(nextSession.start_time), 'MMM d, h:mm a') : 'None'}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/tasks')}>
          <CardContent className="p-4 text-center">
            <CheckSquare className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Tasks</p>
            <p className="text-2xl font-bold">{pendingTasks}</p>
            <p className="text-[10px] text-muted-foreground">pending</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/messages')}>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Messages</p>
            {unreadMessages > 0 ? <Badge variant="destructive" className="text-xs mt-1">{unreadMessages} new</Badge> : <p className="text-sm font-medium mt-1">All read</p>}
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/progress')}>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Sessions Done</p>
            <p className="text-2xl font-bold">{sessionCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Task Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{completedTasks} of {totalTasks} completed</span>
              <span className="font-bold">{taskProgress}%</span>
            </div>
            <Progress value={taskProgress} className="h-3" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Goals Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{achievedGoals} of {goals.length} achieved</span>
              <span className="font-bold">{goalProgress}%</span>
            </div>
            <Progress value={goalProgress} className="h-3" />
          </CardContent>
        </Card>
      </div>

      {/* Mood Tracker + Chart */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Smile className="h-4 w-4" /> How are you feeling?</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {moodEmojis.map((emoji, i) => (
                <button key={i} onClick={() => setMoodValue(i + 1)}
                  className={`text-lg p-1 rounded transition-all ${moodValue === i + 1 ? 'scale-125 bg-primary/10 ring-2 ring-primary' : 'opacity-40 hover:opacity-80'}`}>{emoji}</button>
              ))}
            </div>
            <Textarea value={moodNote} onChange={e => setMoodNote(e.target.value)} placeholder="How are you feeling today?" rows={2} className="mb-3 text-sm" />
            <Button size="sm" onClick={logMood} className="w-full">Log Mood</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Mood Trend</CardTitle></CardHeader>
          <CardContent>
            {recentMoods.length < 2 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Log more moods to see your trend</p>
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={recentMoods}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis domain={[1, 10]} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="mood" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Resources */}
      {pendingResources.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> Assigned Resources ({pendingResources.length} pending)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingResources.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg border">
                  <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.resources?.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{r.resources?.type}</p>
                  </div>
                  {r.due_date && <span className="text-[10px] text-muted-foreground">Due: {r.due_date}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> My Goals</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/dashboard/progress')}>Details <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {goals.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center ${g.status === 'achieved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                    {g.status === 'achieved' ? '✓' : '○'}
                  </div>
                  <span className={`text-sm flex-1 ${g.status === 'achieved' ? 'line-through text-muted-foreground' : ''}`}>{g.title}</span>
                  {g.target_date && <span className="text-[10px] text-muted-foreground">{g.target_date}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentTimeline.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTimeline.map(t => (
                <div key={t.id} className="flex items-start gap-2.5 text-sm">
                  <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                    t.type === 'session' ? 'bg-blue-500' : t.type === 'task' ? 'bg-amber-500' : 'bg-muted-foreground'
                  }`} />
                  <div>
                    <p className="text-xs">{t.description}</p>
                    <p className="text-[10px] text-muted-foreground">{format(parseISO(t.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ─── ROUTER ─── */
const DashboardHome = () => {
  const { role } = useAuth();
  if (role === 'client') return <ClientPortalHome />;
  return <DoctorDashboard />;
};

export default DashboardHome;
