import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (isStaff) {
      const { data } = await db.from('tasks').select('*, clients(full_name)').order('due_date', { ascending: true });
      setTasks(data || []);
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
    await db.from('tasks').update({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }).eq('id', taskId);
    toast({ title: newStatus === 'completed' ? 'Task completed ✓' : 'Task reopened' });
    load();
  };

  const filtered = tasks.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase()) && !t.clients?.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">{isStaff ? 'Task Board' : 'My Tasks'}</h1>
        <p className="text-sm text-muted-foreground">{tasks.filter(t => t.status === 'pending').length} pending tasks</p>
      </div>

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

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const overdue = t.status === 'pending' && t.due_date && t.due_date < today;
            return (
              <Card key={t.id} className={`${overdue ? 'border-destructive/50' : ''}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox checked={t.status === 'completed'} onCheckedChange={() => toggleTask(t.id, t.status)} />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => isStaff && t.client_id && navigate(`/dashboard/clients/${t.client_id}`)}>
                    <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isStaff && t.clients?.full_name && <span className="text-xs text-muted-foreground">{t.clients.full_name}</span>}
                      <Badge variant="outline" className="text-[10px] capitalize">{t.type.replace(/_/g, ' ')}</Badge>
                      {t.due_date && <span className={`text-[10px] ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{overdue ? 'Overdue: ' : ''}{t.due_date}</span>}
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${priorityColor[t.priority] || ''}`}>{t.priority}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
