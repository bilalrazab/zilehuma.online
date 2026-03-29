import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify caller is doctor/admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token)
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: roleRows } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
    const roleData = roleRows?.find((r: any) => r.role === 'super_admin' || r.role === 'doctor') || roleRows?.[0] || null

    if (!roleData || !['doctor', 'super_admin'].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const email = body.email?.trim()?.toLowerCase()
    const full_name = body.full_name?.trim()
    const phone = body.phone?.trim()
    const gender = body.gender?.trim()
    const date_of_birth = body.date_of_birth || null
    const address = body.address?.trim()
    const emergency_contact = body.emergency_contact?.trim()
    const emergency_phone = body.emergency_phone?.trim()
    const notes = body.notes?.trim()
    const requestOrigin = req.headers.get('origin')?.replace(/\/$/, '')
    const redirect_url = body.redirect_url?.trim() || (requestOrigin ? `${requestOrigin}/reset-password` : undefined)

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: 'Email and full name are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Send a real invite email so the client can set their password from the email link
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirect_url,
      data: { full_name }
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create client record linked to user and doctor
    const { error: clientError } = await supabaseAdmin.from('clients').insert({
      user_id: newUser.user.id,
      doctor_id: caller.id,
      full_name,
      email,
      phone: phone || '',
      gender: gender || '',
      date_of_birth: date_of_birth || null,
      address: address || '',
      emergency_contact: emergency_contact || '',
      emergency_phone: emergency_phone || '',
      notes: notes || '',
      status: 'active'
    })

    if (clientError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(JSON.stringify({ error: clientError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: newUser.user.id,
      invite_sent: true,
      redirect_url: redirect_url || null
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
