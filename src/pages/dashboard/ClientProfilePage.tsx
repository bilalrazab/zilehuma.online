import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  User, Calendar, FileText, Target, ArrowLeft, Mail, Phone, MapPin,
  AlertCircle, Edit, Plus, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const db = supabase as any;

const ClientProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [planOpen, setPlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ title: "", description: "", goals: "" });

  useEffect(() => {
    if (!id) return;
    loadAll();
  }, [id]);

  const loadAll = async () => {
    const [clientRes, apptsRes, notesRes, plansRes] = await Promise.all([
      db.from('clients').select('*').eq('id', id).single(),
      db.from('appointments').select('*').eq('client_id', id).order('start_time', { ascending: false }),
      db.from('session_notes').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      db.from('treatment_plans').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ]);
    setClient(clientRes.data);
    setEditForm(clientRes.data || {});
    setAppointments(apptsRes.data || []);
    setNotes(notesRes.data || []);
    setPlans(plansRes.data || []);
  };

  const handleSave = async () => {
    const { error } = await db.from('clients').update({
      full_name: editForm.full_name,
      email: editForm.email,
      phone: editForm.phone,
      gender: editForm.gender,
      date_of_birth: editForm.date_of_birth,
      address: editForm.address,
      emergency_contact: editForm.emergency_contact,
      emergency_phone: editForm.emergency_phone,
      notes: editForm.notes,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Client updated" });
    setEditing(false);
    loadAll();
  };

  const handleAddPlan = async () => {
    if (!planForm.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    const { error } = await db.from('treatment_plans').insert({
      client_id: id, doctor_id: user?.id, ...planForm
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Treatment plan added" });
    setPlanOpen(false);
    setPlanForm({ title: "", description: "", goals: "" });
    loadAll();
  };

  if (!client) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Loading client...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/clients')} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
          {client.full_name?.charAt(0)?.toUpperCase() || 'C'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-heading font-bold">{client.full_name}</h1>
            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>{client.status}</Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
            {client.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {client.email}</span>}
            {client.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {client.phone}</span>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
          <Edit className="h-4 w-4 mr-2" /> {editing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{appointments.length}</p>
            <p className="text-xs text-muted-foreground">Appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{notes.length}</p>
            <p className="text-xs text-muted-foreground">Session Notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{plans.length}</p>
            <p className="text-xs text-muted-foreground">Treatment Plans</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Full Name</Label><Input value={editForm.full_name || ''} onChange={e => setEditForm((p: any) => ({...p, full_name: e.target.value}))} /></div>
                    <div><Label>Email</Label><Input value={editForm.email || ''} onChange={e => setEditForm((p: any) => ({...p, email: e.target.value}))} /></div>
                    <div><Label>Phone</Label><Input value={editForm.phone || ''} onChange={e => setEditForm((p: any) => ({...p, phone: e.target.value}))} /></div>
                    <div><Label>Gender</Label>
                      <Select value={editForm.gender || ''} onValueChange={v => setEditForm((p: any) => ({...p, gender: v}))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Date of Birth</Label><Input type="date" value={editForm.date_of_birth || ''} onChange={e => setEditForm((p: any) => ({...p, date_of_birth: e.target.value}))} /></div>
                    <div><Label>Address</Label><Input value={editForm.address || ''} onChange={e => setEditForm((p: any) => ({...p, address: e.target.value}))} /></div>
                    <div><Label>Emergency Contact</Label><Input value={editForm.emergency_contact || ''} onChange={e => setEditForm((p: any) => ({...p, emergency_contact: e.target.value}))} /></div>
                    <div><Label>Emergency Phone</Label><Input value={editForm.emergency_phone || ''} onChange={e => setEditForm((p: any) => ({...p, emergency_phone: e.target.value}))} /></div>
                  </div>
                  <div><Label>Notes</Label><Textarea value={editForm.notes || ''} onChange={e => setEditForm((p: any) => ({...p, notes: e.target.value}))} rows={3} /></div>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoItem label="Gender" value={client.gender} />
                  <InfoItem label="Date of Birth" value={client.date_of_birth} />
                  <InfoItem label="Address" value={client.address} icon={<MapPin className="h-3.5 w-3.5" />} />
                  <InfoItem label="Emergency Contact" value={`${client.emergency_contact || '—'} ${client.emergency_phone || ''}`} icon={<AlertCircle className="h-3.5 w-3.5" />} />
                  <div className="col-span-full">
                    <p className="text-sm text-muted-foreground font-medium mb-1">Notes</p>
                    <p className="text-sm">{client.notes || 'No notes'}</p>
                  </div>
                  <div className="col-span-full">
                    <p className="text-sm text-muted-foreground font-medium mb-1">Member Since</p>
                    <p className="text-sm">{new Date(client.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4 space-y-3">
          {appointments.map(a => (
            <Card key={a.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(a.start_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <Badge variant={a.status === 'completed' ? 'secondary' : a.status === 'scheduled' ? 'default' : 'outline'}>{a.status}</Badge>
              </CardContent>
            </Card>
          ))}
          {appointments.length === 0 && <EmptyState icon={Calendar} text="No appointments" />}
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-3">
          {notes.map(n => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-500" />
                    <span className="text-sm text-muted-foreground">{new Date(n.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                  </div>
                  <div className="flex gap-1">
                    {n.subjective && <Badge variant="outline" className="text-xs">S</Badge>}
                    {n.objective && <Badge variant="outline" className="text-xs">O</Badge>}
                    {n.assessment && <Badge variant="outline" className="text-xs">A</Badge>}
                    {n.plan && <Badge variant="outline" className="text-xs">P</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {n.subjective && <SoapBlock label="Subjective" value={n.subjective} color="blue" />}
                  {n.objective && <SoapBlock label="Objective" value={n.objective} color="emerald" />}
                  {n.assessment && <SoapBlock label="Assessment" value={n.assessment} color="amber" />}
                  {n.plan && <SoapBlock label="Plan" value={n.plan} color="violet" />}
                </div>
              </CardContent>
            </Card>
          ))}
          {notes.length === 0 && <EmptyState icon={FileText} text="No session notes" />}
        </TabsContent>

        <TabsContent value="plans" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Dialog open={planOpen} onOpenChange={setPlanOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Plan</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Treatment Plan</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Title *</Label><Input value={planForm.title} onChange={e => setPlanForm(p => ({...p, title: e.target.value}))} /></div>
                  <div><Label>Description</Label><Textarea value={planForm.description} onChange={e => setPlanForm(p => ({...p, description: e.target.value}))} rows={3} /></div>
                  <div><Label>Goals</Label><Textarea value={planForm.goals} onChange={e => setPlanForm(p => ({...p, goals: e.target.value}))} placeholder="Treatment goals..." rows={3} /></div>
                  <Button onClick={handleAddPlan} className="w-full">Create Plan</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {plans.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{p.title}</p>
                      <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                    </div>
                    {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                    {p.goals && <p className="text-sm mt-2"><span className="font-medium">Goals:</span> {p.goals}</p>}
                    <p className="text-xs text-muted-foreground mt-2">Created {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 && <EmptyState icon={Target} text="No treatment plans" />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const InfoItem = ({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) => (
  <div>
    <p className="text-sm text-muted-foreground font-medium mb-0.5 flex items-center gap-1.5">{icon}{label}</p>
    <p className="text-sm capitalize">{value || '—'}</p>
  </div>
);

const SoapBlock = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className={`p-2.5 rounded-lg bg-${color}-50/50 dark:bg-${color}-950/20 border border-${color}-100 dark:border-${color}-900/30`}>
    <p className={`font-semibold text-${color}-700 dark:text-${color}-400 text-xs uppercase tracking-wider mb-1`}>{label}</p>
    <p className="text-sm">{value}</p>
  </div>
);

const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="text-center py-12">
    <Icon className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
    <p className="text-muted-foreground text-sm">{text}</p>
  </div>
);

export default ClientProfilePage;
