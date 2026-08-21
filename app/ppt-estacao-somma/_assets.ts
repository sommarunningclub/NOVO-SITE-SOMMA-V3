import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Imagens opcionais da Estação SOMMA (renders e fotografias do espaço).
 *
 * Renders arquitetônicos ainda não existem no repositório, então o deck
 * trabalha com espaços reservados: basta salvar o arquivo em
 * /public/estacao-somma com o nome abaixo e ele entra automaticamente, sem
 * mexer em código. Enquanto o arquivo não existe, cada slot usa a foto real do
 * SOMMA indicada no deck ou uma prancha "em desenvolvimento".
 */
export const OPCIONAIS = {
  renderCapa: "render-capa.jpg",
  renderConceito: "render-conceito.jpg",
  renderPerformance: "render-performance.jpg",
  renderRecovery: "render-recovery.jpg",
  renderCafe: "render-cafe.jpg",
  renderVisao: "render-visao.jpg",
  renderEncerramento: "render-encerramento.jpg",
  parque1: "parque-1.jpg",
  parque2: "parque-2.jpg",
} as const;

export type ChaveOpcional = keyof typeof OPCIONAIS;
export type Opcionais = Record<ChaveOpcional, string | null>;

/** Verifica, a cada request, quais arquivos opcionais já foram adicionados. */
export function resolveOpcionais(): Opcionais {
  const base = path.join(process.cwd(), "public", "estacao-somma");
  const out = {} as Opcionais;
  for (const [chave, arquivo] of Object.entries(OPCIONAIS) as [ChaveOpcional, string][]) {
    out[chave] = fs.existsSync(path.join(base, arquivo)) ? `/estacao-somma/${arquivo}` : null;
  }
  return out;
}
