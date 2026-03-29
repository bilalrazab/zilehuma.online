import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Lock, Clock, Download, Bell, Shield, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SettingsPage = () => {
  const { profile, role, user } = useAuth();
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';

  // Profile
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  // Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Availability (doctor only)
  const [availability, setAvailability] = useState<any[]>([]);
  const [avLoading, setAvLoading] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  useEffect(() => { if (isStaff) loadAvailability(); }, []);

  const loadAvailability = async () => {
    const { data } = await db.from('doctor_availability').select('*').eq('doctor_id', user?.id).order('day_of_week');
    if (data && data.length > 0) {
      setAvailability(data);
    } else {
      // Initialize defaults
      const defaults = DAYS.map((_, i) => ({
        day_of_week: i, start_time: '09:00', end_time: '17:00',
        is_available: i < 5, doctor_id: user?.id,
      }));
      setAvailability(defaults);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    await db.from('profiles').update({ full_name: fullName, phone, updated_at: new Date().toISOString() }).eq('id', user?.id);
    toast({ title: "Profile updated ✓" }); setSaving(false);
  };

  const changePassword = async () => {
    if (password.length < 6) { toast({ title: "Minimum 6 characters", variant: "destructive" }); return; }
    if (password !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Password changed ✓" }); setPassword(''); setConfirmPassword('');
  };

  const updateAvailability = async (dayIndex: number, field: string, value: any) => {
    setAvailability(prev => prev.map(a => a.day_of_week === dayIndex ? { ...a, [field]: value } : a));
  };

  const saveAvailability = async () => {
    setAvLoading(true);
    for (const av of availability) {
      const { data: existing } = await db.from('doctor_availability').select('id').eq('doctor_id', user?.id).eq('day_of_week', av.day_of_week).single();
      if (existing) {
        await db.from('doctor_availability').update({ start_time: av.start_time, end_time: av.end_time, is_available: av.is_available }).eq('id', existing.id);
      } else {
        await db.from('doctor_availability').insert({ doctor_id: user?.id, day_of_week: av.day_of_week, start_time: av.start_time, end_time: av.end_time, is_available: av.is_available });
      }
    }
    toast({ title: "Availability saved ✓" }); setAvLoading(false);
  };

  const exportData = async (type: string) => {
    setExporting(true);
    try {
      let data: any[] = [];
      let filename = '';

      if (type === 'clients') {
        const { data: rows } = await db.from('clients').select('*').order('full_name');
        data = rows || [];
        filename = 'clients_export.csv';
      } else if (type === 'sessions') {
        const { data: rows } = await db.from('appointments').select('*, clients(full_name)').order('start_time', { ascending: false });
        data = (rows || []).map((r: any) => ({ ...r, client_name: r.clients?.full_name, clients: undefined }));
        filename = 'sessions_export.csv';
      } else if (type === 'tasks') {
        const { data: rows } = await db.from('tasks').select('*, clients(full_name)').order('created_at', { ascending: false });
        data = (rows || []).map((r: any) => ({ ...r, client_name: r.clients?.full_name, clients: undefined }));
        filename = 'tasks_export.csv';
      } else if (type === 'payments') {
        const { data: rows } = await db.from('payments').select('*, clients:client_id(full_name)').order('created_at', { ascending: false });
        data = (rows || []).map((r: any) => ({ ...r, client_name: (r as any).clients?.full_name, clients: undefined }));
        filename = 'payments_export.csv';
      }

      if (data.length === 0) { toast({ title: "No data to export" }); setExporting(false); return; }

      const headers = Object.keys(data[0]).filter(k => k !== 'clients');
      const csv = [headers.join(','), ...data.map(row => headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(','))].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Exported ${data.length} records` });
    } catch (err: any) {
      toast({ title: "Export error", description: err.message, variant: "destructive" });
    }
    setExporting(false);
  };

  const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'doctor' ? 'Doctor' : 'Client';

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-heading font-bold">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">{fullName?.charAt(0)?.toUpperCase() || '?'}</div>
            <div>
              <p className="font-semibold text-lg">{fullName}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{roleLabel}</Badge>
                <Badge variant="outline" className="text-xs">Active</Badge>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92..." /></div>
          </div>
          <div><Label>Email</Label><Input value={profile?.email || ''} disabled className="opacity-60" /></div>
          <Button onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>New Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" /></div>
            <div><Label>Confirm Password</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
          </div>
          <Button onClick={changePassword} variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      {/* Availability (Doctor only) */}
      {isStaff && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Weekly Availability</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {availability.map(av => (
              <div key={av.day_of_week} className="flex items-center gap-3 p-2 rounded-lg border">
                <Switch checked={av.is_available} onCheckedChange={v => updateAvailability(av.day_of_week, 'is_available', v)} />
                <span className={`text-sm w-24 ${!av.is_available ? 'text-muted-foreground' : 'font-medium'}`}>{DAYS[av.day_of_week]}</span>
                {av.is_available ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input type="time" value={av.start_time} onChange={e => updateAvailability(av.day_of_week, 'start_time', e.target.value)} className="w-28 h-8 text-xs" />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input type="time" value={av.end_time} onChange={e => updateAvailability(av.day_of_week, 'end_time', e.target.value)} className="w-28 h-8 text-xs" />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Unavailable</span>
                )}
              </div>
            ))}
            <Button onClick={saveAvailability} disabled={avLoading}>{avLoading ? 'Saving...' : 'Save Availability'}</Button>
          </CardContent>
        </Card>
      )}

      {/* Data Export (Doctor only) */}
      {isStaff && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Download className="h-4 w-4" /> Data Export</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Export your data as CSV files for backup or analysis.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => exportData('clients')} disabled={exporting}><Download className="h-4 w-4 mr-2" /> Export Clients</Button>
              <Button variant="outline" onClick={() => exportData('sessions')} disabled={exporting}><Download className="h-4 w-4 mr-2" /> Export Sessions</Button>
              <Button variant="outline" onClick={() => exportData('tasks')} disabled={exporting}><Download className="h-4 w-4 mr-2" /> Export Tasks</Button>
              <Button variant="outline" onClick={() => exportData('payments')} disabled={exporting}><Download className="h-4 w-4 mr-2" /> Export Payments</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Account</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Account ID</span><span className="font-mono text-xs">{user?.id?.slice(0, 8)}...</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{profile?.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge variant="secondary" className="text-xs">{roleLabel}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Member since</span><span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
