-- Extend log_entries with v2 fields
ALTER TABLE log_entries
  ADD COLUMN IF NOT EXISTS km NUMERIC,
  ADD COLUMN IF NOT EXISTS nutrition BOOLEAN,
  ADD COLUMN IF NOT EXISTS sleep_goal BOOLEAN;

-- Goal categories per member per month (coach configures)
CREATE TABLE IF NOT EXISTS member_goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month        DATE NOT NULL,
  category     TEXT NOT NULL CHECK (category IN (
    'monthly_mileage','running_days','workout_days','strength_sessions',
    'mobility_sessions','recovery_days','nutrition_days','sleep_days',
    'mindfulness_days','logging_days'
  )),
  goal_type    TEXT NOT NULL CHECK (goal_type IN ('cumulative','days')),
  target       NUMERIC NOT NULL,
  unit         TEXT NOT NULL,
  definition   TEXT,
  coach_note   TEXT,
  is_primary   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, month, category)
);

-- Outcome metrics per member (coach configures, multiple allowed)
CREATE TABLE IF NOT EXISTS member_metrics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_name  TEXT NOT NULL,
  unit         TEXT NOT NULL,
  direction    TEXT NOT NULL CHECK (direction IN ('up','down')),
  start_value  NUMERIC,
  note         TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Weekly metric logs from member
CREATE TABLE IF NOT EXISTS metric_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_id    UUID NOT NULL REFERENCES member_metrics(id) ON DELETE CASCADE,
  value        NUMERIC NOT NULL,
  logged_week  DATE NOT NULL,
  logged_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, metric_id, logged_week)
);

-- RLS
ALTER TABLE member_goals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_logs    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage member_goals" ON member_goals FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "member read own goals" ON member_goals FOR SELECT TO authenticated
  USING (auth.uid() = member_id);

CREATE POLICY "admin manage member_metrics" ON member_metrics FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "member read own metrics" ON member_metrics FOR SELECT TO authenticated
  USING (auth.uid() = member_id);

CREATE POLICY "admin manage metric_logs" ON metric_logs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "member read own metric_logs" ON metric_logs FOR SELECT TO authenticated
  USING (auth.uid() = member_id);
CREATE POLICY "member insert own metric_logs" ON metric_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = member_id);
CREATE POLICY "member update own metric_logs" ON metric_logs FOR UPDATE TO authenticated
  USING (auth.uid() = member_id) WITH CHECK (auth.uid() = member_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.member_goals   TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.member_metrics TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.metric_logs    TO authenticated, service_role;
