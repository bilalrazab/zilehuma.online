import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Lock } from "lucide-react";

const db = supabase as any;

const SettingsPage = () => {
  const { profile, user } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await db.from('profiles').update({ full_name: name, phone, updated_at: new Date().toISOString() }).eq('id', user?.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated" });
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Password updated" }); setNewPassword(""); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-heading font-bold">Settings</h1>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
          <div><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <Button onClick={handleSaveProfile} disabled={saving}>{saving ? "Saving..." : "Save Profile"}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
          <Button onClick={handleChangePassword} variant="outline">Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
