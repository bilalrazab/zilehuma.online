import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, Filter, MoreHorizontal, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", gender: "", date_of_birth: "",
    address: "", emergency_contact: "", emergency_phone: "", notes: ""
  });
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
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

  const handleAdd = async () => {
    if (!form.full_name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const { error } = await db.from('clients').insert(form);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Client added successfully" });
    setOpen(false);
    setForm({ full_name: "", email: "", phone: "", gender: "", date_of_birth: "", address: "", emergency_contact: "", emergency_phone: "", notes: "" });
    loadClients();
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
            <Button><Plus className="h-4 w-4 mr-2" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
            <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} placeholder="Enter full name" /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="email@example.com" /></div>
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
                <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({...p, date_of_birth: e.target.value}))} /></div>
              </div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Emergency Contact</Label><Input value={form.emergency_contact} onChange={e => setForm(p => ({...p, emergency_contact: e.target.value}))} /></div>
                <div><Label>Emergency Phone</Label><Input value={form.emergency_phone} onChange={e => setForm(p => ({...p, emergency_phone: e.target.value}))} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Initial notes..." rows={3} /></div>
              <Button onClick={handleAdd} className="w-full">Add Client</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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

      {/* Table View */}
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
                      <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No clients found</p>
                      <p className="text-sm text-muted-foreground mt-1">Add your first client to get started</p>
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
