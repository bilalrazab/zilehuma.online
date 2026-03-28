import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, FileText, Target } from "lucide-react";

const db = supabase as any;

const ClientProfilePage = () => {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    db.from('clients').select('*').eq('id', id).single().then(({ data }: any) => setClient(data));
    db.from('appointments').select('*').eq('client_id', id).order('start_time', { ascending: false }).then(({ data }: any) => setAppointments(data || []));
    db.from('session_notes').select('*').eq('client_id', id).order('session_date', { ascending: false }).then(({ data }: any) => setNotes(data || []));
    db.from('treatment_plans').select('*').eq('client_id', id).order('created_at', { ascending: false }).then(({ data }: any) => setPlans(data || []));
  }, [id]);

  if (!client) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">{client.full_name}</h1>
          <p className="text-muted-foreground">{client.email} • {client.phone || 'No phone'}</p>
        </div>
        <Badge className="ml-auto">{client.status}</Badge>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({appointments.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="plans">Plans ({plans.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Card>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Gender</p><p>{client.gender || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Date of Birth</p><p>{client.date_of_birth || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Address</p><p>{client.address || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Emergency Contact</p><p>{client.emergency_contact || '—'} {client.emergency_phone || ''}</p></div>
              <div className="col-span-full"><p className="text-sm text-muted-foreground">Intake Notes</p><p>{client.intake_notes || '—'}</p></div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appointments">
          <div className="space-y-3">
            {appointments.map(a => (
              <Card key={a.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-muted-foreground">{new Date(a.start_time).toLocaleString()}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">{a.status}</Badge>
                </CardContent>
              </Card>
            ))}
            {appointments.length === 0 && <p className="text-muted-foreground text-sm">No appointments</p>}
          </div>
        </TabsContent>
        <TabsContent value="notes">
          <div className="space-y-3">
            {notes.map(n => (
              <Card key={n.id}>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">{new Date(n.session_date).toLocaleDateString()} • {n.duration_minutes || 50}min</p>
                  {n.subjective && <p><strong>S:</strong> {n.subjective}</p>}
                  {n.objective && <p><strong>O:</strong> {n.objective}</p>}
                  {n.assessment && <p><strong>A:</strong> {n.assessment}</p>}
                  {n.plan && <p><strong>P:</strong> {n.plan}</p>}
                </CardContent>
              </Card>
            ))}
            {notes.length === 0 && <p className="text-muted-foreground text-sm">No session notes</p>}
          </div>
        </TabsContent>
        <TabsContent value="plans">
          <div className="space-y-3">
            {plans.map(p => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <p className="font-medium">{p.title}</p>
                    <Badge variant="secondary" className="ml-auto">{p.status}</Badge>
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground mt-2">{p.description}</p>}
                </CardContent>
              </Card>
            ))}
            {plans.length === 0 && <p className="text-muted-foreground text-sm">No treatment plans</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientProfilePage;
