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
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      redirect(profile?.role === "admin" ? "/admin" : "/home");
    }
  }

  const showEnvBanner = !configured || searchParams.env === "missing";

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <div className="w-full max-w-sm space-y-4">

        {/* Logo card */}
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white border border-neutral-100 p-6 shadow-sm">
          {/* Spiral logo */}
          <div className="relative">
            <img
              src="/htc-logo.jpg"
              alt="Hard Things Club"
              className="h-24 w-24 rounded-2xl object-cover shadow-md"
            />
            {/* Subtle glow ring from the spiral colours */}
            <div className="absolute inset-0 rounded-2xl ring-2 ring-offset-2 ring-blue-500/30 pointer-events-none" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Hard Things Club</h1>
            <p className="mt-0.5 text-sm text-neutral-400">Log daily. Build consistency.</p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-2xl bg-white border border-neutral-100 p-6 shadow-sm space-y-4">
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
          <SignInButton />
          <p className="text-center text-xs text-neutral-400">Only cohort members can log in.</p>
        </div>

      </div>
    </main>
  );
}
