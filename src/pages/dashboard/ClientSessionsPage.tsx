import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Video, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO } from "date-fns";

const db = supabase as any;

const ClientSessionsPage = () => {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState<Record<string, any>>({});
  const [stats, setStats] = useState({ total: 0, completed: 0, missed: 0, cancelled: 0 });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
    if (!cr) return;
    const now = new Date().toISOString();
    const [upRes, pastRes] = await Promise.all([
      db.from('appointments').select('*').eq('client_id', cr.id).gte('start_time', now).order('start_time'),
      db.from('appointments').select('*').eq('client_id', cr.id).lt('start_time', now).order('start_time', { ascending: false }),
    ]);
    const all = [...(upRes.data || []), ...(pastRes.data || [])];
    setUpcoming(upRes.data || []);
    setPast(pastRes.data || []);
    setStats({
      total: all.length,
      completed: all.filter(s => s.status === 'completed').length,
      missed: all.filter(s => s.status === 'no_show').length,
      cancelled: all.filter(s => s.status === 'cancelled').length,
    });

    // Load session notes for past sessions
    const pastIds = (pastRes.data || []).map((s: any) => s.id);
    if (pastIds.length > 0) {
      const { data: notes } = await db.from('session_notes').select('appointment_id, subjective, assessment, plan').in('appointment_id', pastIds);
      const noteMap: Record<string, any> = {};
      (notes || []).forEach((n: any) => { if (n.appointment_id) noteMap[n.appointment_id] = n; });
      setSessionNotes(noteMap);
    }
  };

  const typeIcon = (type: string) => {
    if (type === 'online') return <Video className="h-4 w-4" />;
    if (type === 'phone') return <Phone className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  const SessionCard = ({ s, showNotes }: { s: any; showNotes?: boolean }) => {
    const hasNote = sessionNotes[s.id];
    const expanded = expandedNote === s.id;

    return (
      <div className="p-3 rounded-lg border space-y-2">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
            s.status === 'no_show' ? 'bg-destructive/10 text-destructive' :
            s.status === 'cancelled' ? 'bg-muted text-muted-foreground' :
            'bg-primary/10 text-primary'
          }`}>
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{format(parseISO(s.start_time), 'EEEE, MMMM d, yyyy')}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{format(parseISO(s.start_time), 'h:mm a')}</span>
              <span>{s.duration_minutes || 50} min</span>
              <span className="flex items-center gap-0.5">{typeIcon(s.type)} {s.type}</span>
            </div>
          </div>
          <Badge variant={s.status === 'completed' ? 'default' : s.status === 'no_show' ? 'destructive' : s.status === 'cancelled' ? 'secondary' : 'outline'} className="text-xs capitalize">{s.status}</Badge>
        </div>

        {s.meeting_link && s.status === 'scheduled' && (
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => window.open(s.meeting_link, '_blank')}>
            <Video className="h-3.5 w-3.5 mr-1.5" /> Join Session
          </Button>
        )}

        {s.notes && <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">{s.notes}</p>}

        {showNotes && hasNote && (
          <div>
            <button className="flex items-center gap-1 text-xs text-primary font-medium" onClick={() => setExpandedNote(expanded ? null : s.id)}>
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Session Summary
            </button>
            {expanded && (
              <div className="mt-2 space-y-2 text-xs">
                {hasNote.subjective && <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20"><p className="font-bold text-blue-600 text-[10px] uppercase mb-0.5">What was discussed</p><p>{hasNote.subjective}</p></div>}
                {hasNote.assessment && <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/20"><p className="font-bold text-amber-600 text-[10px] uppercase mb-0.5">Assessment</p><p>{hasNote.assessment}</p></div>}
                {hasNote.plan && <div className="p-2 rounded bg-violet-50 dark:bg-violet-950/20"><p className="font-bold text-violet-600 text-[10px] uppercase mb-0.5">Plan</p><p>{hasNote.plan}</p></div>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">My Sessions</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{stats.total}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-500">{stats.completed}</p><p className="text-[10px] text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-destructive">{stats.missed}</p><p className="text-[10px] text-muted-foreground">Missed</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-muted-foreground">{stats.cancelled}</p><p className="text-[10px] text-muted-foreground">Cancelled</p></CardContent></Card>
      </div>

      {/* Upcoming */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Upcoming ({upcoming.length})</CardTitle></CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No upcoming sessions scheduled</p>
          ) : (
            <div className="space-y-2">{upcoming.map(s => <SessionCard key={s.id} s={s} />)}</div>
          )}
        </CardContent>
      </Card>

      {/* Past */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Past Sessions ({past.length})</CardTitle></CardHeader>
        <CardContent>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No past sessions</p>
          ) : (
            <div className="space-y-2">{past.map(s => <SessionCard key={s.id} s={s} showNotes />)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSessionsPage;
