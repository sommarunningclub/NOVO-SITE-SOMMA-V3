import type { DistanciaBase, DistanciaInscricao } from "./config";

export type ModoVagas = "em_breve" | "aberta" | "lista_espera" | "esgotada" | "encerrada";

export type Vagas = {
  modo: ModoVagas;
  capacidade: number | null;
  confirmadas: number;
  vagas_livres: number | null;
  fila: number;
};

export type Momento = { titulo: string; descricao: string | null; horario: string | null };

export type Profissional = {
  nome: string;
  funcao: string | null;
  descricao: string | null;
  especialidade: string | null;
  foto_url: string | null;
  organizacao: "bora" | "somma";
};

/** [lng, lat] na ordem de corrida. */
export type Coordenada = [number, number];

export type PercursoPublico = {
  distancia: DistanciaBase;
  coordenadas: Coordenada[];
  comprimento_m: number;
  fonte: string | null;
};

/** Textos e imagens que o painel pode trocar. Vazio = usa o padrão da página. */
export type Conteudo = {
  hero_imagem?: string;
  hero_descricao?: string;
  sobre_texto?: string;
  link_prova?: string;
  link_regulamento?: string;
};

export type Contato = { whatsapp?: string; email?: string; instagram?: string };

export type EventoPublico = {
  slug: string;
  nome: string;
  descricao: string | null;
  starts_at: string | null;
  ends_at: string | null;
  local_nome: string | null;
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  orientacoes_chegada: string | null;
  info_participacao: string | null;
  valor_centavos: number | null;
  conteudo: Conteudo;
  contato: Contato;
  vagas: Vagas;
  programacao: Momento[];
  profissionais: Profissional[];
  percursos: PercursoPublico[];
};

export type StatusInscricao = "confirmada" | "lista_espera" | "cancelada";

export type InscricaoPublica = {
  id: string;
  status: StatusInscricao;
  codigo: string;
  ticket_token: string;
  nome: string;
  email: string;
  distancia: DistanciaInscricao;
  posicao_fila: number | null;
};

export type Ingresso = InscricaoPublica & {
  qr_token: string;
  presente: boolean;
  evento: Pick<EventoPublico, "nome" | "starts_at" | "ends_at" | "local_nome" | "endereco" | "lat" | "lng">;
};

export type Papel = "admin" | "operador";
export type Sessao = { id: string; nome: string; papel: Papel; mestre: boolean };
