import { useMemo, useState, type ReactNode } from "react";
import { useT } from "../i18n/I18nContext";
import EmptyState from "./EmptyState";

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  numbered?: boolean;
  searchable?: boolean;
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  onRowClick?: (row: T) => void;
  rowClass?: (row: T) => string | undefined;
  emptyLabel?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  getKey,
  numbered = true,
  searchable = true,
  searchText,
  searchPlaceholder,
  toolbar,
  onRowClick,
  rowClass,
  emptyLabel,
}: Props<T>) {
  const t = useT();
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term || !searchText) return rows;
    return rows.filter((r) => searchText(r).toLowerCase().includes(term));
  }, [rows, q, searchText]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const sv = col.sortValue;
    return [...filtered].sort((a, b) => {
      const va = sv(a), vb = sv(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [filtered, sortKey, dir, columns]);

  function onSort(col: Column<T>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(col.key);
      setDir(1);
    }
  }

  return (
    <div className="datatable">
      {(searchable || toolbar) && (
        <div className="dt-toolbar">
          {searchable && (
            <input
              className="dt-search"
              placeholder={searchPlaceholder ?? t("monitor.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          )}
          {toolbar}
        </div>
      )}
      <div className="dt-scroll">
        <table className="dt-table">
          <thead>
            <tr>
              {numbered && <th className="dt-no">{t("col.no")}</th>}
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`${c.align ? `align-${c.align}` : ""} ${c.sortValue ? "sortable" : ""}`}
                  onClick={() => onSort(c)}
                >
                  {c.label}
                  {sortKey === c.key && <span className="dt-arrow">{dir === 1 ? " ▲" : " ▼"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={getKey(row)}
                className={rowClass?.(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {numbered && <td className="dt-no">{i + 1}</td>}
                {columns.map((c) => (
                  <td key={c.key} className={`${c.align ? `align-${c.align}` : ""} ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : (row as Record<string, unknown>)[c.key] as ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <EmptyState label={emptyLabel} />}
      </div>
    </div>
  );
}
