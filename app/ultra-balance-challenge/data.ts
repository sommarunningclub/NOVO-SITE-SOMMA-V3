/**
 * Conteúdo e tokens do Ultra Balance Challenge.
 *
 * Tudo que se repete na página mora aqui, então a página só compõe seções.
 * Os números dos mockups são fictícios e estão marcados como tal na interface.
 */

/* ── Paleta ────────────────────────────────────────────────────────────── */

/** Mesma paleta do deck /ppt-michelob, para as duas peças parecerem uma só. */
export const C = {
  bg: "#060B1C", // fundo base, igual ao deck
  bgAlt: "#080F26", // seção alternada
  navyDeep: "#111C4E",
  navy: "#283280", // azul da logo Michelob Ultra
  navySoft: "#1B2A6B",
  red: "#D22030", // vermelho Michelob Ultra
  orange: "#FF2C03", // laranja Somma, só em acentos
  green: "#2E9E7B", // pilar diversão
  gold: "#C6A664", // dourado de apoio, como no deck
  light: "#F4F5F8",
  ink: "#0E1226",
  inkSoft: "#5A6178",
} as const;

/* ── 1. Hero ───────────────────────────────────────────────────────────── */

export const HERO_STATS = [
  { label: "Movimento", value: "6 missões" },
  { label: "Conexão", value: "4 missões" },
  { label: "Diversão", value: "5 missões" },
] as const;

/* ── 2. Resumo executivo ───────────────────────────────────────────────── */

export const RESUMO_CARDS = [
  {
    icon: "CalendarDays",
    title: "21 dias de engajamento",
    text: "Três semanas de relacionamento contínuo com a comunidade, antes de qualquer custo de operação no dia do evento.",
  },
  {
    icon: "Target",
    title: "Missões gamificadas",
    text: "Movimento, conexão e diversão viram tarefas simples, com pontuação e progresso visível.",
  },
  {
    icon: "BarChart3",
    title: "Dados mensuráveis",
    text: "Cadastro, perfil, comportamento, presença e consentimento registrados em cada etapa.",
  },
  {
    icon: "Flag",
    title: "Conexão com o evento",
    text: "O progresso digital vira benefício concreto no Michelob Ultra Social Run.",
  },
] as const;

/* ── 3. Por que 21 dias ────────────────────────────────────────────────── */

export const PORQUE_BLOCOS = [
  {
    icon: "Sparkles",
    title: "Antes do evento",
    text: "Cria expectativa, cadastro e envolvimento.",
  },
  {
    icon: "Repeat",
    title: "Durante o desafio",
    text: "Estimula recorrência, conteúdo e participação.",
  },
  {
    icon: "Trophy",
    title: "No evento",
    text: "Transforma o progresso digital em benefícios presenciais.",
  },
] as const;

export const TIMELINE = [
  { dia: "Dia 1", title: "Cadastro e escolha do perfil", accent: "navy" },
  { dia: "Dia 7", title: "Primeira recompensa", accent: "navy" },
  { dia: "Dia 14", title: "Experiência especial desbloqueada", accent: "orange" },
  { dia: "Dia 21", title: "Acesso ao Michelob Ultra Social Run", accent: "red" },
] as const;

/** Curva ilustrativa de engajamento ao longo dos 21 dias. */
export const ENGAJAMENTO = [
  18, 26, 32, 38, 41, 47, 58, 54, 57, 62, 66, 69, 74, 82, 78, 81, 85, 88, 92, 96, 100,
];

/* ── 4. Jornada ────────────────────────────────────────────────────────── */

export const JORNADA = [
  { icon: "UserPlus", title: "Cadastro", text: "Dados básicos e aceites, direto no navegador." },
  { icon: "Compass", title: "Escolha do perfil", text: "Performance, comunidade, diversão ou equilíbrio." },
  { icon: "Users", title: "Entrada em uma crew", text: "O participante passa a competir junto com um grupo." },
  { icon: "ListChecks", title: "Cumprimento das missões", text: "Tarefas diárias e semanais nos três pilares." },
  { icon: "Gift", title: "Desbloqueio de recompensas", text: "Badges, sorteios e benefícios por faixa de progresso." },
  { icon: "Flag", title: "Experiência no Social Run", text: "O progresso vira acesso e personalização no evento." },
] as const;

/* ── 5. Cadastro e perfil ──────────────────────────────────────────────── */

