import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const users = [
    { email: 'bilalrazab31@gmail.com', password: 'Tddua@2026', name: 'Bilal Razab', role: 'super_admin' },
    { email: 'zilehuma405@gmail.com', password: 'Tddua@2026', name: 'Dr. Zil-e-Huma', role: 'doctor' },
  ];

  const results = [];

  for (const u of users) {
    const { data: { users: existing } } = await supabaseAdmin.auth.admin.listUsers();
    const found = existing?.find((eu: any) => eu.email === u.email);
    let userId: string;

    if (found) {
      userId = found.id;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name }
      });
      if (error) { results.push({ email: u.email, error: error.message }); continue; }
      userId = data.user.id;
    }

    // Ensure profile exists
    await supabaseAdmin.from('profiles').upsert({ id: userId, full_name: u.name, email: u.email });
    // Ensure role exists
    await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role: u.role }, { onConflict: 'user_id,role' });
    results.push({ email: u.email, userId, status: 'ok' });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
