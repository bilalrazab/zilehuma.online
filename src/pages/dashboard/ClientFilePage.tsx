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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowLeft, AlertTriangle, Calendar, Clock, DollarSign, Plus,
  FileText, CheckSquare, BookOpen, Target, Activity
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

  // Dialogs
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  // Forms
  const [noteForm, setNoteForm] = useState({ subjective: '', objective: '', assessment: '', plan: '', private_notes: '' });
  const [taskForm, setTaskForm] = useState({ title: '', type: 'follow_up', due_date: '', priority: 'medium', notes: '' });
  const [sessionForm, setSessionForm] = useState({ start_time: '', duration_minutes: 50, type: 'in-person', title: 'Session' });
  const [goalForm, setGoalForm] = useState({ title: '', description: '', target_date: '' });

  const load = useCallback(async () => {
    if (!id) return;
    const [clientRes, checklistRes, timelineRes, sessionsRes, tasksRes, notesRes, resourcesRes, goalsRes, paymentsRes] = await Promise.all([
      db.from('clients').select('*').eq('id', id).single(),
      db.from('client_checklists').select('*').eq('client_id', id).single(),
      db.from('timeline_logs').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(50),
      db.from('appointments').select('*').eq('client_id', id).order('start_time', { ascending: false }),
      db.from('tasks').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      db.from('session_notes').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      db.from('resource_assignments').select('*, resources(title, type, url)').eq('client_id', id),
      db.from('goals').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      db.from('payments').select('*').eq('client_id', id).order('created_at', { ascending: false }),
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
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateClient = async (field: string, value: any) => {
    await db.from('clients').update({ [field]: value }).eq('id', id);
    setClient((p: any) => ({ ...p, [field]: value }));
  };

  const updateChecklist = async (key: string, value: boolean) => {
    await db.from('client_checklists').update({ [key]: value, updated_at: new Date().toISOString() }).eq('client_id', id);
    setChecklist((p: any) => ({ ...p, [key]: value }));
    await db.from('timeline_logs').insert({ client_id: id, type: 'checklist', description: `${value ? '✓' : '✗'} ${CHECKLIST_ITEMS.find(i => i.key === key)?.label}`, created_by: user?.id });
  };

  const addNote = async () => {
    await db.from('session_notes').insert({ client_id: id, doctor_id: user?.id, ...noteForm });
    await db.from('timeline_logs').insert({ client_id: id, type: 'note', description: 'Session note added', created_by: user?.id });
    setNoteOpen(false);
    setNoteForm({ subjective: '', objective: '', assessment: '', plan: '', private_notes: '' });
    toast({ title: "Note saved" });
    load();
  };

  const addTask = async () => {
    if (!taskForm.title) return;
    await db.from('tasks').insert({ client_id: id, ...taskForm, due_date: taskForm.due_date || null, created_by: user?.id });
    setTaskOpen(false);
    setTaskForm({ title: '', type: 'follow_up', due_date: '', priority: 'medium', notes: '' });
    toast({ title: "Task created" });
    load();
  };

  const addSession = async () => {
    if (!sessionForm.start_time) return;
    const start = new Date(sessionForm.start_time);
    const end = new Date(start.getTime() + sessionForm.duration_minutes * 60000);
    await db.from('appointments').insert({
      client_id: id, doctor_id: user?.id, start_time: start.toISOString(), end_time: end.toISOString(),
      duration_minutes: sessionForm.duration_minutes, type: sessionForm.type, title: sessionForm.title
    });
    setSessionOpen(false);
    setSessionForm({ start_time: '', duration_minutes: 50, type: 'in-person', title: 'Session' });
    toast({ title: "Session scheduled" });
    load();
  };

  const addGoal = async () => {
    if (!goalForm.title) return;
    await db.from('goals').insert({ client_id: id, ...goalForm, target_date: goalForm.target_date || null });
    setGoalOpen(false);
    setGoalForm({ title: '', description: '', target_date: '' });
    toast({ title: "Goal added" });
    load();
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await db.from('tasks').update({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }).eq('id', taskId);
    load();
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    await db.from('appointments').update({ status }).eq('id', sessionId);
    toast({ title: `Session marked as ${status}` });
    load();
  };

  if (!client) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const riskBorderColor = client.risk_level === 'high' ? 'border-destructive' : client.risk_level === 'moderate' ? 'border-amber-400' : 'border-border';
  const completedChecks = checklist ? CHECKLIST_ITEMS.filter(i => checklist[i.key]).length : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* BACK */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/clients')} className="text-muted-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Clients
      </Button>

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
              </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="text-lg font-bold">{sessions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Pending Tasks</p>
              <p className="text-lg font-bold">{tasks.filter(t => t.status === 'pending').length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Unpaid</p>
              <p className="text-lg font-bold">{payments.filter(p => p.status === 'unpaid').length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Last Session</p>
              <p className="text-sm font-medium">{sessions[0] ? format(parseISO(sessions[0].start_time), 'MMM d') : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. MASTER CHECKLIST */}
      {checklist && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckSquare className="h-4 w-4" /> Master Checklist
              <Badge variant="secondary" className="ml-auto text-xs">{completedChecks}/{CHECKLIST_ITEMS.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {timeline.map(t => (
                <div key={t.id} className="flex gap-3 items-start">
                  <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                    t.type === 'session' ? 'bg-blue-500' : t.type === 'payment' ? 'bg-emerald-500' :
                    t.type === 'task' ? 'bg-amber-500' : t.type === 'note' ? 'bg-violet-500' : 'bg-muted-foreground'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(parseISO(t.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. SESSIONS TABLE */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Sessions</CardTitle>
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
                        <SelectContent><SelectItem value="in-person">In-Person</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
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
                  <th className="pb-2 pr-4">Date</th><th className="pb-2 pr-4">Type</th><th className="pb-2 pr-4">Status</th><th className="pb-2">Actions</th>
                </tr></thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{format(parseISO(s.start_time), 'MMM d, h:mm a')}</td>
                      <td className="py-2 pr-4 capitalize">{s.type}</td>
                      <td className="py-2 pr-4"><Badge variant={s.status === 'completed' ? 'default' : s.status === 'no_show' ? 'destructive' : 'outline'} className="text-xs">{s.status}</Badge></td>
                      <td className="py-2">
                        {s.status === 'scheduled' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => updateSessionStatus(s.id, 'completed')}>Complete</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={() => updateSessionStatus(s.id, 'no_show')}>No-show</Button>
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

      {/* 5. TASKS */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Tasks</CardTitle>
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
            <div className="space-y-2">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Checkbox checked={t.status === 'completed'} onCheckedChange={() => toggleTask(t.id, t.status)} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${t.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                    <div className="flex gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                      {t.due_date && <span className="text-[10px] text-muted-foreground">{t.due_date}</span>}
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${t.priority === 'urgent' ? 'bg-destructive' : t.priority === 'high' ? 'bg-orange-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'} text-white`}>
                    {t.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. RESOURCES */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> Assigned Resources</CardTitle>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No resources assigned</p> : (
            <div className="space-y-2">
              {resources.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.resources?.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{r.resources?.type}</p>
                  </div>
                  <Badge variant={r.status === 'completed' ? 'default' : 'outline'} className="text-xs">{r.status || 'pending'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. NOTES */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Session Notes</CardTitle>
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
                  <div><Label>Private Notes</Label><Textarea value={noteForm.private_notes} onChange={e => setNoteForm(p => ({ ...p, private_notes: e.target.value }))} placeholder="Internal notes..." rows={2} className="border-amber-200" /></div>
                  <Button onClick={addNote} className="w-full">Save Note</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No notes</p> : (
            <div className="space-y-4">
              {notes.map(n => (
                <div key={n.id} className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-2">{format(parseISO(n.created_at), 'MMM d, yyyy h:mm a')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {n.subjective && <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-950/20"><p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Subjective</p><p className="text-xs">{n.subjective}</p></div>}
                    {n.objective && <div className="p-2 rounded bg-emerald-50/50 dark:bg-emerald-950/20"><p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Objective</p><p className="text-xs">{n.objective}</p></div>}
                    {n.assessment && <div className="p-2 rounded bg-amber-50/50 dark:bg-amber-950/20"><p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Assessment</p><p className="text-xs">{n.assessment}</p></div>}
                    {n.plan && <div className="p-2 rounded bg-violet-50/50 dark:bg-violet-950/20"><p className="text-[10px] font-bold text-violet-600 uppercase mb-1">Plan</p><p className="text-xs">{n.plan}</p></div>}
                  </div>
                  {n.private_notes && <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200"><p className="text-[10px] font-bold text-amber-700 uppercase mb-1">🔒 Private</p><p className="text-xs">{n.private_notes}</p></div>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 8. GOALS */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Goals</CardTitle>
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
            <div className="space-y-2">
              {goals.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Target className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{g.title}</p>
                    {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                  </div>
                  <Badge variant={g.status === 'achieved' ? 'default' : 'outline'} className="text-xs capitalize">{g.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientFilePage;
