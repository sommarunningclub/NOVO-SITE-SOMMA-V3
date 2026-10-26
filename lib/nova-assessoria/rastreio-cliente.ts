/**
 * Rastreio de origem das páginas da BORA, do lado do navegador.
 *
 * Junta tudo o que só o navegador sabe (UTMs da URL, click ids, referrer,
 * tela, idioma, fuso) e três identificadores anônimos:
 *
 * - visitante: gerado uma vez e guardado no aparelho. Liga as visitas e o
 *   contato da mesma pessoa, e segura o mesmo professor do rodízio para ela.
 * - sessão: vive enquanto a aba estiver aberta.
 * - primeiro toque: a primeira origem vista neste aparelho, com data. A origem
 *   da visita atual vai separada, então dá para ver as duas.
 *
 * A origem da sessão também fica guardada: se a pessoa entrou por um link com
 * UTM e recarregou a página sem ele, o contato ainda sai com a UTM certa.
 *
 * Todo acesso a storage está em try/catch: aba anônima e navegador interno do
 * Instagram podem recusar, e o rastreio nunca pode travar o contato.
 */

const CHAVE_VISITANTE = "bora_visitante";
const CHAVE_SESSAO = "bora_sessao";
const CHAVE_ORIGEM_SESSAO = "bora_origem_sessao";
const CHAVE_PRIMEIRO_TOQUE = "bora_primeiro_toque";

const PARAMETROS_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
// Ids de clique das plataformas de anúncio e o `ref` que outros sites nossos
// acrescentam ao mandar gente para cá.
const PARAMETROS_CLIQUE = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid", "li_fat_id", "igshid", "ref"] as const;

type Utm = Partial<Record<(typeof PARAMETROS_UTM)[number], string>>;

interface Origem extends Utm {
  click_ids?: Record<string, string>;
  referrer?: string;
  url?: string;
}

export interface Rastreio extends Origem {
  visitante_id: string;
  sessao_id: string;
  primeiro_toque: (Origem & { em: string }) | null;
  tela: string;
  idioma: string;
  fuso: string;
}

function ler(storage: () => Storage, chave: string): string | null {
  try {
    return storage().getItem(chave);
  } catch {
    return null;
  }
}

function gravar(storage: () => Storage, chave: string, valor: string) {
  try {
    storage().setItem(chave, valor);
  } catch {
    // Sem storage o rastreio segue só com o que está na URL.
  }
}

const local = () => window.localStorage;
const sessao = () => window.sessionStorage;

function novoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function idGuardado(storage: () => Storage, chave: string): string {
  const atual = ler(storage, chave);
  if (atual) return atual;
  const id = novoId();
  gravar(storage, chave, id);
  return id;
}

function lerJson<T>(storage: () => Storage, chave: string): T | null {
  const bruto = ler(storage, chave);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as T;
  } catch {
    return null;
  }
}

/** Origem desta página: o que veio na URL e de onde a pessoa chegou. */
function origemDaUrl(): Origem {
  const params = new URLSearchParams(window.location.search);
  const origem: Origem = {};
  for (const p of PARAMETROS_UTM) {
    const v = params.get(p);
    if (v) origem[p] = v;
  }
  const clickIds: Record<string, string> = {};
  for (const p of PARAMETROS_CLIQUE) {
    const v = params.get(p);
    if (v) clickIds[p] = v;
  }
  if (Object.keys(clickIds).length) origem.click_ids = clickIds;
  // Referrer do próprio site não é origem: é a pessoa navegando aqui dentro.
  if (document.referrer && !document.referrer.startsWith(window.location.origin)) {
    origem.referrer = document.referrer;
  }
  return origem;
}

function temMarcacao(o: Origem): boolean {
  return PARAMETROS_UTM.some((p) => o[p]) || !!o.click_ids || !!o.referrer;
}

export function coletarRastreio(): Rastreio {
  const daUrl = origemDaUrl();
  // URL com marcação vence; sem marcação, vale a origem com que a sessão abriu.
  let origem: Origem;
  if (temMarcacao(daUrl)) {
    origem = daUrl;
    gravar(sessao, CHAVE_ORIGEM_SESSAO, JSON.stringify(daUrl));
  } else {
    origem = lerJson<Origem>(sessao, CHAVE_ORIGEM_SESSAO) ?? {};
  }

  let primeiroToque = lerJson<Origem & { em: string }>(local, CHAVE_PRIMEIRO_TOQUE);
  if (!primeiroToque) {
    primeiroToque = { ...origem, url: window.location.href, em: new Date().toISOString() };
    gravar(local, CHAVE_PRIMEIRO_TOQUE, JSON.stringify(primeiroToque));
  }

  let fuso = "";
  try {
    fuso = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Navegador antigo: segue sem fuso.
  }

  return {
    ...origem,
    url: window.location.href,
    visitante_id: idGuardado(local, CHAVE_VISITANTE),
    sessao_id: idGuardado(sessao, CHAVE_SESSAO),
    primeiro_toque: primeiroToque,
    tela: `${window.screen.width}x${window.screen.height}`,
    idioma: navigator.language || "",
    fuso,
  };
}

/** Uma visita por carregamento de página. Não espera resposta e não falha. */
export function registrarVisita(pagina: string) {
  try {
    const corpo = JSON.stringify({ pagina, rastreio: coletarRastreio() });
    const blob = new Blob([corpo], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/nova-assessoria/visita", blob)) return;
    void fetch("/api/nova-assessoria/visita", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: corpo,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Rastreio é acessório; a página segue.
  }
}
