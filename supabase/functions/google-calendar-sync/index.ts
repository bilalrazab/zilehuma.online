import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET");
  const GOOGLE_REFRESH_TOKEN = Deno.env.get("GOOGLE_CALENDAR_REFRESH_TOKEN");

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    return new Response(JSON.stringify({
      error: "Google Calendar not configured",
      setup_required: true,
      message: "Please configure GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_CALENDAR_REFRESH_TOKEN secrets to enable sync.",
    }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, appointment_id } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get fresh access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(`Token refresh failed: ${JSON.stringify(tokenData)}`);
    const accessToken = tokenData.access_token;

    if (action === "sync_approved") {
      // Sync a single approved appointment to Google Calendar
      const { data: apt } = await supabase.from("appointments")
        .select("*, clients(full_name, email)")
        .eq("id", appointment_id).single();
      
      if (!apt) throw new Error("Appointment not found");

      const event = {
        summary: apt.title || "Therapy Session",
        description: `Client: ${apt.clients?.full_name || "N/A"}\nType: ${apt.type}\nNotes: ${apt.notes || "None"}`,
        start: {
          dateTime: apt.start_time,
          timeZone: "Asia/Karachi",
        },
        end: {
          dateTime: apt.end_time,
          timeZone: "Asia/Karachi",
        },
        attendees: apt.clients?.email ? [{ email: apt.clients.email }] : [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 30 },
            { method: "email", minutes: 60 },
          ],
        },
        conferenceData: apt.type === "online" && apt.meeting_link ? undefined : undefined,
      };

      const calRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
      const calData = await calRes.json();
      if (!calRes.ok) throw new Error(`Google Calendar API error [${calRes.status}]: ${JSON.stringify(calData)}`);

      return new Response(JSON.stringify({
        success: true,
        google_event_id: calData.id,
        html_link: calData.htmlLink,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "fetch_busy_times") {
      // Fetch busy times from Google Calendar to block availability
      const { date_from, date_to } = body;
      const busyRes = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: date_from,
          timeMax: date_to,
          items: [{ id: "primary" }],
        }),
      });
      const busyData = await busyRes.json();
      if (!busyRes.ok) throw new Error(`FreeBusy API error [${busyRes.status}]: ${JSON.stringify(busyData)}`);

      return new Response(JSON.stringify({
        success: true,
        busy: busyData.calendars?.primary?.busy || [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use 'sync_approved' or 'fetch_busy_times'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Google Calendar sync error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
