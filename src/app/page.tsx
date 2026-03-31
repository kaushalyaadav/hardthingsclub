import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import SignInButton from "@/components/member/SignInButton";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  if (user) {
    if (adminEmail && user.email?.toLowerCase() === adminEmail) redirect("/admin");
    redirect("/home");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm card p-6 space-y-5">
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
