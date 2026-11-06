export interface Cartao {
  codigo: string;
  nome: string;
  pelotao: string | null;
  preferencia: number;
  instagram: string | null;
  whatsapp: string | null;
  /** Versão da foto; null = sem foto. */
  foto: number | null;
}

export interface MeuPerfil extends Cartao {
  whatsapp_publico: boolean;
  genero: string;
}

export interface GrupoInfo {
  total: number;
  capacidade: number;
  vagas: number;
  completo: boolean;
  aceita_masculino: boolean;
  aceita_feminino: boolean;
  aceita_outro: boolean;
}

export interface Grupo {
  codigo: string;
  pelotao: string;
  atualizado_em: string;
  info: GrupoInfo;
  membros: Cartao[];
}

export interface Notificacao {
  id: string;
  tipo: string;
  dados: { nome?: string; grupo?: string; celebrar?: Celebrar; desfeito?: boolean };
  lida_em: string | null;
  criado_em: string;
}

export type Celebrar = "dupla" | "trio" | "quarteto";

export interface Numeros {
  comunidade: number;
  conectadas: number;
  duplas: number;
  trios: number;
  quartetos: number;
}

export interface Estado {
  ok: true;
  perfil: MeuPerfil | null;
  inscricao?: { nome: string; pelotao: string | null; precisa_genero: boolean };
  grupo?: Grupo | null;
  convites_recebidos?: { id: string; de: Cartao; criado_em: string; grupo: Grupo | null }[];
  convites_enviados?: { id: string; para: Cartao; criado_em: string }[];
  notificacoes?: Notificacao[];
  numeros?: Numeros;
  conexoes?: Grupo[];
}

export type AcaoPessoa = "conectar" | "convidar" | "aceitar" | "aguardando" | "distancia" | "sem_vaga_no_meu";
export type AcaoGrupo = "entrar" | "meu" | "completo" | "distancia" | "ja_em_grupo" | "incompativel";

export type ItemVitrine =
  | { tipo: "pessoa"; acao: AcaoPessoa; dados: Cartao }
  | { tipo: "grupo"; acao: AcaoGrupo; dados: Grupo };

export interface Recado {
  id: string;
  para: string;
  mensagem: string;
  foto: boolean;
  criado_em: string;
  meu: boolean;
  /** Autor do recado ou Insider (moderação). */
  pode_apagar?: boolean;
  denunciei: boolean;
  comentarios?: number;
  /** null = anônimo. */
  autor: { codigo: string; nome: string; foto: number | null; instagram: string | null; whatsapp: string | null } | null;
}

export interface Comentario {
  id: string;
  texto: string;
  /** Só a primeira letra do nome: o comentário é anônimo. */
  inicial: string;
  criado_em: string;
  meu: boolean;
  pode_apagar: boolean;
  denunciei: boolean;
}

export interface ResultadoAcao {
  ok: boolean;
  erro?: string;
  resultado?: string;
  grupo?: string;
  celebrar?: Celebrar;
}
