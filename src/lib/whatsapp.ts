import { supabase } from "@/integrations/supabase/client";

/**
 * Send a WhatsApp message to a client (best-effort, never throws).
 */
export const sendWhatsApp = async (phone: string | null | undefined, text: string) => {
  if (!phone) return;
  try {
    await supabase.functions.invoke('send-whatsapp', {
      body: { to: phone, text, template_name: 'generic' },
    });
  } catch (err) {
    console.error('WhatsApp send failed (non-blocking):', err);
  }
};
