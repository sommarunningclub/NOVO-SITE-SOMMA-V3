import type { IconName } from "./_icons";

/* ══════════════════════════════════════════════════════════════════════════
   Conteúdo da proposta Somma Club × Silver Care.

   Números do Somma vêm do mídia kit 2026 (mesma fonte do /ppt-midiakit).
   Nada de estatística inventada: o que não é medido entra como projeção ou
   simplesmente não entra.
   ══════════════════════════════════════════════════════════════════════════ */

export const FOTOS = {
  capa: "/midiakit/ativacao.jpg",
  pelotao: "/midiakit/p1.jpg",
  sol: "/midiakit/eixao.jpg",
  comunidade: "/midiakit/comunidade.jpg",
  wellness: "/midiakit/wellness.jpg",
  ativacao: "/midiakit/specialday.jpg",
  crowd: "/midiakit/crowd.jpg",
  conteudo: "/midiakit/p2.jpg",
  bandeira: "/midiakit/p3.jpg",
  treino: "/midiakit/treino.jpg",
  espacos: "/midiakit/espacos.jpg",
  eixao2: "/midiakit/eixao2.jpg",
  eixao3: "/midiakit/eixao3.jpg",
  grupo: "/somma/EXQTSMM-284.jpg",
  grupo2: "/somma/IMG_0888_JPG.jpg",
  estrada: "/somma/SMSPD-372.jpg",
  hero: "/somma/hero-background.jpg",
  jan: "/somma/PDCSK217JAN-2433.jpg",
  fev: "/somma/PDCSK21FEV-1794.jpg",
} as const;

/* ── 02 · Insight ──────────────────────────────────────────────────────── */

export const EQUIPAMENTOS = ["Tênis", "Relógio", "Pace", "Hidratação", "Meia", "Playlist"] as const;

/* ── 03 · Território ───────────────────────────────────────────────────── */

export const TERRITORIO = [
  { palavra: "Corrida", foto: FOTOS.pelotao, texto: "O ritual que já existe." },
  { palavra: "Sol", foto: FOTOS.sol, texto: "7h da manhã, o ano inteiro." },
  { palavra: "Wellness", foto: FOTOS.wellness, texto: "Cuidar virou parte do treino." },
  { palavra: "Comunidade", foto: FOTOS.comunidade, texto: "Onde o hábito pega." },
] as const;

/* ── 04 · Por que Somma ────────────────────────────────────────────────── */

export const PROVAS = [
  { valor: "6.000+", label: "membros na comunidade", nota: "e crescendo" },
  { valor: "300+", label: "pessoas todo sábado", nota: "média por encontro" },
  { valor: "13,8 mil", label: "seguidores no Instagram", nota: "@somma.club" },
  { valor: "430 mil", label: "visualizações", nota: "últimos 90 dias" },
] as const;

export const PORQUE = [
  {
    n: "01",
    icon: "sol" as IconName,
    titulo: "Sol de Brasília",
    texto:
      "Céu aberto, altitude e treino ao ar livre o ano inteiro. Exposição solar aqui não é sazonal — é rotina.",
  },
  {
    n: "02",
    icon: "relogio" as IconName,
    titulo: "Frequência real",
    texto:
      "Todo sábado, 7h, mesmo ponto. A marca não aparece uma vez: entra num hábito que já se repete.",
  },
  {
    n: "03",
    icon: "comunidade" as IconName,
    titulo: "Confiança da tropa",
    texto:
      "O que circula no Somma vem de gente real correndo junto. É recomendação, não anúncio.",
  },
] as const;

/* ── 05 · Oportunidade ─────────────────────────────────────────────────── */

export const OPORTUNIDADE = [
  {
    titulo: "O gesto já existe",
    texto: "Passar protetor antes de sair é um hábito de quem treina cedo. Falta a marca dele.",
  },
  {
    titulo: "A categoria está vaga",
    texto: "Ninguém ocupou o lugar de cuidado e proteção dentro do running brasileiro.",
  },
  {
    titulo: "O formato certo",
    texto: "Stick é o único formato que cabe no bolso, no cinto e na reaplicação em movimento.",
  },
] as const;

/* ── 06 · Antes, durante e depois ──────────────────────────────────────── */

