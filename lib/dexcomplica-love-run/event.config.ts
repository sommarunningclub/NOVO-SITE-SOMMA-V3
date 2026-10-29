/**
 * DEXCOMPLICA LOVE RUN (07/11/2026)
 *
 * Somma Club + Dexcomplica, produção Monu. Corre de aquecimento para a festa
 * Dexcomplica, com after no Oscarito.
 *
 * Tudo que a LP afirma sobre o evento sai daqui. Regra: o que não estiver
 * confirmado pela organização fica `null` (ou `confirmado: false`) e a
 * interface simplesmente não mostra, ou diz "em breve". Não inventar horário,
 * percurso, distância, modalidade, regra de acesso ou benefício.
 *
 * O que é OPERACIONAL não mora aqui, mora em `public.eventos` (slug abaixo),
 * e a gestão muda sem deploy:
 *   - pelotões (`eventos.pelotoes`): a inscrição só abre com eles definidos;
 *   - vagas (`eventos.capacidade`): idem;
 *   - inscrição aberta/fechada (`eventos.checkin_status`, `evento_encerrado`).
 */

export const EVENTO_SLUG_OFICIAL = "dexcomplica-love-run";
/**
 * Slug da linha em `public.eventos`. Em produção é sempre o oficial. Fora
 * dela, `LOVE_RUN_EVENTO_SLUG` aponta a LP local para um evento de teste
 * oculto (ver scripts/love-run-teste.mjs), para testar inscrição, vagas e
 * check-in sem tocar no evento real.
 */
export const EVENTO_SLUG =
  (process.env.NODE_ENV !== "production" && process.env.LOVE_RUN_EVENTO_SLUG) || EVENTO_SLUG_OFICIAL;

/** Rodando contra um evento de teste (só fora de produção): a trava de liberação não se aplica. */
export const MODO_TESTE = EVENTO_SLUG !== EVENTO_SLUG_OFICIAL;
/** Endereço público da LP (o slug do banco continua `dexcomplica-love-run`). */
export const EVENTO_PATH = "/dexcomplica";
export const SITE_URL = "https://sommaclub.com.br";
export const EVENTO_URL = `${SITE_URL}${EVENTO_PATH}`;

export const EVENTO_NOME = "Dexcomplica Love Run";
export const BORDAO = "Desapega, desilude... Dexcomplica!";
export const CHAMADA = "Desapega, desilude e vem correr.";
export const APOIO =
  "Um corre diferente, com muita música, ativações e um after para continuar a experiência.";

/** Prefixo do código do ingresso (DLR-8F4X29). O leitor da gestão aceita qualquer prefixo de 2 a 4 letras. */
export const PREFIXO_TICKET = "DLR";

/** Paleta: vermelho e rosa do coração da Dexcomplica, preto/branco/cinza e laranja do Somma. */
export const CORES = {
  vermelho: "#E73A28", // coração do logo Dexcomplica
  mascote: "#FF2F18", // corpo do mascote
  rosa: "#FF85A1", // curativo do mascote
  amarelo: "#F2C230", // fundo dourado do perfil da Dexcomplica
  laranja: "#FF2C03", // SOMMA (logo oficial)
  tinta: "#0E0E0E",
  papel: "#F4F0EA",
  cinza: "#8C8780",
} as const;

/* ─── Quando ──────────────────────────────────────────────────────────────── */
export const DATA_ISO = "2026-11-07";
export const DATA_CURTA = "07.11";
export const DATA_EXTENSO = "Sábado, 7 de novembro";
export const DATA_EXTENSO_ANO = "Sábado, 7 de novembro de 2026";

/** Concentração confirmada pelo Alex em 28/10/2026. Largada: PENDENTE. */
export const HORARIO: { concentracao: string | null; largada: string | null } = {
  concentracao: "06h30",
  largada: null,
};

/* ─── Onde ────────────────────────────────────────────────────────────────── */
export interface Ponto {
  id: "corre" | "after";
  rotulo: string;
  nome: string;
  endereco: string;
  /** Conferido na Places API (searchText) em 27/10/2026. */
  geo: { lat: number; lng: number };
  placeId: string;
}

export const LOCAL_CORRE: Ponto = {
  id: "corre",
  rotulo: "O corre",
  nome: "Parque da Cidade, Estacionamento 1",
  endereco: "Parque da Cidade Sarah Kubitschek, Estacionamento 1, Plano Piloto, Brasília - DF, 70655-775",
  geo: { lat: -15.7943687, lng: -47.9079092 },
  placeId: "ChIJH4nPHI46WpMRD2P1elhXBmM",
};

