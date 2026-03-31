
-- Remove client SELECT on base session_notes table (private_notes exposed)
DROP POLICY IF EXISTS "Clients read own session notes" ON session_notes;

-- Grant client access through the view only (which excludes private_notes)
-- The view uses security_invoker=true, so it respects the caller's RLS context
-- We need to allow authenticated users to SELECT from the view via the base table
-- Create a policy that only allows access when queried through the view context
-- Actually, security_invoker views use the caller's permissions, so we need a policy on the base table
-- The solution: create a restricted policy that only doctors can use on the base table
-- and clients use an RPC function instead

-- Create a security definer function for clients to read their session notes (without private_notes)
CREATE OR REPLACE FUNCTION public.get_client_session_notes(_client_id uuid)
RETURNS TABLE(
  id uuid, client_id uuid, doctor_id uuid, appointment_id uuid,
  subjective text, objective text, assessment text, plan text,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT sn.id, sn.client_id, sn.doctor_id, sn.appointment_id,
         sn.subjective, sn.objective, sn.assessment, sn.plan,
         sn.created_at, sn.updated_at
  FROM session_notes sn
  JOIN clients c ON c.id = sn.client_id
  WHERE sn.client_id = _client_id AND c.user_id = auth.uid()
$$;
