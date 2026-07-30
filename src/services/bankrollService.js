import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

function client() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase não configurado.");
  }
  return supabase;
}

async function getUserId() {
  const { data, error } = await client().auth.getUser();
  if (error || !data.user) throw new Error("NO_SESSION");
  return data.user.id;
}

/* ---------- mapeamento DB <-> UI ---------- */
function rowToSession(r) {
  return {
    id: r.id,
    date: r.date,
    time: r.time || "",
    format: r.format,
    buyIn: Number(r.buy_in) || 0,
    reentries: Number(r.reentries) || 0,
    cashout: Number(r.cashout) || 0,
    stake: r.stake || "",
    hours: r.hours != null ? Number(r.hours) : undefined,
    venue: r.venue || "",
    notes: r.notes || "",
  };
}

function sessionToRow(s, userId) {
  return {
    user_id: userId,
    date: s.date,
    time: s.time || null,
    format: s.format,
    buy_in: Number(s.buyIn) || 0,
    reentries: Number(s.reentries) || 0,
    cashout: Number(s.cashout) || 0,
    stake: s.stake || null,
    hours: s.hours != null && s.hours !== "" ? Number(s.hours) : null,
    venue: s.venue || null,
    notes: s.notes || null,
  };
}

/* ---------- sessões ---------- */
export async function fetchSessions() {
  const { data, error } = await client()
    .from("bankroll_sessions")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToSession);
}

export async function addSession(session) {
  const userId = await getUserId();
  const { data, error } = await client()
    .from("bankroll_sessions")
    .insert(sessionToRow(session, userId))
    .select()
    .single();
  if (error) throw error;

  // Concede XP pela sessão: 30 se lucro, 20 caso contrário.
  const profit = (Number(session.cashout) || 0) - (Number(session.buyIn) || 0);
  const xpBase = profit > 0 ? 30 : 20;
  try {
    await client().rpc("award_xp", {
      p_source: "bankroll",
      p_category: "bankroll",
      p_xp_base: xpBase,
      p_reference_id: data.id,
    });
  } catch (e) {
    console.error("Falha ao conceder XP da sessão de banca:", e);
  }

  return rowToSession(data);
}

export async function deleteSession(id) {
  const { error } = await client().from("bankroll_sessions").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- settings ---------- */
export async function fetchSettings() {
  const { data, error } = await client()
    .from("bankroll_settings")
    .select("bankroll, profile")
    .maybeSingle();
  if (error) throw error;
  return data
    ? { bankroll: Number(data.bankroll) || 0, profile: data.profile || "Padrão" }
    : { bankroll: 0, profile: "Padrão" };
}

export async function saveSettings({ bankroll, profile }) {
  const userId = await getUserId();
  const { error } = await client()
    .from("bankroll_settings")
    .upsert(
      { user_id: userId, bankroll: Number(bankroll) || 0, profile, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}