export const CAMPOS_CADASTRO = [
  "Nome",
  "Telefone",
  "E-mail",
  "Data de nascimento",
  "Pace médio",
  "Objetivo com a corrida",
  "Aceite de comunicação",
  "Aceite de uso de imagem",
] as const;

export const PERFIS = [
  { title: "Performance", text: "Quero evoluir e superar meus resultados.", color: C.navy },
  { title: "Comunidade", text: "Corro para encontrar pessoas e pertencer.", color: C.orange },
  { title: "Diversão", text: "Quero movimento sem abrir mão de aproveitar.", color: C.green },
  { title: "Equilíbrio", text: "Busco conciliar esporte, rotina e vida social.", color: C.red },
] as const;

/* ── 6. Dashboard do participante ──────────────────────────────────────── */

export const DASHBOARD_LEGENDAS = [
  { title: "Progresso geral", text: "Quantos dos 21 dias já foram concluídos." },
  { title: "Sequência atual", text: "Dias seguidos com missão cumprida, o que sustenta a recorrência." },
  { title: "Pontuação total", text: "Soma de missões, check-ins e desafios especiais." },
  { title: "Crew e ranking", text: "Posição individual e dentro do grupo." },
  { title: "Missões disponíveis", text: "O que dá para fazer hoje, sem precisar procurar." },
  { title: "Próxima recompensa", text: "Quanto falta para o próximo desbloqueio." },
] as const;

/* ── 7. Missões ────────────────────────────────────────────────────────── */

export const PILARES = [
  {
    key: "movimento",
    title: "Movimento",
    icon: "Activity",
    color: C.navy,
    missoes: [
      "Realizar um treino",
      "Correr 3 km ou 5 km",
      "Participar de um treino Somma",
      "Completar três atividades na semana",
      "Realizar um treino de recuperação",
    ],
  },
  {
    key: "conexao",
    title: "Conexão",
    icon: "Users",
    color: C.orange,
    missoes: [
      "Correr com alguém novo",
      "Convidar um amigo",
      "Participar de um treino em grupo",
      "Registrar uma atividade com a crew",
      "Ajudar alguém a concluir um treino",
    ],
  },
  {
    key: "diversao",
    title: "Diversão",
    icon: "PartyPopper",
    color: C.green,
    missoes: [
      "Compartilhar seu ritual de equilíbrio",
      "Registrar um momento com amigos",
      "Responder a uma pergunta da campanha",
      "Criar um conteúdo sobre rotina e esporte",
      "Participar de uma missão surpresa",
    ],
  },
] as const;

/* ── 8. Validação ──────────────────────────────────────────────────────── */

export const VALIDACAO = [
  {
    metodo: "QR Code",
    como: "Escaneamento em treinos presenciais",
    aplicacao: "Treinos Somma e ativações",
    mvp: true,
  },
  {
    metodo: "Foto ou vídeo",
    como: "Upload de conteúdo pelo participante",
    aplicacao: "Missões sociais e de comunidade",
    mvp: true,
  },
  {
    metodo: "Código de convite",
    como: "Registro de indicação individual",
    aplicacao: "Convite de novos participantes",
    mvp: true,
  },
  {
    metodo: "Autodeclaração",
    como: "Botão para concluir missões simples",
    aplicacao: "Hábitos e atividades de baixo risco",
    mvp: true,
  },
  {
    metodo: "Strava ou Garmin",
    como: "Sincronização automática de atividades",
    aplicacao: "Evolução futura da plataforma",
    mvp: false,
  },
] as const;

export const FLUXO_VALIDACAO = [
  "Participante",
  "Missão",
  "Comprovação",
  "Validação",
  "Pontuação",
  "Ranking",
] as const;

/* ── 9. Pontuação ──────────────────────────────────────────────────────── */

export const PESOS = [
  { label: "Consistência", value: 40, color: C.navy },
  { label: "Missões concluídas", value: 30, color: C.red },
  { label: "Conexão com a comunidade", value: 20, color: C.orange },
  { label: "Desafios especiais", value: 10, color: C.green },
] as const;

export const PONTOS = [
  { atividade: "Treino concluído", pontos: 10 },
  { atividade: "Treino Somma com QR Code", pontos: 20 },
  { atividade: "Correr com alguém novo", pontos: 15 },
  { atividade: "Convidar novo participante", pontos: 20 },
  { atividade: "Completar todas as missões da semana", pontos: 30 },
  { atividade: "Concluir os 21 dias", pontos: 100 },
] as const;

