import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Calendar, CheckSquare, Target, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, subDays } from "date-fns";

const db = supabase as any;

const ClientProgressPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ sessions: 0, completedTasks: 0, totalTasks: 0, goals: 0, achievedGoals: 0 });
  const [moodData, setMoodData] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
    if (!cr) return;

    const [sessionsRes, tasksRes, goalsRes, moodRes] = await Promise.all([
      db.from('appointments').select('*', { count: 'exact', head: true }).eq('client_id', cr.id).eq('status', 'completed'),
      db.from('tasks').select('*').eq('client_id', cr.id),
      db.from('goals').select('*').eq('client_id', cr.id),
      db.from('mood_entries').select('*').eq('user_id', user?.id).gte('created_at', subDays(new Date(), 30).toISOString()).order('created_at'),
    ]);

    const allTasks = tasksRes.data || [];
    const allGoals = goalsRes.data || [];

    setStats({
      sessions: sessionsRes.count || 0,
      completedTasks: allTasks.filter((t: any) => t.status === 'completed').length,
      totalTasks: allTasks.length,
      goals: allGoals.length,
      achievedGoals: allGoals.filter((g: any) => g.status === 'achieved').length,
    });

    setGoals(allGoals);
    setMoodData((moodRes.data || []).map((m: any) => ({
      date: format(parseISO(m.created_at), 'MMM d'),
      mood: m.mood,
    })));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">My Progress</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Calendar className="h-6 w-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.sessions}</p>
          <p className="text-xs text-muted-foreground">Sessions Done</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckSquare className="h-6 w-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.completedTasks}/{stats.totalTasks}</p>
          <p className="text-xs text-muted-foreground">Tasks Done</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Target className="h-6 w-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.achievedGoals}/{stats.goals}</p>
          <p className="text-xs text-muted-foreground">Goals Achieved</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="h-6 w-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{moodData.length > 0 ? moodData[moodData.length - 1].mood : '—'}</p>
          <p className="text-xs text-muted-foreground">Latest Mood</p>
        </CardContent></Card>
      </div>

      {moodData.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Mood Trend (30 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={moodData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="mood" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {goals.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">My Goals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {goals.map((g: any) => (
              <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg">
                <Target className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1"><p className="text-sm">{g.title}</p></div>
                <Badge variant={g.status === 'achieved' ? 'default' : 'outline'} className="text-xs capitalize">{g.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientProgressPage;
