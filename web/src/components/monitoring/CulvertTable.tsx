import { useT } from "../../i18n/I18nContext";
import type { CulvertRow } from "../../data/monitoringService";

/** Bảng mực nước theo cống: cống · ngoài sông (m) · trong cống (m) ·
 *  trạng thái cửa (đóng/mở). Trạng thái dùng text + màu badge, không chỉ dựa vào màu. */
export default function CulvertTable({ rows }: { rows: CulvertRow[] }) {
  const t = useT();
  return (
    <div className="mon-table-wrap">
      <table className="mon-table">
        <thead>
          <tr>
            <th>{t("mon.col.culvert")}</th>
            <th className="mon-num">{t("mon.col.riverSide")}</th>
            <th className="mon-num">{t("mon.col.insideCulvert")}</th>
            <th>{t("mon.col.gateState")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td className="mon-num">{r.riverLevelM.toFixed(2)}</td>
              <td className="mon-num">{r.insideLevelM.toFixed(2)}</td>
              <td>
                <span className={`mon-badge mon-badge--${r.gateOpen ? "ok" : "closed"}`}>
                  {t(r.gateOpen ? "mon.gate.open" : "mon.gate.closed")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
