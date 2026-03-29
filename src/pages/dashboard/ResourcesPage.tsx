import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, FileText, Video, Headphones, Search, ExternalLink, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;
const typeIcons: Record<string, any> = { document: FileText, video: Video, audio: Headphones, worksheet: FileText, exercise: BookOpen, reading: BookOpen };

const ResourcesPage = () => {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';
  const [resources, setResources] = useState<any[]>([]);
  const [clientResources, setClientResources] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'document', url: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (isStaff) {
      const { data } = await db.from('resources').select('*').order('created_at', { ascending: false });
      setResources(data || []);
    } else {
      const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
      if (cr) {
        const { data } = await db.from('resource_assignments').select('*, resources(*)').eq('client_id', cr.id);
        setClientResources(data || []);
      }
    }
  };

  const addResource = async () => {
    if (!form.title) return;
    await db.from('resources').insert({ ...form, created_by: user?.id });
    setOpen(false); setForm({ title: '', description: '', type: 'document', url: '' });
    toast({ title: "Resource created" }); load();
  };

  const deleteResource = async (id: string) => { await db.from('resources').delete().eq('id', id); toast({ title: "Deleted" }); load(); };

  const markComplete = async (id: string) => {
    await db.from('resource_assignments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
    toast({ title: "Done ✓" }); load();
  };

  if (!isStaff) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">My Resources</h1>
        {clientResources.length === 0 ? (
          <div className="text-center py-16"><BookOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" /><p className="text-muted-foreground">No resources assigned yet</p></div>
        ) : (
          <div className="space-y-3">
            {clientResources.map(cr => {
              const r = cr.resources; const Icon = typeIcons[r?.type] || BookOpen;
              return (
                <Card key={cr.id}><CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium">{r?.title}</p>{r?.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}</div>
                  {r?.url && <Button size="sm" variant="ghost" onClick={() => window.open(r.url, '_blank')}><ExternalLink className="h-3.5 w-3.5" /></Button>}
                  {cr.status !== 'completed' ? <Button size="sm" variant="outline" onClick={() => markComplete(cr.id)}>Done</Button> : <Badge className="text-xs">Done</Badge>}
                </CardContent></Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const filtered = resources.filter(r => r.title?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-heading font-bold">Resource Library</h1><p className="text-sm text-muted-foreground">{resources.length} resources</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Resource</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Resource</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="document">Document</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="worksheet">Worksheet</SelectItem><SelectItem value="exercise">Exercise</SelectItem><SelectItem value="reading">Reading</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>URL</Label><Input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
              <Button onClick={addResource} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(r => {
          const Icon = typeIcons[r.type] || BookOpen;
          return (
            <Card key={r.id} className="hover:shadow-md transition-shadow"><CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold">{r.title}</p><Badge variant="outline" className="text-[10px] mt-1 capitalize">{r.type}</Badge></div>
              </div>
              <div className="flex gap-2 mt-3">
                {r.url && <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => window.open(r.url, '_blank')}><ExternalLink className="h-3 w-3 mr-1" /> Open</Button>}
                <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={() => deleteResource(r.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
};

export default ResourcesPage;
