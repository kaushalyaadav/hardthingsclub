import type { SupabaseClient } from "@supabase/supabase-js";

export type CohortMemberRow = { id: string; full_name: string };

/**
 * Member profiles that still appear in Access control (`allowed_emails`).
 * Removing someone there hides them from cohort admin views even if their `profiles` row remains.
 */
export async function listCohortMembers(supabase: SupabaseClient): Promise<CohortMemberRow[]> {
  const [{ data: allowedRows }, { data: profiles }] = await Promise.all([
    supabase.from("allowed_emails").select("email"),
    supabase.from("profiles").select("id,full_name,email").eq("role", "member").order("full_name")
  ]);

  const allowed = new Set((allowedRows ?? []).map((r) => r.email.trim().toLowerCase()));

  return (profiles ?? [])
    .filter((p) => p.email && allowed.has(p.email.trim().toLowerCase()))
    .map(({ id, full_name }) => ({ id, full_name }));
}
