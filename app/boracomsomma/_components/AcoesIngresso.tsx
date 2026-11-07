"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Download, Loader2, Share2 } from "lucide-react";
import { guardarIngresso } from "./RetirarIngresso";

type Props = {
  token: string;
  codigo: string;
  primeiroNome: string;
  pelotao: string;
  agendaGoogle: string;
};

/**
 * Retirada do ingresso: baixar o PNG, mandar para os stories (compartilhamento
 * nativo com o arquivo, quando o aparelho deixa) e guardar na agenda.
 */
export function AcoesIngresso({ token, codigo, primeiroNome, pelotao, agendaGoogle }: Props) {
  const [podeCompartilharArquivo, setPodeCompartilharArquivo] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const imagem = `/boracomsomma/ingresso/imagem?t=${encodeURIComponent(token)}`;
  const nomeArquivo = `ingresso-bora-com-somma-${codigo}.png`;

  useEffect(() => {
    guardarIngresso(token, primeiroNome, pelotao);
    try {
      const teste = new File([""], "x.png", { type: "image/png" });
      setPodeCompartilharArquivo(!!navigator.canShare?.({ files: [teste] }));
    } catch {
      setPodeCompartilharArquivo(false);
    }
  }, [token, primeiroNome, pelotao]);

  async function compartilhar() {
    setCompartilhando(true);
    try {
      const blob = await fetch(imagem).then((r) => r.blob());
      const arquivo = new File([blob], nomeArquivo, { type: "image/png" });
      await navigator.share({
        files: [arquivo],
        text: "Eu vou no BORA com SOMMA! Sábado, 14/11, no Parque da Cidade. sommaclub.com.br/boracomsomma",
      });
    } catch {
      /* cancelado ou sem suporte: nada a fazer */
    } finally {
      setCompartilhando(false);
    }
  }

  const botao = "inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 font-bold transition";

  return (
    <div className="grid gap-3">
      <a href={`${imagem}&baixar=1`} download={nomeArquivo} className={`${botao} bg-bora text-black hover:brightness-110`}>
        <Download className="h-5 w-5" /> Baixar meu ingresso
      </a>
      {podeCompartilharArquivo && (
        <button type="button" onClick={compartilhar} disabled={compartilhando} className={`${botao} border border-white/25 text-white hover:bg-white/10`}>
          {compartilhando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />} Postar nos stories
        </button>
      )}
      <div className="grid grid-cols-2 gap-3">
        <a href={agendaGoogle} target="_blank" rel="noopener noreferrer" className={`${botao} border border-white/25 whitespace-nowrap px-3 text-sm text-white hover:bg-white/10`}>
          <CalendarPlus className="h-4 w-4" /> Agenda Google
        </a>
        <a href="/boracomsomma/agenda.ics" className={`${botao} border border-white/25 whitespace-nowrap px-3 text-sm text-white hover:bg-white/10`}>
          <CalendarPlus className="h-4 w-4" /> Agenda iPhone
        </a>
      </div>
    </div>
  );
}
