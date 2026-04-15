import { NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabaseEnv";
import { createClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(`${origin}/?env=missing`);
  }

  if (!code) return NextResponse.redirect(`${origin}/`);

  const supabase = createClient();
  await supabase.auth.exchangeCodeForSession(code);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) return NextResponse.redirect(`${origin}/`);

  const email = user.email.toLowerCase();
  const allowedFromEnv = (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  // First check explicit admin email / env allowlist
  let isAllowed = allowedFromEnv.includes(email) || (adminEmail && email === adminEmail);

  // Then check allowed_emails table (managed from admin UI)
  if (!isAllowed) {
    const { data } = await supabase.from("allowed_emails").select("email").eq("email", email).maybeSingle();
    if (data?.email) {
      isAllowed = true;
    }
  }
  if (!isAllowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/?error=not-allowed`);
  }

  if (adminEmail && email === adminEmail) {
    return NextResponse.redirect(`${origin}/admin`);
  }

  return NextResponse.redirect(`${origin}/home`);
}
