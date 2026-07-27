/**
 * Conteúdo do capítulo novo do deck: a plataforma das Crews.
 *
 * Tudo que se repete vira array tipado aqui, então os slides só compõem. Dados
 * de contadores e vagas são ilustrativos e estão marcados como tal na interface.
 * Nenhum nome real de líder é usado; a divisão de responsabilidades e o fee
 * seguem o capítulo financeiro e não são alterados.
 */

/* ── Mensagens ─────────────────────────────────────────────────────────── */

export const MENSAGEM_CENTRAL =
  "A campanha não é só um desafio de 21 dias nem só um evento final. É uma plataforma gamificada de comunidade: as Crews competem, se organizam, geram conteúdo, indicam novos participantes, cumprem desafios e encerram a jornada num grande sábado de experiência Michelob Ultra.";

export const FRASE_IMPACTO =
  "A Michelob não patrocina apenas um treino. Ela funda uma temporada de competição, conteúdo e comunidade.";

export const MENSAGEM_FINAL =
  "O Michelob Ultra Social Run transforma o ritual semanal do Somma em uma temporada de comunidade, competição e conteúdo. Durante 21 dias, as Crews se organizam, competem, indicam, produzem e acumulam pontos. No sábado final, a campanha sai do digital e vira uma grande experiência presencial de corrida, música e celebração.";

/* ── 1 · A plataforma das Crews ────────────────────────────────────────── */

export type Crew = {
  id: string;
  nome: string;
  estilo: string;
  cor: string;
  preenchidas: number;
  total: number;
};

/** Cores do sistema do deck (navy, vermelho, laranja Somma, dourado). */
export const CREWS: readonly Crew[] = [
  { id: "c1", nome: "Crew 01", estilo: "Ritmo forte e disputa", cor: "#283280", preenchidas: 87, total: 100 },
  { id: "c2", nome: "Crew 02", estilo: "Leve, social e cheia de gente", cor: "#FF2C03", preenchidas: 100, total: 100 },
  { id: "c3", nome: "Crew 03", estilo: "Primeira corrida, sem pressão", cor: "#2E9E7B", preenchidas: 42, total: 100 },
  { id: "c4", nome: "Crew 04", estilo: "Constância e comunidade", cor: "#C6A664", preenchidas: 63, total: 100 },
] as const;

export const CREW_COMO_FUNCIONA = [
  { elemento: "Líderes", como: "Cada Crew tem dois líderes responsáveis pela mobilização.", porque: "Cria identificação e pertencimento." },
  { elemento: "Grupo de WhatsApp", como: "Cada Crew tem um grupo oficial.", porque: "Facilita comunicação e organização." },
  { elemento: "Capacidade limitada", como: "O sistema mostra as vagas disponíveis por Crew.", porque: "Gera escassez e controle operacional." },
  { elemento: "Desafios coletivos", como: "A Crew se organiza para cumprir as missões.", porque: "Cria comunidade real." },
  { elemento: "Ranking", como: "Pontos individuais somam para a Crew.", porque: "Transforma participação em competição." },
  { elemento: "Conteúdo", como: "Fotos, vídeos e publicações contam pontos.", porque: "Gera mídia orgânica." },
  { elemento: "Líder operacional", como: "Ajuda a puxar a Crew durante os 21 dias.", porque: "Evita dependência total do Somma." },
] as const;

/* ── 2 · Desafios semanais ─────────────────────────────────────────────── */

export const DESAFIO_EXEMPLO = {
  titulo: "Desafio coletivo da semana",
  meta: "Reunir no mínimo 20 integrantes da Crew para um treino coletivo.",
  regras: [
    "Quórum mínimo de 20 pessoas",
    "Registro por foto oficial",
    "Check-in via QR Code",
    "Validação pelo líder",
    "Bônus de pontos se a Crew levar convidados",
  ],
} as const;

export const DESAFIOS_TIPOS = [
  { tipo: "Treino coletivo", exemplo: "20 integrantes correndo juntos", validacao: "Foto + QR Code", pontuacao: "Pontos para todos" },
  { tipo: "Indicação", exemplo: "Convidar novos participantes", validacao: "Cadastro validado", pontuacao: "Pontos para quem indicou e para a Crew" },
  { tipo: "Conteúdo", exemplo: "Publicar foto ou vídeo marcando a campanha", validacao: "Link ou upload", pontuacao: "Pontos por conteúdo aprovado" },
  { tipo: "Perfect Pace", exemplo: "Correr próximo do pace informado", validacao: "Print de app ou registro", pontuacao: "Pontos por precisão" },
  { tipo: "Caça QR Code", exemplo: "Encontrar QR Codes no percurso", validacao: "Leitura via sistema", pontuacao: "Pontos por check-in" },
  { tipo: "Revezamento", exemplo: "Montar time para desafio entre Crews", validacao: "Check-in da equipe", pontuacao: "Pontos por colocação" },
  { tipo: "Missão surpresa", exemplo: "Desafio liberado sem aviso prévio", validacao: "Conforme regra da missão", pontuacao: "Pontuação especial" },
] as const;

