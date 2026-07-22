import { useAuth } from "../../context/AuthContext";
import { useT } from "../../i18n/I18nContext";
import Icon from "../Icon";
import LangToggle from "../LangToggle";

/** Static mock weather chip — no live weather API wired (out of scope for
 *  this redesign, see tasks/backlog/phase-0.md P0-08). Real per-page weather
 *  content (Dashboard's hourly strip) is a separate, later concern. */
function todayLabel(): string {
  return new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function TopBar() {
  const t = useT();
  const { profile, guestMode, signOut } = useAuth();

  return (
    <header className="topbar2">
      <div className="topbar2-date">{todayLabel()}</div>
      <div className="topbar2-weather">
        <Icon name="cloud-rain" size={16} />
        <span>26°C</span>
      </div>
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
