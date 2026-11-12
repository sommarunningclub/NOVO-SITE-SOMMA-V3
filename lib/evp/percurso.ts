import { DISTANCIAS, type DistanciaBase } from "./config";
import type { Coordenada } from "./tipos";

/**
 * Percursos: leitura de arquivo georreferenciado e contas sobre a linha.
 * Funções puras, usadas no servidor (envio do arquivo) e no mapa (posição de
 * um quilômetro sobre o traçado).
 *
 * O site só desenha percurso que veio de arquivo com geometria (GPX, KML ou
 * GeoJSON). Não existe caminho para "desenhar por cima" de um PDF nem para
 * pedir a rota ao Google: sem arquivo, a página mostra o mapa oficial em PDF.
 */

const R = 6371008.8;
const rad = (g: number) => (g * Math.PI) / 180;

export function distanciaMetros(a: Coordenada, b: Coordenada): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function comprimentoMetros(linha: Coordenada[]): number {
  let total = 0;
  for (let i = 1; i < linha.length; i++) total += distanciaMetros(linha[i - 1], linha[i]);
  return total;
}

/**
 * Ponto sobre a linha a `km` da largada, com o comprimento medido ajustado ao
 * oficial (o GPS mede um pouco a mais ou a menos). Fora da linha, devolve null.
 */
export function pontoNoKm(linha: Coordenada[], km: number, metrosOficiais: number): Coordenada | null {
  if (linha.length < 2) return null;
  const total = comprimentoMetros(linha);
  if (total <= 0) return null;
  const alvo = (km * 1000 * total) / metrosOficiais;
  if (alvo < 0 || alvo > total + 1) return null;
  let acumulado = 0;
  for (let i = 1; i < linha.length; i++) {
    const trecho = distanciaMetros(linha[i - 1], linha[i]);
    if (acumulado + trecho >= alvo) {
      const f = trecho === 0 ? 0 : (alvo - acumulado) / trecho;
      return [
        linha[i - 1][0] + (linha[i][0] - linha[i - 1][0]) * f,
        linha[i - 1][1] + (linha[i][1] - linha[i - 1][1]) * f,
      ];
    }
    acumulado += trecho;
  }
  return linha[linha.length - 1];
}

const valida = (lng: number, lat: number) =>
  Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

function lerGpx(texto: string): Coordenada[] {
  const saida: Coordenada[] = [];
  // Trilha primeiro; se o arquivo só tiver rota, usa a rota.
  for (const tag of ["trkpt", "rtept"]) {
    const re = new RegExp(`<${tag}\\b([^>]*)>`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(texto))) {
      const lat = Number(/\blat\s*=\s*["']([^"']+)["']/i.exec(m[1])?.[1]);
      const lng = Number(/\blon\s*=\s*["']([^"']+)["']/i.exec(m[1])?.[1]);
      if (valida(lng, lat)) saida.push([lng, lat]);
    }
    if (saida.length) break;
  }
  return saida;
}

function lerKml(texto: string): Coordenada[] {
  // A maior LineString do arquivo: KML de prova costuma trazer também pontos soltos.
  let melhor: Coordenada[] = [];
  const re = /<LineString\b[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    const linha: Coordenada[] = [];
    for (const par of m[1].trim().split(/\s+/)) {
      const [lng, lat] = par.split(",").map(Number);
      if (valida(lng, lat)) linha.push([lng, lat]);
    }
    if (linha.length > melhor.length) melhor = linha;
  }
  // gx:Track (exportação de alguns relógios).
  if (!melhor.length) {
    const gx = /<gx:coord>\s*([-\d.]+)\s+([-\d.]+)[^<]*<\/gx:coord>/gi;
    while ((m = gx.exec(texto))) {
      const lng = Number(m[1]);
      const lat = Number(m[2]);
      if (valida(lng, lat)) melhor.push([lng, lat]);
    }
  }
  return melhor;
}

function lerGeoJson(texto: string): Coordenada[] {
  const raiz = JSON.parse(texto) as unknown;
  let melhor: Coordenada[] = [];
  const linha = (coords: unknown): Coordenada[] =>
    Array.isArray(coords)
      ? coords
          .filter((c): c is number[] => Array.isArray(c) && c.length >= 2)
          .map((c) => [Number(c[0]), Number(c[1])] as Coordenada)
          .filter(([lng, lat]) => valida(lng, lat))
      : [];
  const visitar = (no: unknown) => {
    if (!no || typeof no !== "object") return;
    const o = no as Record<string, unknown>;
    if (o.type === "FeatureCollection" && Array.isArray(o.features)) o.features.forEach(visitar);
    else if (o.type === "Feature") visitar(o.geometry);
    else if (o.type === "GeometryCollection" && Array.isArray(o.geometries)) o.geometries.forEach(visitar);
    else if (o.type === "LineString") {
      const l = linha(o.coordinates);
      if (l.length > melhor.length) melhor = l;
    } else if (o.type === "MultiLineString" && Array.isArray(o.coordinates)) {
      // Trechos em sequência formam um percurso só.
      const l = o.coordinates.flatMap((c) => linha(c));
      if (l.length > melhor.length) melhor = l;
    }
  };
  visitar(raiz);
  return melhor;
}