export const ROTINA = [
  {
    n: "01",
    fase: "Antes",
    icon: "sol" as IconName,
    titulo: "Proteção e preparação",
    detalhe: "O ritual começa antes da largada.",
    itens: ["Aplicação no rosto, orelha e nuca", "Ponto de proteção na concentração", "Lembrete no check-in"],
  },
  {
    n: "02",
    fase: "Durante",
    icon: "corrida" as IconName,
    titulo: "Praticidade e reaplicação",
    detalhe: "Sem escorrer, sem sujar a mão, sem parar o treino.",
    itens: ["Stick no bolso ou no cinto", "Reaplicação em 10 segundos", "Apoio nos pontos de hidratação"],
  },
  {
    n: "03",
    fase: "Depois",
    icon: "gota" as IconName,
    titulo: "Limpeza, hidratação e recuperação",
    detalhe: "O pós-treino é onde o cuidado vira hábito.",
    itens: ["Limpeza facial no after", "Hidratação e recuperação da pele", "Conteúdo educativo com a comunidade"],
  },
] as const;

/* ── 07 · Produto herói ────────────────────────────────────────────────── */

export const HEROI = [
  { icon: "raio" as IconName, titulo: "10 segundos", texto: "O tempo de aplicar sem quebrar o ritmo." },
  { icon: "gota" as IconName, titulo: "Não escorre", texto: "Não desce para o olho no suor do quilômetro 8." },
  { icon: "necessaire" as IconName, titulo: "Cabe em tudo", texto: "Bolso do short, cinto, bolsa, bolso do carro." },
  { icon: "pele" as IconName, titulo: "Mão limpa", texto: "Aplica e volta a correr sem lavar a mão." },
] as const;

/* ── 08 · Running Edition ──────────────────────────────────────────────── */

export const RUNNING_EDITION = [
  "Embalagem Somma × Silver Care",
  "Sticker da campanha na tampa",
  "QR Code que leva ao passaporte digital",
  "Mensagem da campanha impressa",
  "Edição limitada, numerada",
  "Peça central do Kit Runner",
] as const;

/* ── 09/10 · Marco zero ────────────────────────────────────────────────── */

export const DIA16_BLOCOS = [
  { rotulo: "Data", valor: "Dia 16" },
  { rotulo: "Local", valor: "Morro da Asa Delta" },
  { rotulo: "Cidade", valor: "Brasília · DF" },
  { rotulo: "Formato", valor: "Corre do Somma" },
] as const;

export const DIA16 = [
  {
    n: "01",
    fase: "Antes da corrida",
    icon: "tenda" as IconName,
    titulo: "Ponto de Proteção",
    itens: [
      "Experimentação do stick",
      "Aplicação assistida antes da largada",
      "Distribuição de samples",
      "QR Code de entrada na campanha",
      "Pergunta rápida sobre proteção solar",
    ],
  },
  {
    n: "02",
    fase: "Durante",
    icon: "corrida" as IconName,
    titulo: "Produto em uso real",
    itens: [
      "Marca presente na experiência",
      "Conteúdo com corredores no percurso",
      "Registro de uso real, não posado",
    ],
  },
  {
    n: "03",
    fase: "Depois",
    icon: "chat" as IconName,
    titulo: "Volta e recompensa",
    itens: [
      "Feedback dos participantes",
      "Conteúdo espontâneo da comunidade",
      "Cupom exclusivo Silver Care",
      "Entrada no desafio digital",
    ],
  },
] as const;

/* ── 11 · Jornada da campanha ──────────────────────────────────────────── */

export const JORNADA = [
  {
    n: "01",
    etapa: "Aquecimento",
    icon: "celular" as IconName,
    quando: "Digital",
    texto: "Conteúdo e educação antes de qualquer ativação.",
    itens: ["Problema real do corredor", "Por que stick", "Teasers da parceria"],
  },
  {
    n: "02",
    etapa: "Experimentação",
    icon: "tenda" as IconName,
    quando: "Dia 16 · Asa Delta",
    texto: "O primeiro contato físico com o produto.",
    itens: ["Aplicação e sampling", "Conteúdo no local", "QR de entrada na campanha"],
  },
  {
    n: "03",
    etapa: "Comunidade",
    icon: "medalha" as IconName,
    quando: "Mês inteiro",
    texto: "O desafio digital que mantém a marca viva entre os eventos.",
    itens: ["Missões semanais", "Pontos e ranking", "Conteúdo da tropa"],
  },
  {
    n: "04",
    etapa: "Somma Day",
    icon: "sol" as IconName,
    quando: "Último sábado",
    texto: "O grande fechamento mensal — a única ativação presencial oficial.",
    itens: ["Ativação premium", "Premiação do desafio", "Kits e experiência de marca"],
  },
] as const;

