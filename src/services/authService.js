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

/**
 * Cadastro no Supabase Auth.
 * name e nickname vão em options.data (user_metadata) com chaves em PT
 * (nome, apelido) para casar com a trigger que popula public.profiles.
 */
export async function signUp({ name, nickname, email, password }) {
  const { data, error } = await client().auth.signUp({
    email,
    password,
    options: {
      data: { nome: name, apelido: nickname },
      emailRedirectTo: `${window.location.origin}/?confirmed=1`,
    },
  });
  if (error) throw error;
  return { user: data.user, needsConfirmation: !data.session };
}

export async function signOut() {
  await client().auth.signOut();
}

export function onAuthChange(cb) {
  return client().auth.onAuthStateChange(cb);
}
