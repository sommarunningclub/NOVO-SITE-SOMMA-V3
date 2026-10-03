"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/lib/shopify/handles";
import type { Lookbook } from "@/lib/shopify/types";
import { formatMoney } from "../../_lib/format";
import { MEDIA, gsap, useGSAP } from "../../_motion";
import { QuickAdd } from "../QuickAdd";
import { ShopImg } from "../ShopImg";

/**
 * Lookbook horizontal. É rolagem nativa (dedo, trackpad, teclado, arrastar com
 * o mouse), não um carrossel: sem setas, sem bolinhas, sem sequestrar o scroll
 * da página. Enquanto a seção cruza a tela o trilho anda devagar sozinho; no
 * primeiro toque da pessoa o controle passa a ser dela e a deriva morre.
 */
export function LookbookRail({ lookbook }: { lookbook: Lookbook }) {
  const rail = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(1);
  const total = lookbook.images.length;

  // progresso e contador a partir da rolagem real
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = el.scrollWidth - el.clientWidth;
      const ratio = max > 0 ? el.scrollLeft / max : 0;
      el.parentElement?.style.setProperty("--lj-progress", String(Math.max(ratio, 1 / total)));
      setPosition(Math.min(total, Math.round(ratio * (total - 1)) + 1));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [total]);

  // arrastar com o mouse (toque e trackpad já rolam sozinhos)
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let startX = 0;
    let startLeft = 0;
    let dragging = false;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      dragging = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.dataset.dragging = "true";
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (dragging) el.scrollLeft = startLeft - (e.clientX - startX);
    };
    const up = () => {
      dragging = false;
      el.dataset.dragging = "false";
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  useGSAP(
    () => {
      const el = rail.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        const max = el.scrollWidth - el.clientWidth;
        if (max <= 0) return;
        const drift = gsap.to(el, {
          scrollLeft: max * 0.4,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
        });
        const release = () => {
          drift.scrollTrigger?.kill();
          drift.kill();
        };
        const events = ["pointerdown", "wheel", "touchstart", "keydown"] as const;
        events.forEach((name) => el.addEventListener(name, release, { once: true, passive: true }));
        return () => events.forEach((name) => el.removeEventListener(name, release));
      });
    },
    { scope: rail },
  );

  return (
    <section className="lj-section lj-white lj-lookbook" aria-labelledby="lookbook-titulo">
      <div className="lj-section__head">
        <div className="lj-stack lj-stack--s">
          <p className="lj-label">{lookbook.title}</p>
          {lookbook.subtitle ? (
            <h2 id="lookbook-titulo" className="lj-slab lj-slab--m">
              {lookbook.subtitle}
            </h2>
          ) : (
            <h2 id="lookbook-titulo" className="lj-sr">
              {lookbook.title}
            </h2>
          )}
        </div>
        <p className="lj-label lj-label--soft">
          {String(total).padStart(2, "0")} imagens / arraste <span aria-hidden="true">→</span>
        </p>
      </div>

      <div ref={rail} className="lj-rail" tabIndex={0} role="region" aria-label={`${lookbook.title}: ${total} imagens, role para o lado`}>
        {lookbook.images.map((image, i) => (
          <figure key={image.url} className="lj-rail__item" style={{ aspectRatio: `${image.width} / ${image.height}` }}>
            <ShopImg image={image} alt={image.altText ?? `Imagem ${i + 1} do lookbook`} sizes="(min-width: 48rem) 30vw, 70vw" />
          </figure>
        ))}
      </div>

      <div className="lj-lookbook__foot">
        <div className="lj-progress lj-label">
          <span>
            {String(position).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className="lj-progress__track" aria-hidden="true">
            <span className="lj-progress__bar" />
          </span>
        </div>

        {lookbook.products.length > 0 ? (
          <div className="lj-shoplook">
            <p className="lj-label">Neste lookbook</p>
            {lookbook.products.map((product) => (
              <div key={product.id} className="lj-shoplook__item">
                {product.image ? (
                  <div className="lj-shoplook__thumb">
                    <ShopImg image={product.image} alt="" sizes="58px" />
                  </div>
                ) : null}
                <div className="lj-shoplook__text">
                  <Link href={ROUTES.product(product.handle)}>{product.title}</Link>
                  <div>{formatMoney(product.price)}</div>
                </div>
                <QuickAdd product={product} inline />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
