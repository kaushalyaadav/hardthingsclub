import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getISTDateString } from "@/lib/utils";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Called by cron job — send notifications to users whose reminder time matches current IST time
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const currentHour = istNow.getHours();
  const currentMinute = istNow.getMinutes();

  const supabase = createAdminClient();

  // Fetch active subscriptions matching current hour (within ±2 min of desired minute)
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id, subscription, reminder_hour, reminder_minute")
    .eq("is_active", true)
    .eq("reminder_hour", currentHour);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const today = getISTDateString();

  // Only send to subs whose minute is within 2 minutes of now
  const matching = subs.filter((s) => Math.abs(s.reminder_minute - currentMinute) <= 2);

  // Check who already logged today
  const userIds = matching.map((s) => s.user_id);
  const { data: todayLogs } = await supabase
    .from("log_entries")
    .select("user_id")
    .eq("entry_date", today)
    .in("user_id", userIds);

  const alreadyLogged = new Set((todayLogs ?? []).map((l) => l.user_id));

  let sent = 0;
  const failed: string[] = [];

  for (const sub of matching) {
    if (alreadyLogged.has(sub.user_id)) continue; // already logged today, skip

    try {
      await webpush.sendNotification(
        sub.subscription as webpush.PushSubscription,
        JSON.stringify({
          title: "Hard Things Club",
          body: "Don't break your streak — log today's activity! 🔥",
          url: "/log",
        })
      );
      sent++;
    } catch (err: any) {
      failed.push(sub.user_id);
      // If subscription expired (410), deactivate it
      if (err.statusCode === 410) {
        await supabase.from("push_subscriptions").update({ is_active: false }).eq("user_id", sub.user_id);
      }
    }
  }

  return NextResponse.json({ sent, failed: failed.length, total: matching.length });
}

// Also support GET for easy browser testing
export async function GET(request: Request) {
  return POST(request);
}
