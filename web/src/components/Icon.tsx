// Minimal monoline icon set (single-color stroke SVGs) — replaces emoji glyphs
// so the UI reads as one consistent, simple system instead of platform emoji.

export type IconName =
  | "home" | "dashboard" | "monitor" | "map" | "report" | "database"
  | "gate" | "chevron-down" | "chart" | "up" | "down" | "print"
  | "download" | "info" | "close" | "empty" | "search";

const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />,
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  monitor: <path d="M3 17 9 9l4 4 8-9M13 21h8M21 12v9" />,
  map: (
    <>
      <path d="M9 4 3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5 9 4Z" />
      <path d="M9 4v14M15 6.5v14" />
    </>
  ),
  report: (
    <>
      <path d="M7 3h8l4 4v14H7Z" />
      <path d="M15 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="8" ry="3" />
      <path d="M4 5.5V18c0 1.66 3.58 3 8 3s8-1.34 8-3V5.5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </>
  ),
  gate: (
    <>
      <path d="M3 5h18M3 19h18" />
      <path d="M6 5v14M12 5v14M18 5v14" />
    </>
  ),
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  chart: <path d="M4 20V10M11 20V4M18 20v-7" />,
  up: <path d="M12 19V5M5 12l7-7 7 7" />,
  down: <path d="M12 5v14M5 12l7 7 7-7" />,
  print: (
    <>
      <path d="M6 9V3h12v6" />
      <rect x="4" y="9" width="16" height="8" rx="1" />
      <path d="M6 14h12v7H6Z" />
    </>
  ),
  download: <path d="M12 4v12M6 12l6 6 6-6M5 21h14" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.01" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  empty: (
    <>
      <path d="M3 8 12 3l9 5-9 5-9-5Z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
};

export default function Icon({ name, size = 18, className }: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className ?? ""}`}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
