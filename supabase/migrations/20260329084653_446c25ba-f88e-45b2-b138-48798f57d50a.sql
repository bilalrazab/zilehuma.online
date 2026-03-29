
-- Remove duplicate client roles for users who have a higher role
DELETE FROM user_roles 
WHERE role = 'client' 
AND user_id IN (
  SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'doctor')
);

-- Fix the handle_new_user trigger to not auto-assign client role if user already has a role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  
  -- Only assign client role if user has NO existing role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;
