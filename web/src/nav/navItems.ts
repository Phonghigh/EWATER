import type { IconName } from "../components/Icon";

export interface NavItem {
  to: string;
  labelKey: string;
  icon: IconName;
  adminOnly?: boolean;
}

/** Shared route table: Sidebar renders it as the nav list, TopBar uses it
 *  to resolve the current route's title (see TopBar.tsx's `resolvePageTitle`)
 *  — one source of truth for "which path maps to which page label" instead
 *  of two separately-maintained lists. */
export const NAV_ITEMS: NavItem[] = [
  { to: "/", labelKey: "nav.dashboard", icon: "dashboard" },
  { to: "/gis-map", labelKey: "nav.gisMap", icon: "map" },
  { to: "/monitoring/overview", labelKey: "nav.monitoring", icon: "monitor" },
  { to: "/forecast/overview", labelKey: "nav.forecast", icon: "cloud-rain" },
  { to: "/whatif", labelKey: "nav.whatif", icon: "sliders" },
  { to: "/works/overview", labelKey: "nav.works", icon: "gate" },
  { to: "/impact/overview", labelKey: "nav.impact", icon: "alert-triangle" },
  { to: "/reports/overview", labelKey: "nav.reports", icon: "report" },
  { to: "/admin/overview", labelKey: "nav.admin", icon: "settings", adminOnly: true },
];
