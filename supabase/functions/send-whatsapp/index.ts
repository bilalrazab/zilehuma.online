import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHATSAPP_API = "https://graph.facebook.com/v21.0";

const BodySchema = z.object({
  to: z.string().min(10).max(20),
  template_name: z.string().min(1).max(100),
  language_code: z.string().default("en"),
  components: z.array(z.any()).optional(),
  // Fallback: send a plain text message instead of a template
  text: z.string().max(4096).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check — only service_role or doctor/super_admin
  const authHeader = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Allow service_role calls (from other edge functions)
  const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;

  if (!isServiceRole) {
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: hasRole } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "doctor",
    });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, template_name, language_code, components, text } = parsed.data;

    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

    if (!phoneNumberId || !accessToken) {
      return new Response(JSON.stringify({ error: "WhatsApp credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format phone: ensure it starts with country code, no spaces/dashes
    const formattedPhone = to.replace(/[\s\-\(\)]/g, "").replace(/^0/, "92");

    let waBody: Record<string, unknown>;

    if (text) {
      // Plain text message
      waBody = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: { body: text },
      };
    } else {
      // Template message
      waBody = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: template_name,
          language: { code: language_code },
          ...(components ? { components } : {}),
        },
      };
    }

    const waResponse = await fetch(
      `${WHATSAPP_API}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(waBody),
      }
    );

    const waResult = await waResponse.json();

    if (!waResponse.ok) {
      console.error("WhatsApp API error:", JSON.stringify(waResult));
      return new Response(JSON.stringify({
        error: "WhatsApp API error",
        details: waResult.error?.message || waResult,
      }), {
        status: waResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: waResult.messages?.[0]?.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("WhatsApp send error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
