import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const db = supabase as any;

const ClientsPage = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", gender: "", intake_notes: "" });
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadClients = async () => {
    let query = db.from('clients').select('*').order('created_at', { ascending: false });
    if (search) query = query.ilike('full_name', `%${search}%`);
    const { data } = await query;
    setClients(data || []);
  };

  useEffect(() => { loadClients(); }, [search]);

  const handleAdd = async () => {
    if (!form.full_name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const { error } = await db.from('clients').insert(form);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Client added" });
    setOpen(false);
    setForm({ full_name: "", email: "", phone: "", gender: "", intake_notes: "" });
    loadClients();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold">Clients</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} /></div>
              <div><Label>Gender</Label><Input value={form.gender} onChange={e => setForm(p => ({...p, gender: e.target.value}))} /></div>
              <div><Label>Intake Notes</Label><Textarea value={form.intake_notes} onChange={e => setForm(p => ({...p, intake_notes: e.target.value}))} /></div>
              <Button onClick={handleAdd} className="w-full">Add Client</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(c => (
          <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/dashboard/clients/${c.id}`)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.full_name}</p>
                  <p className="text-sm text-muted-foreground">{c.email || 'No email'}</p>
                </div>
                <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="ml-auto">{c.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {clients.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No clients found. Add your first client to get started.</p>}
      </div>
    </div>
  );
};

export default ClientsPage;
