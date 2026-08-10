import { createClient } from '@supabase/supabase-js'

export const WINGS_EVENT_SLUG_TITLE = 'Wings das Atléticas 2026 — Atletic Day Wings for Life 2'

export function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
