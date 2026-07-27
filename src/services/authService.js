import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

function client() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
    );
  }
  return supabase;
}

export async function getSessionToken() {
  const { data } = await client().auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch(path, options = {}) {
  const token = await getSessionToken();
  if (!token) throw new Error("NO_SESSION");
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export async function signIn(email, password) {
  const { data, error } = await client().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await client().auth.signOut();
}
