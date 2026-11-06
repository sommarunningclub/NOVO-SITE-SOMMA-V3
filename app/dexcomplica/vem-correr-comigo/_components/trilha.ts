/** Playlist da comunidade. O autoplay só passa se o iframe nascer no gesto do usuário. */
export const TRILHA_PLAYLIST = "1WcGzf4bGvcyfo2znZTyxl";
export const TRILHA_EMBED =
  `https://open.spotify.com/embed/playlist/${TRILHA_PLAYLIST}` +
  `?utm_source=generator&theme=0&autoplay=1`;

const HOST_ID = "cr-trilha-host";

/** Cria o embed na hora do clique — antes de qualquer await — para o browser liberar o som. */
export function armarTrilhaNoGesto() {
  if (typeof document === "undefined") return;
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    host.className = "cr-som-host";
    host.setAttribute("aria-hidden", "true");
    document.body.appendChild(host);
  }
  if (host.querySelector("iframe")) return;

  const iframe = document.createElement("iframe");
  iframe.src = TRILHA_EMBED;
  iframe.title = "Playlist da comunidade";
  iframe.width = "300";
  iframe.height = "152";
  iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  iframe.setAttribute("allowfullscreen", "true");
  iframe.setAttribute("loading", "eager");
  iframe.dataset.testid = "embed-iframe";
  host.appendChild(iframe);
}

export function trilhaArmada() {
  if (typeof document === "undefined") return false;
  return Boolean(document.getElementById(HOST_ID)?.querySelector("iframe"));
}

export function desarmarTrilha() {
  if (typeof document === "undefined") return;
  document.getElementById(HOST_ID)?.remove();
}
