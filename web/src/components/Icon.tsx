// Minimal monoline icon set (single-color stroke SVGs) — replaces emoji glyphs
// so the UI reads as one consistent, simple system instead of platform emoji.
// Kept pruned to exactly what's used by the current live component tree.

export type IconName =
  | "home" | "dashboard" | "monitor" | "map" | "report"
  | "gate" | "empty"
  | "cloud-rain" | "sliders" | "alert-triangle" | "settings"
  | "bell" | "help-circle" | "user"
  | "route" | "droplet" | "pump" | "lock";

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
  gate: (
    <>
      <path d="M3 5h18M3 19h18" />
      <path d="M6 5v14M12 5v14M18 5v14" />
    </>
  ),
  empty: (
    <>
      <path d="M3 8 12 3l9 5-9 5-9-5Z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </>
  ),
  "cloud-rain": (
    <>
      <path d="M6 14a4 4 0 0 1 .7-7.94 5 5 0 0 1 9.6 1.44A3.5 3.5 0 0 1 16 14H6Z" />
      <path d="M8 18v2M12 18v2M16 18v2" />
    </>
  ),
  sliders: (
    <>
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="7" cy="18" r="2" />
    </>
  ),
  "alert-triangle": (
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17v.01" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  "help-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1 1-1 1.7M12 17v.01" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M6 16.5V13a4 4 0 0 1 4-4h4a4 4 0 0 0 4-4" />
    </>
  ),
  droplet: (
    <path d="M12 2.5s6.5 7.2 6.5 12A6.5 6.5 0 0 1 5.5 14.5c0-4.8 6.5-12 6.5-12Z" />
  ),
  pump: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="M12 13v8M8 21h8" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
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
