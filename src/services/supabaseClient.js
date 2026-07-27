import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Flag pública: permite à UI decidir o comportamento sem quebrar.
export const isSupabaseConfigured = Boolean(url && key);

// IMPORTANTE: createClient() lança se url/key faltarem. Isso rodava no import
// e derrubava o app inteiro (tela branca) em deploy sem env vars.
// Aqui só instanciamos quando há configuração; caso contrário exportamos null
// e o erro (claro) só ocorre se alguém realmente tentar autenticar.
export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
