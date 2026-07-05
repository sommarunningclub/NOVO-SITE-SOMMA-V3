import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Diagnóstico: reporta quais variáveis o runtime enxerga (apenas booleanos —
// NUNCA expõe valores). Útil para confirmar env vars na Vercel. Pode ser removido depois.
export async function GET() {
  const has = (v?: string) => Boolean(v && v.length > 0);
  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: has(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_URL: has(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: has(process.env.SUPABASE_SERVICE_ROLE_KEY),
      ASAAS_API_KEY: has(process.env.ASAAS_API_KEY),
      ASAAS_WEBHOOK_TOKEN: has(process.env.ASAAS_WEBHOOK_TOKEN),
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: has(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
      RESEND_API_KEY: has(process.env.RESEND_API_KEY),
      VIP_EMAIL_FROM: has(process.env.VIP_EMAIL_FROM),
    },
  });
}
