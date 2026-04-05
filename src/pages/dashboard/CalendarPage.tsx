import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Video, Trash2, Edit2, CheckCircle2, XCircle, AlertTriangle, CalendarClock, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const CalendarPage = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [editSession, setEditSession] = useState<any>(null);
  const [detailSession, setDetailSession] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [form, setForm] = useState({ client_id: '', start_time: '', duration_minutes: 50, type: 'in-person', title: 'Session', meeting_link: '', notes: '' });

  // Client request form
  const [requestForm, setRequestForm] = useState({ preferred_date: '', preferred_time: '10:00', type: 'in-person', notes: '' });

  useEffect(() => { load(); }, [currentMonth]);
  useEffect(() => { if (isStaff) loadClients(); }, []);

  const load = async () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    if (isStaff) {
      const [sessRes, pendingRes] = await Promise.all([
        db.from('appointments').select('*, clients(full_name, email, phone)').gte('start_time', start.toISOString()).lte('start_time', end.toISOString()).order('start_time'),
        db.from('appointments').select('*, clients(full_name, email)').eq('status', 'pending_approval').order('start_time'),
      ]);
      setSessions(sessRes.data || []);
      setPendingRequests(pendingRes.data || []);
    } else {
      // Client: get own sessions via clients table
      const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
      if (cr) {
        const { data } = await db.from('appointments').select('*').eq('client_id', cr.id).gte('start_time', start.toISOString()).lte('start_time', end.toISOString()).order('start_time');
        setSessions(data || []);
      }
    }
  };

  const loadClients = async () => {
    const { data } = await db.from('clients').select('id, full_name').eq('status', 'active').order('full_name');
    setClients(data || []);
  };

  const createSession = async () => {
    if (!form.client_id || !form.start_time) { toast({ title: "Client and time required", variant: "destructive" }); return; }
    try {
      const start = new Date(form.start_time);
      const end = new Date(start.getTime() + form.duration_minutes * 60000);
      const { error } = await db.from('appointments').insert({
        client_id: form.client_id, doctor_id: user?.id, start_time: start.toISOString(), end_time: end.toISOString(),
        duration_minutes: form.duration_minutes, type: form.type, title: form.title,
        meeting_link: form.meeting_link || null, notes: form.notes || null,
      });
      if (error) throw error;
      setCreateOpen(false); resetForm();
      toast({ title: "✅ Session scheduled" }); load();
    } catch (err: any) {
      toast({ title: "Failed to schedule", description: err.message, variant: "destructive" });
    }
  };

  const updateSession = async () => {
    if (!editSession) return;
    try {
      const start = new Date(form.start_time);
      const end = new Date(start.getTime() + form.duration_minutes * 60000);
      const { error } = await db.from('appointments').update({
        start_time: start.toISOString(), end_time: end.toISOString(),
        duration_minutes: form.duration_minutes, type: form.type, title: form.title,
        meeting_link: form.meeting_link || null, notes: form.notes || null,
      }).eq('id', editSession.id);
      if (error) throw error;
      setEditSession(null); resetForm();
      toast({ title: "✅ Session updated" }); load();
    } catch (err: any) {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await db.from('appointments').update({ status }).eq('id', id);
      toast({ title: `Session marked as ${status}` }); setDetailSession(null); load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const approveRequest = async (session: any) => {
    try {
      await db.from('appointments').update({ status: 'scheduled' }).eq('id', session.id);
      // Notify client
      if (session.client_id) {
        const { data: cl } = await db.from('clients').select('user_id, email, full_name, phone').eq('id', session.client_id).single();
        if (cl?.user_id) {
          await db.from('notifications').insert({
            user_id: cl.user_id, title: 'Session Approved ✅',
            message: `Your session request for ${format(parseISO(session.start_time), 'MMM d, h:mm a')} has been approved.`,
            type: 'info', link: '/dashboard/sessions',
          });
          try {
            await supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'session-confirmation', recipientEmail: cl.email,
                idempotencyKey: `session-approve-${session.id}`,
                templateData: { clientName: cl.full_name?.split(' ')[0], sessionDate: format(parseISO(session.start_time), 'MMMM d, yyyy'), sessionTime: format(parseISO(session.start_time), 'h:mm a'), sessionType: session.type, duration: `${session.duration_minutes || 50} minutes` },
              },
            });
          } catch {}
          // WhatsApp notification
          if (cl.phone) {
            try {
              await supabase.functions.invoke('send-whatsapp', {
                body: {
                  to: cl.phone,
                  text: `✅ Session Confirmed!\n\nHi ${cl.full_name?.split(' ')[0]},\nYour session has been approved.\n\n📅 ${format(parseISO(session.start_time), 'MMMM d, yyyy')}\n🕐 ${format(parseISO(session.start_time), 'h:mm a')}\n📋 ${session.type || 'General'}\n⏱ ${session.duration_minutes || 50} minutes\n\n— Zil-e-Huma's Clinic 🌸`,
                },
              });
            } catch {}
          }
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
          message: `Your session request for ${format(parseISO(session.start_time), 'MMM d')} was not available. Please try another time.`,
          type: 'info', link: '/dashboard/sessions',
        });
      }
      toast({ title: "Request declined" }); load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Client: request a session
  const submitRequest = async () => {
    if (!requestForm.preferred_date) { toast({ title: "Please select a date", variant: "destructive" }); return; }
    setRequestLoading(true);
    try {
      const { data: cr } = await db.from('clients').select('id, doctor_id').eq('user_id', user?.id).single();
      if (!cr) throw new Error('Client record not found');

      // Validate availability
      const requestDate = new Date(requestForm.preferred_date);
      const dayOfWeek = (requestDate.getDay() + 6) % 7;
      if (cr.doctor_id) {
        const { data: avail } = await db.from('doctor_availability').select('*').eq('doctor_id', cr.doctor_id).eq('day_of_week', dayOfWeek).single();
        if (avail && !avail.is_available) {
          toast({ title: "Day unavailable", description: "Your therapist is not available on this day.", variant: "destructive" });
          setRequestLoading(false); return;
        }
        if (avail && (requestForm.preferred_time < avail.start_time || requestForm.preferred_time >= avail.end_time)) {
          toast({ title: "Outside working hours", description: `Available: ${avail.start_time} – ${avail.end_time}`, variant: "destructive" });
          setRequestLoading(false); return;
        }
      }

      const dateTime = `${requestForm.preferred_date}T${requestForm.preferred_time}`;
      const start = new Date(dateTime);
      const end = new Date(start.getTime() + 50 * 60000);

      // Duplicate check
      const { data: existing } = await db.from('appointments').select('id')
        .eq('doctor_id', cr.doctor_id || user?.id)
        .gte('start_time', new Date(start.getTime() - 50 * 60000).toISOString())
        .lte('start_time', new Date(start.getTime() + 50 * 60000).toISOString())
        .in('status', ['scheduled', 'pending_approval']);
      if (existing && existing.length > 0) {
        toast({ title: "Time slot conflict", description: "This time overlaps with an existing session.", variant: "destructive" });
        setRequestLoading(false); return;
      }

      const { error } = await db.from('appointments').insert({
        client_id: cr.id, doctor_id: cr.doctor_id || user?.id,
        start_time: start.toISOString(), end_time: end.toISOString(),
        duration_minutes: 50, type: requestForm.type, title: 'Session (Requested)',
        notes: requestForm.notes || null, status: 'pending_approval',
      });
      if (error) throw error;
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
      toast({ title: "Failed to submit request", description: err.message, variant: "destructive" });
    } finally {
      setRequestLoading(false);
    }
  };

  const cancelSession = async (id: string) => {
    await db.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    toast({ title: "Session cancelled" }); setDetailSession(null); load();
  };

  const deleteSession = async (id: string) => {
    await db.from('appointments').delete().eq('id', id);
    toast({ title: "Session deleted" }); setDetailSession(null); load();
  };

  const resetForm = () => setForm({ client_id: '', start_time: '', duration_minutes: 50, type: 'in-person', title: 'Session', meeting_link: '', notes: '' });

  const openCreate = (date?: Date) => {
    resetForm();
    if (date) setForm(p => ({ ...p, start_time: format(date, "yyyy-MM-dd'T'10:00") }));
    setCreateOpen(true);
  };

  const openEdit = (s: any) => {
    setForm({
      client_id: s.client_id, start_time: format(parseISO(s.start_time), "yyyy-MM-dd'T'HH:mm"),
      duration_minutes: s.duration_minutes || 50, type: s.type, title: s.title,
      meeting_link: s.meeting_link || '', notes: s.notes || '',
    });
    setEditSession(s);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const getSessionsForDay = (day: Date) => sessions.filter(s => isSameDay(parseISO(s.start_time), day));
  const selectedSessions = selectedDate ? getSessionsForDay(selectedDate) : [];

  const statusColor: Record<string, string> = {
    scheduled: 'bg-blue-500', completed: 'bg-emerald-500', cancelled: 'bg-muted-foreground',
    no_show: 'bg-destructive', pending_approval: 'bg-amber-500',
  };

  const SessionForm = ({ onSave, isEdit }: { onSave: () => void; isEdit?: boolean }) => (
    <div className="space-y-3">
      {!isEdit && (
        <div><Label>Client *</Label>
          <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div><Label>Date & Time *</Label><Input type="datetime-local" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 50 }))} /></div>
        <div><Label>Type</Label>
          <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in-person">In-Person</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
      {form.type === 'online' && <div><Label>Meeting Link</Label><Input value={form.meeting_link} onChange={e => setForm(p => ({ ...p, meeting_link: e.target.value }))} placeholder="https://zoom.us/..." /></div>}
      <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
      <Button onClick={onSave} className="w-full">{isEdit ? 'Save Changes' : 'Schedule Session'}</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold">Calendar</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>Today</Button>
          {isStaff && <Button size="sm" onClick={() => openCreate(selectedDate || new Date())}><Plus className="h-3.5 w-3.5 mr-1.5" /> New Session</Button>}
          {!isStaff && <Button size="sm" onClick={() => setRequestOpen(true)}><CalendarClock className="h-3.5 w-3.5 mr-1.5" /> Request Session</Button>}
        </div>
      </div>

      {/* Pending Requests (Doctor) */}
      {isStaff && pendingRequests.length > 0 && (
        <Card className="border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <CalendarClock className="h-4 w-4" /> {pendingRequests.length} Pending Session Request{pendingRequests.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.clients?.full_name || 'Client'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{format(parseISO(r.start_time), 'MMM d, h:mm a')}</span>
                    <span className="capitalize">{r.type}</span>
                    {r.notes && <span className="truncate max-w-[150px]">📝 {r.notes}</span>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs" onClick={() => approveRequest(r)}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => rejectRequest(r)}>
                    <XCircle className="h-3 w-3 mr-1" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Month Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold">{sessions.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-blue-500">{sessions.filter(s => s.status === 'scheduled').length}</p>
          <p className="text-[10px] text-muted-foreground">Scheduled</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-emerald-500">{sessions.filter(s => s.status === 'completed').length}</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-amber-500">{sessions.filter(s => s.status === 'pending_approval').length}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-destructive">{sessions.filter(s => s.status === 'no_show').length}</p>
          <p className="text-[10px] text-muted-foreground">No-shows</p>
        </CardContent></Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {days.map(day => {
              const daySessions = getSessionsForDay(day);
              const inMonth = day.getMonth() === currentMonth.getMonth();
              const selected = selectedDate && isSameDay(day, selectedDate);
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                  className={`relative min-h-[3.5rem] p-1 text-sm rounded-lg transition-colors
                    ${!inMonth ? 'text-muted-foreground/30' : ''}
                    ${isToday(day) ? 'bg-primary/10 font-bold' : ''}
                    ${selected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}
                  `}>
                  <span className="text-xs">{format(day, 'd')}</span>
                  {daySessions.length > 0 && (
                    <div className="flex gap-0.5 justify-center mt-0.5 flex-wrap">
                      {daySessions.slice(0, 3).map(s => (
                        <div key={s.id} className={`h-1.5 w-1.5 rounded-full ${statusColor[s.status] || 'bg-primary'}`} />
                      ))}
                      {daySessions.length > 3 && <span className="text-[8px] text-muted-foreground">+{daySessions.length - 3}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Sessions */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
              {isStaff && <Button size="sm" variant="outline" onClick={() => openCreate(selectedDate)}><Plus className="h-3 w-3 mr-1" /> Add</Button>}
            </div>
          </CardHeader>
          <CardContent>
            {selectedSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No sessions on this day</p>
            ) : (
              <div className="space-y-2">
                {selectedSessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setDetailSession(s)}>
                    <div className={`h-3 w-3 rounded-full flex-shrink-0 ${statusColor[s.status] || 'bg-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.clients?.full_name || s.title || 'Session'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{format(parseISO(s.start_time), 'h:mm a')}</span>
                        <span>{s.duration_minutes || 50}min</span>
                        <span className="flex items-center gap-0.5">
                          {s.type === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                          {s.type}
                        </span>
                      </div>
                    </div>
                    <Badge variant={s.status === 'completed' ? 'default' : s.status === 'no_show' ? 'destructive' : s.status === 'pending_approval' ? 'secondary' : 'outline'} className="text-xs capitalize">{s.status === 'pending_approval' ? 'Pending' : s.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Session Detail Dialog */}
      <Dialog open={!!detailSession} onOpenChange={o => { if (!o) setDetailSession(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Session Details</DialogTitle></DialogHeader>
          {detailSession && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {detailSession.clients?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold">{detailSession.clients?.full_name || detailSession.title}</p>
                  {detailSession.clients?.email && <p className="text-xs text-muted-foreground">{detailSession.clients.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{format(parseISO(detailSession.start_time), 'MMM d, yyyy')}</span></div>
                <div><span className="text-muted-foreground">Time:</span> <span className="font-medium">{format(parseISO(detailSession.start_time), 'h:mm a')}</span></div>
                <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{detailSession.duration_minutes || 50}min</span></div>
                <div><span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{detailSession.type}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Status:</span> <Badge variant={detailSession.status === 'completed' ? 'default' : detailSession.status === 'pending_approval' ? 'secondary' : 'outline'} className="text-xs ml-1 capitalize">{detailSession.status === 'pending_approval' ? 'Awaiting Approval' : detailSession.status}</Badge></div>
              </div>
              {detailSession.meeting_link && (
                <Button variant="outline" className="w-full" onClick={() => window.open(detailSession.meeting_link, '_blank')}>
                  <Video className="h-4 w-4 mr-2" /> Join Meeting
                </Button>
              )}
              {detailSession.notes && <div className="p-3 rounded-lg bg-muted text-sm"><p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>{detailSession.notes}</div>}
              {isStaff && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {detailSession.status === 'pending_approval' && (
                      <>
                        <Button size="sm" onClick={() => { approveRequest(detailSession); setDetailSession(null); }}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => { rejectRequest(detailSession); setDetailSession(null); }}>
                          <XCircle className="h-3 w-3 mr-1" /> Decline
                        </Button>
                      </>
                    )}
                    {detailSession.status === 'scheduled' && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(detailSession.id, 'completed')}>✓ Complete</Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus(detailSession.id, 'no_show')}>No-show</Button>
                        <Button size="sm" variant="outline" onClick={() => { setDetailSession(null); openEdit(detailSession); }}>
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancelSession(detailSession.id)}>Cancel</Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/clients/${detailSession.client_id}`)}>Open File</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteSession(detailSession.id)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Client: Request Session Dialog */}
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
            <p className="text-[11px] text-muted-foreground text-center">Your therapist will confirm or suggest an alternative time.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Session</DialogTitle></DialogHeader>
          <SessionForm onSave={createSession} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editSession} onOpenChange={o => { if (!o) { setEditSession(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Session</DialogTitle></DialogHeader>
          <SessionForm onSave={updateSession} isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
