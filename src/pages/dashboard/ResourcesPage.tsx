import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, FileText, Video, ExternalLink, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const ResourcesPage = () => {
  const { role, user } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string>("");
  const [clients, setClients] = useState<any[]>([]);
  const [assignClientId, setAssignClientId] = useState("");
  const [form, setForm] = useState({ title: "", description: "", type: "document", url: "" });
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';

  const load = async () => {
    if (isStaff) {
      const { data } = await db.from('resources').select('*').order('created_at', { ascending: false });
      setResources(data || []);
      const { data: c } = await db.from('clients').select('id, full_name').eq('status', 'active');
      setClients(c || []);
    } else {
      const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
      if (cr) {
        const { data } = await db.from('resource_assignments').select('*, resources(*)').eq('client_id', cr.id);
        setResources(data?.map((a: any) => ({ ...a.resources, assignment_id: a.id })) || []);
      }
    }
  };

  useEffect(() => { load(); }, [role]);

  const handleAdd = async () => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    const { error } = await db.from('resources').insert({ ...form, created_by: user?.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Resource added" });
    setOpen(false);
    setForm({ title: "", description: "", type: "document", url: "" });
    load();
  };

  const handleAssign = async () => {
    if (!assignClientId || !selectedResource) return;
    const { error } = await db.from('resource_assignments').insert({
      resource_id: selectedResource, client_id: assignClientId, assigned_by: user?.id
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Resource assigned to client" });
    setAssignOpen(false);
    setAssignClientId("");
  };

  const handleDelete = async (id: string) => {
    await db.from('resources').delete().eq('id', id);
    toast({ title: "Resource deleted" });
    load();
  };

  const typeIcon = (type: string) => {
    if (type === 'video') return <Video className="h-5 w-5" />;
    if (type === 'document' || type === 'pdf') return <FileText className="h-5 w-5" />;
    return <BookOpen className="h-5 w-5" />;
  };

  const typeColor = (type: string) => {
    if (type === 'video') return 'bg-blue-500/10 text-blue-500';
    if (type === 'document' || type === 'pdf') return 'bg-amber-500/10 text-amber-500';
    return 'bg-emerald-500/10 text-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">{isStaff ? 'Resources' : 'My Resources'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{resources.length} resource{resources.length !== 1 ? 's' : ''}</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Resource</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Resource</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Resource title" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Brief description..." rows={3} /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({...p, type: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>URL (optional)</Label><Input value={form.url} onChange={e => setForm(p => ({...p, url: e.target.value}))} placeholder="https://..." /></div>
                <Button onClick={handleAdd} className="w-full">Add Resource</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Resource to Client</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={assignClientId} onValueChange={setAssignClientId}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={handleAssign} className="w-full" disabled={!assignClientId}>Assign</Button>
          </div>
        </DialogContent>
      </Dialog>

      {resources.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium text-lg">No resources yet</p>
          <p className="text-sm text-muted-foreground mt-1">{isStaff ? "Add resources for your clients" : "Resources assigned to you will appear here"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r: any) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${typeColor(r.type)}`}>
                    {typeIcon(r.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold line-clamp-1">{r.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.description || 'No description'}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="capitalize">{r.type}</Badge>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1 hover:underline" onClick={e => e.stopPropagation()}>
                          <ExternalLink className="h-3 w-3" /> Open
                        </a>
                      )}
                    </div>
                    {isStaff && (
                      <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedResource(r.id); setAssignOpen(true); }}>Assign</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
