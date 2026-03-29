import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, UserPlus, Phone, Mail, AlertTriangle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const PIPELINE_STAGES = [
  { value: 'all', label: 'All' },
  { value: 'new_inquiry', label: 'New Inquiry' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'intake_started', label: 'Intake Started' },
  { value: 'intake_completed', label: 'Intake Completed' },
  { value: 'booked', label: 'Booked' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'closed', label: 'Closed' },
];

const stageColors: Record<string, string> = {
  new_inquiry: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  contacted: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  intake_started: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  intake_completed: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  booked: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  inactive: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const ClientsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await db.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data || []);
  };

  const handleInvite = async () => {
    if (!form.full_name || !form.email) { toast({ title: "Name and email required", variant: "destructive" }); return; }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-client', {
        body: {
          email: form.email,
          full_name: form.full_name,
          phone: form.phone,
          redirect_url: `${window.location.origin}/reset-password`
        }
      });
      if (error) throw error;
      if (data?.success) {
        setInviteSent(true);
        toast({ title: "Invite email sent", description: `Password setup email sent to ${form.email}.` });
        load();
      }
      else if (data?.error) toast({ title: "Error", description: data.error, variant: "destructive" });
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    setInviting(false);
  };

  const filtered = clients.filter(c => {
    const matchSearch = c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'all' || c.pipeline_stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">{clients.length} total</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) { setInviteSent(false); setForm({ full_name: '', email: '', phone: '' }); } }}>
          <DialogTrigger asChild><Button><UserPlus className="h-4 w-4 mr-2" /> Invite Client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{inviteSent ? 'Invite Email Sent' : 'Invite New Client'}</DialogTitle></DialogHeader>
            {inviteSent ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The client has been emailed a fresh invitation link to create their password and access the portal.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setInviteOpen(false)}>Done</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></div>
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <Button onClick={handleInvite} disabled={inviting} className="w-full">{inviting ? 'Inviting...' : 'Send Invite'}</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {PIPELINE_STAGES.map(s => {
          const count = s.value === 'all' ? clients.length : clients.filter(c => c.pipeline_stage === s.value).length;
          return (
            <Button key={s.value} variant={stageFilter === s.value ? 'default' : 'outline'} size="sm" className="text-xs whitespace-nowrap"
              onClick={() => setStageFilter(s.value)}>
              {s.label} {count > 0 && <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{count}</Badge>}
            </Button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium text-lg">No clients found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <Card key={c.id} className={`cursor-pointer hover:shadow-md transition-shadow ${c.risk_level === 'high' ? 'border-l-4 border-l-destructive' : c.risk_level === 'moderate' ? 'border-l-4 border-l-amber-400' : ''}`}
              onClick={() => navigate(`/dashboard/clients/${c.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {c.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{c.full_name}</p>
                      {c.risk_level === 'high' && <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {c.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${stageColors[c.pipeline_stage] || stageColors.active}`}>
                    {PIPELINE_STAGES.find(s => s.value === c.pipeline_stage)?.label || c.pipeline_stage || 'Active'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