/* ── 3 · Validação ─────────────────────────────────────────────────────── */

export const VALIDACAO_METODOS = [
  { metodo: "QR Code", quando: "Treinos presenciais e encontros oficiais", como: "Leitura pelo participante ou líder", mvp: true },
  { metodo: "Foto coletiva", quando: "Desafios de grupo", como: "Upload com validação do Somma", mvp: true },
  { metodo: "Print de app de corrida", quando: "Desafios de distância, pace ou tempo", como: "Upload do comprovante", mvp: true },
  { metodo: "Vídeo curto", quando: "Desafios especiais e conteúdo", como: "Upload ou link", mvp: true },
  { metodo: "Código de indicação", quando: "Entrada de novos participantes", como: "Cadastro com código da Crew", mvp: true },
  { metodo: "Validação do líder", quando: "Missões coletivas", como: "Líder confirma os participantes", mvp: true },
  { metodo: "Check-in oficial Somma", quando: "Sábados e Somma Day", como: "O sistema registra a presença", mvp: true },
] as const;

export const VALIDACAO_NOTA =
  "O MVP não precisa de integração automática com apps externos. A primeira versão opera com QR Code, upload de comprovantes, check-in dos líderes e validação interna.";

/* ── 4 · Regras de entrada, vagas e transferência ──────────────────────── */

export const REGRAS = [
  { regra: "Entrada no desafio", como: "Participantes entram enquanto houver vagas nas Crews." },
  { regra: "Capacidade da Crew", como: "Cada Crew tem limite configurável de participantes." },
  { regra: "Crew lotada", como: "Ao atingir o limite, o participante escolhe outra Crew." },
  { regra: "Entrada após o início", como: "Permitida só em janela definida, se ainda houver vagas." },
  { regra: "Transferência", como: "O participante pode transferir sua vaga a outra pessoa até a data limite." },
  { regra: "O que é transferido", como: "Pulseira, benefícios, pontos, histórico e posição da inscrição." },
  { regra: "O que não é permitido", como: "Venda da vaga, da pulseira ou dos benefícios." },
  { regra: "Penalidade", como: "Se houver venda identificada, a inscrição pode ser cancelada." },
] as const;

/* ── 5 · Sábados como rituais ──────────────────────────────────────────── */

export const SABADOS = [
  { sabado: "Sábado 1", papel: "Abertura oficial", acontece: "Lançamento das Crews, apresentação dos líderes, pulseiras, primeira missão coletiva, ranking inicial e fotos.", tone: "gold" },
  { sabado: "Sábado 2", papel: "Crew Challenge", acontece: "Revezamento, Perfect Pace, caça QR Code, desafio de conteúdo e ranking parcial.", tone: "gold" },
  { sabado: "Último sábado do mês", papel: "Somma Day x Michelob Ultra", acontece: "A maior ativação intermediária: stand Michelob, recovery premium, brindes, máquina de fotos, sorteios e conteúdo oficial.", tone: "red" },
  { sabado: "Sábado final", papel: "Grand Finale", acontece: "Social Run, Crew Relay, premiações, recovery, loja, máquina de fotos, pagode, eletrônico e funk.", tone: "red" },
] as const;

/* ── 6 · Stand Michelob ────────────────────────────────────────────────── */

export const STAND_ITENS = [
  "Retirada de brindes",
  "Validação de missões",
  "Máquina de fotos",
  "Ranking das Crews",
  "QR Codes",
  "Entrega de pulseiras",
  "Ativações rápidas",
  "Recovery",
  "Conteúdo",
  "Informações do Grand Finale",
] as const;

/* ── 7 · Recompensas ───────────────────────────────────────────────────── */

export const RECOMPENSAS = [
  { momento: "Entrada na campanha", criterio: "Cadastro validado", recompensa: "Pulseira de silicone com QR Code" },
  { momento: "Semana 1 concluída", criterio: "Missões mínimas cumpridas", recompensa: "Soft flask Michelob Ultra x Somma" },
  { momento: "Semana 2 concluída", criterio: "Pontuação mínima ou presença no sábado", recompensa: "Abridor, pochete ou item esportivo" },
  { momento: "Semana 3 concluída", criterio: "Conclusão dos 21 dias", recompensa: "Camiseta dry fit ou medalha finisher" },
  { momento: "Grand Finale", criterio: "Presença no evento final", recompensa: "Foto personalizada, badge final e premiações" },
] as const;

