import type { NextRequest } from "next/server";

/**
 * Rastreio de origem das páginas da BORA, do lado do servidor: valida o que o
 * navegador mandou e soma o que só o servidor sabe (IP, cidade pela Vercel,
 * aparelho pelo user agent). O resultado é a linha de `nova_assessoria_eventos`
 * sem os campos de contato.
 */

function texto(valor: unknown, max = 300): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  return limpo ? limpo.slice(0, max) : null;
}

/** Objeto plano de strings curtas (click ids, origem). Qualquer outra coisa vira null. */
function mapaDeTextos(valor: unknown, maxChaves = 12): Record<string, string> | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const saida: Record<string, string> = {};
  for (const [chave, v] of Object.entries(valor).slice(0, maxChaves)) {
    const t = texto(v, 500);
    if (t) saida[chave.slice(0, 40)] = t;
  }
  return Object.keys(saida).length ? saida : null;
}

function primeiroToque(valor: unknown): Record<string, unknown> | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const v = valor as Record<string, unknown>;
  const saida: Record<string, unknown> = {};
  for (const chave of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "referrer", "url", "em"]) {
    const t = texto(v[chave], 1000);
    if (t) saida[chave] = t;
  }
  const clickIds = mapaDeTextos(v.click_ids);
  if (clickIds) saida.click_ids = clickIds;
  return Object.keys(saida).length ? saida : null;
}

export interface Aparelho {
  dispositivo: string;
  navegador: string;
  sistema: string;
}

/** Leitura simples do user agent, o bastante para os filtros do admin. */
export function lerAparelho(ua: string): Aparelho {
  const dispositivo = /iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)
    ? "tablet"
    : /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)
      ? "celular"
      : "computador";

  // Navegadores internos primeiro: o Instagram também diz "Safari" e "Chrome".
  const navegadores: Array<[RegExp, string]> = [
    [/Instagram/i, "Instagram"],
    [/FBAN|FBAV|FB_IAB/i, "Facebook"],
    [/musical_ly|TikTok|BytedanceWebview/i, "TikTok"],
    [/WhatsApp/i, "WhatsApp"],
    [/LinkedInApp/i, "LinkedIn"],
    [/SamsungBrowser/i, "Samsung Internet"],
    [/Edg\//i, "Edge"],
    [/OPR\/|Opera/i, "Opera"],
    [/Firefox|FxiOS/i, "Firefox"],
    [/CriOS|Chrome/i, "Chrome"],
    [/Safari/i, "Safari"],
  ];
  const navegador = navegadores.find(([re]) => re.test(ua))?.[1] ?? "Outro";

  const sistemas: Array<[RegExp, string]> = [
    [/iPhone|iPad|iPod/i, "iOS"],
    [/Android/i, "Android"],
    [/Windows/i, "Windows"],
    [/Mac OS X|Macintosh/i, "macOS"],
    [/CrOS/i, "ChromeOS"],
    [/Linux/i, "Linux"],
  ];
  const sistema = sistemas.find(([re]) => re.test(ua))?.[1] ?? "Outro";

  return { dispositivo, navegador, sistema };
}

function cabecalhoDecodificado(req: NextRequest, nome: string): string | null {
  const bruto = req.headers.get(nome);
  if (!bruto) return null;
  try {
    return decodeURIComponent(bruto);
  } catch {
    return bruto;
  }
}

/** IP do cliente atrás da Vercel: o primeiro da lista do x-forwarded-for. */
export function ipDaRequisicao(req: NextRequest): string | null {
  const encaminhado = req.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim() || null;
  return req.headers.get("x-real-ip");
}

/** Campos de origem, aparelho e local de um evento. */
export function dadosDeRastreio(req: NextRequest, rastreioBruto: unknown) {
  const r = (rastreioBruto && typeof rastreioBruto === "object" ? rastreioBruto : {}) as Record<string, unknown>;
  const userAgent = req.headers.get("user-agent") ?? "";
  return {
    visitante_id: texto(r.visitante_id, 64),
    sessao_id: texto(r.sessao_id, 64),
    utm_source: texto(r.utm_source),
    utm_medium: texto(r.utm_medium),
    utm_campaign: texto(r.utm_campaign),
    utm_term: texto(r.utm_term),
    utm_content: texto(r.utm_content),
    click_ids: mapaDeTextos(r.click_ids),
    referrer: texto(r.referrer, 1000),
    url: texto(r.url, 1000),
    primeiro_toque: primeiroToque(r.primeiro_toque),
    tela: texto(r.tela, 20),
    idioma: texto(r.idioma, 20),
    fuso: texto(r.fuso, 60),
    user_agent: userAgent.slice(0, 500) || null,
    ...lerAparelho(userAgent),
    ip: ipDaRequisicao(req),
    cidade: cabecalhoDecodificado(req, "x-vercel-ip-city"),
    regiao: req.headers.get("x-vercel-ip-country-region"),
    pais: req.headers.get("x-vercel-ip-country"),
  };
}
