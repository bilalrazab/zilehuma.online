import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const normalizeString = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const normalizeEmail = (value: unknown) => normalizeString(value).toLowerCase()

const mergeNotes = (...values: Array<string | null | undefined>) => {
  return Array.from(new Set(values.map((value) => normalizeString(value)).filter(Boolean))).join('\n\n')
}

const pickExistingClient = (rows: any[] | null | undefined) => {
  if (!rows?.length) return null
  return rows.find((row) => row?.user_id && row?.status !== 'pending_activation') || rows[0]
}

const sendRecoveryEmail = async ({
  email,
  redirectUrl,
  supabaseUrl,
}: {
  email: string
  redirectUrl: string
  supabaseUrl: string
}) => {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  if (!anonKey) {
    throw new Error('Missing publishable key for recovery emails')
  }

  const anonClient = createClient(supabaseUrl, anonKey)
  const { error } = await anonClient.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  if (error) throw error
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Verify caller is doctor/admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !caller) {
      console.error('Auth error:', userError?.message || 'No user found')
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Caller authenticated:', caller.id, caller.email)

    // Check role - handle multiple roles gracefully
    const { data: roleRows, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
    
    if (roleError) {
      console.error('Role query error:', roleError.message)
      return new Response(JSON.stringify({ error: 'Failed to verify permissions' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User roles:', JSON.stringify(roleRows))

    const hasPermission = roleRows?.some((r: any) => 
      r.role === 'super_admin' || r.role === 'doctor'
    )

    if (!hasPermission) {
      console.error('Insufficient permissions for user:', caller.id)
      return new Response(JSON.stringify({ error: 'You do not have permission to invite clients' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse and validate request body
    let body: any
    try {
      body = await req.json()
    } catch (e) {
      console.error('Invalid JSON body:', e)
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const email = normalizeEmail(body.email)
    const full_name = normalizeString(body.full_name)
    const phone = normalizeString(body.phone)
    const gender = normalizeString(body.gender)
    const date_of_birth = body.date_of_birth || null
    const address = normalizeString(body.address)
    const emergency_contact = normalizeString(body.emergency_contact)
    const emergency_phone = normalizeString(body.emergency_phone)
    const notes = normalizeString(body.notes)

    const requestOrigin = req.headers.get('origin')?.replace(/\/$/, '')
    const redirect_url = normalizeString(body.redirect_url) || (requestOrigin ? `${requestOrigin}/reset-password` : 'https://zilehuma.online/reset-password')

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: 'Email and full name are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Inviting client:', email, 'with redirect:', redirect_url)

    // Check if client already exists
    const { data: existingClientRows, error: existingClientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, user_id, status, phone, notes, pipeline_stage')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(5)

    if (existingClientError) {
      console.error('Existing client lookup failed:', existingClientError.message)
      return new Response(JSON.stringify({ error: 'Failed to check existing client records' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const existingClient = pickExistingClient(existingClientRows)

    if (existingClient?.status === 'active' && existingClient?.user_id) {
      return new Response(JSON.stringify({ error: `A client with email ${email} is already active in the portal` }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user already exists in auth
    const { data: { users: existingUsers }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listUsersError) {
      console.error('User lookup failed:', listUsersError.message)
      return new Response(JSON.stringify({ error: 'Failed to check existing users' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const existingUser = existingUsers?.find((u: any) => u.email === email)

    let userId: string | null = existingClient?.user_id || existingUser?.id || null

    if (userId) {
      console.log('Existing auth user found:', userId, '— sending setup email')
      await sendRecoveryEmail({ email, redirectUrl: redirect_url, supabaseUrl })
    } else {
      // New user — send invite
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirect_url,
        data: { full_name }
      })

      if (createError) {
        console.error('Invite error:', createError.message)
        let userMessage = createError.message
        if (createError.message.includes('rate limit')) {
          userMessage = 'Too many invite attempts. Please wait a moment and try again.'
        }
        return new Response(JSON.stringify({ error: userMessage }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!newUser?.user?.id) {
        console.error('Invite succeeded but no user returned')
        return new Response(JSON.stringify({ error: 'Invite was sent but user record was not created properly' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      userId = newUser.user.id
      console.log('New user created:', userId)
    }

    console.log('Using user ID:', userId)

    const clientPayload = {
      user_id: userId,
      doctor_id: caller.id,
      full_name,
      email,
      phone,
      gender,
      date_of_birth,
      address,
      emergency_contact,
      emergency_phone,
      notes: mergeNotes(existingClient?.notes, notes),
      status: 'pending_activation',
      pipeline_stage: existingClient?.pipeline_stage || 'intake_started'
    }

    let clientError: any = null

    if (existingClient?.id) {
      const response = await supabaseAdmin
        .from('clients')
        .update({ ...clientPayload, updated_at: new Date().toISOString() })
        .eq('id', existingClient.id)

      clientError = response.error
    } else {
      const response = await supabaseAdmin.from('clients').insert(clientPayload)
      clientError = response.error
    }

    if (clientError) {
      console.error('Client insert error:', clientError.message)
      return new Response(JSON.stringify({ error: `Failed to create client record: ${clientError.message}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Client record created successfully for:', email)

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      invite_sent: true,
      status: 'pending_activation',
      message: `Setup email sent to ${email}`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Unhandled error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
