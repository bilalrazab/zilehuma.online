import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2 } from "lucide-react";
import { shouldRouteToOnboarding } from "@/lib/clientLifecycle";

const ResetPassword = () => {
  const db = supabase as any;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReady(true);
        setChecking(false);
      }
      // Also handle when the token was already exchanged and user has a session
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        setIsReady(true);
        setChecking(false);
      }
    });

    // Check hash for recovery/invite tokens
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('type=invite')) {
      setIsReady(true);
    }

    // Also check if there's already a session (token already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsReady(true);
        setChecking(false);
      }
    });

    // Give auth state change a moment to fire
    const timeout = setTimeout(() => setChecking(false), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Error setting password", description: error.message, variant: "destructive" });
    } else {
      let destination = "/dashboard";

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user?.id) {
          const { data: clientRecord, error: clientError } = await db
            .from('clients')
            .select('id, user_id, status, full_name, phone, gender, date_of_birth, address, emergency_contact, emergency_phone, notes')
            .eq('user_id', user.id)
            .maybeSingle();

          if (clientError) throw clientError;

          if (clientRecord?.id && clientRecord.status === 'pending_activation') {
            const { error: statusError } = await db
              .from('clients')
              .update({ status: 'pending_profile', updated_at: new Date().toISOString() })
              .eq('id', clientRecord.id);

            if (!statusError) {
              clientRecord.status = 'pending_profile';
            }
          }

          if (clientRecord && shouldRouteToOnboarding(clientRecord)) {
            destination = "/dashboard/onboarding";
          }
        }
      } catch (clientStateError) {
        console.error('Failed to update client onboarding state:', clientStateError);
      }

      toast({ title: "Password set successfully!", description: "Welcome to your portal." });
      navigate(destination);
    }
    setIsLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-heading">Invalid or Expired Link</CardTitle>
            <CardDescription>
              This link is no longer valid. Please contact your therapist for a new invitation link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate("/login")} className="w-full">Go to Login</Button>
            <Link to="/" className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors block">
              ← Back to website
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">Set Your Password</CardTitle>
          <CardDescription>Create a secure password to access your client portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Setting password..." : "Set Password & Continue"}
            </Button>
          </form>
          <Link to="/" className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors block mt-4">
            ← Back to website
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
