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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, FileText, Video, Headphones, Search, ExternalLink, Trash2, Edit2, Users, Send, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

const db = supabase as any;
const typeIcons: Record<string, any> = { document: FileText, video: Video, audio: Headphones, worksheet: FileText, exercise: BookOpen, reading: BookOpen };
const TYPES = ['all', 'document', 'video', 'worksheet', 'exercise', 'reading'];

const ResourcesPage = () => {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';
  const [resources, setResources] = useState<any[]>([]);
  const [clientResources, setClientResources] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editResource, setEditResource] = useState<any>(null);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [assignClientId, setAssignClientId] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [form, setForm] = useState({ title: '', description: '', type: 'document', url: '' });
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (isStaff) {
      const [resourcesRes, clientsRes, assignmentsRes] = await Promise.all([
        db.from('resources').select('*').order('created_at', { ascending: false }),
        db.from('clients').select('id, full_name').eq('status', 'active').order('full_name'),
        db.from('resource_assignments').select('*, resources(title), clients:client_id(full_name)').order('assigned_at', { ascending: false }).limit(50),
      ]);
      setResources(resourcesRes.data || []);
      setClients(clientsRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } else {
      const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
      if (cr) {
        const { data } = await db.from('resource_assignments').select('*, resources(*)').eq('client_id', cr.id).order('assigned_at', { ascending: false });
        setClientResources(data || []);
      }
    }
  };

  const addResource = async () => {
    if (!form.title) { toast({ title: "Title required", variant: "destructive" }); return; }
    await db.from('resources').insert({ ...form, created_by: user?.id });
    setCreateOpen(false); setForm({ title: '', description: '', type: 'document', url: '' });
    toast({ title: "Resource created" }); load();
  };

  const saveEdit = async () => {
    if (!editResource) return;
    await db.from('resources').update(form).eq('id', editResource.id);
    setEditResource(null); toast({ title: "Resource updated" }); load();
  };

  const openEdit = (r: any) => {
    setForm({ title: r.title, description: r.description || '', type: r.type, url: r.url || '' });
    setEditResource(r);
  };

  const deleteResource = async (id: string) => {
    await db.from('resource_assignments').delete().eq('resource_id', id);
    await db.from('resources').delete().eq('id', id);
    toast({ title: "Deleted" }); load();
  };

  const assignResource = async () => {
    if (!assignOpen || !assignClientId) { toast({ title: "Select a client", variant: "destructive" }); return; }
    await db.from('resource_assignments').insert({
      resource_id: assignOpen, client_id: assignClientId, assigned_by: user?.id,
      due_date: assignDueDate || null,
    });
    // Auto-create homework task
    const resource = resources.find(r => r.id === assignOpen);
    if (resource) {
      await db.from('tasks').insert({
        client_id: assignClientId, title: `Complete: ${resource.title}`,
        type: 'homework', priority: 'medium', due_date: assignDueDate || null, created_by: user?.id,
      });
    }
    setAssignOpen(null); setAssignClientId(''); setAssignDueDate('');
    toast({ title: "Resource assigned & homework task created" }); load();
  };

  const markComplete = async (id: string) => {
    await db.from('resource_assignments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
    toast({ title: "Completed ✓" }); load();
  };

  const submitResponse = async (id: string, response: string) => {
    await db.from('resource_assignments').update({ response, status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
    toast({ title: "Response submitted ✓" }); load();
  };

  // Client view
  if (!isStaff) {
    const pending = clientResources.filter(cr => cr.status !== 'completed');
    const completed = clientResources.filter(cr => cr.status === 'completed');

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">My Resources</h1>

        {pending.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Pending ({pending.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {pending.map(cr => {
                const r = cr.resources; const Icon = typeIcons[r?.type] || BookOpen;
                return (
                  <div key={cr.id} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{r?.title}</p>
                        {r?.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] capitalize">{r?.type}</Badge>
                          {cr.due_date && <span className="text-[10px] text-muted-foreground">Due: {cr.due_date}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {r?.url && <Button size="sm" variant="outline" className="text-xs" onClick={() => window.open(r.url, '_blank')}><ExternalLink className="h-3 w-3 mr-1" /> Open</Button>}
                      <Button size="sm" onClick={() => markComplete(cr.id)}>Mark Complete</Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {completed.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Completed ({completed.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {completed.map(cr => {
                const r = cr.resources; const Icon = typeIcons[r?.type] || BookOpen;
                return (
                  <div key={cr.id} className="flex items-center gap-3 p-2 rounded-lg opacity-70">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm line-through">{r?.title}</span>
                    {cr.completed_at && <span className="text-[10px] text-muted-foreground ml-auto">{format(parseISO(cr.completed_at), 'MMM d')}</span>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {clientResources.length === 0 && (
          <div className="text-center py-16"><BookOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" /><p className="text-muted-foreground">No resources assigned yet</p></div>
        )}
      </div>
    );
  }

  // Doctor view
  const filtered = resources.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (search && !r.title?.toLowerCase().includes(search.toLowerCase()) && !r.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const ResourceForm = ({ onSave, isEdit }: { onSave: () => void; isEdit?: boolean }) => (
    <div className="space-y-3">
      <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
      <div><Label>Type</Label>
        <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="worksheet">Worksheet</SelectItem>
            <SelectItem value="exercise">Exercise</SelectItem>
            <SelectItem value="reading">Reading</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>URL</Label><Input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." /></div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
      <Button onClick={onSave} className="w-full">{isEdit ? 'Save Changes' : 'Create Resource'}</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Resource Library</h1>
          <p className="text-sm text-muted-foreground">{resources.length} resources · {assignments.filter(a => a.status === 'pending').length} pending assignments</p>
        </div>
        <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) setForm({ title: '', description: '', type: 'document', url: '' }); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> New Resource</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Resource</DialogTitle></DialogHeader>
            <ResourceForm onSave={addResource} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Resources Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16"><BookOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" /><p className="text-muted-foreground">No resources found</p></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(r => {
            const Icon = typeIcons[r.type] || BookOpen;
            const assignCount = assignments.filter(a => a.resource_id === r.id).length;
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{r.title}</p>
                      {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] capitalize">{r.type}</Badge>
                        {assignCount > 0 && <Badge variant="secondary" className="text-[10px]"><Users className="h-2.5 w-2.5 mr-0.5" />{assignCount}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => setAssignOpen(r.id)}>
                      <Send className="h-3 w-3 mr-1" /> Assign
                    </Button>
                    {r.url && <Button size="sm" variant="outline" className="text-xs" onClick={() => window.open(r.url, '_blank')}><ExternalLink className="h-3 w-3" /></Button>}
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => openEdit(r)}><Edit2 className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={() => deleteResource(r.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Assignments */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Recent Assignments</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignments.slice(0, 10).map(a => (
                <div key={a.id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{a.resources?.title}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="text-primary">{(a as any).clients?.full_name}</span>
                  </div>
                  <Badge variant={a.status === 'completed' ? 'default' : 'outline'} className="text-[10px]">{a.status || 'pending'}</Badge>
                  <span className="text-[10px] text-muted-foreground">{format(parseISO(a.assigned_at), 'MMM d')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign Dialog */}
      <Dialog open={!!assignOpen} onOpenChange={o => { if (!o) { setAssignOpen(null); setAssignClientId(''); setAssignDueDate(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Resource</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-medium">{resources.find(r => r.id === assignOpen)?.title}</p>
            <div><Label>Client *</Label>
              <Select value={assignClientId} onValueChange={setAssignClientId}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Due Date</Label><Input type="date" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)} /></div>
            <Button onClick={assignResource} className="w-full">Assign & Create Task</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editResource} onOpenChange={o => { if (!o) setEditResource(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Resource</DialogTitle></DialogHeader>
          <ResourceForm onSave={saveEdit} isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourcesPage;
