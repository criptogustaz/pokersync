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

// Lê nome, apelido e avatar do usuário logado (RLS garante isolamento).
export async function fetchProfile() {
  const userId = await getUserId();
  const { data, error } = await client()
    .from("profiles")
    .select("id, nome, apelido, avatar_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data || { id: userId, nome: "", apelido: "", avatar_id: 1 };
}

// Atualiza apenas o avatar escolhido.
export async function updateAvatar(avatarId) {
  const userId = await getUserId();
  const { error } = await client()
    .from("profiles")
    .update({ avatar_id: Number(avatarId) || 1 })
    .eq("id", userId);
  if (error) throw error;
}

// Troca de senha pelo próprio usuário logado.
export async function updatePassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("A senha precisa ter ao menos 6 caracteres.");
  }
  const { error } = await client().auth.updateUser({ password: newPassword });
  if (error) throw error;
}
