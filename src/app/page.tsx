import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabaseEnv";
import { createClient } from "@/lib/supabaseServer";
import SignInButton from "@/components/member/SignInButton";

type Props = {
  searchParams: { env?: string; error?: string };
};

export default async function LoginPage({ searchParams }: Props) {
  const configured = hasSupabaseConfig();

  if (configured) {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

    if (user) {
      if (adminEmail && user.email?.toLowerCase() === adminEmail) redirect("/admin");
      redirect("/home");
    }
  }

  const showEnvBanner = !configured || searchParams.env === "missing";

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm card p-6 space-y-5">
        {showEnvBanner && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            <p className="font-medium">Supabase env not set</p>
            <p className="mt-1 text-amber-900/90">
              Copy <code className="rounded bg-amber-100/80 px-1">.env.example</code> to{" "}
              <code className="rounded bg-amber-100/80 px-1">.env.local</code>, add{" "}
              <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> from your{" "}
              <a className="underline" href="https://supabase.com/dashboard/project/_/settings/api">
                Supabase API settings
              </a>
              , then restart <code className="rounded bg-amber-100/80 px-1">npm run dev</code>.
            </p>
          </div>
        )}
        <div className="h-14 w-14 bg-black text-white rounded-md grid place-items-center font-semibold">HTC</div>
        <div>
          <h1 className="text-xl font-semibold">Hard Things Club</h1>
          <p className="text-sm text-neutral-600">Log daily. Build consistency.</p>
        </div>
        <SignInButton />
        <p className="text-xs text-neutral-500">Only allowed emails can log in.</p>
      </div>
    </main>
  );
}
