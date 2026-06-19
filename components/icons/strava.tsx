// Ícone oficial do Strava — extraído do site atual do Somma (site-footer.tsx).
export function StravaIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points="226.172,26.001 90.149,288.345 170.29,288.345 226.172,184.036 281.605,288.345 361.116,288.345"
        fill="currentColor"
      />
      <polygon
        points="361.116,288.345 321.675,367.586 281.605,288.345 220.871,288.345 321.675,485.999 421.851,288.345"
        fill="currentColor"
      />
    </svg>
  );
}
