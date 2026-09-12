/**
 * SOMMA DAY — EDIÇÃO ESPECIAL SET 2026
 *
 * Configuração central do evento: a LP, as rotas de API e o admin leem daqui.
 * O conteúdo vem do briefing oficial da organização — não inventar data,
 * horário, benefício, parceiro, atração ou regra que não esteja aqui.
 *
 * Campos marcados `// PENDENTE` dependem de definição. Enquanto `null`, a
 * interface simplesmente não exibe a informação.
 */

/** Slug da LP e da linha em `public.eventos` — os dois são o mesmo. */
export const EVENTO_SLUG = "edicao-especial-set-2026";
export const EVENTO_PATH = "/edicao-especial-set-2026";
export const SITE_URL = "https://sommaclub.com.br";

export const EVENTO_NOME = "SOMMA DAY";
export const EVENTO_EDICAO = "EDIÇÃO ESPECIAL SET";
export const EVENTO_TITULO = "SOMMA DAY — Edição Especial SET 2026";

/** O mote. Quando houver dúvida de copy, a resposta está nele. */
export const MOTE = "A CORRIDA É SÓ O COMEÇO.";
export const SUBMOTE = "CORRE CEDO. FICA ATÉ MAIS TARDE.";

/**
 * Paleta tirada do arquivo da logo (`public/somma-day/logo-somma-day.svg`),
 * pipetada dos próprios paths — site e impresso falam a mesma língua.
 * A logo oficial é usada como fornecida: não redesenhar, não reconstruir em
 * HTML, não trocar por fonte parecida.
 */
export const CORES = {
  creme: "#F7F4E9",
  vermelho: "#FA3606",
  marca: "#FF2C03",
  azul: "#0148F9",
  amarelo: "#F2B002",
  petroleo: "#3A86A6",
  tinta: "#101010",
} as const;

/* ─── Quando ──────────────────────────────────────────────────────────────── */
export const DATA_ISO = "2026-09-26";
export const DATA_CURTA = "26.09";
export const DATA_EXTENSO = "Sábado, 26 de setembro de 2026";
export const ABERTURA = "07h00";
export const LARGADA = "08h00";
export const ENCERRAMENTO = "13h00";

