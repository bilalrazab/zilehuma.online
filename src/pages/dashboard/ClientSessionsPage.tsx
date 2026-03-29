import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

const db = supabase as any;

const ClientSessionsPage = () => {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
    if (!cr) return;
    const now = new Date().toISOString();
    const { data: up } = await db.from('appointments').select('*').eq('client_id', cr.id)
      .gte('start_time', now).order('start_time');
    const { data: pa } = await db.from('appointments').select('*').eq('client_id', cr.id)
      .lt('start_time', now).order('start_time', { ascending: false });
    setUpcoming(up || []);
    setPast(pa || []);
  };

  const SessionCard = ({ s }: { s: any }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{format(parseISO(s.start_time), 'EEEE, MMMM d')}</p>
        <p className="text-xs text-muted-foreground">{format(parseISO(s.start_time), 'h:mm a')} · {s.type} · {s.duration_minutes || 50}min</p>
      </div>
      <Badge variant={s.status === 'completed' ? 'default' : s.status === 'no_show' ? 'destructive' : 'outline'} className="text-xs">{s.status}</Badge>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">My Sessions</h1>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Upcoming</CardTitle></CardHeader>
        <CardContent>
          {upcoming.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No upcoming sessions</p> : (
            <div className="space-y-2">{upcoming.map(s => <SessionCard key={s.id} s={s} />)}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Past Sessions</CardTitle></CardHeader>
        <CardContent>
          {past.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No past sessions</p> : (
            <div className="space-y-2">{past.map(s => <SessionCard key={s.id} s={s} />)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSessionsPage;
