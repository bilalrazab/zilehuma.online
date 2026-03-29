import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Video, MapPin, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const db = supabase as any;

const statusColors: Record<string, string> = {
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
  "no-show": "outline",
};

const AppointmentsPage = () => {
  const { role, user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    client_id: "", title: "Therapy Session", start_time: "", end_time: "",
    type: "in-person", notes: "", meeting_link: ""
  });
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';

  const load = async () => {
    if (isStaff) {
      let query = db.from('appointments').select('*, clients(full_name)').order('start_time', { ascending: false });
      if (statusFilter !== "all") query = query.eq('status', statusFilter);
      const { data } = await query;
      setAppointments(data || []);
      const { data: c } = await db.from('clients').select('id, full_name').eq('status', 'active');
      setClients(c || []);
    } else {
      const { data: cr } = await db.from('clients').select('id').eq('user_id', user?.id).single();
      if (cr) {
        let query = db.from('appointments').select('*').eq('client_id', cr.id).order('start_time', { ascending: false });
        if (statusFilter !== "all") query = query.eq('status', statusFilter);
        const { data } = await query;
        setAppointments(data || []);
      }
    }
  };

  useEffect(() => { load(); }, [role, statusFilter]);

  const handleAdd = async () => {
    if (!form.client_id || !form.start_time || !form.end_time) {
      toast({ title: "Please fill all required fields", variant: "destructive" }); return;
    }
    const { error } = await db.from('appointments').insert({ ...form, doctor_id: user?.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Appointment created" });
    setOpen(false);
    setForm({ client_id: "", title: "Therapy Session", start_time: "", end_time: "", type: "in-person", notes: "", meeting_link: "" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await db.from('appointments').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    toast({ title: `Appointment ${status}` });
    load();
  };

  const groupByDate = (appts: any[]) => {
    const groups: Record<string, any[]> = {};
    appts.forEach(a => {
      const date = new Date(a.start_time).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(a);
    });
    return groups;
  };

  const grouped = groupByDate(appointments);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Appointment</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Client *</Label>
                  <Select value={form.client_id} onValueChange={v => setForm(p => ({...p, client_id: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Start Time *</Label><Input type="datetime-local" value={form.start_time} onChange={e => setForm(p => ({...p, start_time: e.target.value}))} /></div>
                  <div><Label>End Time *</Label><Input type="datetime-local" value={form.end_time} onChange={e => setForm(p => ({...p, end_time: e.target.value}))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div><Label>Meeting Link</Label><Input value={form.meeting_link} onChange={e => setForm(p => ({...p, meeting_link: e.target.value}))} placeholder="https://..." /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Optional notes..." rows={2} /></div>
                <Button onClick={handleAdd} className="w-full">Create Appointment</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grouped by date */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium text-lg">No appointments found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isStaff ? "Click 'New Appointment' to schedule one" : "No appointments scheduled yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, appts]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{date}</h3>
              <div className="space-y-2">
                {appts.map(a => (
                  <Card key={a.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        a.type === 'online' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
                      }`}>
                        {a.type === 'online' ? <Video className="h-5 w-5 text-blue-500" /> : <MapPin className="h-5 w-5 text-emerald-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{a.title}</p>
                        <p className="text-sm text-muted-foreground">{a.clients?.full_name || 'Client'}</p>
                      </div>
                      <div className="text-right text-sm flex-shrink-0">
                        <p className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(a.start_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                          {' — '}
                          {new Date(a.end_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                        </p>
                        <p className="text-muted-foreground capitalize">{a.type}</p>
                      </div>
                      <Badge variant={statusColors[a.status] as any || "secondary"}>{a.status}</Badge>
                      {isStaff && a.status === 'scheduled' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatus(a.id, 'completed')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(a.id, 'cancelled')} className="text-destructive">
                              <XCircle className="h-4 w-4 mr-2" /> Cancel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(a.id, 'no-show')}>
                              No Show
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
