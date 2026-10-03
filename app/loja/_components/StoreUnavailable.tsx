import Link from "next/link";
import { ROUTES } from "@/lib/shopify/handles";

/**
 * Loja sem Shopify (token ausente ou Shopify fora do ar no build). É uma tela
 * de marca, não uma mensagem técnica: o visitante sabe que volta logo e tem
 * para onde ir.
 */
export function StoreUnavailable() {
  return (
    <section className="lj-state lj-dark" style={{ minHeight: "86svh" }}>
      <p className="lj-label lj-label--soft">Loja</p>
      <h1 className="lj-display lj-display--l">
        Back soon<span className="lj-dot">.</span>
      </h1>
      <p className="lj-lead" style={{ maxWidth: "30rem" }}>
        A loja está fora do ar por instantes. O clube continua: todo sábado, às 7h, no Estacionamento 10 do Parque da Cidade.
      </p>
      <div className="lj-hero__actions">
        <Link className="lj-btn lj-btn--accent" href={ROUTES.club}>
          Ir para o site do clube
          <span className="lj-btn__arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