export const RECOMPENSAS_NOTA =
  "Os itens finais dependem de prazo, orçamento, quantidade mínima de produção e aprovação da Michelob.";

/* ── 8 · Pulseira com QR Code ──────────────────────────────────────────── */

export const PULSEIRA_FLUXO = [
  "Participante recebe a pulseira",
  "Escaneia ou apresenta o QR Code",
  "Sistema identifica nome, Crew e progresso",
  "Líder ou equipe valida a presença",
  "Participante acumula pontos",
  "Benefícios são liberados",
] as const;

/* ── 9 · Ranking e classificação ───────────────────────────────────────── */

export const RANKING_CATEGORIAS = [
  { categoria: "Ranking individual", mede: "Pontuação total do participante" },
  { categoria: "Ranking da Crew", mede: "Soma da pontuação dos integrantes" },
  { categoria: "Ranking de consistência", mede: "Participação recorrente nos 21 dias" },
  { categoria: "Ranking de indicação", mede: "Novos participantes validados" },
  { categoria: "Ranking de conteúdo", mede: "Fotos, vídeos e publicações aprovadas" },
  { categoria: "Ranking esportivo", mede: "Revezamentos, pace e desafios de corrida" },
] as const;

export const RANKING_DESTAQUE =
  "A Crew campeã não será a mais rápida. Será a que melhor combinar presença, organização, conteúdo, indicação e desempenho.";

export const CLASSIFICADOS = [
  { criterio: "Top pontuação", uso: "Pode representar a Crew no desafio final" },
  { criterio: "Melhor consistência", uso: "Premiação especial" },
  { criterio: "Maior indicação", uso: "Reconhecimento individual" },
  { criterio: "Melhor conteúdo", uso: "Destaque no telão e nas redes" },
  { criterio: "Escolha do líder", uso: "Participante convocado para representar a Crew" },
] as const;

/* ── 10 · Timeline da campanha ─────────────────────────────────────────── */

export const TIMELINE_CAMPANHA = [
  { periodo: "Semana 0", fase: "Lançamento", objetivo: "Abrir inscrições, apresentar líderes e formar Crews", ativacoes: "Landing page, vídeos dos líderes, abertura das vagas, cadastro, grupos de WhatsApp e ranking zerado" },
  { periodo: "Sábado 1", fase: "Abertura oficial", objetivo: "Transformar o primeiro sábado na largada da temporada", ativacoes: "Pulseiras, foto das Crews, primeira missão, stand Michelob, máquina de fotos e pontuação em dobro", marco: true },
  { periodo: "Semana 1", fase: "Engajamento", objetivo: "Fazer as Crews se organizarem", ativacoes: "Missões diárias, indicação de amigos, conteúdo, check-ins e ranking" },
  { periodo: "Sábado 2", fase: "Crew Challenge", objetivo: "Criar confronto entre as Crews", ativacoes: "Revezamento, Perfect Pace, caça QR Code, desafio coletivo e ranking público", marco: true },
  { periodo: "Semana 2", fase: "Crescimento", objetivo: "Aumentar participação e conteúdo", ativacoes: "Missões especiais, líderes puxando grupos, desafios surpresa e novos convidados" },
  { periodo: "Somma Day", fase: "Ponto alto intermediário", objetivo: "Usar o último sábado do mês como grande ativação", ativacoes: "Recovery premium, brindes, stand Michelob, ranking, sorteios, máquina de fotos, influenciadores e conteúdo oficial", marco: true },
  { periodo: "Semana final", fase: "Contagem regressiva", objetivo: "Preparar o fechamento dos 21 dias", ativacoes: "Missões com dobro de pontos, vídeos dos líderes, desafios secretos, ranking diário e definição dos classificados" },
  { periodo: "Sexta final", fase: "Fechamento do Challenge", objetivo: "Encerrar a pontuação", ativacoes: "Ranking final, classificados, validação de elegíveis e preparação para o evento" },
  { periodo: "Sábado final", fase: "Grand Finale", objetivo: "Encerrar com grande experiência presencial", ativacoes: "Social Run, Crew Relay, premiações, recovery, loja, máquina de fotos, pagode, eletrônico e funk", marco: true },
] as const;

/* ── 11 · Grand Finale ─────────────────────────────────────────────────── */

