/**
 * O traçado da simulação.
 *
 * Domingo é dia de Eixão do Lazer: a pista fica fechada para carros e livre
 * para quem corre. Por isso o percurso é o que a galera faz de verdade — sai do
 * Santa Monica, sobe os 100 m de acesso, entra no Eixão, segue até a virada e
 * volta pelo mesmo caminho.
 *
 * A geometria vem da Directions API do Google (a via real, não um rabisco),
 * gerada uma única vez e congelada aqui: a página desenha estes pontos sem
 * chamar a API a cada visita — sem cota queimada e sem depender da rede.
 *
 * Ida cortada em 3.10 km e espelhada: 6.20 km no total, o pelotão de 6 km.
 * O traçado oficial ainda será homologado pela organização.
 */

/** [latitude, longitude] */
export type Coordenada = [number, number];

export const ROTA_SIMULADA = {
  /** Fonte: ficha pública do Google Maps (Bar Santa Monica, CLS 208 Bl. C). */
  origem: { lat: -15.8195413, lng: -47.899301 },
  /** Onde o pelotão vira e volta, no meio do Eixão. */
  virada: { lat: -15.798052, lng: -47.883534 },
  distanciaKm: 6.20,
  /** Janela real da corrida na programação. */
  inicio: "07:45",
  fim: "08:40",
  oficial: false,
  pontos: [
  [-15.819620, -47.899410],
  [-15.818790, -47.900040],
  [-15.818590, -47.900160],
  [-15.817910, -47.900290],
  [-15.817710, -47.900270],
  [-15.817410, -47.900160],
  [-15.816550, -47.899010],
  [-15.815860, -47.898140],
  [-15.814910, -47.897010],
  [-15.813730, -47.895660],
  [-15.811840, -47.893650],
  [-15.810570, -47.892410],
  [-15.809510, -47.891420],
  [-15.805940, -47.888270],
  [-15.804820, -47.887370],
  [-15.803930, -47.886700],
  [-15.802840, -47.885970],
  [-15.801430, -47.885090],
  [-15.800600, -47.884650],
  [-15.799490, -47.884130],
  [-15.799000, -47.883960],
  [-15.798052, -47.883534],
  [-15.799000, -47.883960],
  [-15.799490, -47.884130],
  [-15.800600, -47.884650],
  [-15.801430, -47.885090],
  [-15.802840, -47.885970],
  [-15.803930, -47.886700],
  [-15.804820, -47.887370],
  [-15.805940, -47.888270],
  [-15.809510, -47.891420],
  [-15.810570, -47.892410],
  [-15.811840, -47.893650],
  [-15.813730, -47.895660],
  [-15.814910, -47.897010],
  [-15.815860, -47.898140],
  [-15.816550, -47.899010],
  [-15.817410, -47.900160],
  [-15.817710, -47.900270],
  [-15.817910, -47.900290],
  [-15.818590, -47.900160],
  [-15.818790, -47.900040],
  [-15.819620, -47.899410],
  ] as Coordenada[],
} as const;
