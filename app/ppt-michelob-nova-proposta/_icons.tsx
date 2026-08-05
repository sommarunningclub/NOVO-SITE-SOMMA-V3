/**
 * Pictogramas do deck: traço fino, mesma grade de 24, sem preenchimento.
 * Herdam a cor do contexto (`currentColor`), então cada slide define o acento.
 */

export type IconName =
  | "corrida"
  | "musica"
  | "trial"
  | "brinde"
  | "checkin"
  | "comunidade"
  | "tenda"
  | "banner"
  | "cooler"
  | "dj"
  | "bar"
  | "arte"
  | "desafio"
  | "revezamento"
  | "relatorio"
  | "foto"
  | "conteudo"
  | "responsavel"
  | "escala";

const PATHS: Record<IconName, React.ReactNode> = {
  // Corredor em movimento
  corrida: (
    <>
      <circle cx="15" cy="4.5" r="1.9" />
      <path d="M13.6 9 10 11.2l1.6 3.3-2.6 5.4" />
      <path d="M13.6 9c1.6-.6 3.2.2 3.8 1.7l.8 2.1 2.6 1.1" />
      <path d="M11.6 14.5 7 13.8" />
      <path d="M3.2 9.4h3.9M2 12.6h3.2" />
    </>
  ),
  // Nota musical
  musica: (
    <>
      <path d="M9 18V6.4l11-2v11" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="15.4" r="2.5" />
    </>
  ),
  // Copo de trial
  trial: (
    <>
      <path d="M6.5 4h11l-1.2 15.2a1.9 1.9 0 0 1-1.9 1.8h-4.8a1.9 1.9 0 0 1-1.9-1.8Z" />
      <path d="M6.9 9.6h10.2" />
    </>
  ),
  // Presente
  brinde: (
    <>
      <path d="M3.5 10.4h17V21h-17z" />
      <path d="M2.4 6.6h19.2v3.8H2.4zM12 6.6V21" />
      <path d="M12 6.6S10.8 3 8.6 3a2.2 2.2 0 0 0 0 4.4M12 6.6S13.2 3 15.4 3a2.2 2.2 0 0 1 0 4.4" />
    </>
  ),
  // QR Code de check-in
  checkin: (
    <>
      <path d="M3.5 3.5h6v6h-6zM14.5 3.5h6v6h-6zM3.5 14.5h6v6h-6z" />
      <path d="M14.5 14.5h2.6v2.6h-2.6zM20.5 14.5v2.6M17.9 20.5h2.6v-2.6M14.5 20.5h1" />
    </>
  ),
  // Grupo de pessoas
  comunidade: (
    <>
      <circle cx="9" cy="7.6" r="3.1" />
      <path d="M3 20.4a6 6 0 0 1 12 0" />
      <path d="M16.2 5a3.1 3.1 0 0 1 0 5.9M17.6 15a6 6 0 0 1 3.4 5.4" />
    </>
  ),
  // Tenda de ativação (gazebo)
  tenda: (
    <>
      <path d="M2.6 10.6 12 4l9.4 6.6" />
      <path d="M2.6 10.6h18.8" />
      <path d="M5.2 10.6V20M18.8 10.6V20" />
      <path d="M8.4 10.6 7 14.2M15.6 10.6l1.4 3.6" />
    </>
  ),
  // Wind banner
  banner: (
    <>
      <path d="M7 21V3" />
      <path d="M7 3.6c3.4-1.6 6.8 1.6 10.2 0v9.6C13.8 14.8 10.4 11.6 7 13.2" />
      <path d="M4.6 21h4.8" />
    </>
  ),
  // Caixa térmica
  cooler: (
    <>
      <rect x="3" y="8.4" width="18" height="11.2" rx="1.8" />
      <path d="M3 12.2h18" />
      <path d="M9.2 8.4V6.6a1.4 1.4 0 0 1 1.4-1.4h2.8a1.4 1.4 0 0 1 1.4 1.4v1.8" />
      <path d="M12 14v2.6" />
    </>
  ),
  // Mesa de DJ
  dj: (
    <>
      <rect x="2.6" y="6.4" width="18.8" height="11.2" rx="1.8" />
      <circle cx="8" cy="12" r="2.4" />
      <circle cx="16" cy="12" r="2.4" />
      <path d="M8 9.6v.8M16 13.6v.8" />
    </>
  ),
  // Balcão / bar
  bar: (
    <>
      <path d="M2.6 8.2h18.8v2.6H2.6z" />
      <path d="M4.6 10.8V20h14.8v-9.2" />
      <path d="M4.6 15.4h14.8" />
      <path d="M9.4 4.6v3.6M14.6 4.6v3.6" />
    </>
  ),
  // Materiais visuais
  arte: (
    <>
      <rect x="3.2" y="3.6" width="17.6" height="16.8" rx="2" />
      <circle cx="8.6" cy="9" r="1.8" />
      <path d="M3.6 17.4 9 12.4l4 3.6 3.4-2.8 4 3.6" />
    </>
  ),
  // Cronômetro do desafio
  desafio: (
    <>
      <circle cx="12" cy="13.4" r="7.4" />
      <path d="M12 9.6v3.8l2.4 1.8M9.6 2.6h4.8M18.4 6.6l1.6-1.6" />
    </>
  ),
  // Bastão de revezamento
  revezamento: (
    <>
      <path d="M5.6 18.4 12 12l6.4-6.4" />
      <rect x="2.2" y="16.4" width="5" height="5" rx="1.6" transform="rotate(-45 4.7 18.9)" />
      <rect x="16.8" y="2.2" width="5" height="5" rx="1.6" transform="rotate(-45 19.3 4.7)" />
      <path d="M9.6 8.4 15.6 14.4" />
    </>
  ),
  // Relatório com barras
  relatorio: (
    <>
      <path d="M4.6 3.6h14.8v16.8H4.6z" />
      <path d="M8.4 16.4v-3.2M12 16.4V9.6M15.6 16.4v-5" />
    </>
  ),
  // Câmera
  foto: (
    <>
      <path d="M3 7.6h3.6L8.4 5h7.2l1.8 2.6H21v11.8H3Z" />
      <circle cx="12" cy="13.2" r="3.4" />
    </>
  ),
  // Play de conteúdo
  conteudo: (
    <>
      <rect x="2.6" y="4.6" width="18.8" height="14.8" rx="2.4" />
      <path d="M10.2 9.6 15 12l-4.8 2.4Z" />
    </>
  ),
  // Consumo responsável — escudo com confirmação
  responsavel: (
    <>
      <path d="M12 3.2 4.8 6v6c0 4.2 2.9 7.4 7.2 8.8 4.3-1.4 7.2-4.6 7.2-8.8V6Z" />
      <path d="m8.8 12 2.4 2.4 4-4.6" />
    </>
  ),
  // Escala / degraus de investimento
  escala: (
    <>
      <path d="M3.4 20.6h17.2" />
      <path d="M4.8 20.6v-4.4h4.2v4.4M9.8 20.6v-8h4.2v8M14.8 20.6V8.4H19v12.2" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
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
