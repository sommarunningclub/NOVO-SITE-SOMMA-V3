"use client";

import { useState } from "react";
import type { ModoVagas } from "@/lib/evp/tipos";
import { useApi } from "./api";

type Status = "em_breve" | "aberta" | "encerrada";

const OPCOES: { id: Status; rotulo: string; pagina: string }[] = [
  { id: "em_breve", rotulo: "Fechado · em breve", pagina: "A página mostra \"Inscrições em breve\" e não recebe inscrição." },
  { id: "aberta", rotulo: "Aberto", pagina: "O formulário está no ar e recebendo inscrições." },
  { id: "encerrada", rotulo: "Fechado · encerrado", pagina: "A página mostra \"Inscrições encerradas\" e não recebe inscrição." },
];

/**
 * Abre e fecha o formulário de inscrição da página.
 *
 * É o mesmo campo "status das inscrições" da aba Evento, posto em evidência.
 * Abrir só funciona com data, local, endereço, capacidade e valor definidos:
 * quem confere é o banco, e a resposta diz o que falta.
 */
export function ControleInscricoes({
  status,
  modo,
  aoMudar,
  abrirEvento,
}: {
  status: Status;
  modo: ModoVagas;
  aoMudar: () => void;
  abrirEvento: () => void;
}) {
  const api = useApi();
  const [salvando, setSalvando] = useState<Status | null>(null);
  const [erro, setErro] = useState("");
  const [faltam, setFaltam] = useState(false);
  const [feito, setFeito] = useState("");

  async function mudar(novo: Status) {
    if (novo === status || salvando) return;
    if (novo !== "aberta" && status === "aberta" && !window.confirm("Fechar o formulário agora? Quem estiver preenchendo não consegue concluir.")) return;
    setErro("");
    setFeito("");
    setFaltam(false);
    setSalvando(novo);
    const r = await api<{ ok: boolean }>("/api/evp/admin/evento", { method: "PUT", body: JSON.stringify({ inscricoes_status: novo }) });
    setSalvando(null);
    if (!r.ok) {
      setErro(r.erro);
      setFaltam(Array.isArray(r.corpo.faltam));
      return;
    }
    setFeito(novo === "aberta" ? "Formulário aberto. A página já mostra o formulário." : "Formulário fechado. A página já parou de receber inscrições.");
    aoMudar();
  }

  const atual = OPCOES.find((o) => o.id === status) ?? OPCOES[0];
  const lotado = status === "aberta" && (modo === "lista_espera" || modo === "esgotada");

  return (
    <section
      aria-labelledby="controle-inscricoes"
      className="mt-cartao p-5 sm:p-6"
      style={{ borderColor: status === "aberta" ? "var(--mt-verde)" : "var(--mt-linha-forte)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="controle-inscricoes" className="mt-rotulo">Formulário de inscrição</h2>
          <p className="mt-display mt-2" style={{ fontSize: "clamp(2rem, 7vw, 3rem)", color: status === "aberta" ? "var(--mt-verde)" : "var(--mt-branco)" }}>
            {status === "aberta" ? "Aberto" : "Fechado"}
          </p>
          <p className="mt-2 max-w-xl text-sm" style={{ color: "#d4d4d4" }}>
            {atual.pagina}
            {lotado ? (modo === "lista_espera" ? " As vagas acabaram: quem entra agora vai para a lista de espera." : " As vagas acabaram: a página mostra \"Vagas esgotadas\".") : ""}
          </p>
        </div>
        {status === "aberta" ? (
          <button type="button" className="mt-botao mt-botao--linha" onClick={() => mudar("em_breve")} disabled={salvando !== null}>
            {salvando ? "Fechando..." : "Fechar formulário"}
          </button>
        ) : (
          <button type="button" className="mt-botao mt-botao--cheio" onClick={() => mudar("aberta")} disabled={salvando !== null}>
            {salvando === "aberta" ? "Abrindo..." : "Abrir formulário"}
          </button>
        )}
      </div>

      <div role="radiogroup" aria-label="Estado do formulário" className="mt-5 grid gap-2 sm:grid-cols-3">
        {OPCOES.map((o) => {
          const ativo = o.id === status;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={ativo}
              disabled={salvando !== null}
              onClick={() => mudar(o.id)}
              className="mt-mono min-h-11 rounded-full border px-4 text-[0.72rem] transition-colors"
              style={{
                background: ativo ? "var(--mt-branco)" : "transparent",
                color: ativo ? "var(--mt-preto)" : "var(--mt-branco)",
                borderColor: ativo ? "var(--mt-branco)" : "var(--mt-linha-forte)",
                fontWeight: ativo ? 700 : 400,
              }}
            >
              {salvando === o.id ? "Salvando..." : o.rotulo}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-3 min-h-5 text-sm">
        {erro ? (
          <p role="alert" style={{ color: "#ff8a8a" }}>
            {erro}{" "}
            {faltam ? (
              <button type="button" onClick={abrirEvento} className="underline underline-offset-4" style={{ color: "var(--mt-branco)" }}>
                Preencher na aba Evento
              </button>
            ) : null}
          </p>
        ) : feito ? (
          <p style={{ color: "var(--mt-verde)" }}>{feito}</p>
        ) : null}
      </div>
    </section>
  );
}
