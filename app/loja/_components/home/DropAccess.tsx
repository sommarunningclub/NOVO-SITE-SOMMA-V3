"use client";

import { useActionState } from "react";
import type { HomeContent } from "@/lib/shopify/types";
import { joinDropAccess, type DropAccessState } from "../../_actions/drop-access";
import { Lines } from "../Lines";

const IDLE: DropAccessState = { status: "idle" };

/**
 * DROP ACCESS: o cadastro de e-mail da loja. Bloco laranja inteiro, um dos
 * poucos momentos de laranja em área grande. Texto preto sobre laranja (5,4:1).
 */
export function DropAccess({ content, origem = "home" }: { content: HomeContent["newsletter"]; origem?: "home" | "archive" | "pdp" }) {
  const [state, action, pending] = useActionState(joinDropAccess, IDLE);

  return (
    <section className="lj-section lj-orange lj-access" aria-labelledby="drop-access-titulo">
      <p className="lj-label">Drop Access</p>
      <h2 id="drop-access-titulo" className="lj-display lj-display--l" data-reveal="lines">
        <Lines lines={content.headline} dot={false} />
      </h2>
      <div className="lj-access__row">
        <p className="lj-access__pitch">{content.text}</p>

        {state.status === "ok" ? (
          <p className="lj-access__pitch" role="status">
            Você está na lista. O próximo drop chega primeiro no seu e-mail.
          </p>
        ) : (
          <form className="lj-form" action={action} noValidate>
            <input type="hidden" name="origem" value={origem} />
            {/* honeypot: fora da tela e fora da ordem de tabulação */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="lj-sr" />
            <div className="lj-field">
              <label htmlFor="drop-access-email" className="lj-label">
                Seu e-mail
              </label>
              <input
                id="drop-access-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="voce@email.com"
                required
                aria-describedby="drop-access-nota"
                aria-invalid={state.status === "error"}
              />
            </div>
            <button type="submit" className="lj-btn" disabled={pending}>
              {pending ? "Enviando" : "Quero acesso"}
              <span className="lj-btn__arrow" aria-hidden="true">→</span>
            </button>
            <p id="drop-access-nota" className="lj-form__note" role={state.status === "error" ? "alert" : undefined}>
              {state.status === "error" ? state.message : null}
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
