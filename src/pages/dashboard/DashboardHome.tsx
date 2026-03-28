import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import StatsCard from "@/components/dashboard/StatsCard";
import { Users, Calendar, FileText, BookOpen, Clock, MessageSquare, Smile, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const db = supabase as any;

const DashboardHome = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ clients: 0, todaySessions: 0, totalSessions: 0, resources: 0 });
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (role === 'doctor' || role === 'super_admin') loadDoctorData();
    else if (role === 'client') loadClientData();
  }, [role]);

  const loadDoctorData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [clients, appointments, notes, resources] = await Promise.all([
      db.from('clients').select('id', { count: 'exact', head: true }),
      db.from('appointments').select('*').gte('start_time', today).lte('start_time', today + 'T23:59:59'),
      db.from('session_notes').select('id', { count: 'exact', head: true }),
      db.from('resources').select('id', { count: 'exact', head: true }),
    ]);
    setStats({
      clients: clients.count || 0,
      todaySessions: appointments.data?.length || 0,
      totalSessions: notes.count || 0,
      resources: resources.count || 0,
    });
    const { data: logs } = await db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(5);
    setRecentActivity(logs || []);
  };

  const loadClientData = async () => {
    const { data: clientRecord } = await db.from('clients').select('id').eq('user_id', user?.id).single();
    if (clientRecord) {
      const { data: appt } = await db.from('appointments').select('*').eq('client_id', clientRecord.id)
        .gte('start_time', new Date().toISOString()).order('start_time').limit(1);
      if (appt?.[0]) setNextAppointment(appt[0]);
    }
  };

  if (role === 'client') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">My Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/appointments')}>
            <CardContent className="p-6 flex items-center gap-4">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Appointments</p>
                <p className="text-sm text-muted-foreground">View & book sessions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/messages')}>
            <CardContent className="p-6 flex items-center gap-4">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Messages</p>
                <p className="text-sm text-muted-foreground">Chat with your therapist</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/resources')}>
            <CardContent className="p-6 flex items-center gap-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Resources</p>
                <p className="text-sm text-muted-foreground">View assigned materials</p>
              </div>
            </CardContent>
          </Card>
        </div>
        {nextAppointment && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Next Appointment</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{nextAppointment.title}</p>
                  <p className="text-sm text-muted-foreground">{new Date(nextAppointment.start_time).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/mood')}>
          <CardContent className="p-6 flex items-center gap-4">
            <Smile className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">Mood Tracker</p>
              <p className="text-sm text-muted-foreground">Log how you're feeling today</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Clients" value={stats.clients} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Today's Sessions" value={stats.todaySessions} icon={<Calendar className="h-5 w-5" />} />
        <StatsCard title="Total Sessions" value={stats.totalSessions} icon={<FileText className="h-5 w-5" />} />
        <StatsCard title="Resources" value={stats.resources} icon={<BookOpen className="h-5 w-5" />} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent activity yet. Start by adding clients and scheduling appointments.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>{log.action} — {log.entity_type}</span>
                  <span className="text-muted-foreground ml-auto">{new Date(log.created_at).toLocaleString()}</span>
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
