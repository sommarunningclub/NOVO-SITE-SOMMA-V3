"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { DistanciaBase, DistanciaInscricao } from "@/lib/evp/config";
import type { Conteudo, Contato, Coordenada, Momento, Profissional, StatusInscricao, Vagas } from "@/lib/evp/tipos";

// ─── Formatos devolvidos pelas funções evp_admin_* ──────────────────────────

export type DadosPainel = {
  vagas: Vagas;
  inscricoes_status: "em_breve" | "aberta" | "encerrada";
  confirmadas: number;
  lista_espera: number;
  canceladas: number;
  presentes: number;
  taxa_comparecimento: number | null;
  por_distancia: Record<string, number>;
  por_sexo: Record<string, number>;
  primeira_vez: { sim: number; nao: number };
  por_origem: { origem: string; visitas: number; inicios_form: number; inscricoes: number }[];
  funil: { visitas: number; inicios_form: number; inscricoes: number; conversao: number | null };
  por_dia: { dia: string; n: number }[];
};

export type Operacao = {
  email: boolean;
  mapa: boolean;
  mapa_id: boolean;
  segredo_dados: boolean;
  senha_mestra: boolean;
  limite_global: boolean;
};

export type Participante = {
  id: string;
  status: StatusInscricao;
  codigo: string;
  nome: string;
  email: string;
  telefone: string;
  cpf_final: string;
  sexo: "feminino" | "masculino";
  distancia: DistanciaInscricao;
  primeira_vez: boolean;
  aceite_marketing: boolean;
  origem_fonte: string;
  created_at: string;
  confirmada_em: string | null;
  cancelada_em: string | null;
  checkin_em: string | null;
  fila_desde: string | null;
};

export type Ficha = Omit<Participante, "checkin_em" | "fila_desde"> & {
  ticket_token: string;
  aceite_termos_em: string;
  origem: Record<string, string>;
  cancelada_motivo: string | null;
  checkins: { feito_em: string; via: "qr" | "manual"; operador: string; desfeito_em: string | null; desfeito_por: string | null }[];
  historico: { acao: string; quem: string; detalhes: Record<string, unknown>; criado_em: string }[];
};

export type RelatorioPercurso = {
  comprimento_m?: number;
  oficial_m?: number;
  diferenca_pct?: number;
  pontos_no_arquivo?: number;
  pontos?: number;
  inicio_fim_m?: number;
  dentro_do_df?: boolean;
  avisos?: string[];
  bloqueios?: string[];
};

export type PercursoAdmin = {
  distancia: DistanciaBase;
  status: "em_validacao" | "publicado";
  comprimento_m: number;
  pontos: number;
  arquivo_nome: string | null;
  formato: string | null;
  fonte: string | null;
  relatorio: RelatorioPercurso;
  enviado_em: string;
  publicado_em: string | null;
  coordenadas: Coordenada[];
};

export type EventoAdmin = {
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
  capacidade: number | null;
  valor_centavos: number | null;
  inscricoes_status: "em_breve" | "aberta" | "encerrada";
  ao_lotar: "lista_espera" | "encerrar";
  promover_automatico: boolean;
  conteudo: Conteudo;
  contato: Contato;
  vagas: Vagas;
  programacao: Momento[];
  profissionais: Profissional[];
  percursos: PercursoAdmin[];
};

export type Conta = {
  id: string;
  nome: string;
  email: string;
  papel: "admin" | "operador";
  ativo: boolean;
  mestre: boolean;
  ultimo_acesso: string | null;
  tem_senha: boolean;
};

export type LinhaAuditoria = {
  id: number;
  acao: string;
  quem: string;
  alvo_tipo: string | null;
  alvo_id: string | null;
  alvo_nome: string | null;
  detalhes: Record<string, unknown>;
  criado_em: string;
};

// ─── Chamadas ───────────────────────────────────────────────────────────────

