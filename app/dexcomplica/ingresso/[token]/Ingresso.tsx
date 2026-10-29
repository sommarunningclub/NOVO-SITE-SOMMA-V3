"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  DATA_EXTENSO,
  EVENTO_NOME,
  EVENTO_URL,
  HORARIO,
  LOCAL_AFTER,
  LOCAL_CORRE,
  urlComoChegar,
  GRUPO_WHATSAPP,
} from "@/lib/dexcomplica-love-run/event.config";
import { rastrear } from "@/lib/dexcomplica-love-run/analytics";
import { movimentoReduzido, useGsap } from "@/lib/dexcomplica-love-run/motion";
import { lembrarIngresso } from "../../_components/meuIngresso";
import { Equalizador } from "../../_components/Graficos";
import AdicionarAgenda from "../../_components/AdicionarAgenda";
import Interacoes from "../../_components/Interacoes";
import { desenharIngresso } from "./imagem";
import GrupoWhatsapp, { IconeWhatsapp } from "./GrupoWhatsapp";

interface Props {
  nome: string;
  pelotao: string | null;
  codigo: string;
  qr: string;
  presenteEm: string | null;
  novo: boolean;
  emailEnviado: boolean;
}

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export default function Ingresso({ nome, pelotao, codigo, qr, presenteEm, novo, emailEnviado }: Props) {
  const [aviso, setAviso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const primeiro = nome.trim().split(/\s+/)[0];

  useEffect(() => {
    lembrarIngresso(window.location.pathname);
    rastrear("ingresso_visualizado", { novo });
    // Tira ?novo/&email da barra: atualizar ou compartilhar não repete o "acabou de se inscrever".
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }, [novo]);

  const ref = useGsap<HTMLElement>(({ gsap, root }) => {
    if (movimentoReduzido()) return;
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(root.querySelectorAll("[data-linha]"), { yPercent: 110, duration: 1, stagger: 0.08 })
      .from(root.querySelector(".lr-passe"), { y: 120, rotate: -8, opacity: 0, duration: 1.2, ease: "back.out(1.4)" }, 0.2)
      .from(root.querySelector(".lr-passe__qr"), { scale: 0.6, opacity: 0, duration: 0.7, ease: "back.out(2)" }, 0.75)
      .from(root.querySelectorAll(".lr-coracoes span"), {
        scale: 0, opacity: 0, x: 0, y: 0, duration: 1.1, stagger: 0.04, ease: "power4.out",
      }, 0.7)
      .to(root.querySelectorAll(".lr-coracoes span"), { opacity: 0, duration: 0.8, stagger: 0.03 }, 1.6)
      .from(root.querySelectorAll("[data-entra]"), { y: 20, opacity: 0, stagger: 0.06, duration: 0.7 }, 0.9);
  });

  const avisar = (t: string) => {
    setAviso(t);
    window.setTimeout(() => setAviso(""), 3500);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      avisar("Código copiado.");
      rastrear("codigo_copiado");
    } catch {
      avisar(`Seu código: ${codigo}`);
    }
  };

  const salvarImagem = async () => {
    if (salvando) return;
    setSalvando(true);
    try {
      const svg = qrRef.current?.querySelector("svg");
      if (!svg) throw new Error("QR ausente");
      const blob = await desenharIngresso({ nome, pelotao, codigo, svgQr: new XMLSerializer().serializeToString(svg) });
      const arquivo = new File([blob], `ingresso-love-run-${codigo}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare?.({ files: [arquivo] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
        await navigator.share({ files: [arquivo], title: EVENTO_NOME });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = arquivo.name;
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      rastrear("ingresso_salvo", { formato: "png" });
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") avisar("Não deu para gerar a imagem. Tire um print da tela: o QR funciona igual.");
    } finally {
      setSalvando(false);
    }
  };

  const compartilharEvento = async () => {
    const dados = { title: EVENTO_NOME, text: "Bora no Dexcomplica Love Run? Gratuito, vagas limitadas.", url: EVENTO_URL };
    try {
      if (navigator.share) await navigator.share(dados);
      else {
        await navigator.clipboard.writeText(EVENTO_URL);
        avisar("Link do evento copiado.");
      }
      rastrear("evento_compartilhado");
    } catch {
      /* cancelado pela pessoa */
    }
  };

  return (
    <main ref={ref} className="lr-ing">
      <Interacoes />
      <GrupoWhatsapp />
      <div className="lr-ing__topo">
        <p className="lr-eyebrow lr-eyebrow--claro">{novo ? "Inscrição confirmada" : EVENTO_NOME}</p>
        <h1 className="lr-ing__titulo">
          <span className="lr-capa__mascara"><span data-linha>{novo ? "Você está" : `${primeiro},`}</span></span>
          <span className="lr-capa__mascara"><span data-linha className="lr-ing__vermelho">{novo ? "dentro." : "seu ingresso."}</span></span>
        </h1>
        <p className="lr-lead lr-lead--claro" data-entra>
          Seu coração já está no ritmo. Agora é só preparar o tênis e vir viver o Dexcomplica Love Run com a gente.
        </p>
        {novo ? (
          <p className="lr-ing__email" data-entra>
            {emailEnviado
              ? "Também mandamos este ingresso para o seu e-mail."
              : "Guarde este ingresso: salve a imagem ou o link desta página. Se precisar, ele pode ser reenviado para o seu e-mail pela página do evento."}
          </p>
        ) : null}
      </div>

      <div className="lr-ing__palco">
        <div className="lr-coracoes" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} style={{ "--a": `${i * 30}deg` } as React.CSSProperties} />
          ))}
        </div>

        <article className="lr-passe" aria-label={`Ingresso de ${nome}`} data-tilt="7">
          <header className="lr-passe__cab">
            <Image src="/dexcomplica-love-run/marca/dex-logo.png" alt="Dexcomplica" width={900} height={194} className="lr-passe__logo" />
            <p className="lr-passe__evento">
              Love Run <Equalizador />
            </p>
            <p className="lr-passe__realiza">Somma Club × Dexcomplica · produção Monu</p>
          </header>

          <div className="lr-passe__corpo">
            <p className="lr-passe__rot">Participante</p>
            <p className="lr-passe__nome">{nome}</p>
            <dl className="lr-passe__dados">
              <div>
                <dt>Data</dt>
                <dd>{DATA_EXTENSO}</dd>
              </div>
              {HORARIO.concentracao ? (
                <div>
                  <dt>Concentração</dt>
                  <dd>{HORARIO.concentracao}</dd>
                </div>
              ) : null}
              <div>
                <dt>Pelotão</dt>
                <dd>{pelotao ?? "—"}</dd>
              </div>
              <div className="lr-passe__largo">
                <dt>Local</dt>
                <dd>{LOCAL_CORRE.nome}</dd>
              </div>
            </dl>
          </div>

          <div className="lr-passe__picote" aria-hidden="true" />

          <div className="lr-passe__rodape">
            <div ref={qrRef} className="lr-passe__qr" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="lr-passe__rot">Código de check-in</p>
            <p className="lr-passe__codigo">{codigo}</p>
            <p className="lr-passe__dica">Apresente este QR Code (ou o código) no check-in.</p>
            {presenteEm ? <p className="lr-passe__carimbo">Check-in feito às {hora(presenteEm)}</p> : null}
          </div>
        </article>
      </div>

      <div className="lr-ing__acoes" data-entra>
        <a
          className="lr-btn lr-btn--whatsapp"
          href={GRUPO_WHATSAPP.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => rastrear("grupo_whatsapp_clicado", { origem: "ingresso" })}
        >
          <IconeWhatsapp className="lr-btn__icone" />
          Grupo do evento no WhatsApp
        </a>
        <button type="button" className="lr-btn lr-btn--vermelho" onClick={salvarImagem} disabled={salvando}>
          {salvando ? "Gerando imagem…" : "Salvar ingresso"}
        </button>
        <button type="button" className="lr-btn lr-btn--branco" onClick={copiar}>
          Copiar código
        </button>
        <a
          className="lr-btn lr-btn--contorno"
          href={urlComoChegar(LOCAL_CORRE)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => rastrear("como_chegar", { origem: "ingresso" })}
        >
          Como chegar
        </a>
        <AdicionarAgenda pessoal origem="ingresso" className="lr-btn lr-btn--contorno lr-btn--bloco" />
        <button type="button" className="lr-btn lr-btn--contorno" onClick={compartilharEvento}>
          Convidar alguém
        </button>
        <button type="button" className="lr-ing__imprimir" onClick={() => window.print()}>
          Imprimir ou salvar em PDF
        </button>
      </div>
      <p className="lr-ing__aviso" role="status" aria-live="polite">{aviso}</p>

      <section className="lr-ing__info" aria-label="Antes do corre" data-entra>
        <h2>Antes do corre</h2>
        <ul>
          <li>
            <strong>Horário:</strong> {HORARIO.concentracao ? `concentração às ${HORARIO.concentracao}.` : "vamos divulgar no @somma.club e na página do evento."}
          </li>
          <li>
            <strong>After no {LOCAL_AFTER.nome}:</strong> leve roupa de banho e uma segunda roupa. Tem ducha e vestiários.
          </li>
          <li>
            <strong>Festa Dexcomplica:</strong> quem estiver presente no corre terá uma condição especial. Os detalhes saem em breve.
          </li>
          <li>
            <strong>Este ingresso é pessoal.</strong> Para chamar amigos, use “Convidar alguém”: ele compartilha o evento, não o seu QR.
          </li>
        </ul>
        <Link href="/dexcomplica" className="lr-link-seta lr-link-seta--claro">
          Voltar para o evento
        </Link>
      </section>
    </main>
  );
}
