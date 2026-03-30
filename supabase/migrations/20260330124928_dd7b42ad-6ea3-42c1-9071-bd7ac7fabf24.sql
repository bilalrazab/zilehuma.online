
-- 1. Fix blog_posts: drop overly permissive write policies, add admin-only
DROP POLICY IF EXISTS "Anyone can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Anyone can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Anyone can delete blog posts" ON blog_posts;

CREATE POLICY "Staff manage blog posts"
  ON blog_posts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 2. Fix testimonials: drop overly permissive delete policy, add admin-only delete
DROP POLICY IF EXISTS "Anyone can delete testimonials" ON testimonials;

CREATE POLICY "Staff delete testimonials"
  ON testimonials FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Fix user_roles: add restrictive policy to prevent privilege escalation
CREATE POLICY "Only admins can insert roles"
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 4. Fix blog_comments: restrict insert to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON blog_comments;

CREATE POLICY "Authenticated users insert comments"
  ON blog_comments FOR INSERT TO authenticated
  WITH CHECK (true);

-- 5. Fix functions with mutable search_path
CREATE OR REPLACE FUNCTION public.log_session_timeline()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO timeline_logs (client_id, type, reference_id, description, created_by)
    VALUES (NEW.client_id, 'session', NEW.id,
      CASE NEW.status
        WHEN 'completed' THEN 'Session completed'
        WHEN 'cancelled' THEN 'Session cancelled'
        WHEN 'no_show' THEN 'Client missed session'
        ELSE 'Session status: ' || NEW.status
      END, NEW.doctor_id);
  END IF;
  IF NEW.status = 'no_show' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO tasks (client_id, title, type, priority, due_date, created_by)
    VALUES (NEW.client_id, 'Follow up: missed session', 'follow_up', 'high', CURRENT_DATE + 1, NEW.doctor_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_client_checklist()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  INSERT INTO client_checklists (client_id) VALUES (NEW.id) ON CONFLICT (client_id) DO NOTHING;
  INSERT INTO timeline_logs (client_id, type, description) VALUES (NEW.id, 'system', 'Client file created');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_payment_timeline()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  INSERT INTO timeline_logs (client_id, type, reference_id, description)
  VALUES (NEW.client_id, 'payment', NEW.id,
    CASE NEW.status
      WHEN 'paid' THEN 'Payment received: ' || NEW.amount
      WHEN 'unpaid' THEN 'Payment pending: ' || NEW.amount
      ELSE 'Payment ' || NEW.status || ': ' || NEW.amount
    END);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_task_timeline()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO timeline_logs (client_id, type, reference_id, description, created_by)
    VALUES (NEW.client_id, 'task', NEW.id, 'Task created: ' || NEW.title, NEW.created_by);
  ELSIF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO timeline_logs (client_id, type, reference_id, description)
    VALUES (NEW.client_id, 'task', NEW.id, 'Task completed: ' || NEW.title);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
  RETURNS bigint
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
  RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
  RETURNS bigint
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;
