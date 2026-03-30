
-- Fix: Allow clients to read profiles of their assigned doctor (needed for messaging names)
CREATE POLICY "Clients read doctor profiles" ON public.profiles
FOR SELECT USING (
  id IN (
    SELECT doctor_id FROM public.clients WHERE user_id = auth.uid() AND doctor_id IS NOT NULL
  )
);

-- Fix: Allow doctors to update testimonials (for approval)
CREATE POLICY "Doctors update testimonials" ON public.testimonials
FOR UPDATE USING (
  has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);