export type Resposta<T> =
  | { ok: true; corpo: T }
  | { ok: false; status: number; erro: string; corpo: Record<string, unknown> };

/** fetch do painel: erro sempre vira texto, e sessão vencida recarrega a tela de login. */
export function useApi() {
  const router = useRouter();
  return useCallback(
    async <T,>(url: string, init?: RequestInit): Promise<Resposta<T>> => {
      try {
        const cabecalhos =
          init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined;
        const res = await fetch(url, { cache: "no-store", ...init, headers: { ...cabecalhos, ...init?.headers } });
        const corpo = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (res.ok) return { ok: true, corpo: corpo as T };
        if (res.status === 401) router.refresh();
        const erro = typeof corpo.error === "string" ? corpo.error : "Não foi possível concluir. Tente de novo.";
        return { ok: false, status: res.status, erro, corpo };
      } catch {
        return { ok: false, status: 0, erro: "Sem conexão. Confira a internet e tente de novo.", corpo: {} };
      }
    },
    [router]
  );
}

/** Carrega uma seção de /api/evp/admin/dados. */
export function useSecao<T>(secao: string) {
  const api = useApi();
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    const r = await api<{ dados: T }>(`/api/evp/admin/dados?secao=${secao}`);
    if (r.ok) {
      setDados(r.corpo.dados);
      setErro("");
    } else setErro(r.erro);
    setCarregando(false);
  }, [api, secao]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { dados, erro, carregando, recarregar, setDados };
}

// ─── Peças de interface ─────────────────────────────────────────────────────

export type Aviso = { tipo: "ok" | "erro"; texto: string } | null;

export function Mensagem({ aviso }: { aviso: Aviso }) {
  return (
    <p
      role={aviso?.tipo === "erro" ? "alert" : "status"}
      aria-live="polite"
      className="min-h-5 text-sm"
      style={{ color: aviso?.tipo === "erro" ? "#ff8a8a" : "var(--mt-verde)" }}
    >
      {aviso?.texto ?? ""}
    </p>
  );
}

export function Carregando({ erro, carregando, tentar }: { erro: string; carregando: boolean; tentar: () => void }) {
  if (erro) {
    return (
      <div className="mt-cartao p-5" role="alert">
        <p style={{ color: "#ff8a8a" }}>{erro}</p>
        <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno mt-3" onClick={tentar}>
          Tentar de novo
        </button>
      </div>
    );
  }
  if (carregando) {
    return (
      <p className="mt-rotulo py-8" role="status" aria-live="polite">
        Carregando...
      </p>
    );
  }
  return null;
}

export function Campo({
  rotulo,
  dica,
  erro,
  children,
  className = "",
}: {
  rotulo: string;
  dica?: string;
  erro?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`mt-campo ${className}`}>
      <span className="mt-rotulo">{rotulo}</span>
      {children}
      {dica ? (
        <span className="mt-1.5 block text-sm" style={{ color: "var(--mt-cinza)", marginBottom: 0 }}>
          {dica}
        </span>
      ) : null}
      {erro ? (
        <span className="mt-erro" role="alert" style={{ marginBottom: 0 }}>
          {erro}
        </span>
      ) : null}
    </label>
  );
}

export function Bloco({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="mt-cartao p-5 sm:p-6">
      <h3 className="text-lg font-bold">{titulo}</h3>
      {descricao ? (
        <p className="mt-1 text-sm" style={{ color: "var(--mt-cinza)" }}>
          {descricao}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export const STATUS_ROTULO: Record<StatusInscricao, string> = {
  confirmada: "Confirmada",
  lista_espera: "Lista de espera",
  cancelada: "Cancelada",
};
export const STATUS_SELO: Record<StatusInscricao, string> = {
  confirmada: "mt-selo mt-selo--ok",
  lista_espera: "mt-selo mt-selo--espera",
  cancelada: "mt-selo mt-selo--fora",
};

export const vazioParaNulo = (v: string): string | null => (v.trim() === "" ? null : v.trim());
