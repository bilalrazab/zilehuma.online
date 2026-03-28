import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const SessionNotesPage = () => {
  const { role, user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", subjective: "", objective: "", assessment: "", plan: "", duration_minutes: 50 });
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';

  const load = async () => {
    const { data } = await db.from('session_notes').select('*, clients(full_name)').order('session_date', { ascending: false });
    setNotes(data || []);
    if (isStaff) {
      const { data: c } = await db.from('clients').select('id, full_name');
      setClients(c || []);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.client_id) { toast({ title: "Select a client", variant: "destructive" }); return; }
    const { error } = await db.from('session_notes').insert({ ...form, doctor_id: user?.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Session note added" });
    setOpen(false);
    setForm({ client_id: "", subjective: "", objective: "", assessment: "", plan: "", duration_minutes: 50 });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold">{isStaff ? 'Session Notes' : 'Session History'}</h1>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New SOAP Note</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>SOAP Note</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Client</Label>
                  <Select value={form.client_id} onValueChange={v => setForm(p => ({...p, client_id: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Subjective</Label><Textarea value={form.subjective} onChange={e => setForm(p => ({...p, subjective: e.target.value}))} placeholder="Patient's reported symptoms, feelings..." /></div>
                <div><Label>Objective</Label><Textarea value={form.objective} onChange={e => setForm(p => ({...p, objective: e.target.value}))} placeholder="Clinician observations..." /></div>
                <div><Label>Assessment</Label><Textarea value={form.assessment} onChange={e => setForm(p => ({...p, assessment: e.target.value}))} placeholder="Diagnosis, clinical impressions..." /></div>
                <div><Label>Plan</Label><Textarea value={form.plan} onChange={e => setForm(p => ({...p, plan: e.target.value}))} placeholder="Treatment plan, follow-up..." /></div>
                <div><Label>Duration (minutes)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({...p, duration_minutes: parseInt(e.target.value) || 50}))} /></div>
                <Button onClick={handleAdd} className="w-full">Save Note</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="space-y-4">
        {notes.map(n => (
          <Card key={n.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> {n.clients?.full_name || 'Client'}</CardTitle>
                <span className="text-sm text-muted-foreground">{new Date(n.session_date).toLocaleDateString()} • {n.duration_minutes || 50}min</span>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {n.subjective && <div><p className="font-medium text-muted-foreground">Subjective</p><p>{n.subjective}</p></div>}
              {n.objective && <div><p className="font-medium text-muted-foreground">Objective</p><p>{n.objective}</p></div>}
              {n.assessment && <div><p className="font-medium text-muted-foreground">Assessment</p><p>{n.assessment}</p></div>}
              {n.plan && <div><p className="font-medium text-muted-foreground">Plan</p><p>{n.plan}</p></div>}
            </CardContent>
          </Card>
        ))}
        {notes.length === 0 && <p className="text-center text-muted-foreground py-8">No session notes yet</p>}
      </div>
    </div>
  );
};

export default SessionNotesPage;
