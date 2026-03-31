import AllowedEmailsClient from "@/components/admin/AllowedEmailsClient";
import { createClient } from "@/lib/supabaseServer";

export default async function AllowedEmailsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;

  const { data } = await supabase.from("allowed_emails").select("*").order("created_at", { ascending: true });

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-neutral-100 p-5">
        <h1 className="text-2xl font-semibold text-neutral-900">Access control</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage which emails are allowed to log in to Hard Things Club.</p>
      </div>
      <div className="p-5">
        <AllowedEmailsClient initial={(data ?? []) as any} />
      </div>
    </div>
  );
}