/* ── 10. Rankings ──────────────────────────────────────────────────────── */

export const RANKING_TIPOS = [
  { icon: "Trophy", title: "Ranking individual", text: "Maior pontuação total." },
  { icon: "Users", title: "Ranking por crew", text: "Resultado acumulado da equipe." },
  { icon: "CalendarCheck", title: "Ranking de consistência", text: "Maior regularidade ao longo dos 21 dias." },
  { icon: "HeartHandshake", title: "Ranking de conexão", text: "Maior participação em missões sociais." },
] as const;

export const RANKING_LINHAS = [
  { pos: 1, nome: "Marina", crew: "Equilíbrio Crew", pontos: "1.260" },
  { pos: 2, nome: "Pedro", crew: "Performance Crew", pontos: "1.210" },
  { pos: 3, nome: "Luiza", crew: "Social Crew", pontos: "1.180" },
  { pos: 4, nome: "Rafael", crew: "Enjoy Crew", pontos: "1.140" },
  { pos: 5, nome: "Camila", crew: "Social Crew", pontos: "1.090" },
] as const;

/* ── 11. Recompensas ───────────────────────────────────────────────────── */

export const RECOMPENSAS = [
  {
    marco: "7 dias",
    title: "Badge digital e card compartilhável",
    text: "O primeiro sinal público de participação, feito para circular nas redes.",
    color: C.navy,
  },
  {
    marco: "14 dias",
    title: "Participação em sorteios e experiência especial",
    text: "Quem chega na metade entra na disputa por benefícios da marca.",
    color: C.orange,
  },
  {
    marco: "21 dias",
    title: "Acesso prioritário, área exclusiva e produto personalizado",
    text: "A conclusão vira vantagem concreta no dia do Social Run.",
    color: C.red,
  },
  {
    marco: "Missões especiais",
    title: "Benefícios surpresa e experiências da marca",
    text: "Ativações pontuais ao longo dos 21 dias, para quebrar a rotina do desafio.",
    color: C.green,
  },
] as const;

export const BADGES = [
  { name: "Starter", desc: "Primeira missão concluída", color: C.navy },
  { name: "Connected", desc: "Cinco missões de conexão", color: C.orange },
  { name: "Balanced", desc: "Os três pilares na mesma semana", color: C.green },
  { name: "21 Days Finisher", desc: "Desafio completo", color: C.red },
] as const;

/* ── 12. Máquina de fotos ──────────────────────────────────────────────── */

export const FLUXO_MAQUINA = [
  { icon: "CheckCircle2", title: "Participante conclui o desafio" },
  { icon: "QrCode", title: "Recebe um QR Code pessoal" },
  { icon: "ScanLine", title: "Escaneia o código na máquina" },
  { icon: "UserCheck", title: "Sistema reconhece seu perfil" },
  { icon: "Camera", title: "Foto personalizada é gerada" },
  { icon: "Share2", title: "Card é enviado para compartilhamento" },
] as const;

export const CARD_SAIDA_CAMPOS = [
  "Nome",
  "Crew",
  "Perfil",
  "Pontuação",
  "Dias concluídos",
  "Conquista desbloqueada",
  "Meu pace na corrida",
  "Meu pace na vida",
] as const;

/* ── 13. Painel da marca ───────────────────────────────────────────────── */

export const PAINEL_KPIS = [
  { label: "Participantes cadastrados", value: "1.240" },
  { label: "Maiores de 18 anos", value: "1.240" },
  { label: "Usuários ativos", value: "968" },
  { label: "Taxa de conclusão", value: "54%" },
  { label: "Missões concluídas", value: "9.412" },
  { label: "Check-ins presenciais", value: "1.836" },
  { label: "Fotos enviadas", value: "2.107" },
  { label: "Indicações", value: "389" },
  { label: "Conteúdos autorizados", value: "1.642" },
] as const;

export const FUNIL = [
  { label: "Cadastros", value: 1240 },
  { label: "Participantes ativos", value: 968 },
  { label: "Chegaram a 7 dias", value: 812 },
  { label: "Chegaram a 14 dias", value: 705 },
  { label: "Concluíram 21 dias", value: 670 },
  { label: "Presentes no evento", value: 583 },
] as const;

export const ENGAJAMENTO_PILAR = [
  { label: "Movimento", value: 46, color: C.navy },
  { label: "Conexão", value: 31, color: C.orange },
  { label: "Diversão", value: 23, color: C.green },
] as const;

