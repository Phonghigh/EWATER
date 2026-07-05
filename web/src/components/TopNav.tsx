import { NavLink, Link } from "react-router-dom";
import { useT } from "../i18n/I18nContext";
import LangToggle from "./LangToggle";
import Icon from "./Icon";

const MONITOR_TABS = [
  { to: "/monitor/rainfall-actual", label: "monitor.rainfallActual" },
  { to: "/monitor/rainfall-forecast", label: "monitor.rainfallForecast" },
  { to: "/monitor/water-level", label: "monitor.waterLevel" },
  { to: "/monitor/gates", label: "monitor.gates" },
];

export default function TopNav() {
  const t = useT();
  return (
    <header className="topnav">
      <Link to="/" className="topnav-home" title={t("nav.home")}>
        <Icon name="home" size={20} />
      </Link>
      <nav className="topnav-links">
        <NavLink to="/dashboard">{t("nav.dashboard")}</NavLink>
        <div className="topnav-dropdown">
          <NavLink to="/monitor/water-level" className="has-caret">
            {t("nav.monitor")} <Icon name="chevron-down" size={13} className="caret" />
          </NavLink>
          <div className="topnav-menu">
            {MONITOR_TABS.map((m) => (
              <NavLink key={m.to} to={m.to}>
                {t(m.label)}
              </NavLink>
            ))}
          </div>
        </div>
        <NavLink to="/map">{t("nav.map")}</NavLink>
        <NavLink to="/report">{t("nav.report")}</NavLink>
        <NavLink to="/database/network">{t("nav.database")}</NavLink>
      </nav>
      <div className="topnav-right">
        <LangToggle />
      </div>
    </header>
  );
}
