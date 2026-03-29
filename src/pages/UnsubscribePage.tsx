import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailX, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const UnsubscribePage = () => {
  const [status, setStatus] = useState<'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error'>('loading');
  const [processing, setProcessing] = useState(false);
  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
        headers: { apikey: anonKey },
      });
      const data = await res.json();
      if (data.valid === false && data.reason === 'already_unsubscribed') setStatus('already');
      else if (data.valid) setStatus('valid');
      else setStatus('invalid');
    } catch {
      setStatus('error');
    }
  };

  const confirmUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
      if (error) throw error;
      if (data?.success) setStatus('success');
      else if (data?.reason === 'already_unsubscribed') setStatus('already');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto animate-spin" />
              <p className="text-muted-foreground">Verifying...</p>
            </>
          )}
          {status === 'valid' && (
            <>
              <MailX className="h-12 w-12 text-primary mx-auto" />
              <h1 className="text-xl font-heading font-bold">Unsubscribe</h1>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to unsubscribe from app emails from Zil-e-Huma Suleman?
              </p>
              <Button onClick={confirmUnsubscribe} disabled={processing} className="w-full">
                {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : 'Confirm Unsubscribe'}
              </Button>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h1 className="text-xl font-heading font-bold">Unsubscribed</h1>
              <p className="text-sm text-muted-foreground">You have been unsubscribed from app emails. You will still receive essential account emails.</p>
            </>
          )}
          {status === 'already' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto" />
              <h1 className="text-xl font-heading font-bold">Already Unsubscribed</h1>
              <p className="text-sm text-muted-foreground">You are already unsubscribed from app emails.</p>
            </>
          )}
          {status === 'invalid' && (
            <>
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-xl font-heading font-bold">Invalid Link</h1>
              <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or expired.</p>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-xl font-heading font-bold">Something Went Wrong</h1>
              <p className="text-sm text-muted-foreground">Please try again later or contact support.</p>
            </>
          )}
          <a href="/" className="text-xs text-primary hover:underline block mt-4">← Back to zilehuma.online</a>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnsubscribePage;
