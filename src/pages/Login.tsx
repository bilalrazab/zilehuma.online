import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setResetSent(true);
    }
    setIsLoading(false);
  };

  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">Check Your Email</CardTitle>
            <CardDescription className="text-base mt-2">
              We've sent a password reset link to <strong>{email}</strong>. Check your inbox and click the link to set a new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => { setResetSent(false); setForgotMode(false); }} className="w-full">Back to Login</Button>
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
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">
            {forgotMode ? "Reset Password" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {forgotMode
              ? "Enter your email and we'll send you a reset link"
              : "Sign in to access your portal"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={forgotMode ? handleForgotPassword : handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {!forgotMode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? (forgotMode ? "Sending..." : "Signing in...")
                : (forgotMode ? "Send Reset Link" : "Sign In")
              }
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {forgotMode ? (
              <button
                onClick={() => setForgotMode(false)}
                className="text-sm text-primary hover:underline font-medium"
              >
                ← Back to login
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Client access is by invitation only. Contact your therapist to get started.
              </p>
            )}
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">← Back to website</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
