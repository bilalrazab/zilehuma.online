import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Lock, Clock, Download, Bell, Shield, Calendar, Camera, Trash2, Mail, Star, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SettingsPage = () => {
  const { profile, role, user } = useAuth();
  const { toast } = useToast();
  const isStaff = role === 'doctor' || role === 'super_admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Availability (doctor only)
  const [availability, setAvailability] = useState<any[]>([]);
  const [avLoading, setAvLoading] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState('50');
  const [sessionTypes, setSessionTypes] = useState('in-person,online,phone');

  // Notification Preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [messageNotifs, setMessageNotifs] = useState(true);

  // Export
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isStaff) loadAvailability();
    // Load notification preferences from localStorage
    setEmailNotifs(localStorage.getItem('pref_email_notifs') !== 'false');
    setTaskReminders(localStorage.getItem('pref_task_reminders') !== 'false');
    setSessionReminders(localStorage.getItem('pref_session_reminders') !== 'false');
    setMessageNotifs(localStorage.getItem('pref_message_notifs') !== 'false');
  }, []);

  const loadAvailability = async () => {
    const { data } = await db.from('doctor_availability').select('*').eq('doctor_id', user?.id).order('day_of_week');
    if (data && data.length > 0) {
      setAvailability(data);
    } else {
      const defaults = DAYS.map((_, i) => ({
        day_of_week: i, start_time: '09:00', end_time: '17:00',
        is_available: i < 5, doctor_id: user?.id,
      }));
      setAvailability(defaults);
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user?.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = urlData.publicUrl + '?t=' + Date.now();
      await db.from('profiles').update({ avatar_url: url, updated_at: new Date().toISOString() }).eq('id', user?.id);
      setAvatarUrl(url);
      toast({ title: "Avatar updated ✓" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const removeAvatar = async () => {
    try {
      await db.from('profiles').update({ avatar_url: null, updated_at: new Date().toISOString() }).eq('id', user?.id);
      setAvatarUrl('');
      toast({ title: "Avatar removed" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await db.from('profiles').update({ full_name: fullName, phone, updated_at: new Date().toISOString() }).eq('id', user?.id);
      toast({ title: "Profile updated ✓" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (password.length < 6) { toast({ title: "Minimum 6 characters", variant: "destructive" }); return; }
    if (password !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Password changed ✓" }); setPassword(''); setConfirmPassword('');
  };

  const updateAvailability = (dayIndex: number, field: string, value: any) => {
    setAvailability(prev => prev.map(a => a.day_of_week === dayIndex ? { ...a, [field]: value } : a));
  };

  const saveAvailability = async () => {
    setAvLoading(true);
    try {
      for (const av of availability) {
        const { data: existing } = await db.from('doctor_availability').select('id').eq('doctor_id', user?.id).eq('day_of_week', av.day_of_week).single();
        if (existing) {
          await db.from('doctor_availability').update({ start_time: av.start_time, end_time: av.end_time, is_available: av.is_available }).eq('id', existing.id);
        } else {
          await db.from('doctor_availability').insert({ doctor_id: user?.id, day_of_week: av.day_of_week, start_time: av.start_time, end_time: av.end_time, is_available: av.is_available });
        }
      }
      toast({ title: "Availability saved ✓" });
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    }
    setAvLoading(false);
  };

  const saveNotifPrefs = () => {
    localStorage.setItem('pref_email_notifs', String(emailNotifs));
    localStorage.setItem('pref_task_reminders', String(taskReminders));
    localStorage.setItem('pref_session_reminders', String(sessionReminders));
    localStorage.setItem('pref_message_notifs', String(messageNotifs));
    toast({ title: "Notification preferences saved ✓" });
  };

  const exportData = async (type: string) => {
    setExporting(true);
    try {
      let data: any[] = [];
      let filename = '';
      if (type === 'clients') {
        const { data: rows } = await db.from('clients').select('*').order('full_name');
        data = rows || []; filename = 'clients_export.csv';
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
      } else if (type === 'notes') {
        const { data: rows } = await db.from('session_notes').select('*, clients:client_id(full_name)').order('created_at', { ascending: false });
        data = (rows || []).map((r: any) => ({ ...r, client_name: (r as any).clients?.full_name, clients: undefined }));
        filename = 'session_notes_export.csv';
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

  const clearAllNotifications = async () => {
    await db.from('notifications').update({ read: true }).eq('user_id', user?.id);
    toast({ title: "All notifications cleared" });
  };

  const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'doctor' ? 'Doctor' : 'Client';

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-heading font-bold">Settings</h1>

      {/* Profile with Avatar */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {fullName?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{fullName}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{roleLabel}</Badge>
                <Badge variant="outline" className="text-xs">Active</Badge>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Camera className="h-3 w-3 mr-1" /> {uploading ? 'Uploading...' : 'Change Photo'}
                </Button>
                {avatarUrl && (
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive" onClick={removeAvatar}>
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                  </Button>
                )}
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

      {/* Notification Preferences */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Email Notifications</p><p className="text-xs text-muted-foreground">Receive email alerts for important updates</p></div>
              <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Task Reminders</p><p className="text-xs text-muted-foreground">Get notified about upcoming and overdue tasks</p></div>
              <Switch checked={taskReminders} onCheckedChange={setTaskReminders} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Session Reminders</p><p className="text-xs text-muted-foreground">Alerts before scheduled sessions</p></div>
              <Switch checked={sessionReminders} onCheckedChange={setSessionReminders} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Message Notifications</p><p className="text-xs text-muted-foreground">New message alerts</p></div>
              <Switch checked={messageNotifs} onCheckedChange={setMessageNotifs} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveNotifPrefs} size="sm">Save Preferences</Button>
            <Button onClick={clearAllNotifications} size="sm" variant="outline">Clear All Notifications</Button>
          </div>
        </CardContent>
      </Card>

      {/* Availability (Doctor only) */}
      {isStaff && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Weekly Availability</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 pb-3 border-b">
              <div>
                <Label>Default Session Duration (minutes)</Label>
                <Select value={defaultDuration} onValueChange={setDefaultDuration}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="50">50 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Session Types</Label>
                <Input value={sessionTypes} onChange={e => setSessionTypes(e.target.value)} placeholder="in-person,online,phone" className="h-8 text-xs" />
                <p className="text-[10px] text-muted-foreground mt-1">Comma-separated list</p>
              </div>
            </div>
            <div className="space-y-2">
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
            </div>
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button variant="outline" onClick={() => exportData('clients')} disabled={exporting}><Download className="h-4 w-4 mr-2" /> Clients</Button>
              <Button variant="outline" onClick={() => exportData('sessions')} disabled={exporting}><Download className="h-4 w-4 mr-2" /> Sessions</Button>
              <Button variant="outline" onClick={() => exportData('tasks')} disabled={exporting}><Download className="h-4 w-4 mr-2" /> Tasks</Button>
              <Button variant="outline" onClick={() => exportData('payments')} disabled={exporting}><Download className="h-4 w-4 mr-2" /> Payments</Button>
              <Button variant="outline" onClick={() => exportData('notes')} disabled={exporting}><Download className="h-4 w-4 mr-2" /> Session Notes</Button>
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
