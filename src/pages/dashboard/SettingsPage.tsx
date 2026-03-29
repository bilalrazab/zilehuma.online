import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const SettingsPage = () => {
  const { profile, role, user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const saveProfile = async () => {
    setSaving(true);
    await db.from('profiles').update({ full_name: fullName, phone, updated_at: new Date().toISOString() }).eq('id', user?.id);
    toast({ title: "Profile updated" }); setSaving(false);
  };

  const changePassword = async () => {
    if (password.length < 6) { toast({ title: "Min 6 characters", variant: "destructive" }); return; }
    if (password !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Password changed" }); setPassword(''); setConfirmPassword('');
  };

  const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'doctor' ? 'Doctor' : 'Client';

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-heading font-bold">Settings</h1>
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">{fullName?.charAt(0)?.toUpperCase() || '?'}</div>
            <div><p className="font-semibold">{fullName}</p><p className="text-sm text-muted-foreground">{profile?.email}</p><Badge variant="secondary" className="mt-1 text-xs">{roleLabel}</Badge></div>
          </div>
          <div><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92..." /></div>
          <Button onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>New Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <div><Label>Confirm Password</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
          <Button onClick={changePassword} variant="outline">Change Password</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
