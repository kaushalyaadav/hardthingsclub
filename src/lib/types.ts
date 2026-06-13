export const SESSION_TYPES = ["Push", "Pull", "Legs", "Mobility", "Run", "Rest"] as const;
export const ACTIVE_SESSION_TYPES = ["Push", "Pull", "Legs", "Mobility", "Run"] as const;

export type SessionType = (typeof SESSION_TYPES)[number];

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: "member" | "admin";
  is_active: boolean;
};

export type LogEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  session_types: SessionType[];
  session_duration_minutes: number;
  breathwork_minutes: number;
  notes: string | null;
  km: number | null;
  nutrition: boolean | null;
  sleep_goal: boolean | null;
};

export const GOAL_CATEGORIES = [
  "monthly_mileage", "running_days", "workout_days", "strength_sessions",
  "mobility_sessions", "recovery_days", "nutrition_days", "sleep_days",
  "mindfulness_days", "logging_days",
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];
export type GoalType = "cumulative" | "days";

export const GOAL_META: Record<GoalCategory, {
  label: string;
  type: GoalType;
  unit: string;
  defaultTarget: number;
  typeDesc: string;
  autoFrom: string | null;
}> = {
  monthly_mileage:   { label: "Monthly mileage",    type: "cumulative", unit: "km",       defaultTarget: 80,  typeDesc: "Adds up every km logged on a run",           autoFrom: "run_km" },
  running_days:      { label: "Running days",        type: "days",       unit: "days",     defaultTarget: 16,  typeDesc: "Counts days where Run session is logged",    autoFrom: "run_session" },
  workout_days:      { label: "Workout days",        type: "days",       unit: "days",     defaultTarget: 20,  typeDesc: "Counts days where Push/Pull/Legs logged",    autoFrom: "strength_session" },
  strength_sessions: { label: "Strength sessions",   type: "cumulative", unit: "sessions", defaultTarget: 12,  typeDesc: "Counts every Push/Pull/Legs session logged", autoFrom: "strength_session" },
  mobility_sessions: { label: "Mobility sessions",   type: "cumulative", unit: "sessions", defaultTarget: 8,   typeDesc: "Counts every Mobility session logged",       autoFrom: "mobility_session" },
  recovery_days:     { label: "Recovery days",       type: "days",       unit: "days",     defaultTarget: 8,   typeDesc: "Counts days where Mobility logged",          autoFrom: "mobility_session" },
  nutrition_days:    { label: "Nutrition days",      type: "days",       unit: "days",     defaultTarget: 20,  typeDesc: "Member marks yes/no each day",               autoFrom: null },
  sleep_days:        { label: "Sleep days",          type: "days",       unit: "days",     defaultTarget: 20,  typeDesc: "Member marks yes/no each day",               autoFrom: null },
  mindfulness_days:  { label: "Mindfulness days",    type: "days",       unit: "days",     defaultTarget: 20,  typeDesc: "Counts days where breathwork > 0",           autoFrom: "breathwork" },
  logging_days:      { label: "Logging days",        type: "days",       unit: "days",     defaultTarget: 25,  typeDesc: "Counts any day the member saves a log",      autoFrom: "any_log" },
};

export type MemberGoal = {
  id: string;
  member_id: string;
  month: string;
  category: GoalCategory;
  goal_type: GoalType;
  target: number;
  unit: string;
  definition: string | null;
  coach_note: string | null;
  is_primary: boolean;
};

export type MemberMetric = {
  id: string;
  member_id: string;
  metric_name: string;
  unit: string;
  direction: "up" | "down";
  start_value: number | null;
  note: string | null;
  is_active: boolean;
  sort_order: number;
};

export type MetricLog = {
  id: string;
  member_id: string;
  metric_id: string;
  value: number;
  logged_week: string;
};

export type GoalProgress = {
  goal: MemberGoal;
  current: number;
  pct: number;
  daysRemaining: number;
  pace: "on_track" | "at_risk" | "behind";
};
