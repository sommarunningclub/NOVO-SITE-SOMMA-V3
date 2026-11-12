"use client";

import { DISTANCIAS, type DistanciaBase } from "@/lib/evp/config";
import { dataHora } from "@/lib/evp/formato";
import { Carregando, useSecao, type LinhaAuditoria } from "./api";
import { rotuloAcao, rotuloAlvo } from "./rotulos";

function alvo(l: LinhaAuditoria): string {
  if (l.alvo_tipo === "inscricao") return l.alvo_nome ?? (l.alvo_id ? "Inscrição" : "Credencial não reconhecida");
  if (l.alvo_tipo === "percurso" && l.alvo_id) return `Percurso ${DISTANCIAS[l.alvo_id as DistanciaBase]?.oficial ?? l.alvo_id}`;
  return rotuloAlvo(l.alvo_tipo);
}

export function AbaHistorico() {
  const { dados, erro, carregando, recarregar } = useSecao<LinhaAuditoria[]>("auditoria");
  if (!dados) return <Carregando erro={erro} carregando={carregando} tentar={recarregar} />;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--mt-cinza)" }}>
          As 200 ações mais recentes: inscrições, check-ins, edições, exportações e acessos a CPF.
        </p>
        <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" onClick={() => void recarregar()} disabled={carregando}>
          {carregando ? "Atualizando..." : "Atualizar"}
        </button>
      </div>
      {dados.length === 0 ? (
        <div className="mt-cartao p-6 text-sm" style={{ color: "var(--mt-cinza)" }}>Nada registrado ainda.</div>
      ) : (
        <div className="mt-cartao mt-rolagem-x">
          <table className="mt-tabela" style={{ minWidth: 620 }}>
            <thead>
              <tr><th scope="col">Quando</th><th scope="col">Quem</th><th scope="col">Ação</th><th scope="col">Alvo</th></tr>
            </thead>
            <tbody>
              {dados.map((l) => (
                <tr key={l.id}>
                  <td className="mt-mono whitespace-nowrap text-xs">{dataHora(l.criado_em)}</td>
                  <td>{l.quem === "Sistema" && l.alvo_tipo === "inscricao" ? "Participante" : l.quem}</td>
                  <td>{rotuloAcao(l.acao, l.detalhes)}</td>
                  <td>{alvo(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
