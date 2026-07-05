import { useMemo, useState } from "react";
import type { AppData, Selection } from "../types";
import { useStore } from "../state/store";

interface Entry {
  kind: Selection["kind"];
  muid: string;
  label: string;
  lngLat: [number, number];
  properties: Record<string, unknown>;
}

function firstCoord(geom: GeoJSON.Geometry): [number, number] {
  switch (geom.type) {
    case "Point": return geom.coordinates as [number, number];
    case "LineString": return geom.coordinates[0] as [number, number];
    case "MultiLineString": return geom.coordinates[0][0] as [number, number];
    default: return [0, 0];
  }
}

export default function SearchBox({ data, onFlyTo }: {
  data: AppData;
  onFlyTo: (lngLat: [number, number]) => void;
}) {
  const [q, setQ] = useState("");
  const setSelection = useStore((s) => s.setSelection);

  const index = useMemo<Entry[]>(() => {
    const entries: Entry[] = [];
    for (const f of data.manholes.features) {
      const p = f.properties as Record<string, unknown>;
      entries.push({ kind: "manhole", muid: String(p.muid), label: `Manhole ${p.muid}`, lngLat: firstCoord(f.geometry), properties: p });
    }
    for (const f of data.outlets.features) {
      const p = f.properties as Record<string, unknown>;
      entries.push({ kind: "outlet", muid: String(p.muid), label: `Outlet ${p.muid}`, lngLat: firstCoord(f.geometry), properties: p });
    }
    for (const f of data.links.features) {
      const p = f.properties as Record<string, unknown>;
      entries.push({ kind: "link", muid: String(p.muid), label: `Pipe ${p.muid}`, lngLat: firstCoord(f.geometry), properties: p });
    }
    return entries;
  }, [data]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return index.filter((e) => e.muid.toLowerCase().startsWith(t)).slice(0, 8);
  }, [q, index]);

  return (
    <div className="search-box">
      <input
        placeholder="Search by ID (manhole, pipe, outlet)…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((e) => (
            <li key={`${e.kind}-${e.muid}`}>
              <button
                onClick={() => {
                  setSelection({ kind: e.kind, muid: e.muid, properties: e.properties });
                  onFlyTo(e.lngLat);
                  setQ("");
                }}
              >
                {e.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
