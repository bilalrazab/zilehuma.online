import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, UserPlus, Phone, Mail, AlertTriangle, Users, CheckCircle2, XCircle, Loader2, Info, Trash2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { sendWhatsApp } from "@/lib/whatsapp";
import { isClientAwaitingActivation, isClientProfilePending, shouldAppearInClientList } from "@/lib/clientLifecycle";

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
  const [inviteState, setInviteState] = useState<'form' | 'sending' | 'success' | 'error'>('form');
  const [inviteError, setInviteError] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: ''
  });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.from('clients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (err: any) {
      toast({ title: "Failed to load clients", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetInviteForm = () => {
    setForm({ full_name: '', email: '', phone: '' });
    setInviteState('form');
    setInviteError('');
    setInvitedEmail('');
  };

  const handleInvite = async () => {
    if (!form.full_name.trim()) {
      setInviteError('Full name is required');
      return;
    }
    if (!form.email.trim()) {
      setInviteError('Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setInviteError('Please enter a valid email address');
      return;
    }

    setInviteState('sending');
    setInviteError('');

    try {
      const { data, error } = await supabase.functions.invoke('invite-client', {
        body: {
          ...form,
          email: form.email.trim().toLowerCase(),
          full_name: form.full_name.trim(),
          redirect_url: `${window.location.origin}/reset-password`
        }
      });

      if (error) {
        // supabase.functions.invoke wraps non-2xx as FunctionsHttpError
        let errorMessage = 'Failed to send invitation. Please try again.';
        if (error.message) errorMessage = error.message;
        throw new Error(errorMessage);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success) {
        setInvitedEmail(form.email.trim().toLowerCase());
        setInviteState('success');
        toast({
          title: "✅ Invitation sent!",
          description: `A setup email has been sent to ${form.email}`,
        });
        // WhatsApp welcome message
        if (form.phone) {
          sendWhatsApp(form.phone, `🌸 Welcome to Zil-e-Huma's Clinic!\n\nHi ${form.full_name?.split(' ')[0]},\nYou've been invited to join our client portal. Please check your email (${form.email}) for the setup link.\n\nWe look forward to working with you! 💚\n\n— Zil-e-Huma's Clinic`);
        }
        load();
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err: any) {
      console.error('Invite error:', err);
      const msg = err.message || 'An unexpected error occurred';
      setInviteState('error');
      setInviteError(msg);
      toast({
        title: "Invitation failed",
        description: msg,
        variant: "destructive"
      });
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-client', {
        body: { client_id: deleteTarget.id, delete_auth_user: true }
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast({ title: "Client deleted", description: `${deleteTarget.full_name} and all related records have been removed.` });
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleResendInvite = async (client: any) => {
    if (!client?.email) {
      toast({ title: "Missing email", description: "This client does not have an email address yet.", variant: "destructive" });
      return;
    }

    setResendingId(client.id);

    try {
      const { data, error } = await supabase.functions.invoke('invite-client', {
        body: {
          full_name: client.full_name || '',
          email: client.email,
          phone: client.phone || '',
          redirect_url: `${window.location.origin}/reset-password`
        }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Invitation re-sent",
        description: `A fresh setup email has been sent to ${client.email}.`,
      });

      await load();
    } catch (err: any) {
      toast({ title: "Resend failed", description: err.message, variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  };

  const directoryClients = clients.filter(shouldAppearInClientList);
  const pendingInvites = clients.filter(isClientAwaitingActivation);

  const filtered = directoryClients.filter(c => {
    const matchSearch = c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'all' || c.pipeline_stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">{directoryClients.length} in client list · {pendingInvites.length} pending access</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) resetInviteForm(); }}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" /> Invite Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {inviteState === 'success' ? '✅ Invitation Sent' :
                 inviteState === 'error' ? '❌ Invitation Failed' :
                 'Invite New Client'}
              </DialogTitle>
              <DialogDescription>
                {inviteState === 'form' || inviteState === 'sending'
                  ? 'Send a secure invitation email so the client can set up their account and access the portal.'
                  : inviteState === 'success'
                  ? 'The client will receive an email with instructions.'
                  : 'Something went wrong. You can try again.'}
              </DialogDescription>
            </DialogHeader>

            {inviteState === 'success' && (
              <div className="space-y-4">
                <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800 dark:text-emerald-300">
                    A secure invitation email has been sent to <strong>{invitedEmail}</strong>.
                    They will receive a link to set their password and access the client portal.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs text-muted-foreground">
                    The client should check their inbox (and spam/junk folder). The setup link stays valid for 24 hours.
                    If they don't receive it, you can delete and re-invite them.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}>Done</Button>
                  <Button className="flex-1" onClick={resetInviteForm}>
                    <UserPlus className="h-4 w-4 mr-2" /> Invite Another
                  </Button>
                </div>
              </div>
            )}

            {inviteState === 'error' && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{inviteError}</AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={() => { setInviteState('form'); setInviteError(''); }}>
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {(inviteState === 'form' || inviteState === 'sending') && (
              <div className="space-y-4">
                {inviteError && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{inviteError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Full Name <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g. Ahmed Khan" value={form.full_name} onChange={e => { setForm(p => ({ ...p, full_name: e.target.value })); setInviteError(''); }} disabled={inviteState === 'sending'} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Email <span className="text-destructive">*</span></Label>
                    <Input type="email" placeholder="client@email.com" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setInviteError(''); }} disabled={inviteState === 'sending'} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Phone (for WhatsApp)</Label>
                    <Input type="tel" placeholder="+92 3XX XXXXXXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} disabled={inviteState === 'sending'} />
                  </div>
                </div>

                <Button onClick={handleInvite} disabled={inviteState === 'sending'} className="w-full">
                  {inviteState === 'sending' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending Invitation...</>
                  ) : (
                    <><Mail className="h-4 w-4 mr-2" /> Send Invitation Email</>
                  )}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center">
                  The client will receive a secure email to set their password and access their portal.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {pendingInvites.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-heading font-semibold text-base">Pending portal access</h2>
                <p className="text-sm text-muted-foreground">These people are not in the main client list yet because they have not created their credentials.</p>
              </div>
              <Badge variant="secondary">{pendingInvites.length} pending</Badge>
            </div>

            <div className="grid gap-3">
              {pendingInvites.map(c => {
                const fromWebsite = (c.notes || '').toLowerCase().includes('source: website');
                const resendLoading = resendingId === c.id;

                return (
                  <div key={c.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate">{c.full_name || 'Unnamed client'}</p>
                          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Awaiting credentials</Badge>
                          {fromWebsite && <Badge variant="secondary">Website booking</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                          {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvite(c)}
                          disabled={resendLoading}
                        >
                          {resendLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                          Re-send Invite
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {PIPELINE_STAGES.map(s => {
          const count = s.value === 'all' ? directoryClients.length : directoryClients.filter(c => c.pipeline_stage === s.value).length;
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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium text-lg">
            {search || stageFilter !== 'all' ? 'No clients match your filters' : 'No activated clients yet'}
          </p>
          {!search && stageFilter === 'all' && (
            <p className="text-sm text-muted-foreground mt-1">Invite a client or let them book online — they will appear here after setting up their portal access.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => {
            const profilePending = isClientProfilePending(c);
            return (
              <Card key={c.id} className={`cursor-pointer hover:shadow-md transition-shadow ${c.risk_level === 'high' ? 'border-l-4 border-l-destructive' : c.risk_level === 'moderate' ? 'border-l-4 border-l-amber-400' : profilePending ? 'border-l-4 border-l-primary' : ''}`}
                onClick={() => navigate(`/dashboard/clients/${c.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-primary/10 text-primary">
                      {c.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{c.full_name}</p>
                        {profilePending && <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/30 bg-primary/10 text-primary">Profile setup pending</Badge>}
                        {c.risk_level === 'high' && <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {c.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{c.email}</span>}
                        {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                      </div>
                      {profilePending && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">This client has created access but still needs to finish their profile.</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${stageColors[c.pipeline_stage] || stageColors.active}`}>
                        {PIPELINE_STAGES.find(s => s.value === c.pipeline_stage)?.label || c.pipeline_stage || 'Active'}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.full_name}</strong> and all their records (sessions, notes, payments, messages, tasks, etc.). Their login account will also be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientsPage;