/** Reduz pontos mantendo a forma (Douglas-Peucker, tolerância em metros). */
function simplificar(linha: Coordenada[], toleranciaM: number): Coordenada[] {
  if (linha.length <= 2) return linha;
  const lat0 = rad(linha[0][1]);
  const xy = linha.map(([lng, lat]) => [rad(lng) * Math.cos(lat0) * R, rad(lat) * R] as const);
  const manter = new Uint8Array(linha.length);
  manter[0] = 1;
  manter[linha.length - 1] = 1;
  const pilha: [number, number][] = [[0, linha.length - 1]];
  while (pilha.length) {
    const [a, b] = pilha.pop()!;
    const [ax, ay] = xy[a];
    const [bx, by] = xy[b];
    const dx = bx - ax;
    const dy = by - ay;
    const norma = Math.hypot(dx, dy);
    let pior = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d =
        norma === 0
          ? Math.hypot(xy[i][0] - ax, xy[i][1] - ay)
          : Math.abs(dy * xy[i][0] - dx * xy[i][1] + bx * ay - by * ax) / norma;
      if (d > pior) {
        pior = d;
        idx = i;
      }
    }
    if (idx > 0 && pior > toleranciaM) {
      manter[idx] = 1;
      pilha.push([a, idx], [idx, b]);
    }
  }
  return linha.filter((_, i) => manter[i]);
}

export type Relatorio = {
  comprimento_m: number;
  oficial_m: number;
  diferenca_pct: number;
  pontos_no_arquivo: number;
  pontos: number;
  inicio_fim_m: number;
  dentro_do_df: boolean;
  avisos: string[];
  /** Erro que impede salvar. */
  bloqueios: string[];
};

export type ArquivoLido =
  | { ok: true; formato: "gpx" | "kml" | "geojson"; coordenadas: Coordenada[]; relatorio: Relatorio }
  | { ok: false; erro: string };

// Caixa folgada em volta do Distrito Federal.
const DF = { latMin: -16.2, latMax: -15.3, lngMin: -48.4, lngMax: -47.2 };

/**
 * Lê o arquivo e monta o relatório que o admin confere antes de publicar. Não
 * publica nada: quem publica é uma pessoa, depois de comparar com o mapa oficial.
 */
export function lerArquivoDePercurso(nome: string, texto: string, distancia: DistanciaBase): ArquivoLido {
  const ext = nome.toLowerCase().split(".").pop() ?? "";
  const inicio = texto.trimStart().slice(0, 200).toLowerCase();
  let formato: "gpx" | "kml" | "geojson";
  if (ext === "gpx" || inicio.includes("<gpx")) formato = "gpx";
  else if (ext === "kml" || inicio.includes("<kml")) formato = "kml";
  else if (ext === "geojson" || ext === "json" || inicio.startsWith("{")) formato = "geojson";
  else return { ok: false, erro: "Formato não reconhecido. Envie um arquivo GPX, KML ou GeoJSON." };

  let bruto: Coordenada[];
  try {
    bruto = formato === "gpx" ? lerGpx(texto) : formato === "kml" ? lerKml(texto) : lerGeoJson(texto);
  } catch {
    return { ok: false, erro: "Não foi possível ler o arquivo. Confira se ele está íntegro." };
  }
  // Pontos repetidos em sequência não acrescentam nada.
  bruto = bruto.filter((c, i) => i === 0 || c[0] !== bruto[i - 1][0] || c[1] !== bruto[i - 1][1]);
  if (bruto.length < 2) {
    return { ok: false, erro: "O arquivo não tem uma linha de percurso (são necessários ao menos dois pontos)." };
  }

  const oficial = DISTANCIAS[distancia].metros;
  const medido = comprimentoMetros(bruto);
  const coordenadas = simplificar(bruto, 3).map(([lng, lat]) => [Number(lng.toFixed(6)), Number(lat.toFixed(6))] as Coordenada);
  const diferenca = ((medido - oficial) / oficial) * 100;
  const dentro = bruto.every(([lng, lat]) => lat >= DF.latMin && lat <= DF.latMax && lng >= DF.lngMin && lng <= DF.lngMax);
  const inicioFim = distanciaMetros(bruto[0], bruto[bruto.length - 1]);

  const avisos: string[] = [];
  const bloqueios: string[] = [];
  if (!dentro) bloqueios.push("Há pontos fora do Distrito Federal. Este não parece ser um percurso da prova.");
  if (Math.abs(diferenca) > 15) {
    bloqueios.push(
      `O traçado mede ${(medido / 1000).toFixed(2)} km, muito diferente dos ${DISTANCIAS[distancia].oficial} oficiais. Confira se o arquivo é o desta distância.`
    );
  } else if (Math.abs(diferenca) > 3) {
    avisos.push(
      `O traçado mede ${(medido / 1000).toFixed(2)} km, ${Math.abs(diferenca).toFixed(1)}% ${diferenca > 0 ? "acima" : "abaixo"} do oficial. Diferença pequena é normal em arquivo de GPS; diferença assim pede conferência.`
    );
  }
  if (bruto.length < 50) avisos.push("O arquivo tem poucos pontos. As curvas podem ficar retas no mapa.");
  if (inicioFim > 1500) {
    avisos.push(
      `O primeiro e o último ponto estão a ${(inicioFim / 1000).toFixed(1)} km um do outro. Largada e chegada são na Esplanada: confira o sentido e os extremos.`
    );
  }

  return {
    ok: true,
    formato,
    coordenadas,
    relatorio: {
      comprimento_m: Math.round(medido),
      oficial_m: oficial,
      diferenca_pct: Number(diferenca.toFixed(2)),
      pontos_no_arquivo: bruto.length,
      pontos: coordenadas.length,
      inicio_fim_m: Math.round(inicioFim),
      dentro_do_df: dentro,
      avisos,
      bloqueios,
    },
  };
}
