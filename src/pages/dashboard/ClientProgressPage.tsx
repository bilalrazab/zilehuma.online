import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Calendar, CheckSquare, Target, TrendingUp, BookOpen, Smile, Award } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, subDays, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";

const db = supabase as any;

const ClientProgressPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ sessions: 0, completedTasks: 0, totalTasks: 0, goals: 0, achievedGoals: 0, resources: 0, completedResources: 0 });
  const [moodData, setMoodData] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [sessionFrequency, setSessionFrequency] = useState<any[]>([]);
  const [taskCompletion, setTaskCompletion] = useState<any[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
    if (!cr) return;
    const cid = cr.id;

    const [sessionsRes, tasksRes, goalsRes, moodRes, resourcesRes, allSessionsRes] = await Promise.all([
      db.from('appointments').select('*', { count: 'exact', head: true }).eq('client_id', cid).eq('status', 'completed'),
      db.from('tasks').select('*').eq('client_id', cid),
      db.from('goals').select('*').eq('client_id', cid),
      db.from('mood_entries').select('*').eq('user_id', user?.id).gte('created_at', subDays(new Date(), 60).toISOString()).order('created_at'),
      db.from('resource_assignments').select('*').eq('client_id', cid),
      db.from('appointments').select('start_time, status').eq('client_id', cid).gte('start_time', subDays(new Date(), 90).toISOString()).order('start_time'),
    ]);

    const allTasks = tasksRes.data || [];
    const allGoals = goalsRes.data || [];
    const allResources = resourcesRes.data || [];

    setStats({
      sessions: sessionsRes.count || 0,
      completedTasks: allTasks.filter((t: any) => t.status === 'completed').length,
      totalTasks: allTasks.length,
      goals: allGoals.length,
      achievedGoals: allGoals.filter((g: any) => g.status === 'achieved').length,
      resources: allResources.length,
      completedResources: allResources.filter((r: any) => r.status === 'completed').length,
    });

    setGoals(allGoals);
    setMoodData((moodRes.data || []).map((m: any) => ({
      date: format(parseISO(m.created_at), 'MMM d'),
      mood: m.mood,
      note: m.note,
    })));

    // Session frequency (weekly for last 12 weeks)
    const allSessions = allSessionsRes.data || [];
    const weeks = eachWeekOfInterval({ start: subDays(new Date(), 84), end: new Date() }, { weekStartsOn: 1 });
    const weeklyData = weeks.map(weekStart => {
      const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const count = allSessions.filter((s: any) => {
        const d = parseISO(s.start_time);
        return d >= weekStart && d <= wEnd && s.status === 'completed';
      }).length;
      return { week: format(weekStart, 'MMM d'), sessions: count };
    });
    setSessionFrequency(weeklyData);

    // Task completion over time
    const completedByWeek = weeks.map(weekStart => {
      const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const completed = allTasks.filter((t: any) => {
        if (!t.completed_at) return false;
        const d = parseISO(t.completed_at);
        return d >= weekStart && d <= wEnd;
      }).length;
      return { week: format(weekStart, 'MMM d'), completed };
    });
    setTaskCompletion(completedByWeek);

    // Recent achievements
    const achievements: any[] = [];
    if ((sessionsRes.count || 0) >= 5) achievements.push({ icon: '🎯', title: '5+ Sessions', desc: 'You\'ve completed 5 sessions!' });
    if ((sessionsRes.count || 0) >= 10) achievements.push({ icon: '⭐', title: '10+ Sessions', desc: 'Milestone: 10 sessions completed!' });
    if (allGoals.some((g: any) => g.status === 'achieved')) achievements.push({ icon: '🏆', title: 'Goal Achieved', desc: 'You achieved a goal!' });
    if (allTasks.filter((t: any) => t.status === 'completed').length >= 10) achievements.push({ icon: '📋', title: 'Task Master', desc: '10+ tasks completed!' });
    if (allResources.filter((r: any) => r.status === 'completed').length >= 3) achievements.push({ icon: '📚', title: 'Resource Explorer', desc: '3+ resources completed!' });
    setRecentAchievements(achievements);
  };

  const taskProgress = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const goalProgress = stats.goals > 0 ? Math.round((stats.achievedGoals / stats.goals) * 100) : 0;
  const resourceProgress = stats.resources > 0 ? Math.round((stats.completedResources / stats.resources) * 100) : 0;
  const avgMood = moodData.length > 0 ? (moodData.reduce((s, m) => s + m.mood, 0) / moodData.length).toFixed(1) : '—';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">My Progress</h1>

      {/* Achievements */}
      {recentAchievements.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Achievements</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {recentAchievements.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-background/60 rounded-lg p-2 min-w-fit">
                  <span className="text-xl">{a.icon}</span>
                  <div><p className="text-xs font-semibold">{a.title}</p><p className="text-[10px] text-muted-foreground">{a.desc}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <Calendar className="h-6 w-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.sessions}</p>
          <p className="text-xs text-muted-foreground">Sessions Done</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckSquare className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.completedTasks}<span className="text-sm text-muted-foreground">/{stats.totalTasks}</span></p>
          <p className="text-xs text-muted-foreground">Tasks Done</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Target className="h-6 w-6 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.achievedGoals}<span className="text-sm text-muted-foreground">/{stats.goals}</span></p>
          <p className="text-xs text-muted-foreground">Goals Achieved</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Smile className="h-6 w-6 text-pink-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{avgMood}</p>
          <p className="text-xs text-muted-foreground">Avg Mood (60d)</p>
        </CardContent></Card>
      </div>

      {/* Progress Bars */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2"><span>Tasks</span><span className="font-bold">{taskProgress}%</span></div>
            <Progress value={taskProgress} className="h-3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2"><span>Goals</span><span className="font-bold">{goalProgress}%</span></div>
            <Progress value={goalProgress} className="h-3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2"><span>Resources</span><span className="font-bold">{resourceProgress}%</span></div>
            <Progress value={resourceProgress} className="h-3" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Mood Trend */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Mood Trend (60 days)</CardTitle></CardHeader>
          <CardContent>
            {moodData.length < 2 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Log more moods to see your trend</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={moodData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const d = payload[0].payload;
                      return <div className="bg-background border rounded p-2 text-xs"><p className="font-bold">Mood: {d.mood}/10</p>{d.note && <p className="text-muted-foreground">{d.note}</p>}<p className="text-muted-foreground">{d.date}</p></div>;
                    }
                    return null;
                  }} />
                  <Area type="monotone" dataKey="mood" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Session Frequency */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Session Frequency (12 weeks)</CardTitle></CardHeader>
          <CardContent>
            {sessionFrequency.every(s => s.sessions === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">No session data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sessionFrequency}>
                  <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Completion Chart */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Task Completion (12 weeks)</CardTitle></CardHeader>
        <CardContent>
          {taskCompletion.every(t => t.completed === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">No completed tasks yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={taskCompletion}>
                <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="completed" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Goals */}
      {goals.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> My Goals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {goals.map((g: any) => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                  g.status === 'achieved' ? 'bg-emerald-500/10 text-emerald-500' :
                  g.status === 'in_progress' ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {g.status === 'achieved' ? '✓' : g.status === 'in_progress' ? '◉' : '○'}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${g.status === 'achieved' ? 'line-through text-muted-foreground' : ''}`}>{g.title}</p>
                  {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                </div>
                <div className="text-right">
                  <Badge variant={g.status === 'achieved' ? 'default' : g.status === 'in_progress' ? 'secondary' : 'outline'} className="text-xs capitalize">{g.status}</Badge>
                  {g.target_date && <p className="text-[10px] text-muted-foreground mt-0.5">{g.target_date}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientProgressPage;
