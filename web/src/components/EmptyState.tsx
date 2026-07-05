import { useT } from "../i18n/I18nContext";
import Icon from "./Icon";

export default function EmptyState({ label }: { label?: string }) {
  const t = useT();
  return (
    <div className="empty-state">
      <Icon name="empty" size={36} className="empty-box" />
      <p>{label ?? t("app.noData")}</p>
    </div>
  );
}
