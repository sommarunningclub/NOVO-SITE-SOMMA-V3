import Link from "next/link";
import { ROUTES } from "@/lib/shopify/handles";

/** 404 da loja, na voz da marca. */
export default function NotFound() {
  return (
    <section className="lj-state lj-dark">
      <p className="lj-label lj-label--soft">Erro 404</p>
      <h1 className="lj-display lj-display--l">
        You took
        <br />a wrong turn<span className="lj-dot">.</span>
      </h1>
      <p className="lj-annot">061 / Go back to the club</p>
      <div className="lj-hero__actions">
        <Link className="lj-btn lj-btn--accent" href={ROUTES.home}>
          Voltar para a loja
          <span className="lj-btn__arrow" aria-hidden="true">→</span>
        </Link>
        <Link className="lj-link" href={ROUTES.club}>
          Ir para o site do clube
        </Link>
      </div>
    </section>
  );
}
