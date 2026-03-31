
-- Fix the view to use SECURITY INVOKER (default, but be explicit)
DROP VIEW IF EXISTS public.session_notes_client;

-- Instead of a view, add a column-restricted client SELECT policy
-- Postgres RLS doesn't support column-level restrictions, so use a secure view with INVOKER
CREATE VIEW public.session_notes_client 
WITH (security_invoker = true) AS
SELECT id, client_id, doctor_id, appointment_id, subjective, objective, assessment, plan, created_at, updated_at
FROM public.session_notes;

-- Re-add client SELECT on session_notes but only for rows they own
-- Clients should use the view instead, but we need to allow the view to work
CREATE POLICY "Clients read own session notes" ON session_notes
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT c.id FROM clients c WHERE c.user_id = auth.uid()));