/* ── 14. O que a marca recebe ──────────────────────────────────────────── */

export const MARCA_RECEBE = [
  { icon: "Flame", title: "Engajamento", text: "Relacionamento com a comunidade durante 21 dias." },
  { icon: "Database", title: "Dados", text: "Cadastro, perfil, comportamento e presença." },
  { icon: "Camera", title: "Conteúdo", text: "Fotos, vídeos, cards e histórias compartilháveis." },
  { icon: "Sparkles", title: "Experiência", text: "Conexão entre plataforma digital e evento presencial." },
  { icon: "LineChart", title: "Mensuração", text: "Relatório final com indicadores de campanha." },
] as const;

/* ── 15. Arquitetura ───────────────────────────────────────────────────── */

export const STACK = [
  { camada: "Interface", tech: "Next.js", funcao: "Página e painel do participante" },
  { camada: "Hospedagem", tech: "Vercel", funcao: "Publicação e performance" },
  { camada: "Banco de dados", tech: "Supabase", funcao: "Participantes, missões e pontuação" },
  { camada: "Autenticação", tech: "Supabase Auth", funcao: "Acesso seguro" },
  { camada: "Arquivos", tech: "Supabase Storage", funcao: "Fotos e vídeos" },
  { camada: "E-mail", tech: "Resend", funcao: "Confirmações e lembretes" },
  { camada: "Comunicação", tech: "WhatsApp", funcao: "Ativações estratégicas" },
  { camada: "Relatórios", tech: "Dashboard próprio", funcao: "Indicadores e exportações" },
] as const;

/* ── 16. Modelo de dados ───────────────────────────────────────────────── */

export const ENTIDADES = [
  { name: "Participantes", liga: "Perfis, crews, pontuação" },
  { name: "Perfis", liga: "Personaliza missões" },
  { name: "Crews", liga: "Agrupa participantes" },
  { name: "Missões", liga: "Geram conclusões" },
  { name: "Conclusões", liga: "Alimentam a pontuação" },
  { name: "Check-ins", liga: "Presença por QR Code" },
  { name: "Uploads", liga: "Fotos e vídeos enviados" },
  { name: "Pontuação", liga: "Base dos rankings" },
  { name: "Recompensas", liga: "Desbloqueio por faixa" },
  { name: "Indicações", liga: "Convites entre participantes" },
  { name: "Consentimentos", liga: "Comunicação e uso de imagem" },
] as const;

/* ── 17. MVP ───────────────────────────────────────────────────────────── */

export const MVP = [
  "Cadastro",
  "Escolha do perfil",
  "Dashboard",
  "Missões",
  "Upload de foto",
  "Check-in por QR Code",
  "Ranking individual",
  "Ranking por crew",
  "Pontuação",
  "Recompensas",
  "Painel administrativo",
  "Cards compartilháveis",
  "Integração com máquina de fotos",
  "Relatório final",
] as const;

export const FUTURO = [
  "Integração com Garmin",
  "Integração com Strava",
  "Push notifications",
  "Aplicativo nativo",
  "Desafios recorrentes",
  "Programa de fidelidade",
  "Inteligência de personalização",
] as const;

/* ── 18. Indicadores ───────────────────────────────────────────────────── */

export const INDICADORES = [
  { categoria: "Aquisição", itens: ["Cadastros", "Novos leads", "Convites realizados"] },
  {
    categoria: "Engajamento",
    itens: ["Usuários ativos", "Missões concluídas", "Sequência média", "Conteúdos enviados"],
  },
  {
    categoria: "Conversão",
    itens: ["Participantes que concluíram 21 dias", "Participantes presentes no evento", "Recompensas resgatadas"],
  },
  {
    categoria: "Marca",
    itens: ["Alcance", "Marcações", "UGC", "Lembrança de marca", "Intenção de compra", "Associação com vida ativa"],
  },
  {
    categoria: "Eficiência",
    itens: [
      "Custo por cadastro",
      "Custo por participante ativo",
      "Custo por conclusão",
      "Custo por participante presente",
    ],
  },
] as const;

/* ── 19. Resumo final ──────────────────────────────────────────────────── */

export const NUMEROS_FINAIS = [
  { value: "21", label: "dias" },
  { value: "3", label: "pilares" },
  { value: "1", label: "comunidade" },
  { value: "1", label: "experiência final" },
] as const;
