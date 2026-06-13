import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createClient as createAdminClient } from "@supabase/supabase-js";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, user, isAdmin: profile?.role === "admin" };
}

export async function GET() {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await supabase.from("allowed_emails").select("*").order("created_at", { ascending: true });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null) as { email?: string; full_name?: string; role?: "member" | "admin"; password?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const full_name = body?.full_name?.trim() || null;
  const role = body?.role === "admin" ? "admin" : "member";
  const password = body?.password?.trim();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
  if (!password || password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Missing service role configuration" }, { status: 500 });

  const admin = createAdminClient(url, serviceRoleKey);
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 400 });
  const existingUser = usersData.users.find((u) => (u.email || "").toLowerCase() === email);

  if (existingUser) {
    const { error } = await admin.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: { role, ...(full_name ? { full_name } : {}) }
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, ...(full_name ? { full_name } : {}) }
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("allowed_emails")
    .upsert({ email, role, full_name }, { onConflict: "email" })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Sync name + role to profile if it exists
  const profileUpdate: Record<string, unknown> = { role, is_active: true };
  if (full_name) profileUpdate.full_name = full_name;
  await supabase.from("profiles").update(profileUpdate).eq("email", email);

  return NextResponse.json({ item: data });
}

export async function PATCH(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null) as { id?: string; full_name?: string; email?: string; password?: string } | null;
  const id = body?.id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: row, error: fetchErr } = await supabase.from("allowed_emails").select("email").eq("id", id).single();
  if (fetchErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const full_name = body?.full_name?.trim() || undefined;
  const newEmail = body?.email?.trim().toLowerCase() || undefined;
  const password = body?.password?.trim() || undefined;

  if (password && password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Missing service role config" }, { status: 500 });

  const admin = createAdminClient(url, serviceRoleKey);

  // Find existing auth user by current email
  const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existingUser = usersData?.users.find((u) => (u.email || "").toLowerCase() === row.email.toLowerCase());

  if (existingUser) {
    const authUpdate: Record<string, unknown> = {};
    if (newEmail) authUpdate.email = newEmail;
    if (password) authUpdate.password = password;
    if (full_name) authUpdate.user_metadata = { ...existingUser.user_metadata, full_name };
    if (Object.keys(authUpdate).length > 0) {
      const { error } = await admin.auth.admin.updateUserById(existingUser.id, authUpdate);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // Update allowed_emails
  const allowedUpdate: Record<string, unknown> = {};
  if (full_name) allowedUpdate.full_name = full_name;
  if (newEmail) allowedUpdate.email = newEmail;
  if (Object.keys(allowedUpdate).length > 0) {
    await supabase.from("allowed_emails").update(allowedUpdate).eq("id", id);
  }

  // Update profile
  const profileUpdate: Record<string, unknown> = {};
  if (full_name) profileUpdate.full_name = full_name;
  if (newEmail) profileUpdate.email = newEmail;
  if (Object.keys(profileUpdate).length > 0) {
    await supabase.from("profiles").update(profileUpdate).eq("email", row.email);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: row, error: fetchErr } = await supabase.from("allowed_emails").select("email").eq("id", id).single();
  if (fetchErr || !row?.email) return NextResponse.json({ error: fetchErr?.message || "Not found" }, { status: 400 });

  const { error } = await supabase.from("allowed_emails").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceRoleKey) {
    const admin = createAdminClient(url, serviceRoleKey);
    await admin.from("profiles").update({ is_active: false }).eq("email", row.email.trim().toLowerCase());
  }

  return NextResponse.json({ ok: true });
}