/* ── 12/13 · Somma Protegido ───────────────────────────────────────────── */

export const MISSOES = [
  { nome: "Check-in no Somma", pontos: "+20", tipo: "Presença" },
  { nome: "Missão Silver da semana", pontos: "+15", tipo: "Digital" },
  { nome: "Experimentou o produto", pontos: "+15", tipo: "Ativação" },
  { nome: "Postou a experiência", pontos: "+20", tipo: "Conteúdo" },
  { nome: "Levou um amigo", pontos: "+20", tipo: "Comunidade" },
  { nome: "Presença no Somma Day", pontos: "+30", tipo: "Evento" },
] as const;

export const PREMIA = [
  { titulo: "Frequência", texto: "Quem aparece toda semana." },
  { titulo: "Participação", texto: "Quem entra nas missões." },
  { titulo: "Consistência", texto: "Quem mantém o hábito." },
  { titulo: "Comunidade", texto: "Quem traz gente junto." },
] as const;

/* ── 14 · Tecnologia ───────────────────────────────────────────────────── */

export const TECH = [
  { icon: "checkin" as IconName, nome: "Check-in personalizado", texto: "A pergunta da marca dentro do ritual de sábado." },
  { icon: "medalha" as IconName, nome: "Passaporte digital", texto: "Cada pessoa com sua cartela de missões." },
  { icon: "ranking" as IconName, nome: "Ranking e pontuação", texto: "Participação, não pace." },
  { icon: "qr" as IconName, nome: "QR Codes rastreáveis", texto: "Em totens, samples, kits e conteúdo." },
  { icon: "cupom" as IconName, nome: "Cupons rastreáveis", texto: "Do sábado até o carrinho." },
  { icon: "site" as IconName, nome: "Landing page da campanha", texto: "Casa digital da parceria." },
  { icon: "raio" as IconName, nome: "Quiz e roleta", texto: "Mecânicas rápidas de ativação." },
  { icon: "dados" as IconName, nome: "Dashboard de resultados", texto: "Relatório mensal com o que aconteceu." },
] as const;

/* ── 15 · Comunidade ───────────────────────────────────────────────────── */

export const COMUNIDADE = [
  { icon: "chat" as IconName, titulo: "Grupos de WhatsApp", texto: "Onde o sábado é combinado — e onde a missão da semana aparece." },
  { icon: "comunidade" as IconName, titulo: "Pace leaders e tropa", texto: "Quem puxa o pelotão puxa o hábito. Eles usam primeiro." },
  { icon: "camera" as IconName, titulo: "Conteúdo da própria tropa", texto: "A comunidade produz mais imagem do que qualquer produção." },
  { icon: "presente" as IconName, titulo: "Recompensa que circula", texto: "Kit, cupom e edição limitada como moeda de participação." },
] as const;

/* ── 16 · Somma Day ────────────────────────────────────────────────────── */

export const SOMMA_DAY = [
  "Ativação Silver Care em formato premium",
  "Sampling e experimentação assistida",
  "QR Codes e desafios do mês",
  "Ranking e premiação do Somma Protegido",
  "Kits e conteúdo com a comunidade",
  "Experiência de marca no ponto de encontro",
] as const;

/* ── 17 · Kit Runner ───────────────────────────────────────────────────── */

export const KIT = [
  { icon: "stick" as IconName, nome: "Silver Sun Stick", nota: "O herói do kit" },
  { icon: "limpeza" as IconName, nome: "Limpeza facial", nota: "Para o pós-treino" },
  { icon: "gota" as IconName, nome: "Hidratação", nota: "Recuperação da pele" },
  { icon: "sticker" as IconName, nome: "Sticker da campanha", nota: "Vai parar na garrafa" },
  { icon: "qr" as IconName, nome: "Card com QR", nota: "Entrada no passaporte" },
] as const;

