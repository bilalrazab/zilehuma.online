import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/dashboard/StatsCard";
import { Users, Calendar, FileText, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const db = supabase as any;

const AnalyticsPage = () => {
  const [stats, setStats] = useState({ clients: 0, appointments: 0, sessions: 0, resources: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => { loadStats(); loadMonthly(); }, []);

  const loadStats = async () => {
    const [c, a, s, r] = await Promise.all([
      db.from('clients').select('id', { count: 'exact', head: true }),
      db.from('appointments').select('id', { count: 'exact', head: true }),
      db.from('session_notes').select('id', { count: 'exact', head: true }),
      db.from('resources').select('id', { count: 'exact', head: true }),
    ]);
    setStats({ clients: c.count || 0, appointments: a.count || 0, sessions: s.count || 0, resources: r.count || 0 });
  };

  const loadMonthly = async () => {
    const { data: appts } = await db.from('appointments').select('start_time, status').order('start_time');
    const months: Record<string, { month: string, appointments: number, completed: number }> = {};
    appts?.forEach((a: any) => {
      const m = new Date(a.start_time).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!months[m]) months[m] = { month: m, appointments: 0, completed: 0 };
      months[m].appointments++;
      if (a.status === 'completed') months[m].completed++;
    });
    setMonthlyData(Object.values(months).slice(-12));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Analytics</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Clients" value={stats.clients} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Total Appointments" value={stats.appointments} icon={<Calendar className="h-5 w-5" />} />
        <StatsCard title="Session Notes" value={stats.sessions} icon={<FileText className="h-5 w-5" />} />
        <StatsCard title="Resources" value={stats.resources} icon={<TrendingUp className="h-5 w-5" />} />
      </div>
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Monthly Appointments</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;
