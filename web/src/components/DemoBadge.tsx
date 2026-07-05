import { useT } from "../i18n/I18nContext";

export default function DemoBadge({ title }: { title?: boolean }) {
  const t = useT();
  return (
    <span className="demo-badge" title={title ? t("app.demoNote") : undefined}>
      {t("app.demoBadge")}
    </span>
  );
}
