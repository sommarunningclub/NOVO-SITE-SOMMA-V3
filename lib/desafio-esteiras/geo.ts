import { UNITS, type EventUnit } from "./event.config";

export type LatLng = { lat: number; lng: number };

export type GeoSnap =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "ok"; pos: LatLng; nearest: EventUnit; km: number }
  | { status: "denied" }
  | { status: "unsupported" }
  | { status: "error"; reason: "timeout" | "unavailable" | "unknown" };

const RAIO_TERRA_KM = 6371;

/** Distância em linha reta (haversine). */
export function distanciaKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function unidadeMaisProxima(
  from: LatLng,
  units: readonly EventUnit[] = UNITS,
): { unit: EventUnit; km: number } {
  let melhor = units[0];
  let menor = distanciaKm(from, { lat: melhor.latitude, lng: melhor.longitude });
  for (let i = 1; i < units.length; i++) {
    const u = units[i];
    const km = distanciaKm(from, { lat: u.latitude, lng: u.longitude });
    if (km < menor) {
      melhor = u;
      menor = km;
    }
  }
  return { unit: melhor, km: menor };
}

export function formatarDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${(Math.round(km * 10) / 10).toFixed(1).replace(".", ",")} km`;
  return `${Math.round(km)} km`;
}

/**
 * Fora da mancha DF/GO o pin ainda cai numa Evolve — a copy muda de tom.
 * Luziânia fica ~50 km de Vicente Pires; 80 km cobre o entorno e corta outro estado.
 */
export function foraDaRegiao(km: number): boolean {
  return km > 80;
}

/** Até ~2,5 km a gente manda a pé — combina com “pode correr até lá”. */
export function modoRota(km: number): "walking" | "driving" {
  return km < 2.5 ? "walking" : "driving";
}

export function rotaGoogleUrl(
  unit: EventUnit,
  origin?: LatLng | null,
  travelmode: "driving" | "walking" = "driving",
): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${unit.latitude},${unit.longitude}`,
    travelmode,
  });
  if (origin) {
    params.set("origin", `${origin.lat},${origin.lng}`);
    params.set("dir_action", "navigate");
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function interpretarGeoError(code: number): Extract<GeoSnap, { status: "denied" | "error" }> {
  if (code === 1) return { status: "denied" };
  if (code === 3) return { status: "error", reason: "timeout" };
  if (code === 2) return { status: "error", reason: "unavailable" };
  return { status: "error", reason: "unknown" };
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
