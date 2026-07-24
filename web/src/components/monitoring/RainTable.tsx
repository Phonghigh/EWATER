import { useMemo, useState } from "react";
import { useT } from "../../i18n/I18nContext";
import type { RainTableRow, TrendDir } from "../../data/monitoringService";

type SortKey = "name" | "r10min" | "r1h" | "r24h";

const TREND_GLYPH: Record<TrendDir, string> = { up: "↑", down: "↓", flat: "−" };

/** Bảng số liệu mưa thực đo: trạm × {10 phút, 1 giờ, 24 giờ} + xu hướng + trạng
 *  thái. Hàng liên kết 2 chiều với bản đồ (chọn/hover ↔ highlight marker). Ô số
 *  đổi giá trị sau mỗi lần refresh sẽ "flash" nhẹ (key theo giá trị → remount →
 *  animation chạy 1 lần). Sắp xếp theo cột số (mặc định 24h giảm dần). */
export default function RainTable({
  rows,
  selectedCode = null,
  hoveredCode = null,
  onSelect,
  onHover,
}: {
  rows: RainTableRow[];
  selectedCode?: string | null;
  hoveredCode?: string | null;
  onSelect?: (code: string) => void;
  onHover?: (code: string | null) => void;
}) {
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
            <th className="mon-num">{t("mon.col.trend")}</th>
            <th>{t("mon.col.status")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const active = r.code === selectedCode;
            const hover = r.code === hoveredCode;
            return (
              <tr
                key={r.code}
                className={`mon-row${active ? " mon-row--active" : ""}${hover ? " mon-row--hover" : ""}`}
                aria-selected={active}
                tabIndex={onSelect ? 0 : undefined}
                onClick={onSelect ? () => onSelect(r.code) : undefined}
                onMouseEnter={onHover ? () => onHover(r.code) : undefined}
                onMouseLeave={onHover ? () => onHover(null) : undefined}
                onKeyDown={
                  onSelect
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(r.code);
                        }
                      }
                    : undefined
                }
              >
                <td>{r.name}</td>
                <td className="mon-num"><span key={r.r10min} className="mon-cell-v">{r.r10min.toFixed(1)}</span></td>
                <td className="mon-num"><span key={r.r1h} className="mon-cell-v">{r.r1h.toFixed(1)}</span></td>
                <td className="mon-num mon-num--strong"><span key={r.r24h} className="mon-cell-v">{r.r24h.toFixed(1)}</span></td>
                <td className="mon-num">
                  <span className={`mon-trend mon-trend--${r.trend}`} aria-hidden="true">{TREND_GLYPH[r.trend]}</span>
                </td>
                <td>
                  <span className={`mon-badge mon-badge--${r.status === "online" ? "ok" : "off"}`}>
                    {t(r.status === "online" ? "mon.status.online" : "mon.status.offline")}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
