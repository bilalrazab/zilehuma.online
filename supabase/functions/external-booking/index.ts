import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const BookingSchema = z.object({
  client_name: z.string().min(1).max(255),
  client_email: z.string().email(),
  client_phone: z.string().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  type: z.enum(["in-person", "online", "phone"]).default("in-person"),
  service: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  source: z.string().max(100).default("external"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate API key
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("EXTERNAL_BOOKING_API_KEY");
  if (expectedKey && apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const parsed = BookingSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = parsed.data;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find doctor
    const { data: doctors } = await supabase.from("user_roles").select("user_id").eq("role", "doctor").limit(1);
    const doctorId = doctors?.[0]?.user_id;
    if (!doctorId) {
      return new Response(JSON.stringify({ error: "No doctor available" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate availability
    const requestDate = new Date(`${data.date}T${data.time}`);
    const dayOfWeek = (requestDate.getUTCDay() + 6) % 7;
    const { data: avail } = await supabase.from("doctor_availability")
      .select("*").eq("doctor_id", doctorId).eq("day_of_week", dayOfWeek).eq("is_available", true).single();
    
    if (!avail) {
      return new Response(JSON.stringify({ error: "Doctor not available on this day" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data.time < avail.start_time || data.time >= avail.end_time) {
      return new Response(JSON.stringify({ 
        error: "Outside working hours",
        available_hours: { start: avail.start_time, end: avail.end_time },
      }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check conflicts
    const start = new Date(`${data.date}T${data.time}:00`);
    const end = new Date(start.getTime() + 50 * 60000);
    const { data: conflicts } = await supabase.from("appointments").select("id")
      .eq("doctor_id", doctorId)
      .gte("start_time", new Date(start.getTime() - 50 * 60000).toISOString())
      .lte("start_time", new Date(start.getTime() + 50 * 60000).toISOString())
      .in("status", ["scheduled", "pending_approval"]);

    if (conflicts && conflicts.length > 0) {
      return new Response(JSON.stringify({ error: "Time slot conflict" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert client
    let clientId: string;
    const { data: existingClient } = await supabase.from("clients")
      .select("id").eq("email", data.client_email).single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: clientError } = await supabase.from("clients").insert({
        full_name: data.client_name,
        email: data.client_email,
        phone: data.client_phone,
        doctor_id: doctorId,
        status: "active",
        pipeline_stage: "new_inquiry",
        notes: `Source: ${data.source}`,
      }).select("id").single();
      if (clientError) throw clientError;
      clientId = newClient!.id;
    }

    // Create appointment
    const { data: appointment, error: aptError } = await supabase.from("appointments").insert({
      client_id: clientId,
      doctor_id: doctorId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: 50,
      type: data.type,
      title: `Session: ${data.service || "General"}`,
      notes: `[${data.source}] ${data.notes || ""}`.trim(),
      status: "pending_approval",
    }).select("id").single();

    if (aptError) throw aptError;

    // Notify doctor
    await supabase.from("notifications").insert({
      user_id: doctorId,
      title: `New External Booking 📅`,
      message: `${data.client_name} requested a session via ${data.source} for ${data.date} at ${data.time}.`,
      type: "info",
      link: "/dashboard/calendar",
    });

    return new Response(JSON.stringify({
      success: true,
      appointment_id: appointment!.id,
      status: "pending_approval",
      message: "Booking request received. Awaiting doctor approval.",
    }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("External booking error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
