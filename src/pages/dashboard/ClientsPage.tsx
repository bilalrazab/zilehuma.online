import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, MoreHorizontal, Mail, Phone, Copy, Check, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const db = supabase as any;

const ClientsPage = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [invitedName, setInvitedName] = useState("");
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", gender: "", date_of_birth: "",
    address: "", emergency_contact: "", emergency_phone: "", notes: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadClients = async () => {
    let query = db.from('clients').select('*').order('created_at', { ascending: false });
    if (search) query = query.ilike('full_name', `%${search}%`);
    if (statusFilter !== "all") query = query.eq('status', statusFilter);
    const { data } = await query;
    setClients(data || []);
  };

  useEffect(() => { loadClients(); }, [search, statusFilter]);

  const handleInviteClient = async () => {
    if (!form.full_name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (!form.email.trim()) { toast({ title: "Email is required for invitation", variant: "destructive" }); return; }

    setIsSubmitting(true);
    const { data, error } = await supabase.functions.invoke('invite-client', {
      body: {
        ...form,
        redirect_url: window.location.origin + '/reset-password'
      }
    });

    if (error || data?.error) {
      toast({ title: "Failed to invite client", description: data?.error || error?.message, variant: "destructive" });
    } else {
      setInvitedName(form.full_name);
      setInviteLink(data.invite_link);
      setOpen(false);
      setInviteDialogOpen(true);
      toast({ title: "Client invited successfully!" });
      setForm({ full_name: "", email: "", phone: "", gender: "", date_of_birth: "", address: "", emergency_contact: "", emergency_phone: "", notes: "" });
      loadClients();
    }
    setIsSubmitting(false);
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!inviteLink) return;
    const message = `Hi ${invitedName}, you've been invited to the client portal by Dr. Zil-e-Huma. Set your password here: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleStatusChange = async (id: string, status: string) => {
    await db.from('clients').update({ status }).eq('id', id);
    toast({ title: `Client marked as ${status}` });
    loadClients();
  };

  const activeCount = clients.filter(c => c.status === 'active').length;
  const inactiveCount = clients.filter(c => c.status !== 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} total · {activeCount} active · {inactiveCount} inactive</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Invite Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Invite New Client</DialogTitle>
              <DialogDescription>
                The client will receive a link to set their password and access the portal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} placeholder="Enter full name" /></div>
                <div className="col-span-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="client@email.com" /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="+92 300 1234567" /></div>
                <div><Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm(p => ({...p, gender: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({...p, date_of_birth: e.target.value}))} /></div>
              </div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Emergency Contact</Label><Input value={form.emergency_contact} onChange={e => setForm(p => ({...p, emergency_contact: e.target.value}))} /></div>
                <div><Label>Emergency Phone</Label><Input value={form.emergency_phone} onChange={e => setForm(p => ({...p, emergency_phone: e.target.value}))} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Initial notes..." rows={3} /></div>
              <Button onClick={handleInviteClient} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating & inviting..." : "Invite Client"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invite Link Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🎉 Client Invited!</DialogTitle>
            <DialogDescription>
              Share this link with <strong>{invitedName}</strong> so they can set their password and access the portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {inviteLink ? (
              <>
                <div className="bg-muted rounded-lg p-3 text-sm break-all font-mono text-muted-foreground">
                  {inviteLink}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopyLink} variant="outline" className="flex-1">
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button onClick={handleWhatsAppShare} variant="outline" className="flex-1 text-green-600 hover:text-green-700">
                    <ExternalLink className="h-4 w-4 mr-2" /> WhatsApp
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                The client account has been created. They can use "Forgot Password" on the login page to set their password.
              </p>
            )}
            <Button onClick={() => setInviteDialogOpen(false)} className="w-full">Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/dashboard/clients/${c.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{c.full_name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{c.email || c.phone || ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-0.5">
                        {c.email && <p className="text-sm flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" /> {c.email}</p>}
                        {c.phone && <p className="text-sm flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" /> {c.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell capitalize">{c.gender || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/clients/${c.id}`)}>View Profile</DropdownMenuItem>
                          {c.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleStatusChange(c.id, 'inactive')}>Mark Inactive</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleStatusChange(c.id, 'active')}>Mark Active</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No clients found</p>
                      <p className="text-sm text-muted-foreground mt-1">Invite your first client to get started</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsPage;
