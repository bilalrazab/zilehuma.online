
-- Allow clients to update their own client record
CREATE POLICY "Clients update own" ON public.clients
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow clients to insert their own client record
CREATE POLICY "Clients insert own" ON public.clients
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
