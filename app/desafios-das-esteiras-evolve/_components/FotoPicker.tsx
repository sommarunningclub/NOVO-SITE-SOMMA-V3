"use client";

import { useEffect, useRef, useState } from "react";
import { UNIT_ACCENT } from "@/lib/desafio-esteiras/event.config";

const MAX_BYTES = 3 * 1024 * 1024;
const TIPOS = "image/jpeg,image/png,image/webp";

/**
 * Escolha da foto de perfil.
 *
 * O arquivo fica só em memória aqui: quem envia é quem usa o componente, depois
 * de já ter uma inscrição a que vincular a foto. O preview é um object URL,
 * revogado ao trocar de imagem para não vazar memória.
 *
 * A foto é opcional em todo lugar — sem ela a pessoa aparece na grade com a
 * inicial do nome sobre a cor da unidade.
 */
export function FotoPicker({
  nome,
  unitId,
  fotoAtualUrl,
  onChange,
  onRemover,
}: {
  nome: string;
  unitId: string;
  /** Foto já salva no servidor (tela de edição). */
  fotoAtualUrl?: string | null;
  onChange: (file: File | null) => void;
  /** Só na edição: marca a foto salva para remoção. */
  onRemover?: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [removida, setRemovida] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function selecionar(file: File | null) {
    setErro(null);
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setErro("A imagem precisa ter no máximo 3 MB.");
      if (input.current) input.current.value = "";
      return;
    }
    if (!TIPOS.split(",").includes(file.type)) {
      setErro("Envie uma foto em JPG, PNG ou WEBP.");
      if (input.current) input.current.value = "";
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setRemovida(false);
    onChange(file);
  }

  function limpar() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setErro(null);
    onChange(null);
    if (input.current) input.current.value = "";
    if (fotoAtualUrl && onRemover) {
      setRemovida(true);
      onRemover();
    }
  }

  const mostrando = preview ?? (removida ? null : fotoAtualUrl ?? null);
  // Na inscrição o nome ainda não foi digitado quando a foto é escolhida; um
  // "?" pareceria erro, então cai num ícone neutro até existir uma inicial.
  const inicial = nome.trim().charAt(0).toUpperCase();
  const cor = UNIT_ACCENT[unitId] ?? "#e0261b";

  return (
    <div>
      <div className="flex items-center gap-4">
        <span
          className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full"
          style={{ background: mostrando ? "transparent" : cor }}
          aria-hidden
        >
          {mostrando ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mostrando} alt="" className="h-full w-full object-cover" />
          ) : inicial ? (
            <span className="dst-display text-[1.9rem] leading-none text-[color:var(--ink)]">
              {inicial}
            </span>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={{ color: "var(--ink)" }}>
              <circle cx="12" cy="8.5" r="3.6" fill="currentColor" />
              <path d="M4.6 20.5c0-4 3.3-6.2 7.4-6.2s7.4 2.2 7.4 6.2" fill="currentColor" />
            </svg>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem]"
          >
            {mostrando ? "Trocar foto" : "Escolher foto"}
          </button>
          {mostrando && (
            <button
              type="button"
              onClick={limpar}
              className="dst-label ml-3 underline underline-offset-4 hover:text-[color:var(--somma)]"
            >
              remover
            </button>
          )}
          <p className="dst-label mt-2.5 leading-relaxed text-[color:rgba(242,240,236,0.4)]">
            Opcional · JPG, PNG ou WEBP até 3 MB
          </p>
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept={TIPOS}
        className="sr-only"
        onChange={(e) => selecionar(e.target.files?.[0] ?? null)}
      />

      {erro && (
        <p role="alert" className="dst-label mt-3 text-[color:var(--evolve)]">
          {erro}
        </p>
      )}
    </div>
  );
}
