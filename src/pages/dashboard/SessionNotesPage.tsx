import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const db = supabase as any;

const SessionNotesPage = () => {
  const { role, user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_id: "", subjective: "", objective: "", assessment: "", plan: "", private_notes: ""
  });
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';

  const load = async () => {
    if (isStaff) {
      const { data } = await db.from('session_notes').select('*, clients(full_name)').order('created_at', { ascending: false });
      setNotes(data || []);
      const { data: c } = await db.from('clients').select('id, full_name');
      setClients(c || []);
    } else {
      // Client can see their own session notes
      const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
      if (cr) {
        const { data } = await db.from('session_notes').select('*').eq('client_id', cr.id).order('created_at', { ascending: false });
        setNotes(data || []);
      }
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.client_id) { toast({ title: "Select a client", variant: "destructive" }); return; }
    const { error } = await db.from('session_notes').insert({
      client_id: form.client_id,
      doctor_id: user?.id,
      subjective: form.subjective || null,
      objective: form.objective || null,
      assessment: form.assessment || null,
      plan: form.plan || null,
      private_notes: form.private_notes || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Session note saved" });
    setOpen(false);
    setForm({ client_id: "", subjective: "", objective: "", assessment: "", plan: "", private_notes: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">{isStaff ? 'Session Notes' : 'Session History'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{notes.length} note{notes.length !== 1 ? 's' : ''} recorded</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New SOAP Note</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
              <DialogHeader><DialogTitle>SOAP Session Note</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Client *</Label>
                  <Select value={form.client_id} onValueChange={v => setForm(p => ({...p, client_id: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2"><Badge variant="outline" className="text-xs font-bold">S</Badge> Subjective</Label>
                    <Textarea value={form.subjective} onChange={e => setForm(p => ({...p, subjective: e.target.value}))} placeholder="Patient's reported symptoms, feelings, concerns..." rows={4} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2"><Badge variant="outline" className="text-xs font-bold">O</Badge> Objective</Label>
                    <Textarea value={form.objective} onChange={e => setForm(p => ({...p, objective: e.target.value}))} placeholder="Clinical observations, test results..." rows={4} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2"><Badge variant="outline" className="text-xs font-bold">A</Badge> Assessment</Label>
                    <Textarea value={form.assessment} onChange={e => setForm(p => ({...p, assessment: e.target.value}))} placeholder="Diagnosis, clinical impressions..." rows={4} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2"><Badge variant="outline" className="text-xs font-bold">P</Badge> Plan</Label>
                    <Textarea value={form.plan} onChange={e => setForm(p => ({...p, plan: e.target.value}))} placeholder="Treatment plan, follow-up actions..." rows={4} />
                  </div>
                </div>
                {isStaff && (
                  <div className="space-y-1.5">
                    <Label>Private Notes (not visible to client)</Label>
                    <Textarea value={form.private_notes} onChange={e => setForm(p => ({...p, private_notes: e.target.value}))} placeholder="Internal notes..." rows={2} className="border-amber-200 focus-visible:ring-amber-300" />
                  </div>
                )}
                <Button onClick={handleAdd} className="w-full">Save Note</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium text-lg">No session notes yet</p>
          <p className="text-sm text-muted-foreground mt-1">{isStaff ? "Create your first SOAP note" : "Your session notes will appear here"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => {
            const isExpanded = expandedId === n.id;
            return (
              <Card key={n.id} className="hover:shadow-md transition-shadow">
                <Collapsible open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : n.id)}>
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-4 cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{n.clients?.full_name || 'Client'}</p>
                          <p className="text-sm text-muted-foreground">{new Date(n.created_at).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {n.subjective && <Badge variant="outline" className="text-xs hidden sm:inline-flex">S</Badge>}
                          {n.objective && <Badge variant="outline" className="text-xs hidden sm:inline-flex">O</Badge>}
                          {n.assessment && <Badge variant="outline" className="text-xs hidden sm:inline-flex">A</Badge>}
                          {n.plan && <Badge variant="outline" className="text-xs hidden sm:inline-flex">P</Badge>}
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {n.subjective && (
                          <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                            <p className="font-semibold text-blue-700 dark:text-blue-400 text-xs uppercase tracking-wider mb-1.5">Subjective</p>
                            <p className="text-sm">{n.subjective}</p>
                          </div>
                        )}
                        {n.objective && (
                          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                            <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider mb-1.5">Objective</p>
                            <p className="text-sm">{n.objective}</p>
                          </div>
                        )}
                        {n.assessment && (
                          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                            <p className="font-semibold text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wider mb-1.5">Assessment</p>
                            <p className="text-sm">{n.assessment}</p>
                          </div>
                        )}
                        {n.plan && (
                          <div className="p-3 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                            <p className="font-semibold text-violet-700 dark:text-violet-400 text-xs uppercase tracking-wider mb-1.5">Plan</p>
                            <p className="text-sm">{n.plan}</p>
                          </div>
                        )}
                      </div>
                      {isStaff && n.private_notes && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                          <p className="font-semibold text-amber-800 dark:text-amber-300 text-xs uppercase tracking-wider mb-1">🔒 Private Notes</p>
                          <p className="text-sm">{n.private_notes}</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SessionNotesPage;
