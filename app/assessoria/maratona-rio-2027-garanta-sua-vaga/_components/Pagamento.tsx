"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Check, Copy, FileCheck2, Loader2, Mail, Paperclip } from "lucide-react";
import {
  COMPROVANTE_MAX_BYTES,
  EMAIL_SAC,
  PIX,
  VALOR_ESTRUTURA,
  VALOR_INSCRICAO,
  reais,
} from "@/lib/maratona-rio-2027/inscricao";
import { cn } from "@/lib/utils";

export interface DadosPagamento {
  resultado: "inscrito" | "atualizado";
  id: number;
  token: string;
  total: number;
  estrutura: boolean;
  pago: boolean;
  comprovante: boolean;
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

/**
 * Foto de celular passa fácil de 4 MB. Imagens grandes são redesenhadas em
 * JPEG de até 2000 px antes de subir; um comprovante continua legível.
 */
async function prepararArquivo(arquivo: File): Promise<File> {
  if (!arquivo.type.startsWith("image/") || arquivo.size <= 1.5 * 1024 * 1024) return arquivo;
  try {
    const imagem = await createImageBitmap(arquivo);
    const escala = Math.min(1, 2000 / Math.max(imagem.width, imagem.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imagem.width * escala);
    canvas.height = Math.round(imagem.height * escala);
    canvas.getContext("2d")!.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    return blob ? new File([blob], "comprovante.jpg", { type: "image/jpeg" }) : arquivo;
  } catch {
    return arquivo;
  }
}

function AnexarComprovante({ id, token, jaEnviado }: { id: number; token: string; jaEnviado: boolean }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [fase, setFase] = useState<"livre" | "enviando" | "enviado">(jaEnviado ? "enviado" : "livre");
  const [erro, setErro] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    e.target.value = "";
    if (!original) return;
    setErro(null);
    setFase("enviando");
    const arquivo = await prepararArquivo(original);
    if (arquivo.size > COMPROVANTE_MAX_BYTES) {
      setErro("O arquivo precisa ter no máximo 4 MB. Tente um print da tela.");
      setFase(jaEnviado || nomeArquivo ? "enviado" : "livre");
      return;
    }
    const form = new FormData();
    form.set("id", String(id));
    form.set("token", token);
    form.set("arquivo", arquivo);
    try {
      const res = await fetch("/api/maratona-rio-2027/comprovante", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu certo. Tente de novo.");
      setNomeArquivo(original.name);
      setFase("enviado");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Sem conexão. Tente de novo.");
      setFase(jaEnviado || nomeArquivo ? "enviado" : "livre");
    }
  }

  return (
    <div>
      <input
        ref={entrada}
        type="file"
        accept="image/*,application/pdf"
        onChange={escolher}
        className="sr-only"
        aria-label="Arquivo do comprovante"
      />
      {fase === "enviado" ? (
        <div className="rounded-2xl border border-bora/50 bg-bora/10 p-4">
          <p className="flex items-center gap-2 font-medium text-bora">
            <FileCheck2 className="h-5 w-5" /> Comprovante recebido
          </p>
          <p className="mt-1 text-sm text-white/65">
            {nomeArquivo ? `${nomeArquivo}. ` : ""}A equipe da BORA confere e confirma a sua inscrição.
          </p>
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="mt-3 text-sm text-white/60 underline underline-offset-4 hover:text-white"
          >
            Enviar outro arquivo
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={fase === "enviando"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-bora px-6 py-4 font-bora text-base font-bold uppercase text-black transition-colors hover:bg-white disabled:opacity-60"
        >
          {fase === "enviando" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Enviando...
            </>
          ) : (
            <>
              <Paperclip className="h-5 w-5" /> Anexar comprovante
            </>
          )}
        </button>
      )}
      {erro && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {erro}
        </p>
      )}
    </div>
  );
}

export function Pagamento({
  dados,
  nome,
  onNovaInscricao,
}: {
  dados: DadosPagamento;
  nome: string;
  onNovaInscricao?: () => void;
}) {
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
          A inscrição só vale depois do pagamento. Pague e anexe o comprovante aqui embaixo.
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

      <div className="px-6 pt-7 sm:px-10">
        <p className="font-bora text-sm font-bold uppercase tracking-widest text-bora">1. Pague o Pix</p>
      </div>
      <div className="mt-4 grid gap-6 px-6 pb-6 sm:grid-cols-[180px_1fr] sm:items-center sm:px-10">
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
          <p className="pt-1 text-sm text-white/50">
            Recebedor: <span className="text-white">{PIX.recebedor}</span>
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-6 sm:px-10">
        <p className="text-sm text-white/60">Prefere digitar o valor? Use a chave Pix (e-mail):</p>
        <p className="mt-2 break-all rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm">
          {PIX.chave}
        </p>
        <div className="mt-3">
          <Copiar texto={PIX.chave} rotulo="Copiar chave Pix" />
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/30 px-6 py-6 sm:px-10">
        <p className="font-bora text-sm font-bold uppercase tracking-widest text-bora">2. Anexe o comprovante</p>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Print da tela, foto ou PDF do comprovante. A equipe da BORA confere e confirma a sua inscrição.
        </p>
        <div className="mt-4">
          <AnexarComprovante id={dados.id} token={dados.token} jaEnviado={dados.comprovante} />
        </div>
        <a
          href={mailto}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <Mail className="h-4 w-4" /> Prefere mandar por e-mail? {EMAIL_SAC}
        </a>
      </div>

      {onNovaInscricao && (
        <div className="border-t border-white/10 px-6 py-4 text-center sm:px-10">
          <button
            type="button"
            onClick={onNovaInscricao}
            className="text-sm text-white/45 underline underline-offset-4 hover:text-white"
          >
            Inscrever outra pessoa
          </button>
        </div>
      )}
    </div>
  );
}