export const LOCAL_AFTER: Ponto = {
  id: "after",
  rotulo: "O after",
  nome: "Oscarito Brasília",
  endereco:
    "SIG, Quadra 01, lotes 985 a 1035, Centro Empresarial Parque Brasília, salas 244 e 245, Brasília - DF, 70610-410",
  geo: { lat: -15.7939634, lng: -47.9104947 },
  placeId: "ChIJGU6GaLM7WpMRlGFhJOzfZXE",
};

export const PONTOS = [LOCAL_CORRE, LOCAL_AFTER] as const;

export function urlComoChegar(p: Ponto): string {
  const q = new URLSearchParams({
    api: "1",
    destination: `${p.geo.lat},${p.geo.lng}`,
    destination_place_id: p.placeId,
  });
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}

export function urlNoMapa(p: Ponto): string {
  const q = new URLSearchParams({ api: "1", query: p.nome, query_place_id: p.placeId });
  return `https://www.google.com/maps/search/?${q.toString()}`;
}

/* ─── O corre ─────────────────────────────────────────────────────────────── */
/**
 * PENDENTE. Traçado oficial. Quando vier, preencher com a imagem do percurso
 * (em /public/dexcomplica-love-run/) e a descrição; o bloco aparece sozinho.
 */
export const PERCURSO: { imagem: string; alt: string; descricao: string } | null = null;

/* ─── After no Oscarito ───────────────────────────────────────────────────── */
export const AFTER = {
  /** PENDENTE: início e fim do after. */
  horario: null as string | null,
  /** PENDENTE: condição de acesso (gratuito para inscritos? pulseira? consumação?). */
  acesso: null as string | null,
  /** Informado pela organização no briefing. */
  estrutura: ["Ducha", "Vestiários"] as const,
  /**
   * PENDENTE. As peças do Oscarito citam beach tennis, futevôlei e vôlei de
   * areia, mas não foi confirmado o que fica liberado no dia. Enquanto vazio,
   * a página fala só em "estrutura esportiva".
   */
  modalidades: [] as string[],
};

/** O que levar: só o que a organização pediu. */
export const LEVAR = [
  { item: "Tênis e roupa de corrida", detalhe: "O corre vem primeiro." },
  { item: "Roupa de banho", detalhe: "Tem ducha no Oscarito." },
  { item: "Uma segunda roupa", detalhe: "Para curtir o after com tudo." },
  { item: "Seu ingresso", detalhe: "QR Code no celular ou o código." },
] as const;

/* ─── A festa ─────────────────────────────────────────────────────────────── */
export const FESTA = {
  nome: "Dexcomplica",
  /**
   * A bio do @dexxcomplica diz "28 de novembro" (sem ano, local nem link).
   * Não confirmado pela organização: só aparece quando `confirmada = true`.
   */
  data: "28 de novembro",
  confirmada: false,
  local: null as string | null,
  /** PENDENTE: URL oficial de informações/ingressos. */
  url: null as string | null,
  instagram: "https://www.instagram.com/dexxcomplica/",
  /**
   * PENDENTE. Sabe-se só que quem estiver PRESENTE no corre tem uma condição
   * especial. Percentual, código, regras e forma de entrega: a definir. Não é
   * entregue na inscrição.
   */
  beneficio: null as string | null,
};

/* ─── Trilha ──────────────────────────────────────────────────────────────── */
/**
 * Música da página, pelo player oficial do Spotify (o áudio não pode ser
 * baixado de lá). O player só toca quando a pessoa aperta play, usa o volume
 * do aparelho e, para quem não está logado no Spotify, toca uma prévia de 30 s.
 */
export const TRILHA = {
  titulo: "Pela Última Vez (Ao Vivo)",
  artistas: "Grupo Menos É Mais e NATTAN",
  spotifyId: "6B7ot6Wlqf7zt3FCkYl2FJ",
} as const;

/* ─── Marcas e redes ──────────────────────────────────────────────────────── */
export const INSTAGRAM_SOMMA = "https://www.instagram.com/somma.club/";
export const POLITICA_PRIVACIDADE = "/politica-de-privacidade";

/* ─── Estado da inscrição ─────────────────────────────────────────────────── */
export type EstadoInscricao = "em_breve" | "abertas" | "esgotado" | "encerradas";

/**
 * Escassez na comunicação: "vagas limitadas", sem número (pedido do Alex em
 * 29/10/2026). O teto real fica só no banco (`eventos.capacidade`): é ele que
 * fecha a inscrição e faz a página mostrar "esgotado".
 */
export const ESCASSEZ_PUBLICA = "Vagas limitadas";

/** Grupo do evento no WhatsApp: onde saem as novidades e informações. */
export const GRUPO_WHATSAPP = {
  nome: "Corre do Lovezinho",
  url: "https://chat.whatsapp.com/Ete0hJXmutSDXHKiD3dpn5",
} as const;
