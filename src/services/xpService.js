import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

function client() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase não configurado.");
  return supabase;
}

// Mapa de nível → patente (25 níveis + Lenda no cap)
const PATENTES = [
  "Micro Stakes I", "Micro Stakes II", "Micro Stakes III",
  "Low Stakes I", "Low Stakes II", "Low Stakes III",
  "Mid Stakes I", "Mid Stakes II", "Mid Stakes III",
  "High Stakes I", "High Stakes II", "High Stakes III",
  "High Roller I", "High Roller II", "High Roller III",
  "Super High Roller I", "Super High Roller II", "Super High Roller III",
  "Nosebleeds I", "Nosebleeds II", "Nosebleeds III",
  "Nosebleeds IV", "Nosebleeds V", "Nosebleeds VI", "Nosebleeds VII",
];

export function getPatente(level) {
  if (level >= 25) return "Lenda do Poker";
  return PATENTES[level - 1] || "Micro Stakes I";
}

// Mesma fórmula da função SQL xp_for_next_level
export function xpForNextLevel(level) {
  return Math.round(100 * Math.pow(level, 1.5));
}

export async function fetchProgress() {
  const { data, error } = await client()
    .from("user_progress")
    .select("level, xp_current, xp_total, streak_days, streak_best, combo_gto, prestige_count")
    .maybeSingle();
  if (error) throw error;
  return data || { level: 1, xp_current: 0, xp_total: 0, streak_days: 0, streak_best: 0, combo_gto: 0, prestige_count: 0 };
}

export async function fetchActiveMissions() {
  const { data, error } = await client()
    .from("user_missions")
    .select("id, progress, goal_value, status, period_start, completed_at, missions(code, title, description, kind, category, xp_reward, icon)")
    .eq("status", "active")
    .order("period_start", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchMissionCatalog() {
  const { data, error } = await client()
    .from("missions")
    .select("code, title, description, kind, category, goal_base, xp_reward, icon")
    .order("kind", { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Registra um drill e concede XP em uma única chamada.
 * O servidor calcula multiplicadores (streak + combo) e aplica cap diário.
 * Retorna { xp_final, level_up, new_level, combo_gto }.
 */
export async function registerTraining({ spotId, verdict, evLoss, userAction, userSizing }) {
  const { data, error } = await client().rpc("register_training", {
    p_spot_id: spotId || null,
    p_verdict: verdict,
    p_ev_loss: Number(evLoss) || 0,
    p_user_action: userAction || null,
    p_user_sizing: userSizing != null ? Number(userSizing) : null,
  });
  if (error) throw error;
  return data?.[0];
}

/**
 * Concede XP genérico (bankroll, missão, etc). O servidor aplica multiplicadores.
 * Retorna { xp_final, level_up, new_level }.
 */
export async function awardXP({ source, category, xpBase, referenceId }) {
  const { data, error } = await client().rpc("award_xp", {
    p_source: source,
    p_category: category,
    p_xp_base: xpBase,
    p_reference_id: referenceId || null,
  });
  if (error) throw error;
  return data?.[0];
}
