"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { SOMMA } from "@/lib/somma-data";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function StyledMap({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!KEY) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    setOptions({ key: KEY, v: "weekly", language: "pt-BR", region: "BR" });

    (async () => {
      try {
        const { Map, OverlayView } = await importLibrary("maps");
        if (cancelled || !ref.current) return;

        const map = new Map(ref.current, {
          center: SOMMA.geo,
          zoom: 18,
          mapTypeId: "satellite",
          tilt: 0,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
        });

        // Ponto pulsante exatamente na coordenada do SOMMA (OverlayView + CSS).
        class PulseOverlay extends OverlayView {
          private el: HTMLDivElement | null = null;
          constructor(private position: google.maps.LatLngLiteral) {
            super();
          }
          onAdd() {
            this.el = document.createElement("div");
            this.el.className = "somma-map-pulse";
            this.getPanes()?.overlayMouseTarget.appendChild(this.el);
          }
          draw() {
            const proj = this.getProjection();
            if (!proj || !this.el) return;
            const p = proj.fromLatLngToDivPixel(
              new google.maps.LatLng(this.position.lat, this.position.lng)
            );
            if (p) {
              this.el.style.left = `${p.x}px`;
              this.el.style.top = `${p.y}px`;
            }
          }
          onRemove() {
            this.el?.remove();
            this.el = null;
          }
        }

        const overlay = new PulseOverlay(SOMMA.geo);
        overlay.setMap(map);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-white text-center text-muted ${className ?? ""}`}>
        Mapa indisponível — configure a chave do Google Maps.
      </div>
    );
  }

  return <div ref={ref} className={className} aria-label="Mapa do ponto de encontro do SOMMA Club" />;
}
