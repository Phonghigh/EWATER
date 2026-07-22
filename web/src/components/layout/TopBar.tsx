import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useT } from "../../i18n/I18nContext";
import Icon from "../Icon";
import LangToggle from "../LangToggle";
import { NAV_ITEMS } from "../../nav/navItems";

/** Resolves the current path to its nav label key, matched by first path
 *  segment so sub-tab routes (e.g. `/monitoring/rain`) still map back to
 *  their parent nav item (`/monitoring/overview`)'s title. Returns null for
 *  paths with no nav entry (shouldn't happen inside AppShell, but keeps
 *  this honest rather than silently falling back to a wrong label). */
function resolvePageTitleKey(pathname: string): string | null {
  if (pathname === "/") return "nav.dashboard";
  const segment = "/" + pathname.split("/")[1];
  const item = NAV_ITEMS.find((i) => i.to !== "/" && "/" + i.to.split("/")[1] === segment);
  return item?.labelKey ?? null;
}

/** Date + weather moved out of the global top bar and into Dashboard's own
 *  summary row (matches the reference mockup's layout, where that content
 *  sits under the page title, not in the persistent shell chrome) — see
 *  `pages/Dashboard.tsx`. The current page's title now lives here instead,
 *  persistent across scroll instead of living in each page's own
 *  `PageHeader` row (which left a bare, near-empty strip on pages like
 *  Dashboard once other content moved around it). */
export default function TopBar() {
  const t = useT();
  const location = useLocation();
  const { profile, guestMode, signOut } = useAuth();
  const titleKey = resolvePageTitleKey(location.pathname);

  return (
    <header className="topbar2">
      {titleKey && <h1 className="topbar2-title">{t(titleKey)}</h1>}
      <div className="topbar2-right">
        <button className="icon-btn" type="button" title={t("nav.brandTitle")}>
          <Icon name="bell" size={18} />
        </button>
        <button className="icon-btn" type="button">
          <Icon name="help-circle" size={18} />
        </button>
        <LangToggle />
        {profile ? (
          <div className="topbar2-user">
            <Icon name="user" size={18} />
            <span className="topbar2-user-name">{profile.full_name ?? profile.email}</span>
            <span className="role-badge">{t(`role.${profile.role}`)}</span>
            <button className="logout-btn" onClick={() => signOut()}>{t("nav.logout")}</button>
          </div>
        ) : (
          <div className="topbar2-user">
            <span className="role-badge">{t("role.guest")}</span>
            {guestMode && (
              <button className="logout-btn" onClick={() => signOut()}>{t("nav.exitGuest")}</button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
