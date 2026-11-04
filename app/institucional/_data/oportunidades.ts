/**
 * Formas de uma marca fazer parte. São exemplos ilustrativos, não entregas
 * garantidas: o escopo de cada parceria é definido em proposta.
 */
export interface CategoriaOportunidade {
  id: string;
  numero: string;
  titulo: string;
  resumo: string;
  exemplos: { titulo: string; descricao: string }[];
  /** O que dá para acompanhar depois, sem prometer resultado. */
  sinais: string;
}

export const OPORTUNIDADES: CategoriaOportunidade[] = [
  {
    id: "presencial",
    numero: "01",
    titulo: "Experiências presenciais",
    resumo: "A marca no momento em que as pessoas estão juntas, antes e depois de correr.",
    exemplos: [
      { titulo: "Amostragem no pós-treino", descricao: "Produto na mão de quem acabou de correr, no momento mais aberto da manhã." },
      { titulo: "Estação de recovery", descricao: "Alongamento, massagem ou gelo assinados pela marca." },
      { titulo: "Ponto de hidratação", descricao: "Água, isotônico ou café num lugar por onde todos passam." },
      { titulo: "Aquecimento conduzido", descricao: "A marca abre o encontro com um aquecimento coletivo." },
    ],
    sinais: "Pessoas atendidas, produtos distribuídos, presenças confirmadas no encontro.",
  },
  {
    id: "digital",
    numero: "02",
    titulo: "Conteúdo e influência digital",
    resumo: "Histórias contadas por quem vive a comunidade, não por um anúncio.",
    exemplos: [
      { titulo: "Storytelling de marca", descricao: "A marca aparece dentro de uma história real da comunidade." },
      { titulo: "Collabs no Instagram", descricao: "Publicações em parceria, com alcance nos dois perfis." },
      { titulo: "Série recorrente", descricao: "Um quadro fixo que volta toda semana ou todo mês." },
      { titulo: "Cobertura dos encontros", descricao: "Bastidores, stories e registro das ativações." },
    ],
    sinais: "Visualizações, interações e cliques do conteúdo publicado na parceria.",
  },
  {
    id: "eventos",
    numero: "03",
    titulo: "Eventos e ativações especiais",
    resumo: "Uma data própria, desenhada em torno da marca e do que ela quer dizer.",
    exemplos: [
      { titulo: "Corridas temáticas", descricao: "Um tema, um percurso e uma narrativa criados com a marca." },
      { titulo: "Lançamento de produto", descricao: "O produto apresentado para quem vai usar, no lugar onde se usa." },
      { titulo: "Edições especiais", descricao: "Encontros maiores, como o SOMMA DAY, com a marca no centro." },
      { titulo: "Desafios", descricao: "Formatos com inscrição, vagas e ranking, como o Desafio das Esteiras." },
    ],
    sinais: "Inscrições, estreantes e retorno das pessoas aos encontros seguintes.",
  },
  {
    id: "lifestyle",
    numero: "04",
    titulo: "Lifestyle, produtos e collabs",
    resumo: "Objetos que a comunidade veste, usa e leva para casa.",
    exemplos: [
      { titulo: "Vestuário co-branded", descricao: "Peças assinadas pela SOMMA e pela marca." },
      { titulo: "Drops na loja SOMMA", descricao: "Edições limitadas vendidas em loja.sommaclub.com.br." },
      { titulo: "Kits", descricao: "Kits de boas-vindas ou de evento com produtos da marca." },
      { titulo: "Benefícios", descricao: "Condições exclusivas para quem faz parte da comunidade." },
    ],
    sinais: "Peças vendidas ou entregues, uso de cupons, resgates de benefício.",
  },
  {
    id: "tecnologia",
    numero: "05",
    titulo: "Tecnologia e relacionamento",
    resumo: "A infraestrutura que a SOMMA já usa todo sábado, a serviço da campanha.",
    exemplos: [
      { titulo: "Inscrição digital", descricao: "Página de inscrição da ação, com consentimento para a marca quando acordado." },
      { titulo: "QR de campanha", descricao: "Um QR que leva para uma experiência, um cupom ou uma pesquisa." },
      { titulo: "Check-in com QR", descricao: "Presença registrada na entrada, com ingresso digital." },
      { titulo: "Relatório agregado", descricao: "Leitura da participação ao fim de cada etapa, sem expor ninguém." },
    ],
    sinais: "Inscrições, leituras de QR, check-ins e recorrência, sempre em números agregados.",
  },
];
