/**
 * Conjunto de ícones próprio do Ultra Balance Challenge.
 *
 * Desenhados numa grade 24x24 com traço de 1.5, cantos retos e o mínimo de
 * curvas, para casar com a tipografia condensada do deck. Os nomes seguem os
 * que já estavam nos dados, então data.ts não precisou mudar.
 */

type P = { className?: string; color?: string };

const S = ({ children, className, color }: P & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color ?? "currentColor"}
    strokeWidth="1.5"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

/* ── Campanha e tempo ──────────────────────────────────────────────────── */

const CalendarDays = (p: P) => (
  <S {...p}>
    <path d="M3 6h18v15H3z" />
    <path d="M3 10h18M8 3v5M16 3v5" />
    <path d="M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2" />
  </S>
);

const CalendarCheck = (p: P) => (
  <S {...p}>
    <path d="M3 6h18v15H3z" />
    <path d="M3 10h18M8 3v5M16 3v5" />
    <path d="m8 15 3 3 5-5" />
  </S>
);

const Repeat = (p: P) => (
  <S {...p}>
    <path d="M4 9V6h13l-3-3M20 15v3H7l3 3" />
    <path d="M20 15V9M4 9v6" />
  </S>
);

const Flame = (p: P) => (
  <S {...p}>
    <path d="M12 3 7 9v5a5 5 0 0 0 10 0V9z" />
    <path d="M12 21v-6" />
  </S>
);

/* ── Movimento e esporte ───────────────────────────────────────────────── */

const Activity = (p: P) => (
  <S {...p}>
    <path d="M2 12h4l3-8 4 16 3-8h6" />
  </S>
);

const Target = (p: P) => (
  <S {...p}>
    <path d="M4 4h5M4 4v5M20 4h-5M20 4v5M4 20h5M4 20v-5M20 20h-5M20 20v-5" />
    <path d="M12 8v8M8 12h8" />
  </S>
);

const Flag = (p: P) => (
  <S {...p}>
    <path d="M6 21V3M6 4h12l-3 4 3 4H6" />
  </S>
);