/* ─── Onde ────────────────────────────────────────────────────────────────── */
export const LOCAL = "Estacionamento 9";
export const LOCAL_COMPLETO = "Estacionamento 9 — Parque da Cidade";
export const CIDADE = "Brasília, DF";
/** Confirmado na Places API do Google: CEP 70655-775. */
export const GEO = { lat: -15.8062037, lng: -47.9127005 } as const;
export const ENDERECO_COMPLETO =
  "Estacionamento 9 - Parque da Cidade - Plano Piloto, Brasília - DF, 70655-775";
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${GEO.lat}%2C${GEO.lng}`;

/* ─── Formato ─────────────────────────────────────────────────────────────── */
export const GRATUITO = true;

/**
 * TETO OPERACIONAL — INTERNO. NUNCA vai para a tela.
 *
 * A comunicação pública diz "vagas limitadas" / "garanta sua pulseira". Dizer
 * o número transforma o limite em contagem regressiva pública e muda a
 * percepção do evento. O valor existe no banco, no painel e na trava de
 * inscrição — não na copy.
 */
export const CAPACIDADE_INTERNA = 1000;
export const ESCASSEZ_PUBLICA = "Vagas limitadas";

/* ─── Pelotões ────────────────────────────────────────────────────────────── */
/**
 * Percursos da experiência, não categorias competitivas. A pessoa escolhe na
 * inscrição. Os ids batem com `eventos.pelotoes` no banco.
 */
export const PELOTOES = ["5km", "6km", "8km"] as const;
export type Pelotao = (typeof PELOTOES)[number];

export const PELOTOES_ROTULO: Record<Pelotao, string> = {
  "5km": "5 KM",
  "6km": "6 KM",
  "8km": "8 KM",
};

/* ─── Cronograma oficial ──────────────────────────────────────────────────── */
export const CRONOGRAMA = [
  {
    hora: "07h00",
    titulo: "Abertura",
    texto: "Chegada, credenciamento, check-in e entrega das pulseiras. DJ desde a primeira pessoa.",
    cor: CORES.vermelho,
  },
  {
    hora: "07h30",
    titulo: "Concentração e aquecimento",
    texto: "Todo mundo junto, aquecimento e as orientações antes do corre.",
    cor: CORES.vermelho,
  },
  {
    hora: "08h00",
    titulo: "Largada",
    texto: "Saem os pelotões de 5 km, 6 km e 8 km. Na chegada: hidratação, recovery e DJ.",
    cor: CORES.azul,
  },
  {
    hora: "09h00",
    titulo: "Ativações",
    texto: "Parceiros, experiências, sorteios, fotos, recovery, Fit Dance Evolve e café da manhã.",
    cor: CORES.azul,
  },
  {
    hora: "10h00",
    titulo: "Avisos e falas",
    texto: "Rápido: agradecimentos, parceiros e sorteios.",
    cor: CORES.amarelo,
  },
  {
    hora: "10h30",
    titulo: "Pagode",
    texto: "A virada do dia. Pagode, chopp, comida e comunidade até o fim.",
    cor: CORES.amarelo,
  },
  {
    hora: "12h30",
    titulo: "Começa o encerramento",
    texto: "A última hora, sem pressa.",
    cor: CORES.petroleo,
  },
  {
    hora: "13h00",
    titulo: "Fim",
    texto: "Até a próxima edição.",
    cor: CORES.petroleo,
  },
] as const;

/* ─── A jornada, em seis palavras ─────────────────────────────────────────── */
export const JORNADA = [
  { titulo: "Corre", texto: "5, 6 ou 8 km. Você escolhe o pelotão na inscrição.", cor: CORES.vermelho },
  { titulo: "Recupera", texto: "Hidratação e recovery assim que cruza a chegada.", cor: CORES.azul },
  { titulo: "Come", texto: "Café da manhã, água, frutas e carreteiro.", cor: CORES.amarelo },
  { titulo: "Experimenta", texto: "Ativações dos parceiros, Fit Dance Evolve, sorteios e foto.", cor: CORES.petroleo },
  { titulo: "Fica", texto: "Mesa, cadeira e conversa. O evento não acaba na chegada.", cor: CORES.vermelho },
  { titulo: "Celebra", texto: "Pagode e chopp a partir das 10h30.", cor: CORES.azul },
] as const;

/**
 * O que a pulseira libera. Lista oficial — nada de prometer o que não está
 * confirmado (as marcas dos sorteios, por exemplo, ainda dependem de parceiro).
 */
export const BENEFICIOS = [
  "Café da manhã",
  "Água e frutas",
  "Carreteiro",
  "Chopp e bebidas",
  "Ativações dos parceiros",
  "Sorteios",
  "Fit Dance Evolve",
  "Recovery",
] as const;

/** Bebida alcoólica só na virada do dia, e com controle de maioridade. */
export const BEBIDA_HORA = "10h30";
export const IDADE_MINIMA_BEBIDA = 18;

/* ─── Letreiro ────────────────────────────────────────────────────────────── */
export const MARQUEE = [
  "A CORRIDA É SÓ O COMEÇO",
  "26.09",
  "TODO MUNDO CORRE, DEPOIS TODO MUNDO FICA",
  "GARANTA SUA PULSEIRA",
  "DO CORRE AO PAGODE",
] as const;

/* ─── Estado ──────────────────────────────────────────────────────────────── */
export type EventoStatus =
  | "em_breve"
  | "inscricoes_abertas"
  | "esgotado"
  | "inscricoes_encerradas"
  | "acontecendo"
  | "encerrado";

/**
 * Fallback para quando a linha do evento não existir no banco. Em produção
 * quem manda é `eventos.checkin_status` — a gestão abre e fecha sem deploy.
 */
export const STATUS: EventoStatus = "inscricoes_abertas";
