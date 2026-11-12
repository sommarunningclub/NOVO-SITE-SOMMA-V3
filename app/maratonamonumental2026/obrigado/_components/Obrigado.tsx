"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { linkGoogleAgenda } from "@/lib/evp/agenda";
import { medir } from "@/lib/evp/analytics";
import { CAMINHO, ROTULO_DISTANCIA, URL_LP } from "@/lib/evp/config";
import { dataLonga, horario } from "@/lib/evp/formato";
import type { Ingresso } from "@/lib/evp/tipos";
import { EASE, gsap, useEscopo } from "../../_motion";

type Props = {
  qr: string | null;
  ingresso: Pick<Ingresso, "nome" | "codigo" | "distancia" | "status" | "posicao_fila" | "presente" | "evento">;
};

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt style={{ font: "500 10px/1.2 var(--font-mt-mono), monospace", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(8,8,8,0.55)" }}>{rotulo}</dt>
      <dd style={{ marginTop: 4, fontSize: 15, fontWeight: 600, lineHeight: 1.25, color: "#080808" }}>{valor}</dd>
    </div>
  );
}

export function Obrigado({ qr, ingresso }: Props) {
  const confirmada = ingresso.status === "confirmada";
  const ev = ingresso.evento;
  const data = dataLonga(ev.starts_at);
  const hora = horario(ev.starts_at, ev.ends_at);
  const agenda = linkGoogleAgenda(ev);
  const cartao = useRef<HTMLDivElement>(null);
  const [salvando, setSalvando] = useState(false);
  const [recado, setRecado] = useState("");

  const ref = useEscopo<HTMLElement>(({ raiz }) => {
    const rota = raiz.querySelector<SVGPathElement>("[data-rota]");
    if (rota) gsap.set(rota, { strokeDasharray: 1, strokeDashoffset: 1 });
    const tl = gsap.timeline({ defaults: { ease: EASE.out } });
    tl.from("[data-c='marco']", { autoAlpha: 0, y: -10, duration: 0.5 })
      .from("[data-c='letra']", { yPercent: 110, duration: 0.9, stagger: 0.045 }, 0.1)
      .from("[data-c='texto']", { autoAlpha: 0, y: 18, duration: 0.6, stagger: 0.08 }, 0.6)
      .from("[data-c='ingresso']", { y: 80, rotate: -5, autoAlpha: 0, duration: 1.1, ease: "back.out(1.3)" }, 0.5)
      .from("[data-c='campo']", { autoAlpha: 0, y: 10, duration: 0.4, stagger: 0.05 }, 1.05)
      .from("[data-c='qr']", { scale: 0.85, autoAlpha: 0, duration: 0.6, ease: "back.out(1.8)" }, 1.25)
      .from("[data-c='acao']", { autoAlpha: 0, y: 14, duration: 0.5, stagger: 0.06 }, 1.35);
    if (rota) tl.to(rota, { strokeDashoffset: 0, duration: 1.8, ease: EASE.inOut }, 0.2);
  });

  async function salvar() {
    if (!cartao.current || salvando) return;
    setSalvando(true);
    setRecado("");
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cartao.current, { backgroundColor: "#080808", scale: Math.min(3, window.devicePixelRatio * 2), useCORS: true });
      const link = document.createElement("a");
      link.download = `ingresso-meeting-tecnico-${ingresso.codigo}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setRecado("Ingresso salvo como imagem.");
    } catch {
      setRecado("Não foi possível gerar a imagem. Faça uma captura de tela do ingresso.");
    }
    setSalvando(false);
  }

  async function compartilhar() {
    const dados = { title: "Meeting Técnico | Maratona Monumental de Brasília 2026", text: "Vou no Meeting Técnico da Monumental, com o SOMMA Club e a BORA. Vem também:", url: URL_LP };
    try {
      if (navigator.share) await navigator.share(dados);
      else {
        await navigator.clipboard.writeText(`${dados.text} ${dados.url}`);
        setRecado("Link do evento copiado.");
      }
    } catch {
      /* a pessoa fechou a folha de compartilhamento */
    }
  }

  const titulo = confirmada ? "You're in." : "Na lista.";

  return (
    <main ref={ref} className="relative isolate min-h-dvh overflow-hidden pb-16 pt-10" style={{ paddingTop: "calc(2.5rem + env(safe-area-inset-top))" }}>
      <svg aria-hidden viewBox="0 0 1200 800" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-70">
        <path data-rota pathLength={1} className="mt-rota" d="M-20 700 C 180 700, 220 520, 380 530 S 560 700, 720 610 S 820 300, 960 320 S 1090 460, 1140 250 S 1180 120, 1230 110" />
      </svg>

      <div className="mt-container grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6 lg:pt-10">
          <p data-c="marco" className="mt-marco"><b>Meeting Técnico</b> Maratona Monumental 2026</p>
          <h1 className="mt-display mt-6 text-[clamp(3.3rem,19vw,11rem)]" aria-label={titulo}>
            <span className="mt-mascara" aria-hidden>
              <span className="!flex flex-wrap">
                {titulo.split("").map((l, i) => (
                  <span key={i} data-c="letra" className="inline-block" style={{ whiteSpace: "pre", color: l === "." ? "var(--mt-laranja)" : undefined }}>{l}</span>
                ))}
              </span>
            </span>
          </h1>
          <p data-c="texto" className="mt-6 max-w-[30rem] text-[1.25rem] font-semibold leading-snug">
            {confirmada
              ? `Obrigado, ${ingresso.nome.split(/\s+/)[0]}. Sua participação no Meeting Técnico foi confirmada.`
              : `Obrigado, ${ingresso.nome.split(/\s+/)[0]}. Você está na lista de espera${ingresso.posicao_fila ? `, na posição ${ingresso.posicao_fila}` : ""}.`}
          </p>
          <p data-c="texto" className="mt-texto mt-3 max-w-[30rem]">
            {confirmada
              ? "Este é o seu ingresso. No dia, apresente o QR Code na recepção. Ele também foi enviado para o seu e-mail."
              : "As vagas estão preenchidas. Se uma abrir, ela vai para quem chegou primeiro, e você recebe o ingresso por e-mail. Esta página mostra a sua situação sempre atualizada."}
          </p>
          {ingresso.presente && <p data-c="texto" className="mt-selo mt-selo--ok mt-5">Presença registrada no credenciamento</p>}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {confirmada && (
              <button data-c="acao" type="button" onClick={salvar} disabled={salvando} className="mt-botao mt-botao--cheio">
                {salvando ? "Gerando imagem" : "Salvar ingresso"}
              </button>
            )}
            {agenda ? (
              <>
                <a data-c="acao" href={agenda} target="_blank" rel="noopener noreferrer" className="mt-botao mt-botao--linha" onClick={() => medir("evp_add_to_calendar", { destino: "google" })}>
                  Adicionar à agenda<span className="mt-so-leitor"> do Google, abre em nova aba</span>
                </a>
                <a data-c="acao" href={`${CAMINHO}/agenda.ics`} className="mt-botao mt-botao--linha" onClick={() => medir("evp_add_to_calendar", { destino: "ics" })}>
                  Baixar convite (.ics)
                </a>
              </>
            ) : (
              <button data-c="acao" type="button" disabled className="mt-botao mt-botao--linha">Agenda: data em breve</button>
            )}
            <button data-c="acao" type="button" onClick={compartilhar} className="mt-botao mt-botao--linha">Compartilhar o evento</button>
          </div>
          <p aria-live="polite" className="mt-3 min-h-5 text-[0.88rem] text-[color:var(--mt-cinza)]">{recado}</p>
          <Link data-c="acao" href={CAMINHO} className="mt-mono mt-6 inline-flex min-h-11 items-center text-[0.72rem] text-[color:var(--mt-cinza)] underline underline-offset-4">
            Voltar para a página do Meeting
          </Link>
        </div>

        <div className="lg:col-span-6">
          {/* O ingresso usa cores fixas e nada de filtro: é este bloco que vira imagem ao salvar. */}
          <div ref={cartao} data-c="ingresso" className="mx-auto w-full max-w-[26rem] p-2">
            <div className="mt-ingresso">
              <div style={{ background: "#080808", color: "#fff", padding: "22px 24px 26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", font: "700 11px/1 var(--font-mt-mono), monospace", letterSpacing: "0.16em" }}>
                  <span>SOMMA CLUB <span style={{ color: "#FF2C03" }}>×</span> BORA</span>
                  <span style={{ color: "#FF2C03" }}>{confirmada ? "INGRESSO" : "LISTA DE ESPERA"}</span>
                </div>
                <p className="mt-display" style={{ fontSize: 64, marginTop: 26 }}>
                  Meeting<br />Técnico<span style={{ color: "#FF2C03" }}>.</span>
                </p>
                <p style={{ marginTop: 10, fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#d4d4d4" }}>
                  Maratona Monumental de Brasília 2026
                </p>
              </div>

              <dl style={{ padding: "22px 24px", display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
                <div data-c="campo" style={{ gridColumn: "1 / -1" }}><Linha rotulo="Participante" valor={ingresso.nome} /></div>
                <div data-c="campo" style={{ gridColumn: "1 / -1" }}><Linha rotulo="Distância na prova" valor={ROTULO_DISTANCIA[ingresso.distancia]} /></div>
                <div data-c="campo"><Linha rotulo="Data" valor={data ?? "Em breve"} /></div>
                <div data-c="campo"><Linha rotulo="Horário" valor={hora ?? "Em breve"} /></div>
                <div data-c="campo" style={{ gridColumn: "1 / -1" }}>
                  <Linha rotulo="Local" valor={ev.local_nome ? [ev.local_nome, ev.endereco].filter(Boolean).join(", ") : "Local em definição"} />
                </div>
              </dl>

              <div className="mt-ingresso__picote" />

              <div style={{ padding: "22px 24px 26px", display: "flex", alignItems: "center", gap: 18 }}>
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img data-c="qr" src={qr} alt="QR Code do seu ingresso" width={132} height={132} style={{ width: 132, height: 132, flex: "none", borderRadius: 8 }} />
                ) : (
                  <div data-c="qr" style={{ width: 132, height: 132, flex: "none", borderRadius: 8, border: "2px dashed rgba(8,8,8,0.35)", display: "grid", placeItems: "center", textAlign: "center", font: "700 11px/1.4 var(--font-mt-mono), monospace", letterSpacing: "0.1em", color: "rgba(8,8,8,0.6)", padding: 10 }}>
                    QR CODE SAI COM A VAGA
                  </div>
                )}
                <div>
                  <p style={{ font: "500 10px/1.2 var(--font-mt-mono), monospace", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(8,8,8,0.55)" }}>Código da inscrição</p>
                  <p style={{ font: "700 24px/1.1 var(--font-mt-mono), monospace", letterSpacing: "0.04em", marginTop: 6, color: "#080808" }}>{ingresso.codigo}</p>
                  <p style={{ marginTop: 10, fontSize: 12, lineHeight: 1.4, color: "rgba(8,8,8,0.7)" }}>
                    {confirmada ? "Apresente este QR Code na recepção. Pessoal e intransferível." : `Posição ${ingresso.posicao_fila ?? "na fila"}. O ingresso chega por e-mail se a vaga abrir.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