/* ── 18 · Stickers e mote ──────────────────────────────────────────────── */

export const FRASES = [
  "Bota a cara no sol",
  "No corre, vai de stick",
  "Corre no sol",
  "Proteção também é treino",
  "Use protetor, bro",
  "Quem vive lá fora, se cuida",
] as const;

export const MOTES = [
  { frase: "Viver lá fora faz bem. Se proteger também.", uso: "Assinatura institucional da parceria", destaque: true },
  { frase: "Quem vive lá fora, se cuida.", uso: "Territorial, para campanha de marca", destaque: false },
  { frase: "No corre, vai de stick.", uso: "Assinatura de produto e sampling", destaque: false },
  { frase: "Corre no sol.", uso: "Nome do desafio digital", destaque: false },
] as const;

/* ── 19 · Conteúdo ─────────────────────────────────────────────────────── */

export const CONTEUDO = [
  { foto: FOTOS.eixao3, selo: "Reels", legenda: "O que você passa antes de sair?" },
  { foto: FOTOS.conteudo, selo: "Stories", legenda: "Missão da semana" },
  { foto: FOTOS.wellness, selo: "Carrossel", legenda: "Pele de quem treina no sol" },
  { foto: FOTOS.ativacao, selo: "Ativação", legenda: "Ponto de proteção" },
] as const;

/* ── 20 · Ecossistema de mídia ─────────────────────────────────────────── */

export const CANAIS = [
  { icon: "instagram" as IconName, nome: "Instagram", detalhe: "13,8 mil seguidores · 430 mil visualizações em 90 dias" },
  { icon: "chat" as IconName, nome: "WhatsApp", detalhe: "Grupos ativos da comunidade" },
  { icon: "email" as IconName, nome: "E-mail", detalhe: "Comunicações gerenciadas pelo Somma" },
  { icon: "site" as IconName, nome: "Site", detalhe: "sommaclub.com.br" },
  { icon: "checkin" as IconName, nome: "Check-in", detalhe: "Ritual semanal, presencial e digital" },
  { icon: "tenda" as IconName, nome: "Eventos", detalhe: "Sábados, Somma Day e corres especiais" },
] as const;

export const LGPD =
  "Acesso aos canais de relacionamento com a comunidade Somma através de comunicações gerenciadas pelo Somma. Dados pessoais somente poderão ser compartilhados mediante consentimento específico do usuário.";

/* ── 21 · Planos ───────────────────────────────────────────────────────── */

export const PLANOS = [
  {
    n: "01",
    nome: "Apoiadora Somma",
    preco: "R$ 5.000",
    periodo: "por mês",
    resumo: "A marca entra na rotina e no conteúdo do clube.",
    recomendado: false,
    itens: [
      "1 ativação por mês no Somma Day",
      "Distribuição de produtos",
      "4 stories por mês",
      "1 reels por mês",
      "Divulgação nos grupos",
      "Cupom exclusivo",
      "Presença nos conteúdos da ativação",
    ],
  },
  {
    n: "02",
    nome: "Parceira de Cuidado",
    preco: "R$ 10.000",
    periodo: "por mês",
    resumo: "Tudo do plano 01, mais presença digital e tecnologia.",
    recomendado: false,
    itens: [
      "Presença no site do Somma",
      "Presença no sistema de check-in",
      "Check-in personalizado pela marca",
      "Mais inserções nos canais da comunidade",
      "Desafios digitais",
      "Sampling segmentado",
      "Conteúdo educacional",
      "Até 1 disparo de e-mail mensal",
      "Relatório ampliado",
    ],
  },
  {
    n: "03",
    nome: "Marca Oficial de Cuidado e Proteção",
    preco: "R$ 15.000",
    periodo: "por mês",
    resumo: "Tudo dos planos anteriores, mais propriedade de marca dentro do Somma.",
    recomendado: true,
    itens: [
      "2 reels por mês e stories semanais",
      "Comunicação recorrente nos grupos",
      "Até 2 e-mails mensais",
      "Campanhas digitais e proprietárias",
      "Passaporte digital, ranking e missões",
      "Captação autorizada de leads",
      "Ativação premium no Somma Day",
      "Exclusividade de categoria na vigência",
      "Relatório completo e inteligência de dados",
    ],
  },
] as const;