export const GRAND_FINALE = [
  { horario: "7h às 9h", momento: "Social Run", experiencia: "Recepção, aquecimento, largada, 5 km e 10 km", tone: "day" },
  { horario: "9h às 11h", momento: "Crew Relay", experiencia: "Revezamento, desafios finais e pontuação esportiva", tone: "day" },
  { horario: "11h às 13h", momento: "Premiação e recovery", experiencia: "Ranking final, medalhas, brindes, loja e máquina de fotos", tone: "day" },
  { horario: "13h às 16h", momento: "Ultra Pagode Session", experiencia: "Pagode, convivência e início da experiência social", tone: "night" },
  { horario: "16h às 19h", momento: "Ultra Electronic Sunset", experiencia: "DJs, sunset e transição para a noite", tone: "night" },
  { horario: "19h às 23h", momento: "Ultra Funk Session", experiencia: "Funk, festa e encerramento", tone: "night" },
] as const;

export const GRAND_FINALE_NOTA =
  "Horários e atrações são conceituais e serão ajustados conforme local, licenças, orçamento e aprovação da Michelob.";

/* ── 12 · Modelo de acesso ─────────────────────────────────────────────── */

export const ACESSO = [
  { publico: "Participante elegível do Challenge", acesso: "Entrada gratuita via QR Code ou Challenge Pass", destaque: true },
  { publico: "Público geral", acesso: "Ingresso pago" },
  { publico: "Insiders e embaixadores", acesso: "Credencial específica" },
  { publico: "Convidados Michelob", acesso: "Lista e área reservada" },
  { publico: "Influenciadores contratados", acesso: "Credencial de creator" },
] as const;

export const ACESSO_CRITERIOS = [
  "Cadastro validado",
  "Maior de 18 anos para áreas com bebidas alcoólicas",
  "Pontuação mínima",
  "Missões obrigatórias concluídas",
  "Presença ou confirmação antecipada",
] as const;

/* ── 13 · Conteúdo audiovisual ─────────────────────────────────────────── */

export const CONTEUDO_PLANO = [
  { momento: "Vídeo de abertura", tipo: "Captação premium", objetivo: "Lançar a campanha e apresentar as Crews", premium: true },
  { momento: "Sábado 1", tipo: "Cobertura leve + cenas principais", objetivo: "Mostrar a largada da temporada", premium: false },
  { momento: "Somma Day x Michelob", tipo: "Captação premium", objetivo: "Gerar o principal conteúdo intermediário", premium: true },
  { momento: "Semana final", tipo: "Conteúdo dos líderes", objetivo: "Criar tensão e contagem regressiva", premium: false },
  { momento: "Grand Finale", tipo: "Captação premium completa", objetivo: "Produzir o recap oficial e materiais de marca", premium: true },
] as const;

export const CONTEUDO_NOTA =
  "A cobertura recorrente pode ser feita pelo time Somma. Os momentos principais têm produção audiovisual premium.";

/* ── 14 · Papel de cada parte (resumo visual) ──────────────────────────── */

export const PAPEL_SOMMA = [
  "Estratégia",
  "Conceito da campanha",
  "Ultra Balance Challenge",
  "Tecnologia",
  "Comunidade",
  "CRM",
  "Crews",
  "Operação esportiva",
  "Professores",
  "Pacers",
  "Conteúdo",
  "Dados",
  "Relatório",
  "Coordenação estratégica",
] as const;

export const PAPEL_MICHELOB = [
  "Espaço",
  "Estrutura física",
  "Palco",
  "Som",
  "Iluminação",
  "Cenografia",
  "Segurança",
  "Brigadistas",
  "Ambulância",
  "Bandas",
  "DJs",
  "Máquina de fotos",
  "Brindes",
  "Premiações",
  "Alimentação",
  "Recovery",
  "Produto Michelob Ultra",
  "Operação do bar",
  "Mídia paga",
  "Licenças",
  "Produção física",
  "Fornecedores",
] as const;

/* ── 15 · O que mudou na proposta ──────────────────────────────────────── */

export const EVOLUCAO = [
  { antes: "Desafio individual", agora: "Plataforma de Crews" },
  { antes: "Perfis genéricos", agora: "Times liderados por pessoas reais" },
  { antes: "Missões soltas", agora: "Desafios semanais com quórum e validação" },
  { antes: "Participação pontual", agora: "Jornada de 21 dias com recompensas" },
  { antes: "Evento final", agora: "Grand Finale com corrida, música e festival" },
  { antes: "Comunidade passiva", agora: "Comunidade que se organiza sozinha" },
  { antes: "Ativação de marca", agora: "Plataforma gamificada de relacionamento" },
] as const;
