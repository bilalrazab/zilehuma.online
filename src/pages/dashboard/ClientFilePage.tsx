import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowLeft, AlertTriangle, Calendar, Clock, DollarSign, Plus,
  FileText, CheckSquare, BookOpen, Target, Activity, Edit2,
  Trash2, Download, Send, Video, MapPin, Phone, ChevronDown, ChevronUp, User, ExternalLink
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const CHECKLIST_ITEMS = [
  { key: 'intake_completed', label: 'Intake completed' },
  { key: 'consent_signed', label: 'Consent signed' },
  { key: 'first_session_done', label: 'First session done' },
  { key: 'treatment_plan_created', label: 'Treatment plan created' },
  { key: 'progress_reviewed', label: 'Progress reviewed' },
  { key: 'follow_up_sent', label: 'Follow-up sent' },
  { key: 'case_closed', label: 'Case closed' },
];

const PIPELINE_STAGES = ['new_inquiry', 'contacted', 'intake_started', 'intake_completed', 'booked', 'active', 'inactive', 'closed'];
const RISK_LEVELS = ['normal', 'moderate', 'high'];

const ClientFilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [checklist, setChecklist] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [allResources, setAllResources] = useState<any[]>([]);

  // Dialog states
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [assignResourceOpen, setAssignResourceOpen] = useState(false);
  const [endSessionDialog, setEndSessionDialog] = useState<any>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [timelineLimit, setTimelineLimit] = useState(20);

  // Forms
  const [noteForm, setNoteForm] = useState({ subjective: '', objective: '', assessment: '', plan: '', private_notes: '' });
  const [taskForm, setTaskForm] = useState({ title: '', type: 'follow_up', due_date: '', priority: 'medium', notes: '' });
  const [sessionForm, setSessionForm] = useState({ start_time: '', duration_minutes: 50, type: 'in-person', title: 'Session', meeting_link: '', notes: '' });
  const [goalForm, setGoalForm] = useState({ title: '', description: '', target_date: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', notes: '', session_id: '' });
  const [clientForm, setClientForm] = useState<any>({});
  const [assignResourceId, setAssignResourceId] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  // End session workflow
  const [endSessionNote, setEndSessionNote] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [endSessionPayment, setEndSessionPayment] = useState({ amount: '', method: 'cash' });
  const [endSessionNextDate, setEndSessionNextDate] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const [clientRes, checklistRes, timelineRes, sessionsRes, tasksRes, notesRes, resourcesRes, goalsRes, paymentsRes, allResourcesRes] = await Promise.all([
      db.from('clients').select('*').eq('id', id).single(),
      db.from('client_checklists').select('*').eq('client_id', id).single(),
      db.from('timeline_logs').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(100),
      db.from('appointments').select('*').eq('client_id', id).order('start_time', { ascending: false }),
      db.from('tasks').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      db.from('session_notes').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      db.from('resource_assignments').select('*, resources(title, type, url)').eq('client_id', id),
      db.from('goals').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      db.from('payments').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      db.from('resources').select('id, title, type').order('title'),
    ]);
    setClient(clientRes.data);
    setChecklist(checklistRes.data);
    setTimeline(timelineRes.data || []);
    setSessions(sessionsRes.data || []);
    setTasks(tasksRes.data || []);
    setNotes(notesRes.data || []);
    setResources(resourcesRes.data || []);
    setGoals(goalsRes.data || []);
    setPayments(paymentsRes.data || []);
    setAllResources(allResourcesRes.data || []);
    if (clientRes.data) setClientForm(clientRes.data);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateClient = async (field: string, value: any) => {
    await db.from('clients').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id);
    setClient((p: any) => ({ ...p, [field]: value }));
  };

  const saveClientDetails = async () => {
    await db.from('clients').update({
      full_name: clientForm.full_name, email: clientForm.email, phone: clientForm.phone,
      date_of_birth: clientForm.date_of_birth || null, gender: clientForm.gender || null,
      address: clientForm.address || null, emergency_contact: clientForm.emergency_contact || null,
      emergency_phone: clientForm.emergency_phone || null, notes: clientForm.notes || null,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    setEditClientOpen(false); toast({ title: "Client updated" }); load();
  };

  const updateChecklist = async (key: string, value: boolean) => {
    await db.from('client_checklists').update({ [key]: value, updated_at: new Date().toISOString() }).eq('client_id', id);
    setChecklist((p: any) => ({ ...p, [key]: value }));
    await db.from('timeline_logs').insert({ client_id: id, type: 'checklist', description: `${value ? '✓' : '✗'} ${CHECKLIST_ITEMS.find(i => i.key === key)?.label}`, created_by: user?.id });
  };

  const addNote = async () => {
    await db.from('session_notes').insert({ client_id: id, doctor_id: user?.id, ...noteForm });
    await db.from('timeline_logs').insert({ client_id: id, type: 'note', description: 'Session note added', created_by: user?.id });
    setNoteOpen(false); setNoteForm({ subjective: '', objective: '', assessment: '', plan: '', private_notes: '' });
    toast({ title: "Note saved" }); load();
  };

  const deleteNote = async (noteId: string) => {
    await db.from('session_notes').delete().eq('id', noteId);
    toast({ title: "Note deleted" }); load();
  };

  const addTask = async () => {
    if (!taskForm.title) return;
    await db.from('tasks').insert({ client_id: id, ...taskForm, due_date: taskForm.due_date || null, created_by: user?.id });
    // Notify client about new task
    if (client?.user_id) {
      await db.from('notifications').insert({
        user_id: client.user_id, title: 'New Task Assigned',
        message: `"${taskForm.title}" has been assigned to you`,
        type: 'info', link: '/dashboard/tasks',
      });
    }
    setTaskOpen(false); setTaskForm({ title: '', type: 'follow_up', due_date: '', priority: 'medium', notes: '' });
    toast({ title: "Task created" }); load();
  };

  const deleteTask = async (taskId: string) => {
    await db.from('tasks').delete().eq('id', taskId);
    toast({ title: "Task deleted" }); load();
  };

  const addSession = async () => {
    if (!sessionForm.start_time) return;
    const start = new Date(sessionForm.start_time);
    const end = new Date(start.getTime() + sessionForm.duration_minutes * 60000);
    await db.from('appointments').insert({
      client_id: id, doctor_id: user?.id, start_time: start.toISOString(), end_time: end.toISOString(),
      duration_minutes: sessionForm.duration_minutes, type: sessionForm.type, title: sessionForm.title,
      meeting_link: sessionForm.meeting_link || null, notes: sessionForm.notes || null
    });
    // Notify client + send email
    if (client?.user_id) {
      await db.from('notifications').insert({
        user_id: client.user_id, title: 'Session Scheduled',
        message: `Your session is scheduled for ${format(start, 'MMM d, h:mm a')}`,
        type: 'info', link: '/dashboard/sessions',
      });
      // Send confirmation email
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'session-confirmation',
            recipientEmail: client.email,
            idempotencyKey: `session-confirm-${Date.now()}`,
            templateData: {
              clientName: client.full_name?.split(' ')[0],
              sessionDate: format(start, 'MMMM d, yyyy'),
              sessionTime: format(start, 'h:mm a'),
              sessionType: sessionForm.type,
              duration: `${sessionForm.duration_minutes} minutes`,
            },
          },
        });
      } catch (err) { console.error('Email send error:', err); }
    }
    setSessionOpen(false); setSessionForm({ start_time: '', duration_minutes: 50, type: 'in-person', title: 'Session', meeting_link: '', notes: '' });
    toast({ title: "Session scheduled" }); load();
  };

  const addGoal = async () => {
    if (!goalForm.title) return;
    await db.from('goals').insert({ client_id: id, ...goalForm, target_date: goalForm.target_date || null });
    setGoalOpen(false); setGoalForm({ title: '', description: '', target_date: '' });
    toast({ title: "Goal added" }); load();
  };

  const updateGoalStatus = async (goalId: string, status: string) => {
    await db.from('goals').update({ status, updated_at: new Date().toISOString() }).eq('id', goalId);
    toast({ title: `Goal marked as ${status}` }); load();
  };

  const addPayment = async () => {
    if (!paymentForm.amount) return;
    await db.from('payments').insert({
      client_id: id, amount: parseFloat(paymentForm.amount), method: paymentForm.method,
      notes: paymentForm.notes || null, session_id: paymentForm.session_id || null,
      status: 'paid', payment_date: new Date().toISOString().split('T')[0]
    });
    setPaymentOpen(false); setPaymentForm({ amount: '', method: 'cash', notes: '', session_id: '' });
    toast({ title: "Payment recorded" }); load();
  };

  const assignResource = async () => {
    if (!assignResourceId) return;
    await db.from('resource_assignments').insert({ resource_id: assignResourceId, client_id: id, assigned_by: user?.id, due_date: assignDueDate || null });
    const resource = allResources.find(r => r.id === assignResourceId);
    if (resource) {
      await db.from('tasks').insert({ client_id: id, title: `Complete: ${resource.title}`, type: 'homework', priority: 'medium', due_date: assignDueDate || null, created_by: user?.id });
    }
    // Notify client about resource
    if (client?.user_id) {
      const resTitle = allResources.find(r => r.id === assignResourceId)?.title || 'A resource';
      await db.from('notifications').insert({
        user_id: client.user_id, title: 'New Resource Assigned',
        message: `"${resTitle}" has been shared with you`,
        type: 'info', link: '/dashboard/progress',
      });
    }
    setAssignResourceOpen(false); setAssignResourceId(''); setAssignDueDate('');
    toast({ title: "Resource assigned" }); load();
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await db.from('tasks').update({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }).eq('id', taskId);
    load();
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    await db.from('appointments').update({ status }).eq('id', sessionId);
    toast({ title: `Session marked as ${status}` }); load();
  };

  // End Session Workflow
  const startEndSession = (session: any) => {
    setEndSessionDialog(session);
    setEndSessionNote({ subjective: '', objective: '', assessment: '', plan: '' });
    setEndSessionPayment({ amount: '', method: 'cash' });
    setEndSessionNextDate('');
  };

  const completeEndSession = async () => {
    if (!endSessionDialog) return;
    // 1. Mark session completed
    await db.from('appointments').update({ status: 'completed' }).eq('id', endSessionDialog.id);
    // 2. Save note
    if (endSessionNote.subjective || endSessionNote.objective || endSessionNote.assessment || endSessionNote.plan) {
      await db.from('session_notes').insert({ client_id: id, doctor_id: user?.id, appointment_id: endSessionDialog.id, ...endSessionNote });
    }
    // 3. Record payment
    if (endSessionPayment.amount) {
      await db.from('payments').insert({
        client_id: id, session_id: endSessionDialog.id, amount: parseFloat(endSessionPayment.amount),
        method: endSessionPayment.method, status: 'paid', payment_date: new Date().toISOString().split('T')[0]
      });
    }
    // 4. Schedule next
    if (endSessionNextDate) {
      const start = new Date(endSessionNextDate);
      const end = new Date(start.getTime() + 50 * 60000);
      await db.from('appointments').insert({
        client_id: id, doctor_id: user?.id, start_time: start.toISOString(), end_time: end.toISOString(),
        duration_minutes: 50, type: endSessionDialog.type, title: 'Session'
      });
      await db.from('clients').update({ next_session_date: endSessionNextDate.split('T')[0] }).eq('id', id);
    }
    // Update last session date
    await db.from('clients').update({ last_session_date: new Date().toISOString().split('T')[0] }).eq('id', id);
    // Update checklist
    await db.from('client_checklists').update({ first_session_done: true }).eq('client_id', id);

    setEndSessionDialog(null);
    toast({ title: "Session completed — note saved, payment recorded" }); load();
  };

  const exportClientData = () => {
    if (!client) return;
    const data = { client, sessions, tasks, notes: notes.map(n => ({ ...n, private_notes: undefined })), goals, payments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${client.full_name.replace(/\s+/g, '_')}_file.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Client file exported" });
  };

  if (!client) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const riskBorderColor = client.risk_level === 'high' ? 'border-destructive' : client.risk_level === 'moderate' ? 'border-amber-400' : 'border-border';
  const completedChecks = checklist ? CHECKLIST_ITEMS.filter(i => checklist[i.key]).length : 0;
  const checklistProgress = (completedChecks / CHECKLIST_ITEMS.length) * 100;
  const pendingTaskCount = tasks.filter(t => t.status === 'pending').length;
  const unpaidCount = payments.filter(p => p.status === 'unpaid').length;
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/clients')} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportClientData}><Download className="h-3.5 w-3.5 mr-1" /> Export</Button>
          <Button size="sm" variant="outline" onClick={() => { setClientForm(client); setEditClientOpen(true); }}><Edit2 className="h-3.5 w-3.5 mr-1" /> Edit</Button>
        </div>
      </div>

      {/* 1. HEADER */}
      <Card className={`border-2 ${riskBorderColor}`}>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
              {client.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-heading font-bold">{client.full_name}</h1>
                {client.risk_level === 'high' && <AlertTriangle className="h-4 w-4 text-destructive" />}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                {client.email && <span>{client.email}</span>}
                {client.phone && <span>· {client.phone}</span>}
                {client.gender && <span>· {client.gender}</span>}
                {client.date_of_birth && <span>· DOB: {client.date_of_birth}</span>}
              </div>
              {(client.emergency_contact || client.emergency_phone) && (
                <p className="text-xs text-muted-foreground mt-1">Emergency: {client.emergency_contact} {client.emergency_phone}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={client.pipeline_stage || 'active'} onValueChange={v => updateClient('pipeline_stage', v)}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{PIPELINE_STAGES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={client.risk_level || 'normal'} onValueChange={v => updateClient('risk_level', v)}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t">
            <div className="text-center"><p className="text-xs text-muted-foreground">Sessions</p><p className="text-lg font-bold">{sessions.length}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Pending Tasks</p><p className="text-lg font-bold">{pendingTaskCount}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Unpaid</p><p className="text-lg font-bold text-destructive">{unpaidCount}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-lg font-bold text-emerald-600">Rs. {totalPaid.toLocaleString()}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Last Session</p><p className="text-sm font-medium">{sessions[0] ? format(parseISO(sessions[0].start_time), 'MMM d') : '—'}</p></div>
          </div>
          {client.notes && <div className="mt-3 p-2 rounded bg-muted text-xs"><span className="font-medium">Notes:</span> {client.notes}</div>}
        </CardContent>
      </Card>

      {/* 2. MASTER CHECKLIST */}
      {checklist && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckSquare className="h-4 w-4" /> Master Checklist
              <Badge variant="secondary" className="ml-auto text-xs">{completedChecks}/{CHECKLIST_ITEMS.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={checklistProgress} className="h-2 mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {CHECKLIST_ITEMS.map(item => (
                <label key={item.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Checkbox checked={checklist[item.key]} onCheckedChange={v => updateChecklist(item.key, !!v)} />
                  <span className={`text-sm ${checklist[item.key] ? 'line-through text-muted-foreground' : ''}`}>{item.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. TIMELINE */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Timeline ({timeline.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
          ) : (
            <>
              <div className="space-y-2">
                {timeline.slice(0, timelineLimit).map(t => (
                  <div key={t.id} className="flex gap-3 items-start p-1.5 rounded hover:bg-muted/30">
                    <div className={`h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                      t.type === 'session' ? 'bg-blue-500' : t.type === 'payment' ? 'bg-emerald-500' :
                      t.type === 'task' ? 'bg-amber-500' : t.type === 'note' ? 'bg-violet-500' :
                      t.type === 'checklist' ? 'bg-cyan-500' : 'bg-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(parseISO(t.created_at), { addSuffix: true })}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">{t.type}</Badge>
                  </div>
                ))}
              </div>
              {timeline.length > timelineLimit && (
                <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => setTimelineLimit(p => p + 30)}>Load more ({timeline.length - timelineLimit} remaining)</Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 4. SESSIONS */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Sessions ({sessions.length})</CardTitle>
            <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Schedule</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Schedule Session</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Date & Time *</Label><Input type="datetime-local" value={sessionForm.start_time} onChange={e => setSessionForm(p => ({ ...p, start_time: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Duration (min)</Label><Input type="number" value={sessionForm.duration_minutes} onChange={e => setSessionForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 50 }))} /></div>
                    <div><Label>Type</Label>
                      <Select value={sessionForm.type} onValueChange={v => setSessionForm(p => ({ ...p, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="in-person">In-Person</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="phone">Phone</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  {sessionForm.type === 'online' && <div><Label>Meeting Link</Label><Input value={sessionForm.meeting_link} onChange={e => setSessionForm(p => ({ ...p, meeting_link: e.target.value }))} /></div>}
                  <div><Label>Notes</Label><Input value={sessionForm.notes} onChange={e => setSessionForm(p => ({ ...p, notes: e.target.value }))} /></div>
                  <Button onClick={addSession} className="w-full">Schedule</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No sessions</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3">Date</th><th className="pb-2 pr-3">Type</th><th className="pb-2 pr-3">Duration</th><th className="pb-2 pr-3">Status</th><th className="pb-2">Actions</th>
                </tr></thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-3">{format(parseISO(s.start_time), 'MMM d, h:mm a')}</td>
                      <td className="py-2 pr-3 capitalize flex items-center gap-1">{s.type === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}{s.type}</td>
                      <td className="py-2 pr-3">{s.duration_minutes || 50}m</td>
                      <td className="py-2 pr-3"><Badge variant={s.status === 'completed' ? 'default' : s.status === 'no_show' ? 'destructive' : 'outline'} className="text-[10px]">{s.status}</Badge></td>
                      <td className="py-2">
                        {s.status === 'scheduled' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" className="h-6 text-[10px]" onClick={() => startEndSession(s)}>End Session</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive" onClick={() => updateSessionStatus(s.id, 'no_show')}>No-show</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. PAYMENTS */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Payments ({payments.length})</CardTitle>
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Record</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Amount (Rs.) *</Label><Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} /></div>
                  <div><Label>Method</Label>
                    <Select value={paymentForm.method} onValueChange={v => setPaymentForm(p => ({ ...p, method: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank">Bank Transfer</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="jazzcash">JazzCash</SelectItem><SelectItem value="easypaisa">Easypaisa</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {sessions.filter(s => s.status === 'completed').length > 0 && (
                    <div><Label>Link to Session</Label>
                      <Select value={paymentForm.session_id} onValueChange={v => setPaymentForm(p => ({ ...p, session_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Optional..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {sessions.filter(s => s.status === 'completed').map(s => (
                            <SelectItem key={s.id} value={s.id}>{format(parseISO(s.start_time), 'MMM d, h:mm a')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div><Label>Notes</Label><Input value={paymentForm.notes} onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))} /></div>
                  <Button onClick={addPayment} className="w-full">Record Payment</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No payments</p> : (
            <div className="space-y-1.5">
              {payments.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                  <DollarSign className={`h-4 w-4 ${p.status === 'paid' ? 'text-emerald-500' : 'text-destructive'}`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Rs. {Number(p.amount).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-2">{p.method} · {p.payment_date || format(parseISO(p.created_at), 'MMM d')}</span>
                  </div>
                  <Badge variant={p.status === 'paid' ? 'default' : 'destructive'} className="text-[10px]">{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. TASKS */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Tasks ({tasks.length})</CardTitle>
            <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Add Task</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Title *</Label><Input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Type</Label>
                      <Select value={taskForm.type} onValueChange={v => setTaskForm(p => ({ ...p, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="follow_up">Follow-up</SelectItem><SelectItem value="homework">Homework</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem><SelectItem value="reminder">Reminder</SelectItem><SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Priority</Label>
                      <Select value={taskForm.priority} onValueChange={v => setTaskForm(p => ({ ...p, priority: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Due Date</Label><Input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} /></div>
                  <div><Label>Notes</Label><Textarea value={taskForm.notes} onChange={e => setTaskForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                  <Button onClick={addTask} className="w-full">Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No tasks</p> : (
            <div className="space-y-1.5">
              {tasks.map(t => {
                const overdue = t.status === 'pending' && t.due_date && t.due_date < today;
                return (
                  <div key={t.id} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 ${overdue ? 'bg-destructive/5' : ''}`}>
                    <Checkbox checked={t.status === 'completed'} onCheckedChange={() => toggleTask(t.id, t.status)} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${t.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                      <div className="flex gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                        {t.due_date && <span className={`text-[10px] ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{overdue ? 'Overdue: ' : ''}{t.due_date}</span>}
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${t.priority === 'urgent' ? 'bg-destructive' : t.priority === 'high' ? 'bg-orange-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'} text-white`}>{t.priority}</Badge>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteTask(t.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. RESOURCES */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> Resources ({resources.length})</CardTitle>
            <Dialog open={assignResourceOpen} onOpenChange={o => { setAssignResourceOpen(o); if (!o) { setAssignResourceId(''); setAssignDueDate(''); } }}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Assign</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Assign Resource</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Resource *</Label>
                    <Select value={assignResourceId} onValueChange={setAssignResourceId}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{allResources.map(r => <SelectItem key={r.id} value={r.id}>{r.title} ({r.type})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Due Date</Label><Input type="date" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)} /></div>
                  <Button onClick={assignResource} className="w-full">Assign & Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No resources assigned</p> : (
            <div className="space-y-1.5">
              {resources.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                  <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.resources?.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{r.resources?.type}</p>
                  </div>
                  {r.resources?.url && <Button size="sm" variant="ghost" className="h-6" onClick={() => window.open(r.resources.url, '_blank')}><ExternalLink className="h-3 w-3" /></Button>}
                  <Badge variant={r.status === 'completed' ? 'default' : 'outline'} className="text-[10px]">{r.status || 'pending'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 8. NOTES */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Session Notes ({notes.length})</CardTitle>
            <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Add Note</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                <DialogHeader><DialogTitle>SOAP Session Note</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label className="flex items-center gap-1"><Badge variant="outline" className="text-xs font-bold">S</Badge> Subjective</Label>
                      <Textarea value={noteForm.subjective} onChange={e => setNoteForm(p => ({ ...p, subjective: e.target.value }))} placeholder="Patient's reported symptoms..." rows={3} /></div>
                    <div><Label className="flex items-center gap-1"><Badge variant="outline" className="text-xs font-bold">O</Badge> Objective</Label>
                      <Textarea value={noteForm.objective} onChange={e => setNoteForm(p => ({ ...p, objective: e.target.value }))} placeholder="Clinical observations..." rows={3} /></div>
                    <div><Label className="flex items-center gap-1"><Badge variant="outline" className="text-xs font-bold">A</Badge> Assessment</Label>
                      <Textarea value={noteForm.assessment} onChange={e => setNoteForm(p => ({ ...p, assessment: e.target.value }))} placeholder="Diagnosis, impressions..." rows={3} /></div>
                    <div><Label className="flex items-center gap-1"><Badge variant="outline" className="text-xs font-bold">P</Badge> Plan</Label>
                      <Textarea value={noteForm.plan} onChange={e => setNoteForm(p => ({ ...p, plan: e.target.value }))} placeholder="Treatment plan..." rows={3} /></div>
                  </div>
                  <div><Label>🔒 Private Notes</Label><Textarea value={noteForm.private_notes} onChange={e => setNoteForm(p => ({ ...p, private_notes: e.target.value }))} rows={2} className="border-amber-200" /></div>
                  <Button onClick={addNote} className="w-full">Save Note</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No notes</p> : (
            <div className="space-y-3">
              {notes.map(n => {
                const expanded = expandedNoteId === n.id;
                return (
                  <div key={n.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <button className="flex items-center gap-1 text-xs text-muted-foreground" onClick={() => setExpandedNoteId(expanded ? null : n.id)}>
                        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {format(parseISO(n.created_at), 'MMM d, yyyy h:mm a')}
                      </button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteNote(n.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    {expanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {n.subjective && <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-950/20"><p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Subjective</p><p className="text-xs">{n.subjective}</p></div>}
                        {n.objective && <div className="p-2 rounded bg-emerald-50/50 dark:bg-emerald-950/20"><p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Objective</p><p className="text-xs">{n.objective}</p></div>}
                        {n.assessment && <div className="p-2 rounded bg-amber-50/50 dark:bg-amber-950/20"><p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Assessment</p><p className="text-xs">{n.assessment}</p></div>}
                        {n.plan && <div className="p-2 rounded bg-violet-50/50 dark:bg-violet-950/20"><p className="text-[10px] font-bold text-violet-600 uppercase mb-1">Plan</p><p className="text-xs">{n.plan}</p></div>}
                        {n.private_notes && <div className="md:col-span-2 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200"><p className="text-[10px] font-bold text-amber-700 uppercase mb-1">🔒 Private</p><p className="text-xs">{n.private_notes}</p></div>}
                      </div>
                    )}
                    {!expanded && (
                      <p className="text-xs text-muted-foreground truncate">{n.subjective || n.assessment || n.plan || 'No content'}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 9. GOALS */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Goals ({goals.length})</CardTitle>
            <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Add Goal</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Goal</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Title *</Label><Input value={goalForm.title} onChange={e => setGoalForm(p => ({ ...p, title: e.target.value }))} /></div>
                  <div><Label>Description</Label><Textarea value={goalForm.description} onChange={e => setGoalForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                  <div><Label>Target Date</Label><Input type="date" value={goalForm.target_date} onChange={e => setGoalForm(p => ({ ...p, target_date: e.target.value }))} /></div>
                  <Button onClick={addGoal} className="w-full">Add Goal</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No goals set</p> : (
            <div className="space-y-1.5">
              {goals.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                  <Target className={`h-4 w-4 flex-shrink-0 ${g.status === 'achieved' ? 'text-emerald-500' : 'text-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${g.status === 'achieved' ? 'line-through text-muted-foreground' : ''}`}>{g.title}</p>
                    {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                  </div>
                  <Select value={g.status} onValueChange={v => updateGoalStatus(g.id, v)}>
                    <SelectTrigger className="w-28 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active" className="text-xs">Active</SelectItem>
                      <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                      <SelectItem value="achieved" className="text-xs">Achieved</SelectItem>
                      <SelectItem value="paused" className="text-xs">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* END SESSION WORKFLOW DIALOG */}
      <Dialog open={!!endSessionDialog} onOpenChange={o => { if (!o) setEndSessionDialog(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>End Session — Complete Workflow</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">Complete these steps to properly close this session.</p>

            {/* Step 1: SOAP Note */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Badge>1</Badge> Session Note (SOAP)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label className="text-xs">Subjective</Label><Textarea value={endSessionNote.subjective} onChange={e => setEndSessionNote(p => ({ ...p, subjective: e.target.value }))} rows={2} placeholder="Patient's report..." /></div>
                <div><Label className="text-xs">Objective</Label><Textarea value={endSessionNote.objective} onChange={e => setEndSessionNote(p => ({ ...p, objective: e.target.value }))} rows={2} placeholder="Observations..." /></div>
                <div><Label className="text-xs">Assessment</Label><Textarea value={endSessionNote.assessment} onChange={e => setEndSessionNote(p => ({ ...p, assessment: e.target.value }))} rows={2} placeholder="Assessment..." /></div>
                <div><Label className="text-xs">Plan</Label><Textarea value={endSessionNote.plan} onChange={e => setEndSessionNote(p => ({ ...p, plan: e.target.value }))} rows={2} placeholder="Next steps..." /></div>
              </div>
            </div>

            {/* Step 2: Payment */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Badge>2</Badge> Payment</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Amount (Rs.)</Label><Input type="number" value={endSessionPayment.amount} onChange={e => setEndSessionPayment(p => ({ ...p, amount: e.target.value }))} placeholder="Leave empty to skip" /></div>
                <div><Label className="text-xs">Method</Label>
                  <Select value={endSessionPayment.method} onValueChange={v => setEndSessionPayment(p => ({ ...p, method: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank">Bank</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="jazzcash">JazzCash</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Step 3: Schedule Next */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Badge>3</Badge> Schedule Next Session</h3>
              <Input type="datetime-local" value={endSessionNextDate} onChange={e => setEndSessionNextDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">Leave empty to skip scheduling.</p>
            </div>

            <Button onClick={completeEndSession} className="w-full" size="lg">✓ Complete Session</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT CLIENT DIALOG */}
      <Dialog open={editClientOpen} onOpenChange={setEditClientOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Edit Client Details</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full Name</Label><Input value={clientForm.full_name || ''} onChange={e => setClientForm((p: any) => ({ ...p, full_name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={clientForm.email || ''} onChange={e => setClientForm((p: any) => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={clientForm.phone || ''} onChange={e => setClientForm((p: any) => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Gender</Label>
                <Select value={clientForm.gender || ''} onValueChange={v => setClientForm((p: any) => ({ ...p, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Date of Birth</Label><Input type="date" value={clientForm.date_of_birth || ''} onChange={e => setClientForm((p: any) => ({ ...p, date_of_birth: e.target.value }))} /></div>
              <div><Label>Address</Label><Input value={clientForm.address || ''} onChange={e => setClientForm((p: any) => ({ ...p, address: e.target.value }))} /></div>
              <div><Label>Emergency Contact</Label><Input value={clientForm.emergency_contact || ''} onChange={e => setClientForm((p: any) => ({ ...p, emergency_contact: e.target.value }))} /></div>
              <div><Label>Emergency Phone</Label><Input value={clientForm.emergency_phone || ''} onChange={e => setClientForm((p: any) => ({ ...p, emergency_phone: e.target.value }))} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={clientForm.notes || ''} onChange={e => setClientForm((p: any) => ({ ...p, notes: e.target.value }))} rows={3} /></div>
            <Button onClick={saveClientDetails} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientFilePage;
