import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = getWeekStart(new Date()).toISOString().slice(0, 10);

  try {
    const { data: missions } = await supabase
      .from("missions")
      .select("id, kind, goal_base, goal_scale")
      .in("kind", ["daily", "weekly"]);

    if (!missions?.length) {
      return respond({ ok: true, message: "Nenhuma missão para atribuir." });
    }

    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: users } = await supabase
      .from("user_progress")
      .select("user_id, level")
      .gte("updated_at", cutoff);

    if (!users?.length) {
      return respond({ ok: true, message: "Nenhum usuário ativo." });
    }

    const rows: any[] = [];
    for (const user of users) {
      for (const m of missions) {
        const goal = Math.round(m.goal_base * (1 + m.goal_scale * (user.level - 1)));
        const period = m.kind === "daily" ? today : weekStart;
        rows.push({
          user_id: user.user_id,
          mission_id: m.id,
          goal_value: goal,
          period_start: period,
          progress: 0,
          status: "active",
        });
      }
    }

    const { error, count } = await supabase
      .from("user_missions")
      .upsert(rows, { onConflict: "user_id,mission_id,period_start", ignoreDuplicates: true, count: "exact" });

    if (error) throw error;

    return respond({
      ok: true,
      users: users.length,
      missions: missions.length,
      inserted: count ?? "unknown",
    });
  } catch (e) {
    return respond({ ok: false, error: String(e) }, 500);
  }
});

function getWeekStart(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function respond(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
