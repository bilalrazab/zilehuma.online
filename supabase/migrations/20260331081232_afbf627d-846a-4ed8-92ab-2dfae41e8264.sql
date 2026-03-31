
-- 1. Fix blog_likes: restrict DELETE to own session_id only
DROP POLICY IF EXISTS "Anyone can delete own likes" ON blog_likes;
CREATE POLICY "Users delete own likes" ON blog_likes
  FOR DELETE TO anon, authenticated
  USING (session_id = coalesce(current_setting('request.headers', true)::json->>'x-session-id', ''));

-- 2. Fix audit_logs: restrict INSERT to service_role only
DROP POLICY IF EXISTS "System insert audit logs" ON audit_logs;
CREATE POLICY "Service role insert audit logs" ON audit_logs
  FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');

-- 3. Fix session_notes: create a view excluding private_notes for clients
CREATE OR REPLACE VIEW public.session_notes_client AS
SELECT id, client_id, doctor_id, appointment_id, subjective, objective, assessment, plan, created_at, updated_at
FROM public.session_notes;

-- Drop the overly broad client SELECT policy on session_notes
DROP POLICY IF EXISTS "Clients read own session notes" ON session_notes;

-- 4. Fix user_roles: replace the ALL policy with explicit WITH CHECK
DROP POLICY IF EXISTS "Admins manage roles" ON user_roles;
CREATE POLICY "Admins manage roles" ON user_roles
  FOR ALL TO public
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
