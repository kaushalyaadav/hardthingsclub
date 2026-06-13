import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    subscription?: object;
    reminder_hour?: number;
    reminder_minute?: number;
  } | null;

  if (!body?.subscription) return NextResponse.json({ error: "subscription required" }, { status: 400 });

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    subscription: body.subscription,
    reminder_hour: body.reminder_hour ?? 20,
    reminder_minute: body.reminder_minute ?? 0,
    is_active: true,
  }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("push_subscriptions").update({ is_active: false }).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
