/**
 * Roteiro da apresentação: ordem, ato, tema visual, título e notas do
 * apresentador. O texto de cada slide mora no próprio componente; aqui fica
 * o que a navegação, a visão geral e o modo apresentador precisam.
 */
export type Tema = "escuro" | "claro" | "laranja";

export interface Ato {
  id: string;
  nome: string;
}

export const ATOS: Ato[] = [
  { id: "conexao", nome: "Conexão" },
  { id: "influencia", nome: "Influência" },
  { id: "oportunidades", nome: "Oportunidades" },
  { id: "inteligencia", nome: "Recorrência e inteligência" },
  { id: "parceria", nome: "Parceria" },
];

export interface SlideInfo {
  id: string;
  ato: Ato["id"];
  tema: Tema;
  titulo: string;
  notas: string;
}

export const SLIDES: SlideInfo[] = [
  {
    id: "abertura",
    ato: "conexao",
    tema: "escuro",
    titulo: "Sua marca faz parte do movimento?",
    notas:
      "Abra com a pergunta e deixe o símbolo se montar. Cada ponto é uma pessoa: é essa a ideia que atravessa a apresentação inteira. O anel laranja que fica de fora é o lugar da marca.",
  },
  {
    id: "grande-ideia",
    ato: "conexao",
    tema: "claro",
    titulo: "As marcas querem fazer parte da vida das pessoas. Nós já fazemos.",
    notas:
      "Mostre um sábado de ponta a ponta. Toque em cada momento: são seis pontos de contato reais, antes, durante e depois da corrida. A pergunta implícita é: em qual deles a sua marca estaria?",
  },
  {
    id: "quem-somos",
    ato: "conexao",
    tema: "escuro",
    titulo: "Uma comunidade. Milhares de conexões.",
    notas:
      "Cada ponto do quadro é uma pessoa cadastrada. Os laranjas já confirmaram presença em algum encontro com check-in. Origem: Parque da Cidade, todo sábado às 7h, gratuito.",
  },
  {
    id: "dimensoes",
    ato: "influencia",
    tema: "claro",
    titulo: "A nossa influência não acontece em um único lugar.",
    notas:
      "Três dimensões que se alimentam: o encontro físico gera conteúdo, o conteúdo vira hábito e identidade, e a identidade traz as pessoas de volta para a rua. Clique em cada círculo para mostrar o ciclo.",
  },
  {
    id: "audiencia-digital",
    ato: "influencia",
    tema: "escuro",
    titulo: "A comunidade continua conectada.",
    notas:
      "Números do Instagram Insights, últimos 30 dias, capturados em 04/11/2026. Visualização não é pessoa única: uma pessoa pode ver vários conteúdos. Passe o mouse para ver o número exato.",
  },
  {
    id: "distribuicao",
    ato: "influencia",
    tema: "claro",
    titulo: "Conteúdo que mantém a comunidade em movimento.",
    notas:
      "Cada ponto é 1% das visualizações. Stories levam cerca de 62%: é o canal do dia a dia. Comunicação recorrente cria vários contatos ao longo do tempo. Não prometemos que a marca recebe toda a audiência orgânica da conta.",
  },
  {
    id: "perfil",
    ato: "influencia",
    tema: "escuro",
    titulo: "Uma audiência com identidade.",
    notas:
      "Comece pelos seguidores do Instagram e depois troque para participantes dos eventos: são públicos diferentes e os dois estão aqui. Não inferimos renda nem profissão a partir de idade ou sexo.",
  },
  {
    id: "alem-do-digital",
    ato: "influencia",
    tema: "claro",
    titulo: "Não dependemos apenas de um algoritmo para reunir pessoas.",
    notas:
      "O ecossistema é próprio: cadastro, check-in, WhatsApp, site e encontros. Os números saem do sistema de check-in da SOMMA. Feche com a frase: a relação não termina quando alguém fecha o Instagram.",
  },
  {
    id: "exposicao-experiencia",
    ato: "oportunidades",
    tema: "escuro",
    titulo: "Sua marca pode aparecer. Ou pode ser vivida.",
    notas:
      "Alterne entre os dois modos. Não é contra mídia: são valores complementares. A mídia gera alcance; a experiência gera vínculo, e o vínculo se constrói com repetição.",
  },
  {
    id: "o-que-criar",
    ato: "oportunidades",
    tema: "claro",
    titulo: "Existem muitas formas de fazer parte.",
    notas:
      "Cinco territórios. Abra o que tiver mais a ver com a marca na sala. São exemplos ilustrativos: o escopo de cada parceria é definido em proposta.",
  },
  {
    id: "cases",
    ato: "oportunidades",
    tema: "escuro",
    titulo: "Marcas que já entraram em movimento com a gente.",
    notas:
      "Só entra o que tem registro. Os números vêm do sistema de check-in. Michelob Ultra está em preparação e a Love Run acontece em 07/11: diga isso com clareza, não como case concluído.",
  },
  {
    id: "linha-do-tempo",
    ato: "inteligencia",
    tema: "claro",
    titulo: "Uma marca não se constrói em um único sábado.",
    notas:
      "Troque entre 3, 6 e 12 meses. Cada ponto cinza é um sábado de encontro. Os marcos são ilustrativos: nem todo sábado tem ativação, e o número de ativações é negociado.",
  },
  {
    id: "inteligencia",
    ato: "inteligencia",
    tema: "escuro",
    titulo: "A experiência acontece na rua. A inteligência continua depois dela.",
    notas:
      "Cada participação passa por inscrição e check-in. Isso permite medir recorrência, estreantes e retenção sem expor ninguém. Abra o painel completo com o botão ou a tecla P.",
  },
  {
    id: "painel",
    ato: "inteligencia",
    tema: "escuro",
    titulo: "Painel da comunidade",
    notas:
      "Dados reais e agregados. Troque o período e o formato do evento, clique numa coluna para ver o evento. Ressalva: é confirmação de presença pelo site, não contagem auditada na porta.",
  },
  {
    id: "modelo",
    ato: "parceria",
    tema: "claro",
    titulo: "A sua marca. O seu objetivo. Uma experiência construída em conjunto.",
    notas:
      "Sem tabela de preço e sem pacote pronto. A duração dá o horizonte; os dez fatores dão a forma. Termine no processo de quatro passos.",
  },
  {
    id: "chamada",
    ato: "parceria",
    tema: "laranja",
    titulo: "Sua marca pode aparecer em uma corrida. Ou fazer parte de uma comunidade.",
    notas: "Feche com o convite e os contatos. Deixe este slide na tela durante a conversa.",
  },
];