/* ── 22 · Comparativo ──────────────────────────────────────────────────── */

export const COMPARATIVO = [
  { item: "Ativação presencial no Somma Day", p1: "1 por mês", p2: "1 por mês", p3: "Premium" },
  { item: "Distribuição de produtos", p1: "•", p2: "Segmentada", p3: "Segmentada" },
  { item: "Stories", p1: "4 por mês", p2: "6 por mês", p3: "Semanais" },
  { item: "Reels", p1: "1 por mês", p2: "1 por mês", p3: "2 por mês" },
  { item: "Divulgação nos grupos", p1: "•", p2: "Ampliada", p3: "Recorrente" },
  { item: "Cupom exclusivo", p1: "•", p2: "•", p3: "•" },
  { item: "Presença no site e no check-in", p1: "—", p2: "•", p3: "•" },
  { item: "Check-in personalizado e conteúdo educacional", p1: "—", p2: "•", p3: "•" },
  { item: "E-mail mensal", p1: "—", p2: "Até 1", p3: "Até 2" },
  { item: "Desafios digitais", p1: "—", p2: "•", p3: "•" },
  { item: "Passaporte, ranking e missões", p1: "—", p2: "—", p3: "•" },
  { item: "Campanhas proprietárias e captação autorizada de leads", p1: "—", p2: "—", p3: "•" },
  { item: "Exclusividade de categoria", p1: "—", p2: "—", p3: "•" },
  { item: "Relatório", p1: "Básico", p2: "Ampliado", p3: "Completo" },
] as const;

/* ── 23 · Ativações avulsas ────────────────────────────────────────────── */

export const AVULSAS = [
  { icon: "tenda" as IconName, nome: "Ativação especial", texto: "Fora do calendário mensal, em data escolhida pela marca." },
  { icon: "presente" as IconName, nome: "Lançamento de produto", texto: "Estreia de um produto dentro da comunidade." },
  { icon: "raio" as IconName, nome: "Campanha proprietária", texto: "Conceito, nome e mecânica próprios da Silver Care." },
  { icon: "site" as IconName, nome: "Landing page", texto: "Página dedicada com captação e regulamento." },
  { icon: "medalha" as IconName, nome: "Desafio digital", texto: "Temporada extra do Corre no Sol." },
  { icon: "camera" as IconName, nome: "Produção audiovisual", texto: "Filme, fotografia e banco de imagens da marca." },
  { icon: "comunidade" as IconName, nome: "Projeto com creators", texto: "Curadoria de corredores da comunidade." },
  { icon: "lupa" as IconName, nome: "Pesquisa com a comunidade", texto: "Teste de produto e leitura de hábito." },
  { icon: "sticker" as IconName, nome: "Naming de edição especial", texto: "Batizar a Running Edition junto com a tropa." },
] as const;

/* ── 24 · Mensuração ───────────────────────────────────────────────────── */

export const METRICAS = [
  { grupo: "Presença", itens: ["Pessoas impactadas", "Participantes por ativação", "Check-ins no período"] },
  { grupo: "Produto", itens: ["Samples distribuídos", "Experimentações registradas", "Feedback de uso"] },
  { grupo: "Digital", itens: ["QR Codes escaneados", "Interações nas missões", "Retenção no desafio", "Alcance e visualizações"] },
  { grupo: "Negócio", itens: ["Cupons utilizados", "Vendas atribuídas", "Leads autorizados", "Conteúdo gerado"] },
] as const;

/* ── 25 · Horizonte ────────────────────────────────────────────────────── */

export const HORIZONTE = [
  {
    n: "01",
    fase: "Agora",
    titulo: "Apoiadora",
    texto: "A marca entra no sábado e no conteúdo do clube.",
  },
  {
    n: "02",
    fase: "3 a 6 meses",
    titulo: "Marca de cuidado",
    texto: "Proteção vira parte do ritual: check-in, missões, passaporte e Somma Day.",
  },
  {
    n: "03",
    fase: "6 a 12 meses",
    titulo: "Propriedade de marca",
    texto: "Running Edition, Kit Runner e uma campanha que a comunidade reconhece como dela.",
  },
] as const;
