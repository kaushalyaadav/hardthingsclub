const API_SETTINGS = "https://supabase.com/dashboard/project/_/settings/api";

const MISSING_PAIR =
  "Supabase URL and anon key are missing. Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
  `See ${API_SETTINGS}`;

/** True when public Supabase credentials are present (trimmed, non-empty). */
export function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

function assertSupabasePublicEnv(): void {
  if (!hasSupabaseConfig()) {
    throw new Error(MISSING_PAIR);
  }
}

export function getSupabaseUrl(): string {
  assertSupabasePublicEnv();
  return process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
}

export function getSupabaseAnonKey(): string {
  assertSupabasePublicEnv();
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
}