const Trophy = (p: P) => (
  <S {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
    <path d="M12 14v4M9 21h6" />
  </S>
);

/* ── Pessoas ───────────────────────────────────────────────────────────── */

const Users = (p: P) => (
  <S {...p}>
    <path d="M3 21v-2a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v2" />
    <path d="M5.5 8.5h5v-4h-5z" />
    <path d="M16 21v-2a4 4 0 0 0-2-3.4M15 4.6a3 3 0 0 1 0 3.8" />
  </S>
);

const UserPlus = (p: P) => (
  <S {...p}>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M6.5 9.5h5v-5h-5z" />
    <path d="M18 8v6M15 11h6" />
  </S>
);

const UserCheck = (p: P) => (
  <S {...p}>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M6.5 9.5h5v-5h-5z" />
    <path d="m15 12 2 2 4-4" />
  </S>
);

const HeartHandshake = (p: P) => (
  <S {...p}>
    <path d="M12 20 4 13a4 4 0 0 1 8-4 4 4 0 0 1 8 4z" />
    <path d="m9 13 3 2 3-2" />
  </S>
);

const Compass = (p: P) => (
  <S {...p}>
    <path d="M12 2 2 12l10 10 10-10z" />
    <path d="m9 15 2-4 4-2-2 4z" />
  </S>
);

/* ── Dados e sistema ───────────────────────────────────────────────────── */

const BarChart3 = (p: P) => (
  <S {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </S>
);

const LineChart = (p: P) => (
  <S {...p}>
    <path d="M3 3v18h18" />
    <path d="m6 15 4-5 3 3 5-7" />
  </S>
);

const Database = (p: P) => (
  <S {...p}>
    <path d="M4 5h16v14H4z" />
    <path d="M4 10h16M4 15h16" />
    <path d="M7.5 7.5h.01M7.5 12.5h.01M7.5 17.5h.01" />
  </S>
);

const ListChecks = (p: P) => (
  <S {...p}>
    <path d="m3 6 2 2 3-3M3 13l2 2 3-3M3 20l2 2 3-3" />
    <path d="M12 7h9M12 14h9M12 21h9" />
  </S>
);

const CheckCircle2 = (p: P) => (
  <S {...p}>
    <path d="M4 4h16v16H4z" />
    <path d="m8 12 3 3 5-6" />
  </S>
);

const Check = (p: P) => (
  <S {...p}>
    <path d="m4 12 5 5L20 6" />
  </S>
);

/* ── Captura e compartilhamento ────────────────────────────────────────── */

const Camera = (p: P) => (
  <S {...p}>
    <path d="M3 7h4l2-3h6l2 3h4v13H3z" />
    <path d="M8.5 13.5h7v-4h-7z" />
  </S>
);

const QrCode = (p: P) => (
  <S {...p}>
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
    <path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" />
  </S>
);

const ScanLine = (p: P) => (
  <S {...p}>
    <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
    <path d="M3 12h18" />
  </S>
);

const Share2 = (p: P) => (
  <S {...p}>
    <path d="M16 3h5v5M8 21H3v-5" />
    <path d="M21 3 3 21" />
    <path d="M3 8V3h5M16 21h5v-5" />
  </S>
);

const Upload = (p: P) => (
  <S {...p}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 20h16" />
  </S>
);

/* ── Diversos ──────────────────────────────────────────────────────────── */

const Sparkles = (p: P) => (
  <S {...p}>
    <path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
    <path d="M19 4v3M17.5 5.5h3" />
  </S>
);

const Gift = (p: P) => (
  <S {...p}>
    <path d="M3 9h18v12H3zM3 9V7h18v2M12 7v14" />
    <path d="M12 7c-3 0-4-1-4-2s1-2 2-2 2 2 2 4zM12 7c3 0 4-1 4-2s-1-2-2-2-2 2-2 4z" />
  </S>
);

const PartyPopper = (p: P) => (
  <S {...p}>
    <path d="m3 21 5-13 8 8z" />
    <path d="M14 4v3M18 3l-1.5 2.5M21 8h-3M19.5 12.5 18 11" />
  </S>
);

const Award = (p: P) => (
  <S {...p}>
    <path d="M6 3h12v8l-6 4-6-4z" />
    <path d="m9 14-1 7 4-2 4 2-1-7" />
  </S>
);

const ArrowRight = (p: P) => (
  <S {...p}>
    <path d="M3 12h17M14 6l6 6-6 6" />
  </S>
);

const ArrowUpRight = (p: P) => (
  <S {...p}>
    <path d="M6 18 18 6M9 6h9v9" />
  </S>
);

const ChevronRight = (p: P) => (
  <S {...p}>
    <path d="m9 5 7 7-7 7" />
  </S>
);

const ChevronDown = (p: P) => (
  <S {...p}>
    <path d="m5 9 7 7 7-7" />
  </S>
);

const RotateCcw = (p: P) => (
  <S {...p}>
    <path d="M4 4v6h6" />
    <path d="M4 10a8 8 0 1 1 1.5 6" />
  </S>
);

const Wifi = (p: P) => (
  <S {...p}>
    <path d="M2 8a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01" />
  </S>
);

const BatteryFull = (p: P) => (
  <S {...p}>
    <path d="M2 8h18v8H2zM22 11v2" />
    <path d="M4.5 10h3v4h-3zM8.5 10h3v4h-3zM12.5 10h3v4h-3z" />
  </S>
);

export const ICONS = {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BatteryFull,
  CalendarCheck,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Database,
  Flag,
  Flame,
  Gift,
  HeartHandshake,
  LineChart,
  ListChecks,
  PartyPopper,
  QrCode,
  Repeat,
  RotateCcw,
  ScanLine,
  Share2,
  Sparkles,
  Target,
  Trophy,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Wifi,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className, color }: { name: string; className?: string; color?: string }) {
  const Cmp = ICONS[name as IconName];
  if (!Cmp) return null;
  return <Cmp className={className} color={color} />;
}
