"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { LEVAR } from "@/lib/dexcomplica-love-run/event.config";
import { movimentoReduzido } from "@/lib/dexcomplica-love-run/motion";

const CHAVE = "love-run:mochila";

/**
 * "Na mochila" como checklist de verdade: cada item marca e fica marcado
 * neste aparelho. Tudo marcado = mochila pronta (com festa, se houver
 * movimento).
 */
export default function Mochila() {
  const [feitos, setFeitos] = useState<string[]>([]);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
      if (Array.isArray(v)) setFeitos(v.filter((x) => typeof x === "string"));
    } catch {
      setFeitos([]);
    }
  }, []);

  const pronta = LEVAR.every((l) => feitos.includes(l.item));

  const alternar = (item: string, el: HTMLElement) => {
    const novo = feitos.includes(item) ? feitos.filter((f) => f !== item) : [...feitos, item];
    setFeitos(novo);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(novo));
    } catch {
      /* modo privado */
    }
    if (!movimentoReduzido()) {
      gsap.fromTo(el.querySelector(".lr-levar__coracao"), { scale: 0.4 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)" });
      if (LEVAR.every((l) => novo.includes(l.item))) {
        gsap.fromTo(".lr-levar", { rotate: -1.5 }, { rotate: 1.5, duration: 0.12, yoyo: true, repeat: 5, ease: "sine.inOut", onComplete: () => { gsap.to(".lr-levar", { rotate: -1.5, duration: 0.3 }); } });
      }
    }
    navigator.vibrate?.(12);
  };

  return (
    <div className="lr-levar" data-revelar data-pronta={pronta}>
      <h3 className="lr-levar__titulo">{pronta ? "Mochila pronta!" : "Na mochila"}</h3>
      <p className="lr-levar__dica">{pronta ? "Agora é só chegar com o coração no ritmo." : "Toque para marcar o que já separou."}</p>
      <ul>
        {LEVAR.map((l) => {
          const marcado = feitos.includes(l.item);
          return (
            <li key={l.item}>
              <button type="button" aria-pressed={marcado} onClick={(e) => alternar(l.item, e.currentTarget)}>
                <svg viewBox="0 0 24 22" aria-hidden="true" className="lr-levar__coracao">
                  <path d="M12 21.2 10.4 19.8C4.6 14.6.8 11.2.8 7A5.9 5.9 0 0 1 6.8 1c1.9 0 3.7.9 5.2 2.3A7.3 7.3 0 0 1 17.2 1a5.9 5.9 0 0 1 6 6c0 4.2-3.8 7.6-9.6 12.8Z" />
                </svg>
                <span>
                  <strong>{l.item}</strong>
                  <span>{l.detalhe}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
