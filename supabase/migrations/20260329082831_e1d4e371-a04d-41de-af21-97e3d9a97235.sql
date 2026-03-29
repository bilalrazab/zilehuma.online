
-- Extend clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'normal';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'new_inquiry';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_session_date date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_session_date date;

-- Extend appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 50;

-- Extend resource_assignments
ALTER TABLE resource_assignments ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE resource_assignments ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE resource_assignments ADD COLUMN IF NOT EXISTS response text DEFAULT '';
ALTER TABLE resource_assignments ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Tasks table (CRM engine)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'follow_up',
  due_date date,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  created_by uuid,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid',
  payment_date date,
  method text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Client checklists (master checklist per client)
CREATE TABLE IF NOT EXISTS client_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  intake_completed boolean DEFAULT false,
  consent_signed boolean DEFAULT false,
  first_session_done boolean DEFAULT false,
  treatment_plan_created boolean DEFAULT false,
  progress_reviewed boolean DEFAULT false,
  follow_up_sent boolean DEFAULT false,
  case_closed boolean DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Timeline logs (auto-logged events)
CREATE TABLE IF NOT EXISTS timeline_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  reference_id uuid,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  target_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Forms (intake, consent, assessment)
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'intake',
  title text NOT NULL,
  content jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks
CREATE POLICY "Doctors manage tasks" ON tasks FOR ALL USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clients read own tasks" ON tasks FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
CREATE POLICY "Clients update own tasks" ON tasks FOR UPDATE USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for payments
CREATE POLICY "Doctors manage payments" ON payments FOR ALL USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clients read own payments" ON payments FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for client_checklists
CREATE POLICY "Doctors manage checklists" ON client_checklists FOR ALL USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clients read own checklist" ON client_checklists FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for timeline_logs
CREATE POLICY "Doctors manage timeline" ON timeline_logs FOR ALL USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clients read own timeline" ON timeline_logs FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for goals
CREATE POLICY "Doctors manage goals" ON goals FOR ALL USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clients read own goals" ON goals FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for forms
CREATE POLICY "Doctors manage forms" ON forms FOR ALL USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clients manage own forms" ON forms FOR ALL USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Auto-create checklist for new clients
CREATE OR REPLACE FUNCTION create_client_checklist()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO client_checklists (client_id) VALUES (NEW.id) ON CONFLICT (client_id) DO NOTHING;
  INSERT INTO timeline_logs (client_id, type, description) VALUES (NEW.id, 'system', 'Client file created');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_client_created ON clients;
CREATE TRIGGER on_client_created AFTER INSERT ON clients FOR EACH ROW EXECUTE FUNCTION create_client_checklist();

-- Auto-log timeline on session status change
CREATE OR REPLACE FUNCTION log_session_timeline()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
$$;

DROP TRIGGER IF EXISTS on_session_change ON appointments;
CREATE TRIGGER on_session_change AFTER UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION log_session_timeline();

-- Auto-log payment timeline
CREATE OR REPLACE FUNCTION log_payment_timeline()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
$$;

DROP TRIGGER IF EXISTS on_payment_change ON payments;
CREATE TRIGGER on_payment_change AFTER INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION log_payment_timeline();

-- Auto-log task timeline
CREATE OR REPLACE FUNCTION log_task_timeline()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
$$;

DROP TRIGGER IF EXISTS on_task_change ON tasks;
CREATE TRIGGER on_task_change AFTER INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION log_task_timeline();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
