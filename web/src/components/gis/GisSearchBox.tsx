import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import { useI18n } from "../../i18n/I18nContext";

/** A searchable point on the map - a manhole/water-level node or a pump/gate
 *  outlet. Built in `GisMap.tsx` from the same GeoJSON features the map draws,
 *  so `lng`/`lat` are real coordinates the map can fly to. */
export type StationHit = {
  id: string;
  type: "station" | "pump" | "gate";
  lng: number;
  lat: number;
};

const MAX_RESULTS = 8;

const TYPE_KEY: Record<StationHit["type"], string> = {
  station: "gis.search.typeStation",
  pump: "gis.layer.pumpStation",
  gate: "gis.layer.gate",
};

/** Custom autocomplete replacing the native `<datalist>` (feedback 2026-07-24:
 *  the browser dropdown was unstylable and its arrow dumped all ~880 raw muids
 *  at once). Filters by substring, caps to 8 typed results, is keyboard- and
 *  screen-reader-navigable, and flies the map to the picked point via
 *  `onSelect`. Rows are ≥44px tall for older operators' touch accuracy. */
export default function GisSearchBox({
  stations, onSelect,
}: {
  stations: StationHit[];
  onSelect: (hit: StationHit) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stations.filter((s) => s.id.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }, [query, stations]);

  // Close on click/tap outside the search box.
  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [open]);

  function choose(hit: StationHit) {
    setQuery(hit.id);
    setOpen(false);
    onSelect(hit);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (results[activeIndex]) {
        e.preventDefault();
        choose(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div className="gis-topbar-search" ref={rootRef}>
      <Icon name="search" size={18} />
      <input
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="gis-search-listbox"
        aria-activedescendant={showDropdown && results[activeIndex] ? `gis-search-opt-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder={t("gis.searchPlaceholder")}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {showDropdown && (
        <ul className="gis-search-dropdown" id="gis-search-listbox" role="listbox">
          {results.length === 0 ? (
            <li className="gis-search-empty">{t("gis.search.noResults")}</li>
          ) : (
            results.map((hit, i) => (
              <li key={`${hit.type}-${hit.id}`} role="option" id={`gis-search-opt-${i}`} aria-selected={i === activeIndex}>
                <button
                  type="button"
                  className={`gis-search-option${i === activeIndex ? " active" : ""}`}
                  // pointerdown (not click) so the option fires before the
                  // input's blur/outside-click handler tears the list down.
                  onPointerDown={(e) => { e.preventDefault(); choose(hit); }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span className="gis-search-option-id">{hit.id}</span>
                  <span className="gis-search-option-type">{t(TYPE_KEY[hit.type])}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
