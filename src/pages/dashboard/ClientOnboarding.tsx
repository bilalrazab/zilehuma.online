import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Camera, User, Heart, Shield, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useRef } from "react";

const db = supabase as any;

const ClientOnboarding = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [clientId, setClientId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    gender: '',
    date_of_birth: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
  });

  useEffect(() => {
    const loadClient = async () => {
      if (!user?.id) return;
      const { data } = await db.from('clients').select('*').eq('user_id', user.id).single();
      if (data) {
        setClientId(data.id);
        setForm(prev => ({
          ...prev,
          full_name: data.full_name || prev.full_name,
          phone: data.phone || prev.phone,
          gender: data.gender || prev.gender,
          date_of_birth: data.date_of_birth || prev.date_of_birth,
          address: data.address || prev.address,
          emergency_contact: data.emergency_contact || prev.emergency_contact,
          emergency_phone: data.emergency_phone || prev.emergency_phone,
          notes: data.notes || prev.notes,
        }));
        // If client already has all info filled, redirect to dashboard
        if (data.phone && data.gender && data.date_of_birth && data.emergency_contact) {
          navigate('/dashboard', { replace: true });
        }
      }
    };
    loadClient();
  }, [user?.id]);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

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
      toast({ title: "Photo uploaded ✓" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleComplete = async () => {
    if (!form.full_name.trim()) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Update profile
      const { error: profileErr } = await db.from('profiles').update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', user?.id);
      if (profileErr) throw profileErr;

      // Update or create client record
      if (clientId) {
        const { error: clientErr } = await db.from('clients').update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          gender: form.gender,
          date_of_birth: form.date_of_birth || null,
          address: form.address.trim(),
          emergency_contact: form.emergency_contact.trim(),
          emergency_phone: form.emergency_phone.trim(),
          notes: form.notes.trim(),
          pipeline_stage: 'intake_completed',
        }).eq('id', clientId);
        if (clientErr) throw clientErr;
      } else {
        // No client record yet — create one linked to this user
        const { error: insertErr } = await db.from('clients').insert({
          user_id: user?.id,
          full_name: form.full_name.trim(),
          email: user?.email || '',
          phone: form.phone.trim(),
          gender: form.gender,
          date_of_birth: form.date_of_birth || null,
          address: form.address.trim(),
          emergency_contact: form.emergency_contact.trim(),
          emergency_phone: form.emergency_phone.trim(),
          notes: form.notes.trim(),
          pipeline_stage: 'intake_completed',
          status: 'active',
        });
        if (insertErr) throw insertErr;
      }

      toast({ title: "Profile complete! 🎉", description: "Welcome to your wellness portal." });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Step {step} of {totalSteps}</span>
            <span className="font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Profile & Photo */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Let's set up your profile</CardTitle>
              <CardDescription>Tell us a bit about yourself so your therapist can serve you better.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar className="h-24 w-24">
                    {avatarUrl && <AvatarImage src={avatarUrl} />}
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                      {form.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
              </div>

              <div>
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Your full name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+92..." />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => update('gender', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
              </div>
              <div>
                <Label>Address / City</Label>
                <Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Your city or address" />
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Emergency Contact */}
        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Emergency Contact</CardTitle>
              <CardDescription>This information helps us keep you safe. It will remain confidential.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Emergency Contact Name</Label>
                <Input value={form.emergency_contact} onChange={e => update('emergency_contact', e.target.value)} placeholder="e.g. Parent, spouse, sibling" />
              </div>
              <div>
                <Label>Emergency Contact Phone</Label>
                <Input value={form.emergency_phone} onChange={e => update('emergency_phone', e.target.value)} placeholder="+92..." />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Continue <ArrowRight className="h-4 w-4 ml-2" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Additional Info & Confirm */}
        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Almost done!</CardTitle>
              <CardDescription>Anything you'd like your therapist to know before your first session?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Additional Notes (optional)</Label>
                <Textarea value={form.notes} onChange={e => update('notes', e.target.value)}
                  placeholder="What brings you here? Any concerns, goals, or things we should know..."
                  rows={4} />
              </div>

              <div className="rounded-lg border p-4 bg-muted/30 space-y-2 text-sm">
                <p className="font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Your information is secure</p>
                <p className="text-muted-foreground text-xs">
                  All data is encrypted and accessible only to your assigned therapist. 
                  You can update this information anytime from your profile settings.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" onClick={handleComplete} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <>Complete Setup <CheckCircle2 className="h-4 w-4 ml-2" /></>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your privacy is important to us. <a href="/privacy-policy" className="underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default ClientOnboarding;
