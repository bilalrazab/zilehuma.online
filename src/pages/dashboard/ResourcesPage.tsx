import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, FileText, Video, CheckCircle } from "lucide-react";
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
  const [form, setForm] = useState({ title: "", description: "", type: "article", category: "General", content: "", video_url: "" });
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';

  const load = async () => {
    if (isStaff) {
      const { data } = await db.from('resources').select('*').eq('is_archived', false).order('created_at', { ascending: false });
      setResources(data || []);
    } else {
      const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
      if (cr) {
        const { data } = await db.from('resource_assignments').select('*, resources(*)').eq('client_id', cr.id);
        setResources(data?.map((a: any) => ({ ...a.resources, assignment_status: a.status, assignment_id: a.id })) || []);
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
    setForm({ title: "", description: "", type: "article", category: "General", content: "", video_url: "" });
    load();
  };

  const markComplete = async (assignmentId: string) => {
    await db.from('resource_assignments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', assignmentId);
    toast({ title: "Marked as complete" });
    load();
  };

  const typeIcon = (type: string) => {
    if (type === 'video') return <Video className="h-4 w-4" />;
    if (type === 'pdf' || type === 'worksheet') return <FileText className="h-4 w-4" />;
    return <BookOpen className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold">{isStaff ? 'Resources' : 'My Resources'}</h1>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Resource</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Resource</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({...p, type: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="worksheet">Worksheet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({...p, category: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Homework">Homework</SelectItem>
                      <SelectItem value="Psychoeducation">Psychoeducation</SelectItem>
                      <SelectItem value="Mindfulness">Mindfulness</SelectItem>
                      <SelectItem value="Assessment">Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Video URL (optional)</Label><Input value={form.video_url} onChange={e => setForm(p => ({...p, video_url: e.target.value}))} /></div>
                <div><Label>Content</Label><Textarea value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} rows={4} /></div>
                <Button onClick={handleAdd} className="w-full">Add Resource</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{typeIcon(r.type)}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{r.category}</Badge>
                    <Badge variant="outline">{r.type}</Badge>
                  </div>
                  {!isStaff && r.assignment_status && (
                    <div className="mt-2">
                      {r.assignment_status === 'completed' ? (
                        <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => markComplete(r.assignment_id)}>Mark Complete</Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {resources.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No resources yet</p>}
      </div>
    </div>
  );
};

export default ResourcesPage;
