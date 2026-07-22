import { NavLink } from "react-router-dom";
import { useT } from "../../i18n/I18nContext";
import { useAuth } from "../../context/AuthContext";
import Icon, { type IconName } from "../Icon";

interface NavItem {
  to: string;
  labelKey: string;
  icon: IconName;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
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

/** Left sidebar: brand header + role-aware nav list. Always mounted (guests
 *  included). "Quản trị hệ thống" is hidden outright for non-admins (showing
 *  then bouncing would be a confusing dead end). Every other item is staff-
 *  only (authority/admin) — a guest (no `profile`) sees them as disabled,
 *  non-clickable entries instead of a live link that just redirects to
 *  /login on click, so the access boundary is visible before the click, not
 *  after. */
export default function Sidebar() {
  const t = useT();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const isStaff = !!profile;
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Icon name="home" size={26} />
        <div className="sidebar-brand-text">
          <strong>{t("nav.brandTitle")}</strong>
          <span>{t("nav.brandSubtitle")}</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const locked = item.to !== "/" && !isStaff;
          if (locked) {
            return (
              <div key={item.to} className="sidebar-link disabled" title={t("nav.guestLocked")}>
                <Icon name={item.icon} size={19} />
                <span>{t(item.labelKey)}</span>
                <Icon name="lock" size={14} className="sidebar-link-lock" />
              </div>
            );
          }
          return (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className="sidebar-link">
              <Icon name={item.icon} size={19} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
