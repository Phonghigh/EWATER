import { NavLink } from "react-router-dom";
import { useT } from "../../i18n/I18nContext";
import { useAuth } from "../../context/AuthContext";
import Icon from "../Icon";
import { NAV_ITEMS } from "../../nav/navItems";

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
        <img src="/img/Logo_tỉnh_Vĩnh_Long.webp" alt={t("nav.brandTitle")} className="sidebar-brand-logo" />
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
                <Icon name={item.icon} size={22} />
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
      <div className="sidebar-footer">{t("nav.copyright")}</div>
    </aside>
  );
}
