import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

const Signup = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">Invitation Only</CardTitle>
          <CardDescription className="text-base mt-2">
            The client portal is accessible by invitation only. Your therapist will send you a personal invitation link to set up your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Your therapist adds you as a client</li>
              <li>You receive a secure invitation link</li>
              <li>Click the link to set your password</li>
              <li>Sign in and access your portal</li>
            </ol>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link to="/login">Already have an account? Sign in</Link>
            </Button>
            <Link to="/" className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors">
              ← Back to website
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
