import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import StatsCard from "@/components/dashboard/StatsCard";
import { Users, Calendar, FileText, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const db = supabase as any;

const COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.7)', 'hsl(var(--primary) / 0.4)', 'hsl(var(--primary) / 0.2)'];

const AnalyticsPage = () => {
  const [stats, setStats] = useState({ clients: 0, appointments: 0, sessions: 0, resources: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [c, a, s, r] = await Promise.all([
      db.from('clients').select('id', { count: 'exact', head: true }),
      db.from('appointments').select('id', { count: 'exact', head: true }),
      db.from('session_notes').select('id', { count: 'exact', head: true }),
      db.from('resources').select('id', { count: 'exact', head: true }),
    ]);
    setStats({ clients: c.count || 0, appointments: a.count || 0, sessions: s.count || 0, resources: r.count || 0 });

    const { data: appts } = await db.from('appointments').select('start_time, status, type').order('start_time');
    if (appts) {
      // Monthly data
      const months: Record<string, { month: string, total: number, completed: number }> = {};
      const statuses: Record<string, number> = {};
      const types: Record<string, number> = {};
      appts.forEach((a: any) => {
        const m = new Date(a.start_time).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!months[m]) months[m] = { month: m, total: 0, completed: 0 };
        months[m].total++;
        if (a.status === 'completed') months[m].completed++;
        statuses[a.status] = (statuses[a.status] || 0) + 1;
        types[a.type] = (types[a.type] || 0) + 1;
      });
      setMonthlyData(Object.values(months).slice(-12));
      setStatusData(Object.entries(statuses).map(([name, value]) => ({ name, value })));
      setTypeData(Object.entries(types).map(([name, value]) => ({ name, value })));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Practice performance overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Clients" value={stats.clients} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Appointments" value={stats.appointments} icon={<Calendar className="h-5 w-5" />} />
        <StatsCard title="Session Notes" value={stats.sessions} icon={<FileText className="h-5 w-5" />} />
        <StatsCard title="Resources" value={stats.resources} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Appointments Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Appointments</CardTitle>
            <CardDescription>Appointments over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Total" />
                  <Bar dataKey="completed" fill="hsl(var(--primary) / 0.4)" radius={[6, 6, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No appointment data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
            <CardDescription>Appointment outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {statusData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="capitalize">{s.name}: {s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Type Distribution */}
      {typeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appointment Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 flex-wrap">
              {typeData.map(t => (
                <div key={t.name} className="flex-1 min-w-[120px]">
                  <p className="text-3xl font-bold text-primary">{t.value}</p>
                  <p className="text-sm text-muted-foreground capitalize mt-1">{t.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;
