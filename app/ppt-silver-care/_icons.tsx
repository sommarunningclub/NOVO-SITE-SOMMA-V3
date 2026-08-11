/**
 * Pictogramas do deck: traço fino, grade de 24, sem preenchimento.
 * Herdam a cor do contexto (`currentColor`), então cada slide define o acento.
 */

export type IconName =
  | "sol"
  | "stick"
  | "pele"
  | "corrida"
  | "gota"
  | "limpeza"
  | "qr"
  | "checkin"
  | "celular"
  | "ranking"
  | "medalha"
  | "cupom"
  | "comunidade"
  | "tenda"
  | "camera"
  | "email"
  | "chat"
  | "instagram"
  | "dados"
  | "sticker"
  | "necessaire"
  | "relogio"
  | "mapa"
  | "check"
  | "presente"
  | "raio"
  | "coracao"
  | "lupa"
  | "site";

const PATHS: Record<IconName, React.ReactNode> = {
  sol: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.2v2.3M12 19.5v2.3M2.2 12h2.3M19.5 12h2.3M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
    </>
  ),
  stick: (
    <>
      <path d="M8.6 2.8h6.8v4.1H8.6z" />
      <path d="M7.8 6.9h8.4v13a2.2 2.2 0 0 1-2.2 2.2h-4a2.2 2.2 0 0 1-2.2-2.2Z" />
      <path d="M7.8 11.2h8.4" />
    </>
  ),
  pele: (
    <>
      <path d="M12 21.3s-7.6-4.4-7.6-10.2A4.6 4.6 0 0 1 12 7.7a4.6 4.6 0 0 1 7.6 3.4c0 5.8-7.6 10.2-7.6 10.2Z" />
      <path d="M9.4 12.2c1-1 2-1.4 2.6-1.4s1.6.4 2.6 1.4" />
    </>
  ),
  corrida: (
    <>
      <circle cx="15" cy="4.5" r="1.9" />
      <path d="M13.6 9 10 11.2l1.6 3.3-2.6 5.4" />
      <path d="M13.6 9c1.6-.6 3.2.2 3.8 1.7l.8 2.1 2.6 1.1" />
      <path d="M11.6 14.5 7 13.8" />
      <path d="M3.2 9.4h3.9M2 12.6h3.2" />
    </>
  ),
  gota: (
    <>
      <path d="M12 2.8s6 6.6 6 10.7a6 6 0 0 1-12 0C6 9.4 12 2.8 12 2.8Z" />
      <path d="M9 14.4a3 3 0 0 0 3 3" />
    </>
  ),
  limpeza: (
    <>
      <path d="M9.4 2.8h5.2v3.4H9.4z" />
      <path d="M8.2 6.2h7.6l1.3 5.4v8.2a2 2 0 0 1-2 2H8.9a2 2 0 0 1-2-2v-8.2Z" />
      <path d="M6.9 13.4h10.2" />
    </>
  ),
  qr: (
    <>
      <path d="M3.5 3.5h6v6h-6zM14.5 3.5h6v6h-6zM3.5 14.5h6v6h-6z" />
      <path d="M14.5 14.5h2.6v2.6h-2.6zM20.5 14.5v2.6M17.9 20.5h2.6v-2.6M14.5 20.5h1" />
    </>
  ),
  checkin: (
    <>
      <rect x="3.2" y="4.6" width="17.6" height="15.4" rx="2.2" />
      <path d="M3.2 9h17.6" />
      <path d="m8.4 13.6 2.4 2.4 4.8-4.8" />
    </>
  ),
  celular: (
    <>
      <rect x="6.4" y="2.4" width="11.2" height="19.2" rx="2.4" />
      <path d="M10.4 5.4h3.2" />
      <path d="M10.6 18.6h2.8" />
    </>
  ),
  ranking: (
    <>
      <path d="M3.6 20.4h4.2v-7H3.6zM9.9 20.4h4.2V6.6H9.9zM16.2 20.4h4.2v-9.8h-4.2z" />
    </>
  ),
  medalha: (
    <>
      <circle cx="12" cy="15" r="5.6" />
      <circle cx="12" cy="15" r="2.2" />
      <path d="M8.6 9.8 5.8 3.4h12.4l-2.8 6.4" />
    </>
  ),
  cupom: (
    <>
      <path d="M2.8 8.2h18.4v3a2 2 0 0 0 0 3.6v3H2.8v-3a2 2 0 0 0 0-3.6Z" />
      <path d="M9.4 8.2v1.4M9.4 13.3v1.4M9.4 16.4v1.4" />
    </>
  ),
  comunidade: (
    <>
      <circle cx="8.6" cy="8.4" r="3" />
      <circle cx="16.4" cy="9.6" r="2.4" />
      <path d="M2.8 19.6c0-3.2 2.6-5.4 5.8-5.4s5.8 2.2 5.8 5.4" />
      <path d="M16.2 14.4c2.8 0 5 1.9 5 4.6" />
    </>
  ),
  tenda: (
    <>
      <path d="M2.4 11.2 12 4.2l9.6 7" />
      <path d="M4.4 11.2v9h15.2v-9" />
      <path d="M4.4 15.2h15.2" />
    </>
  ),
  camera: (
    <>
      <path d="M3 7.6h3.6l1.6-2.4h7.6l1.6 2.4H21v11.6H3Z" />
      <circle cx="12" cy="13.2" r="3.6" />
    </>
  ),
  email: (
    <>
      <rect x="2.6" y="5.2" width="18.8" height="13.6" rx="2" />
      <path d="m3.4 6.6 8.6 6.4 8.6-6.4" />
    </>
  ),
  chat: (
    <>
      <path d="M3.2 12c0-4.4 3.9-7.8 8.8-7.8s8.8 3.4 8.8 7.8-3.9 7.8-8.8 7.8a10 10 0 0 1-3-.4l-4.4 1.6 1.2-3.6A7.4 7.4 0 0 1 3.2 12Z" />
      <path d="M8.6 11.8h6.8M8.6 14.6h4.2" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.1" cy="6.9" r=".9" fill="currentColor" />
    </>
  ),
  dados: (
    <>
      <path d="M3.4 20.2h17.2" />
      <path d="m4.6 15.6 4.6-5 3.6 3 6.6-7.4" />
      <path d="M15.8 6.2h3.6v3.6" />
    </>
  ),
  sticker: (
    <>
      <path d="M12 2.8a9.2 9.2 0 1 1-9.2 9.2c0-.4 0-.7.1-1" />
      <path d="M21.2 12h-5.6a3.6 3.6 0 0 0-3.6 3.6v5.6" />
      <path d="M8.6 9.4h.01M14.4 8.6h.01M9.4 14.6h.01" />
    </>
  ),
  necessaire: (
    <>
      <path d="M3.4 8.6h17.2v11.2a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6Z" />
      <path d="M7.6 8.6V6.4a4.4 4.4 0 0 1 8.8 0v2.2" />
      <path d="M3.4 12.6h17.2" />
    </>
  ),
  relogio: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 6.8V12l3.4 2.2" />
    </>
  ),
  mapa: (
    <>
      <path d="M12 21.2s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="m8.2 12.2 2.6 2.6 5-5.4" />
    </>
  ),
  presente: (
    <>
      <path d="M3.5 10.4h17V21h-17z" />
      <path d="M2.4 6.6h19.2v3.8H2.4zM12 6.6V21" />
      <path d="M12 6.6S10.8 3 8.6 3a2.2 2.2 0 0 0 0 4.4M12 6.6S13.2 3 15.4 3a2.2 2.2 0 0 1 0 4.4" />
    </>
  ),
  raio: <path d="M13.6 2.4 5.2 13.4h5.6l-.8 8.2 8.8-11.2h-5.8Z" />,
  coracao: (
    <path d="M12 20.6S3.6 15.4 3.6 9.6a4.6 4.6 0 0 1 8.4-2.6 4.6 4.6 0 0 1 8.4 2.6c0 5.8-8.4 11-8.4 11Z" />
  ),
  lupa: (
    <>
      <circle cx="10.8" cy="10.8" r="7.2" />
      <path d="m16.2 16.2 4.6 4.6" />
    </>
  ),
  site: (
    <>
      <rect x="2.6" y="4.2" width="18.8" height="15.6" rx="2" />
      <path d="M2.6 8.6h18.8" />
      <path d="M5.8 6.4h.01M8.2 6.4h.01" />
    </>
  ),
};

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
