import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Video, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const AppointmentsPage = () => {
  const { role, user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", title: "Therapy Session", start_time: "", end_time: "", type: "in-person" });
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';

  const load = async () => {
    if (isStaff) {
      const { data } = await db.from('appointments').select('*, clients(full_name)').order('start_time', { ascending: false });
      setAppointments(data || []);
      const { data: c } = await db.from('clients').select('id, full_name').eq('status', 'active');
      setClients(c || []);
    } else {
      const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
      if (cr) {
        const { data } = await db.from('appointments').select('*').eq('client_id', cr.id).order('start_time', { ascending: false });
        setAppointments(data || []);
      }
    }
  };

  useEffect(() => { load(); }, [role]);

  const handleAdd = async () => {
    if (!form.client_id || !form.start_time || !form.end_time) {
      toast({ title: "Please fill all required fields", variant: "destructive" }); return;
    }
    const { error } = await db.from('appointments').insert({ ...form, doctor_id: user?.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Appointment created" });
    setOpen(false);
    setForm({ client_id: "", title: "Therapy Session", start_time: "", end_time: "", type: "in-person" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold">Appointments</h1>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Appointment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Client</Label>
                  <Select value={form.client_id} onValueChange={v => setForm(p => ({...p, client_id: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} /></div>
                <div><Label>Start Time</Label><Input type="datetime-local" value={form.start_time} onChange={e => setForm(p => ({...p, start_time: e.target.value}))} /></div>
                <div><Label>End Time</Label><Input type="datetime-local" value={form.end_time} onChange={e => setForm(p => ({...p, end_time: e.target.value}))} /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({...p, type: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In Person</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} className="w-full">Create Appointment</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="space-y-3">
        {appointments.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4 flex items-center gap-4 flex-wrap">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {a.type === 'online' ? <Video className="h-5 w-5 text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.clients?.full_name || 'Client'}</p>
              </div>
              <div className="text-right text-sm">
                <p className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(a.start_time).toLocaleDateString()}</p>
                <p className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {new Date(a.start_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p>
              </div>
              <Badge variant="secondary">{a.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {appointments.length === 0 && <p className="text-center text-muted-foreground py-8">No appointments yet</p>}
      </div>
    </div>
  );
};

export default AppointmentsPage;
