"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Loader2, MessageCircle, X } from "lucide-react";
import { coletarRastreio } from "@/lib/nova-assessoria/rastreio-cliente";
import { cn } from "@/lib/utils";

/**
 * Botão "falar com um professor" das páginas da BORA.
 *
 * Abre um formulário curto (nome e WhatsApp), registra o contato com toda a
 * origem e manda a pessoa para o WhatsApp do professor, com a mensagem já
 * escrita. Em /assessoria quem escolhe o professor é o rodízio do servidor; no
 * link de um professor, é ele.
 */

interface Props {
  /** 'assessoria' ou 'bio-<slug>'. */
  pagina: string;
  rotulo: string;
  /** Primeiro nome do professor, quando a página é dele. */
  professor?: string;
  variante?: "verde" | "preto" | "contorno";
  className?: string;
}

type Estado =
  | { fase: "preenchendo"; erro?: string }
  | { fase: "enviando" }
  | { fase: "pronto"; url: string; professor: string };

function mascaraWhatsapp(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function ContatoBora({ pagina, rotulo, professor, variante = "verde", className }: Props) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [estado, setEstado] = useState<Estado>({ fase: "preenchendo" });
  const primeiroCampo = useRef<HTMLInputElement>(null);
  const titulo = useId();

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    primeiroCampo.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 2) return setEstado({ fase: "preenchendo", erro: "Digite seu nome." });
    if (whatsapp.replace(/\D/g, "").length < 10) {
      return setEstado({ fase: "preenchendo", erro: "Digite seu WhatsApp com DDD." });
    }

    setEstado({ fase: "enviando" });
    try {
      const res = await fetch("/api/nova-assessoria/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagina, nome, whatsapp, empresa, rastreio: coletarRastreio() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        return setEstado({ fase: "preenchendo", erro: data.error || "Não deu certo. Tente de novo." });
      }
      setEstado({ fase: "pronto", url: data.url, professor: data.professor?.primeiroNome ?? "o professor" });
      window.location.assign(data.url);
    } catch {
      setEstado({ fase: "preenchendo", erro: "Sem conexão. Tente de novo." });
    }
  }

  const erro = estado.fase === "preenchendo" ? estado.erro : undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 font-bora text-base font-bold uppercase tracking-wide transition-transform active:scale-[0.98]",
          variante === "verde" && "bg-bora text-black hover:bg-white",
          variante === "preto" && "bg-black text-bora hover:bg-white hover:text-black",
          variante === "contorno" && "border-2 border-bora text-bora hover:bg-bora hover:text-black",
          className
        )}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        {rotulo}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="presentation">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setAberto(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titulo}
            className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0b0b0b] px-6 pb-8 pt-7 text-white sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar"
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {estado.fase === "pronto" ? (
              <div className="py-4 text-center">
                <p className="font-bora text-sm font-bold uppercase tracking-widest text-bora">Tudo certo</p>
                <h2 id={titulo} className="mt-3 font-bora text-3xl font-black uppercase italic leading-none">
                  Abrindo a conversa com {estado.professor}
                </h2>
                <p className="mt-4 text-sm text-white/60">Se o WhatsApp não abrir sozinho, toque no botão.</p>
                <a
                  href={estado.url}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-bora px-6 py-4 font-bora font-bold uppercase text-black"
                >
                  Abrir o WhatsApp <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            ) : (
              <form onSubmit={enviar} noValidate>
                <p className="font-bora text-sm font-bold uppercase tracking-widest text-bora">BORA Assessoria</p>
                <h2 id={titulo} className="mt-2 font-bora text-3xl font-black uppercase italic leading-none">
                  {professor ? `Fale com ${professor}` : "Fale com um professor"}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Deixe seu nome e WhatsApp. Em seguida abrimos a conversa com{" "}
                  {professor ?? "um professor BORA"} no WhatsApp.
                </p>

                <label className="mt-6 block text-sm font-medium text-white/80">
                  Seu nome
                  <input
                    ref={primeiroCampo}
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      setEstado({ fase: "preenchendo" });
                    }}
                    autoComplete="name"
                    maxLength={80}
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white outline-none placeholder:text-white/30 focus:border-bora"
                    placeholder="Como você se chama"
                  />
                </label>
                <label className="mt-4 block text-sm font-medium text-white/80">
                  Seu WhatsApp
                  <input
                    value={whatsapp}
                    onChange={(e) => {
                      setWhatsapp(mascaraWhatsapp(e.target.value));
                      setEstado({ fase: "preenchendo" });
                    }}
                    autoComplete="tel-national"
                    inputMode="tel"
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white outline-none placeholder:text-white/30 focus:border-bora"
                    placeholder="(61) 99999-9999"
                  />
                </label>
                {/* Isca para robô: fora da tela e fora do tab. */}
                <input
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                />

                {erro && (
                  <p role="alert" className="mt-4 text-sm text-red-400">
                    {erro}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={estado.fase === "enviando"}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-bora px-6 py-4 font-bora font-bold uppercase text-black transition-colors hover:bg-white disabled:opacity-60"
                >
                  {estado.fase === "enviando" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Ir para o WhatsApp <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
                <p className="mt-4 text-center text-xs text-white/40">
                  Usamos seus dados só para este contato.{" "}
                  <a href="/politica-de-privacidade" className="underline hover:text-white/70">
                    Política de privacidade
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
