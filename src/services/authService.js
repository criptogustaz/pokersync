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

// Cadastro: guarda o nome em user_metadata. Retorna { needsConfirmation }.
// Se o projeto exigir confirmação de e-mail, o usuário não loga na hora —
// recebe um e-mail para confirmar antes do primeiro acesso.
export async function signUp(name, email, password) {
  const { data, error } = await client().auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  // session === null quando a confirmação de e-mail está ativa.
  return { user: data.user, needsConfirmation: !data.session };
}

export async function signOut() {
  await client().auth.signOut();
}

// Assina mudanças de sessão (login/logout/token refresh).
// Uso: const { data: { subscription } } = onAuthChange((event, session) => { ... })
// Retorna o mesmo shape do supabase.auth.onAuthStateChange (com data.subscription.unsubscribe).
// Se o Supabase não estiver configurado, devolve um "assinatura fake" que pode ser cancelada sem erro.
export function onAuthChange(callback) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { subscription: { unsubscribe() {} } } };
  }
  return supabase.auth.onAuthStateChange((event, session) => {
    try {
      callback(event, session);
    } catch (e) {
      console.error("onAuthChange callback error:", e);
    }
  });
}

// Retorna o usuário logado (nome em user_metadata + e-mail). Best-effort.
export async function getCurrentUser() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    const u = data?.user;
    if (!u) return null;
    return { name: u.user_metadata?.name || null, email: u.email || null };
  } catch {
    return null;
  }
}
