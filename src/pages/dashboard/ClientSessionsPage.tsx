import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Video, Phone, ChevronDown, ChevronUp, CalendarClock, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const ClientSessionsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState<Record<string, any>>({});
  const [stats, setStats] = useState({ total: 0, completed: 0, missed: 0, cancelled: 0, pending: 0 });
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestForm, setRequestForm] = useState({ preferred_date: '', preferred_time: '10:00', type: 'in-person', notes: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
    if (!cr) return;
    const now = new Date().toISOString();
    const [upRes, pastRes, pendingRes] = await Promise.all([
      db.from('appointments').select('*').eq('client_id', cr.id).eq('status', 'scheduled').gte('start_time', now).order('start_time'),
      db.from('appointments').select('*').eq('client_id', cr.id).lt('start_time', now).order('start_time', { ascending: false }),
      db.from('appointments').select('*').eq('client_id', cr.id).eq('status', 'pending_approval').order('start_time'),
    ]);
    const all = [...(upRes.data || []), ...(pastRes.data || []), ...(pendingRes.data || [])];
    setUpcoming(upRes.data || []);
    setPast(pastRes.data || []);
    setPending(pendingRes.data || []);
    setStats({
      total: all.length,
      completed: all.filter(s => s.status === 'completed').length,
      missed: all.filter(s => s.status === 'no_show').length,
      cancelled: all.filter(s => s.status === 'cancelled').length,
      pending: (pendingRes.data || []).length,
    });

    const pastIds = (pastRes.data || []).map((s: any) => s.id);
    if (pastIds.length > 0) {
      const { data: notes } = await db.from('session_notes').select('appointment_id, subjective, assessment, plan').in('appointment_id', pastIds);
      const noteMap: Record<string, any> = {};
      (notes || []).forEach((n: any) => { if (n.appointment_id) noteMap[n.appointment_id] = n; });
      setSessionNotes(noteMap);
    }
  };

  const submitRequest = async () => {
    if (!requestForm.preferred_date) { toast({ title: "Please select a date", variant: "destructive" }); return; }
    setRequestLoading(true);
    try {
      const { data: cr } = await db.from('clients').select('id, doctor_id').eq('user_id', user?.id).single();
      if (!cr) throw new Error('Client record not found');

      // Validate against doctor availability
      const requestDate = new Date(requestForm.preferred_date);
      const dayOfWeek = (requestDate.getDay() + 6) % 7; // Convert to Mon=0
      if (cr.doctor_id) {
        const { data: avail } = await db.from('doctor_availability').select('*').eq('doctor_id', cr.doctor_id).eq('day_of_week', dayOfWeek).single();
        if (avail && !avail.is_available) {
          toast({ title: "Day unavailable", description: "Your therapist is not available on this day. Please choose another.", variant: "destructive" });
          setRequestLoading(false); return;
        }
        if (avail) {
          const reqTime = requestForm.preferred_time;
          if (reqTime < avail.start_time || reqTime >= avail.end_time) {
            toast({ title: "Outside working hours", description: `Available hours: ${avail.start_time} – ${avail.end_time}`, variant: "destructive" });
            setRequestLoading(false); return;
          }
        }
      }

      const dateTime = `${requestForm.preferred_date}T${requestForm.preferred_time}`;
      const start = new Date(dateTime);
      const end = new Date(start.getTime() + 50 * 60000);

      // Check for duplicate/conflicting requests
      const { data: existing } = await db.from('appointments').select('id')
        .eq('doctor_id', cr.doctor_id || user?.id)
        .gte('start_time', new Date(start.getTime() - 50 * 60000).toISOString())
        .lte('start_time', new Date(start.getTime() + 50 * 60000).toISOString())
        .in('status', ['scheduled', 'pending_approval']);
      if (existing && existing.length > 0) {
        toast({ title: "Time slot conflict", description: "This time overlaps with an existing session. Please pick another time.", variant: "destructive" });
        setRequestLoading(false); return;
      }

      await db.from('appointments').insert({
        client_id: cr.id, doctor_id: cr.doctor_id || user?.id,
        start_time: start.toISOString(), end_time: end.toISOString(),
        duration_minutes: 50, type: requestForm.type, title: 'Session (Requested)',
        notes: requestForm.notes || null, status: 'pending_approval',
      });
      if (cr.doctor_id) {
        await db.from('notifications').insert({
          user_id: cr.doctor_id, title: 'New Session Request 📅',
          message: `A client has requested a session for ${format(start, 'MMM d, h:mm a')}`,
          type: 'info', link: '/dashboard/calendar',
        });
      }
      setRequestOpen(false);
      setRequestForm({ preferred_date: '', preferred_time: '10:00', type: 'in-person', notes: '' });
      toast({ title: "✅ Request submitted", description: "Your therapist will review and confirm." });
      load();
    } catch (err: any) {
      toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
    } finally {
      setRequestLoading(false);
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
            s.status === 'pending_approval' ? 'bg-amber-500/10 text-amber-500' :
            'bg-primary/10 text-primary'
          }`}>
            {s.status === 'pending_approval' ? <CalendarClock className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{format(parseISO(s.start_time), 'EEEE, MMMM d, yyyy')}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{format(parseISO(s.start_time), 'h:mm a')}</span>
              <span>{s.duration_minutes || 50} min</span>
              <span className="flex items-center gap-0.5">{typeIcon(s.type)} {s.type}</span>
            </div>
          </div>
          <Badge variant={
            s.status === 'completed' ? 'default' :
            s.status === 'no_show' ? 'destructive' :
            s.status === 'cancelled' ? 'secondary' :
            s.status === 'pending_approval' ? 'secondary' :
            'outline'
          } className="text-xs capitalize">{s.status === 'pending_approval' ? 'Awaiting Approval' : s.status}</Badge>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">My Sessions</h1>
        <Button size="sm" onClick={() => setRequestOpen(true)}><CalendarClock className="h-3.5 w-3.5 mr-1.5" /> Request Session</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{stats.total}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-500">{stats.completed}</p><p className="text-[10px] text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-500">{stats.pending}</p><p className="text-[10px] text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-destructive">{stats.missed}</p><p className="text-[10px] text-muted-foreground">Missed</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-muted-foreground">{stats.cancelled}</p><p className="text-[10px] text-muted-foreground">Cancelled</p></CardContent></Card>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <Card className="border-amber-400/30">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CalendarClock className="h-4 w-4 text-amber-500" /> Awaiting Approval ({pending.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">{pending.map(s => <SessionCard key={s.id} s={s} />)}</div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Upcoming ({upcoming.length})</CardTitle></CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">No upcoming sessions scheduled</p>
              <Button size="sm" variant="outline" onClick={() => setRequestOpen(true)}>
                <CalendarClock className="h-3.5 w-3.5 mr-1.5" /> Request a Session
              </Button>
            </div>
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

      {/* Request Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Session</DialogTitle>
            <DialogDescription>Choose your preferred time. Your therapist will review and confirm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Preferred Date *</Label><Input type="date" value={requestForm.preferred_date} onChange={e => setRequestForm(p => ({ ...p, preferred_date: e.target.value }))} min={new Date().toISOString().split('T')[0]} /></div>
            <div><Label>Preferred Time *</Label><Input type="time" value={requestForm.preferred_time} onChange={e => setRequestForm(p => ({ ...p, preferred_time: e.target.value }))} /></div>
            <div><Label>Session Type</Label>
              <Select value={requestForm.type} onValueChange={v => setRequestForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes (optional)</Label><Textarea value={requestForm.notes} onChange={e => setRequestForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Any specific topics or preferences..." /></div>
            <Button onClick={submitRequest} disabled={requestLoading} className="w-full">
              {requestLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientSessionsPage;
