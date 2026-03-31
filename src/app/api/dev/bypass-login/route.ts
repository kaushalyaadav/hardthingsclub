import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing server env for demo login" }, { status: 500 });
  }

  const supabase = createClient();
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const allowedFromEnv = (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  let isAllowed = allowedFromEnv.includes(email) || (adminEmail && email === adminEmail);
  if (!isAllowed) {
    const { data } = await supabase.from("allowed_emails").select("email").eq("email", email).maybeSingle();
    if (data?.email) isAllowed = true;
  }
  if (!isAllowed) return NextResponse.json({ error: "Email is not allowlisted" }, { status: 403 });

  const admin = createAdminClient(url, serviceRoleKey);
  const { data: byEmail } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = byEmail?.users?.find((u) => u.email?.toLowerCase() === email);
  if (!existing) {
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true
    });
    if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${appUrl}/auth/callback` }
  });
  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkError?.message || "Could not create login link" }, { status: 400 });
  }

  return NextResponse.json({ actionLink: linkData.properties.action_link });
}

