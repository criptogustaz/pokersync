import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

// Só instancia quando há configuração; evita derrubar o app no import.
export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
