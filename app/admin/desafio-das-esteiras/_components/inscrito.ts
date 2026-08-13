import type { Participacao, Sexo, VagasStatus } from "@/lib/desafio-esteiras/event.config";

export interface Inscrito {
  id: string;
  created_at: string;
  full_name: string;
  cpf?: string;
  cpf_mascarado: string;
  birth_date: string;
  idade: number | null;
  faixa_etaria: string | null;
  email: string;
  phone: string;
  unit_id: string;
  sexo: Sexo | null;
  participacao: Participacao;
  foto_url: string | null;
  tem_foto: boolean;
  ticket_code: string;
  ticket_token: string;
  status: "confirmed" | "checked_in" | "cancelled";
  checked_in_at: string | null;
  origem: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referral: string | null;
  atualizado_em: string | null;
  heat_number: number | null;
}

export const STATUS_LABEL: Record<Inscrito["status"], string> = {
  confirmed: "CONFIRMADO",
  checked_in: "CHECK-IN",
  cancelled: "CANCELADO",
};

export const STATUS_COR: Record<Inscrito["status"], string> = {
  confirmed: "rgba(242,240,236,0.6)",
  checked_in: "var(--somma)",
  cancelled: "var(--evolve)",
};

export function horaInscrito(iso?: string | null): string {
  return iso
    ? new Date(iso).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
}

export type { VagasStatus };
