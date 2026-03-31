CREATE POLICY "Clients insert own appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);