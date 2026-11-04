"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { EMAIL_SAC, PIX, VALOR_ESTRUTURA, VALOR_INSCRICAO, reais } from "@/lib/maratona-rio-2027/inscricao";
import { cn } from "@/lib/utils";

export interface DadosPagamento {
  resultado: "inscrito" | "atualizado";
  id: number;
  total: number;
  estrutura: boolean;
  pago: boolean;
  pix: string;
  qrSvg: string;
}

/** Botão que copia um texto e mostra "Copiado" por um instante. */
function Copiar({ texto, rotulo, destaque }: { texto: string; rotulo: string; destaque?: boolean }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Navegador sem clipboard API (ou sem permissão): seleção manual.
      const area = document.createElement("textarea");
      area.value = texto;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-bora text-base font-bold uppercase transition-colors",
        destaque ? "bg-bora text-black hover:bg-white" : "border border-white/20 text-white hover:border-white/50",
        copiado && "bg-white text-black"
      )}
    >
      {copiado ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
      {copiado ? "Copiado!" : rotulo}
    </button>
  );
}

export function Pagamento({ dados, nome }: { dados: DadosPagamento; nome: string }) {
  const assunto = `Comprovante · Meia Maratona do Rio 2027 · ${nome}`;
  const corpo = `Olá! Segue o comprovante do Pix da minha inscrição na Meia Maratona do Rio 2027.\n\nNome: ${nome}\nInscrição: MDR27I${dados.id}\nValor: ${reais(dados.total)}${dados.estrutura ? " (inscrição + estrutura de apoio)" : ""}\n`;
  const mailto = `mailto:${EMAIL_SAC}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;

  if (dados.pago) {
    return (
      <div className="rounded-3xl border border-bora/40 bg-bora/[0.06] px-6 py-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-bora text-black">
          <Check className="h-7 w-7" strokeWidth={3} />
        </span>
        <h3 className="mt-6 font-bora text-3xl font-black uppercase italic leading-none">Pagamento já confirmado</h3>
        <p className="mt-4 text-white/70">
          Atualizamos os seus dados. A sua vaga continua garantida, não precisa pagar de novo.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-bora/40 bg-bora/[0.04]">
      <div className="px-6 pt-8 text-center sm:px-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bora text-black">
          <Check className="h-6 w-6" strokeWidth={3} />
        </span>
        <p className="mt-5 font-bora text-sm font-bold uppercase tracking-widest text-bora">
          {dados.resultado === "atualizado" ? "Dados atualizados, vaga mantida" : "Vaga reservada"}
        </p>
        <h3 className="mt-2 font-bora text-3xl font-black uppercase italic leading-none sm:text-4xl">
          Agora é só pagar o Pix
        </h3>
        <p className="mt-3 text-sm text-white/60">
          A inscrição só vale depois do pagamento. Não feche esta tela antes de pagar.
        </p>
      </div>

      <div className="mx-6 mt-7 rounded-2xl border border-white/10 bg-black/40 p-5 sm:mx-10">
        <div className="flex justify-between text-sm text-white/70">
          <span>Inscrição · 21 km sem camisa</span>
          <span className="tabular-nums">{reais(VALOR_INSCRICAO)}</span>
        </div>
        {dados.estrutura && (
          <div className="mt-2 flex justify-between text-sm text-white/70">
            <span>Estrutura de apoio BORA no Rio</span>
            <span className="tabular-nums">{reais(VALOR_ESTRUTURA)}</span>
          </div>
        )}
        <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-3">
          <span className="font-medium">Total</span>
          <span className="font-bora text-3xl font-black italic text-bora tabular-nums">{reais(dados.total)}</span>
        </div>
      </div>

      <div className="mt-7 grid gap-6 px-6 pb-8 sm:grid-cols-[180px_1fr] sm:items-center sm:px-10">
        <div
          className="mx-auto w-48 rounded-2xl bg-white p-3 sm:w-full [&_svg]:h-auto [&_svg]:w-full"
          role="img"
          aria-label={`QR Code do Pix de ${reais(dados.total)}`}
          // SVG gerado no servidor pela lib qrcode, a partir do código Pix.
          dangerouslySetInnerHTML={{ __html: dados.qrSvg }}
        />
        <div className="space-y-3">
          <p className="text-sm text-white/60">
            No app do banco: <strong className="text-white">Pix copia e cola</strong>. O valor já vem preenchido.
          </p>
          <Copiar texto={dados.pix} rotulo="Copiar código Pix" destaque />
          <dl className="space-y-1 pt-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-white/50">Recebedor</dt>
              <dd className="text-right">{PIX.recebedor}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/50">Instituição</dt>
              <dd className="text-right">{PIX.instituicao}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-6 sm:px-10">
        <p className="text-sm text-white/60">Prefere digitar o valor? Use a chave Pix:</p>
        <p className="mt-2 break-all rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm">
          {PIX.chave}
        </p>
        <div className="mt-3">
          <Copiar texto={PIX.chave} rotulo="Copiar chave Pix" />
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/30 px-6 py-6 sm:px-10">
        <p className="font-bora text-sm font-bold uppercase tracking-widest text-bora">Depois de pagar</p>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Mande o comprovante para <strong className="text-white">{EMAIL_SAC}</strong>. A equipe confere e confirma a sua
          inscrição.
        </p>
        <a
          href={mailto}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-4 font-bora font-bold uppercase hover:border-white/50"
        >
          <Mail className="h-5 w-5" /> Enviar comprovante
        </a>
      </div>
    </div>
  );
}
