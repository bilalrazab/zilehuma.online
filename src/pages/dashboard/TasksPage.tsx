import { useEffect, useState } from "react";
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
import { CheckSquare, Search, Plus, Trash2, Edit2, AlertTriangle, Calendar, Clock, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isToday, isPast, isTomorrow } from "date-fns";

const db = supabase as any;

const TYPES = ['all', 'follow_up', 'homework', 'payment', 'reminder', 'admin'];
const PRIORITIES = ['all', 'urgent', 'high', 'medium', 'low'];
const STATUSES = ['all', 'pending', 'completed', 'cancelled'];

const priorityColor: Record<string, string> = {
  urgent: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-blue-500 text-white',
};

const TasksPage = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [form, setForm] = useState({ title: '', type: 'follow_up', priority: 'medium', due_date: '', notes: '', client_id: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (isStaff) {
      const [tasksRes, clientsRes] = await Promise.all([
        db.from('tasks').select('*, clients(full_name)').order('due_date', { ascending: true }),
        db.from('clients').select('id, full_name').eq('status', 'active').order('full_name'),
      ]);
      setTasks(tasksRes.data || []);
      setClients(clientsRes.data || []);
    } else {
      const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
      if (cr) {
        const { data } = await db.from('tasks').select('*').eq('client_id', cr.id).order('due_date', { ascending: true });
        setTasks(data || []);
      }
    }
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await db.from('tasks').update({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', taskId);
    toast({ title: newStatus === 'completed' ? 'Task completed ✓' : 'Task reopened' });
    load();
  };

  const deleteTask = async (taskId: string) => {
    await db.from('tasks').delete().eq('id', taskId);
    toast({ title: "Task deleted" }); load();
  };

  const createTask = async () => {
    if (!form.title) { toast({ title: "Title required", variant: "destructive" }); return; }
    await db.from('tasks').insert({
      title: form.title, type: form.type, priority: form.priority,
      due_date: form.due_date || null, notes: form.notes || null,
      client_id: form.client_id || null, created_by: user?.id
    });
    setCreateOpen(false);
    setForm({ title: '', type: 'follow_up', priority: 'medium', due_date: '', notes: '', client_id: '' });
    toast({ title: "Task created" }); load();
  };

  const saveEdit = async () => {
    if (!editTask) return;
    await db.from('tasks').update({
      title: form.title, type: form.type, priority: form.priority,
      due_date: form.due_date || null, notes: form.notes || null,
      client_id: form.client_id || null, updated_at: new Date().toISOString()
    }).eq('id', editTask.id);
    setEditTask(null);
    toast({ title: "Task updated" }); load();
  };

  const openEdit = (t: any) => {
    setForm({ title: t.title, type: t.type, priority: t.priority, due_date: t.due_date || '', notes: t.notes || '', client_id: t.client_id || '' });
    setEditTask(t);
  };

  const bulkComplete = async () => {
    const pendingIds = filtered.filter(t => t.status === 'pending').map(t => t.id);
    if (pendingIds.length === 0) return;
    for (const id of pendingIds) {
      await db.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
    }
    toast({ title: `${pendingIds.length} tasks completed` }); load();
  };

  const filtered = tasks.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase()) && !t.clients?.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const today = new Date().toISOString().split('T')[0];
  const overdue = filtered.filter(t => t.status === 'pending' && t.due_date && t.due_date < today);
  const dueToday = filtered.filter(t => t.status === 'pending' && t.due_date === today);
  const upcoming = filtered.filter(t => t.status === 'pending' && t.due_date && t.due_date > today);
  const noDate = filtered.filter(t => t.status === 'pending' && !t.due_date);
  const completed = filtered.filter(t => t.status === 'completed');
  const cancelled = filtered.filter(t => t.status === 'cancelled');

  const totalPending = tasks.filter(t => t.status === 'pending').length;
  const totalCompleted = tasks.filter(t => t.status === 'completed').length;
  const totalOverdue = tasks.filter(t => t.status === 'pending' && t.due_date && t.due_date < today).length;

  const TaskForm = ({ onSave, isEdit }: { onSave: () => void; isEdit?: boolean }) => (
    <div className="space-y-3">
      <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
      {isStaff && (
        <div><Label>Client</Label>
          <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No client</SelectItem>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Type</Label>
          <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="homework">Homework</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Priority</Label>
          <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} /></div>
      <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
      <Button onClick={onSave} className="w-full">{isEdit ? 'Save Changes' : 'Create Task'}</Button>
    </div>
  );

  const TaskItem = ({ t }: { t: any }) => {
    const isOverdue = t.status === 'pending' && t.due_date && t.due_date < today;
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/30 ${isOverdue ? 'border-destructive/40 bg-destructive/5' : ''}`}>
        <Checkbox checked={t.status === 'completed'} onCheckedChange={() => toggleTask(t.id, t.status)} />
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => isStaff && t.client_id && navigate(`/dashboard/clients/${t.client_id}`)}>
          <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {isStaff && t.clients?.full_name && <span className="text-xs text-primary font-medium">{t.clients.full_name}</span>}
            <Badge variant="outline" className="text-[10px] capitalize">{t.type.replace(/_/g, ' ')}</Badge>
            {t.due_date && (
              <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                <Calendar className="h-2.5 w-2.5" />
                {isOverdue ? 'Overdue: ' : ''}{t.due_date}
              </span>
            )}
            {t.notes && <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">📝 {t.notes}</span>}
          </div>
        </div>
        <Badge className={`text-[10px] ${priorityColor[t.priority] || ''}`}>{t.priority}</Badge>
        {isStaff && (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}><Edit2 className="h-3 w-3" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteTask(t.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        )}
      </div>
    );
  };

  const TaskGroup = ({ title, icon, tasks: groupTasks, variant }: { title: string; icon: React.ReactNode; tasks: any[]; variant?: string }) => {
    if (groupTasks.length === 0) return null;
    return (
      <Card className={variant === 'destructive' ? 'border-destructive/30' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon} {title}
            <Badge variant="secondary" className="ml-auto text-xs">{groupTasks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {groupTasks.map(t => <TaskItem key={t.id} t={t} />)}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">{isStaff ? 'Task Board' : 'My Tasks'}</h1>
          <div className="flex gap-3 text-sm text-muted-foreground mt-1">
            <span>{totalPending} pending</span>
            <span>·</span>
            <span>{totalCompleted} completed</span>
            {totalOverdue > 0 && <><span>·</span><span className="text-destructive font-medium">{totalOverdue} overdue</span></>}
          </div>
        </div>
        <div className="flex gap-2">
          {isStaff && statusFilter === 'pending' && filtered.length > 0 && (
            <Button size="sm" variant="outline" onClick={bulkComplete}>Complete All ({filtered.filter(t => t.status === 'pending').length})</Button>
          )}
          {isStaff && (
            <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) setForm({ title: '', type: 'follow_up', priority: 'medium', due_date: '', notes: '', client_id: '' }); }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> New Task</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
                <TaskForm onSave={createTask} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Task Groups */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium text-lg">No tasks found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting filters or create a new task</p>
        </div>
      ) : statusFilter === 'all' || statusFilter === 'pending' ? (
        <div className="space-y-4">
          <TaskGroup title="Overdue" icon={<AlertTriangle className="h-4 w-4 text-destructive" />} tasks={overdue} variant="destructive" />
          <TaskGroup title="Due Today" icon={<Clock className="h-4 w-4 text-primary" />} tasks={dueToday} />
          <TaskGroup title="Upcoming" icon={<Calendar className="h-4 w-4 text-muted-foreground" />} tasks={upcoming} />
          <TaskGroup title="No Due Date" icon={<Filter className="h-4 w-4 text-muted-foreground" />} tasks={noDate} />
          {statusFilter === 'all' && <TaskGroup title="Completed" icon={<CheckSquare className="h-4 w-4 text-emerald-500" />} tasks={completed} />}
          {statusFilter === 'all' && <TaskGroup title="Cancelled" icon={<Trash2 className="h-4 w-4 text-muted-foreground" />} tasks={cancelled} />}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(t => <TaskItem key={t.id} t={t} />)}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTask} onOpenChange={o => { if (!o) setEditTask(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          <TaskForm onSave={saveEdit} isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;
