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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceRoleKey)

    // Verify caller is doctor/admin
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: { user: caller } } = await admin.auth.getUser(token)
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: roleRows } = await admin.from('user_roles').select('role').eq('user_id', caller.id)
    const hasPermission = roleRows?.some((r: any) => r.role === 'super_admin' || r.role === 'doctor')
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { client_id, delete_auth_user } = await req.json()
    if (!client_id) {
      return new Response(JSON.stringify({ error: 'client_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch client to get user_id
    const { data: client } = await admin.from('clients').select('user_id, email').eq('id', client_id).single()
    if (!client) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Delete all related records in order (most dependent first)
    const tables = [
      { table: 'messages', via: 'thread_id', subquery: true },
      { table: 'message_threads', via: 'participant_two', userId: true },
      { table: 'resource_assignments', via: 'client_id' },
      { table: 'session_notes', via: 'client_id' },
      { table: 'payments', via: 'client_id' },
      { table: 'goals', via: 'client_id' },
      { table: 'forms', via: 'client_id' },
      { table: 'tasks', via: 'client_id' },
      { table: 'treatment_plans', via: 'client_id' },
      { table: 'timeline_logs', via: 'client_id' },
      { table: 'client_checklists', via: 'client_id' },
      { table: 'appointments', via: 'client_id' },
    ]

    for (const t of tables) {
      if (t.subquery && client.user_id) {
        // Delete messages from threads involving this user
        const { data: threads } = await admin.from('message_threads')
          .select('id')
          .or(`participant_one.eq.${client.user_id},participant_two.eq.${client.user_id}`)
        if (threads?.length) {
          const threadIds = threads.map((th: any) => th.id)
          await admin.from('messages').delete().in('thread_id', threadIds)
          await admin.from('message_threads').delete().in('id', threadIds)
        }
      } else if (t.userId && client.user_id) {
        // Already handled above
      } else if (!t.subquery && !t.userId) {
        await admin.from(t.table).delete().eq(t.via, client_id)
      }
    }

    // Delete mood entries and notifications for user
    if (client.user_id) {
      await admin.from('mood_entries').delete().eq('user_id', client.user_id)
      await admin.from('notifications').delete().eq('user_id', client.user_id)
    }

    // Delete the client record
    const { error: delErr } = await admin.from('clients').delete().eq('id', client_id)
    if (delErr) {
      console.error('Client delete error:', delErr.message)
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Optionally delete auth user and their profile/role
    if (delete_auth_user && client.user_id) {
      await admin.from('profiles').delete().eq('id', client.user_id)
      await admin.from('user_roles').delete().eq('user_id', client.user_id)
      const { error: authErr } = await admin.auth.admin.deleteUser(client.user_id)
      if (authErr) {
        console.warn('Auth user delete failed (non-blocking):', authErr.message)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
