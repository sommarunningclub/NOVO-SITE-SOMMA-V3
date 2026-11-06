import { NextResponse } from "next/server";
import { apagarSessao } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  apagarSessao(res);
  return res;
}
