import { useMemo, useState } from "react";
import { useT } from "../../i18n/I18nContext";
import type { RainTableRow } from "../../data/monitoringService";

type SortKey = "name" | "r10min" | "r1h" | "r3h" | "r6h" | "r24h";

/** Bảng số liệu mưa thực đo: trạm × {10 phút, 1 giờ, 3 giờ, 6 giờ, 24 giờ} + trạng thái.
 *  Sắp xếp được theo cột số (mặc định 24h giảm dần) — aria-sort cho screen reader. */
export default function RainTable({ rows }: { rows: RainTableRow[] }) {
  const t = useT();
  const [sortKey, setSortKey] = useState<SortKey>("r24h");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const s = [...rows].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      return a[sortKey] - b[sortKey];
    });
    return asc ? s : s.reverse();
  }, [rows, sortKey, asc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(key === "name");
    }
  }

  const ariaSort = (key: SortKey) => (sortKey === key ? (asc ? "ascending" : "descending") : "none");

  const numCols: { key: SortKey; label: string }[] = [
    { key: "r10min", label: t("mon.col.r10min") },
    { key: "r1h", label: t("mon.col.r1h") },
    { key: "r3h", label: t("mon.col.r3h") },
    { key: "r6h", label: t("mon.col.r6h") },
    { key: "r24h", label: t("mon.col.r24h") },
  ];

  return (
    <div className="mon-table-wrap">
      <table className="mon-table">
        <thead>
          <tr>
            <th aria-sort={ariaSort("name")}>
              <button type="button" className="mon-th-btn" onClick={() => toggleSort("name")}>
                {t("mon.col.station")}
              </button>
            </th>
            {numCols.map((c) => (
              <th key={c.key} className="mon-num" aria-sort={ariaSort(c.key)}>
                <button type="button" className="mon-th-btn" onClick={() => toggleSort(c.key)}>
                  {c.label}
                </button>
              </th>
            ))}
            <th>{t("mon.col.status")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.code}>
              <td>{r.name}</td>
              <td className="mon-num">{r.r10min.toFixed(1)}</td>
              <td className="mon-num">{r.r1h.toFixed(1)}</td>
              <td className="mon-num">{r.r3h.toFixed(1)}</td>
              <td className="mon-num">{r.r6h.toFixed(1)}</td>
              <td className="mon-num mon-num--strong">{r.r24h.toFixed(1)}</td>
              <td>
                <span className={`mon-badge mon-badge--${r.status === "online" ? "ok" : "off"}`}>
                  {t(r.status === "online" ? "mon.status.online" : "mon.status.offline")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
