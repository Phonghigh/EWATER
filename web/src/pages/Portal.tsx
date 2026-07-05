import { Link } from "react-router-dom";
import { useT } from "../i18n/I18nContext";
import DemoBadge from "../components/DemoBadge";
import Icon, { type IconName } from "../components/Icon";

const MODULES: { to: string; icon: IconName; label: string }[] = [
  { to: "/dashboard", icon: "dashboard", label: "nav.dashboard" },
  { to: "/monitor/water-level", icon: "monitor", label: "nav.monitor" },
  { to: "/map", icon: "map", label: "nav.map" },
  { to: "/report", icon: "report", label: "nav.report" },
  { to: "/database/network", icon: "database", label: "nav.database" },
  { to: "/monitor/gates", icon: "gate", label: "monitor.gates" },
];

export default function Portal() {
  const t = useT();
  return (
    <div className="portal">
      <section className="portal-hero">
        <div className="portal-hero-inner">
          <h1>{t("portal.heroCity")}</h1>
          <p>{t("portal.heroSub")}</p>
          <Link to="/dashboard" className="portal-cta">{t("portal.enter")} →</Link>
        </div>
      </section>

      <section className="portal-modules">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.to} className="module-tile">
            <Icon name={m.icon} size={28} className="module-icon" />
            <span className="module-label">{t(m.label)}</span>
          </Link>
        ))}
      </section>

      <section className="portal-intro">
        <h2>{t("portal.intro.title")} <DemoBadge title /></h2>
        <p>{t("portal.intro.body")}</p>
        <p className="portal-disclaimer">{t("app.demoNote")}</p>
      </section>

      <footer className="portal-footer">
        <span>EWATER · Vĩnh Long · FRMIS demo</span>
      </footer>
    </div>
  );
}
