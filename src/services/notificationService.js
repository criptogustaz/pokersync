import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

function client() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase não configurado.");
  return supabase;
}

export async function fetchNotifications(limit = 20) {
  const { data, error } = await client()
    .from("notifications")
    .select("id, title, body, kind, read, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function markAsRead(id) {
  const { error } = await client()
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllAsRead() {
  const { error } = await client()
    .from("notifications")
    .update({ read: true })
    .eq("read", false);
  if (error) throw error;
}

export async function deleteNotification(id) {
  const { error } = await client().from("notifications").delete().eq("id", id);
  if (error) throw error;
}
