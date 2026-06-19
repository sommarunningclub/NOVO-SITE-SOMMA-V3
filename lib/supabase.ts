import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase server-side. Usa as MESMAS env vars do site atual.
// Retorna null quando não configurado, para o formulário degradar com elegância.
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
