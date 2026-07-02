import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabaseServer";
import { MEMBER_APPLICATIONS } from "@/lib/memberApplications";
import { GOAL_CATEGORIES, GOAL_META } from "@/lib/types";
import { computeGoalProgress } from "@/lib/goalProgress";
import type { MemberGoal } from "@/lib/types";
import { getISTDateString, PROGRAMME_START, isMovementDay } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null) as { memberId?: string; month?: string } | null;
  if (!body?.memberId || !body?.month) return NextResponse.json({ error: "memberId and month required" }, { status: 400 });

  const { memberId, month } = body;
  const monthStart = `${month}-01`;
  const today = getISTDateString();

  const { data: memberProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", memberId)
    .single();
  if (!memberProfile) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  // Fetch everything in parallel
  const [
    { data: allGoals },
    { data: monthLogs },
    { data: allLogs },
  ] = await Promise.all([
    // All goals ever set for this member (all months)
    supabase.from("member_goals").select("*").eq("member_id", memberId).order("month"),
    // This month's full entries for current goal progress
    supabase
      .from("log_entries")
      .select("entry_date,session_types,breathwork_minutes,km,nutrition,sleep_goal")
      .eq("user_id", memberId)
      .gte("entry_date", monthStart),
    // All entries since programme start for overall stats
    supabase
      .from("log_entries")
      .select("entry_date,session_types,breathwork_minutes,km,nutrition,sleep_goal")
      .eq("user_id", memberId)
      .gte("entry_date", PROGRAMME_START)
      .lte("entry_date", today),
  ]);

  // ── Overall programme stats since April ──────────────────────────
  const allEntries = allLogs ?? [];
  const programmeDays = allEntries.length;
  const movementDays = allEntries.filter((e) => isMovementDay(e.session_types as any)).length;
  const breathworkDays = allEntries.filter((e) => e.breathwork_minutes > 0).length;

  // Debug: log entries with km for this member
  const juneEntries = allEntries.filter((e) => e.entry_date.startsWith("2026-06"));
  const juneRunKm = juneEntries.filter((e) => (e.session_types as any)?.includes("Run")).reduce((sum, e) => sum + ((e.km as any) ?? 0), 0);
  console.log(`DEBUG [${memberProfile.full_name}]: June entries: ${juneEntries.length}, June run km: ${juneRunKm}`);

  // Logging consistency: unique logged days / days elapsed since programme start
  const today_d = new Date(`${today}T00:00:00+05:30`);
  const start_d = new Date(`${PROGRAMME_START}T00:00:00+05:30`);
  const daysElapsedSinceStart = Math.max(1, Math.floor((today_d.getTime() - start_d.getTime()) / 86400000) + 1);
  const loggingConsistencyPct = Math.round((programmeDays / daysElapsedSinceStart) * 100);

  // ── Past goals with progress (all months except current) ─────────
  const goals = (allGoals ?? []) as MemberGoal[];
  const pastGoals = goals.filter((g) => g.month < monthStart);
  const currentGoals = goals.filter((g) => g.month === monthStart);

  // Group past goals by month
  const pastMonths = [...new Set(pastGoals.map((g) => g.month))].sort();
  const pastGoalsSummary = pastMonths.length > 0
    ? pastMonths.map((m) => {
        const monthGoals = pastGoals.filter((g) => g.month === m);
        const monthLabel = new Date(`${m}T00:00:00+05:30`).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
        // Compute progress for that month using all entries in that month
        const mStart = m;
        const mEnd = m.slice(0, 7);
        const mEntries = allEntries.filter((e) => e.entry_date.startsWith(mEnd));
        const mProgress = computeGoalProgress(monthGoals, mEntries as any, today);

        // June 2026 had mid-month goal setting - note the stronger pace
        const isMidMonthGoalMonth = m === "2026-06-01";
        const midMonthNote = isMidMonthGoalMonth ? " [Note: goals set mid-month, so pace extrapolates higher for full month]" : "";

        return `${monthLabel}:${midMonthNote}\n` + mProgress.map((gp) =>
          `  - ${GOAL_META[gp.goal.category].label}: target ${gp.goal.target} ${gp.goal.unit}, achieved ${gp.current} (${gp.pct}%)\n    Definition set: "${gp.goal.definition || "none"}"`
        ).join("\n");
      }).join("\n\n")
    : "No goals set in previous months yet.";

  // ── Current month progress ────────────────────────────────────────
  const currentProgress = computeGoalProgress(currentGoals, monthLogs ?? [], today);
  const currentProgressSummary = currentProgress.length > 0
    ? currentProgress.map((gp) =>
        `- ${GOAL_META[gp.goal.category].label}: ${gp.current}/${gp.goal.target} ${gp.goal.unit} (${gp.pct}%) — ${gp.pace}\n  Definition: "${gp.goal.definition || "none"}"`
      ).join("\n")
    : "No goals set for this month yet.";

  // ── Application form ─────────────────────────────────────────────
  const app = MEMBER_APPLICATIONS.find(
    (a) => a.email.toLowerCase() === (memberProfile.email || "").toLowerCase()
  );

  // ── Goal categories reference ─────────────────────────────────────
  const goalCategoriesDesc = GOAL_CATEGORIES.map(
    (c) => `${c}: ${GOAL_META[c].label} (${GOAL_META[c].type === "cumulative" ? "running total" : "days counter"}, default: ${GOAL_META[c].defaultTarget} ${GOAL_META[c].unit}) — ${GOAL_META[c].typeDesc}`
  ).join("\n");

  const prompt = `You are helping fitness coach Kaushal set monthly goals for a Hard Things Club member (6-month programme, Apr–Sep 2026).

═══ MEMBER: ${memberProfile.full_name} ═══
Month to set goals for: ${month}

─── WHY THEY JOINED ───
${app ? `${app.why_change}\n\nWhy Kaushal: ${app.why_kaushal}` : "No application data."}

─── PROGRAMME STATS SINCE APRIL (overall picture) ───
- Days elapsed since programme start: ${daysElapsedSinceStart}
- Total days logged: ${programmeDays} (${loggingConsistencyPct}% logging consistency)
- Movement days (any active session): ${movementDays}
- Breathwork / mindfulness days: ${breathworkDays}

─── PAST GOALS & PERFORMANCE (what Kaushal has set before, and how the member did) ───
${pastGoalsSummary}

─── CURRENT MONTH (${month}) GOALS & PROGRESS SO FAR ───
${currentProgressSummary}

─── AVAILABLE GOAL CATEGORIES ───
${goalCategoriesDesc}

═══ TASK ═══
Suggest 2–3 goals for ${month}. Consider:
1. What worked in past months (high %, good definitions) — reinforce or build on them. If any month had [mid-month goal setting], the achievement is even stronger than the % suggests—be ambitious.
2. What struggled (low %) — either adjust the target to be more realistic, or change the definition to be clearer
3. The member's core motivation and blockers from their application
4. Their overall consistency — if logging is low, prioritise logging_days; if movement is low, prioritise workout_days
5. Goals should feel ambitious yet achievable—push them to grow, but keep it sustainable so they stay engaged
6. Don't repeat goals that are clearly wrong for this person

Return ONLY a JSON array, no explanation, no markdown:
[
  {
    "category": "exact_category_key",
    "target": 20,
    "is_primary": true,
    "definition": "Specific, personalised one sentence — what hitting this goal means for ${memberProfile.full_name.split(" ")[0]} specifically."
  }
]

Rules:
- category must be one of the exact keys above
- Only one goal can have is_primary: true
- definition must reference their specific situation — never generic`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ error: "Could not parse suggestions" }, { status: 500 });

    const suggestions = JSON.parse(jsonMatch[0]) as Array<{
      category: string; target: number; is_primary: boolean; definition: string;
    }>;

    const enriched = suggestions
      .filter((s) => GOAL_CATEGORIES.includes(s.category as any))
      .map((s) => {
        const meta = GOAL_META[s.category as keyof typeof GOAL_META];
        return {
          category: s.category,
          target: s.target || meta.defaultTarget,
          unit: meta.unit,
          definition: s.definition || "",
          is_primary: s.is_primary,
        };
      });

    return NextResponse.json({ goals: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI request failed" }, { status: 500 });
  }
}
