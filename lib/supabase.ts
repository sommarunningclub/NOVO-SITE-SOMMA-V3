import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase server-side. Usa as MESMAS env vars do site atual.
// Retorna null quando não configurado, para o formulário degradar com elegância.
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Cliente service-role (server-only) — espelha o padrão da GESTÃO
// (v0-sistema-somma-de-gestao-l7) para webhook/cupom/professor_clients.
// Bypassa RLS — usar APENAS em rotas server-side confiáveis.
export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  // SEM fallback para a anon key: se a service-role faltar, retorna null e a rota
  // falha de forma explícita (evita gravar via anon e violar RLS silenciosamente).
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "[getServiceSupabase] SUPABASE_SERVICE_ROLE_KEY ausente — configure no ambiente (Vercel)."
    );
    return null;
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
