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
};
