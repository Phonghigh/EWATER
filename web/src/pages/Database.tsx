import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { FeatureCollection } from "geojson";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/I18nContext";
import { useStore } from "../state/store";
import { useMonitoring } from "../monitoring/useMonitoring";
import DataTable, { type Column } from "../components/DataTable";
import { downloadCsv } from "../components/csv";
import DemoBadge from "../components/DemoBadge";
import Icon from "../components/Icon";

type NetKind = "manholes" | "links" | "outlets" | "rivers";

interface Row {
  id: string;
  props: Record<string, unknown>;
  lng: number;
  lat: number;
  kind: "manhole" | "link" | "outlet" | "river";
}

function firstCoord(g: GeoJSON.Geometry): [number, number] {
  if (g.type === "Point") return g.coordinates as [number, number];
  if (g.type === "LineString") return g.coordinates[0] as [number, number];
  if (g.type === "MultiLineString") return g.coordinates[0][0] as [number, number];
  return [0, 0];
}

function toRows(fc: FeatureCollection, kind: Row["kind"]): Row[] {
  return fc.features.map((f) => {
    const p = f.properties as Record<string, unknown>;
    const [lng, lat] = firstCoord(f.geometry);
    return { id: String(p.muid ?? p.riverName ?? p.topoId ?? Math.random()), props: p, lng, lat, kind };
  });
}

export default function Database() {
  const { tab } = useParams<{ tab: string }>();
  const t = useT();
  const active = tab === "stations" ? "stations" : "network";

  return (
    <div className="content-page">
      <div className="page-head">
        <h2>{t("db.title")} <DemoBadge title /></h2>
      </div>
      <div className="subtabs">
        <TabLink to="/database/network" active={active === "network"}>{t("db.network")}</TabLink>
        <TabLink to="/database/stations" active={active === "stations"}>{t("db.stations")}</TabLink>
      </div>
      {active === "network" ? <NetworkTab /> : <StationTab />}
    </div>
  );
}

function TabLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  const nav = useNavigate();
  return <button className={active ? "active" : ""} onClick={() => nav(to)}>{children}</button>;
}

// ------------------------------------------------------------- network tab

const NET_TABS: { key: NetKind; label: string }[] = [
  { key: "manholes", label: "db.manholes" },
  { key: "links", label: "db.links" },
  { key: "outlets", label: "db.outlets" },
  { key: "rivers", label: "db.rivers" },
];

function NetworkTab() {
  const data = useAppData();
  const t = useT();
  const nav = useNavigate();
  const setSelection = useStore((s) => s.setSelection);
  const [kind, setKind] = useState<NetKind>("manholes");

  const rows = useMemo(() => {
    switch (kind) {
      case "manholes": return toRows(data.manholes, "manhole");
      case "links": return toRows(data.links, "link");
      case "outlets": return toRows(data.outlets, "outlet");
      case "rivers": return toRows(data.rivers, "river");
    }
  }, [data, kind]);

  const columns = useMemo<Column<Row>[]>(() => {
    const num = (k: string) => (r: Row) => {
      const v = r.props[k];
      return typeof v === "number" ? v : 0;
    };
    const cell = (k: string, mul = 1, digits = 2) => (r: Row) => {
      const v = r.props[k];
      return typeof v === "number" ? (v * mul).toFixed(digits) : "-";
    };
    const idCol: Column<Row> = { key: "id", label: t("col.code"), sortValue: (r) => r.id };
    const geo: Column<Row>[] = [
      { key: "lng", label: t("col.lng"), align: "right", render: (r) => r.lng.toFixed(5) },
      { key: "lat", label: t("col.lat"), align: "right", render: (r) => r.lat.toFixed(5) },
    ];
    const view: Column<Row> = {
      key: "view", label: "", align: "center",
      render: (r) => (
        <button className="chart-btn" title={t("db.viewOnMap")} onClick={(e) => {
          e.stopPropagation();
          if (r.kind !== "river") setSelection({ kind: r.kind, muid: r.id, properties: r.props });
          nav("/map");
        }}><Icon name="map" size={15} /></button>
      ),
    };
    if (kind === "manholes")
      return [idCol,
        { key: "invert", label: t("col.invert"), align: "right", sortValue: num("invertLevel"), render: cell("invertLevel") },
        { key: "ground", label: t("col.ground"), align: "right", sortValue: num("groundLevel"), render: cell("groundLevel") },
        { key: "dia", label: t("col.diameter"), align: "right", render: cell("diameter", 1000, 0) },
        ...geo, view];
    if (kind === "links")
      return [idCol,
        { key: "from", label: t("col.fromNode"), render: (r) => String(r.props.fromNode ?? "-") },
        { key: "to", label: t("col.toNode"), render: (r) => String(r.props.toNode ?? "-") },
        { key: "len", label: t("col.length"), align: "right", sortValue: num("length"), render: cell("length", 1, 1) },
        { key: "slope", label: t("col.slope"), align: "right", render: cell("slope") },
        { key: "dia", label: t("col.diameter"), align: "right", render: cell("diameter", 1000, 0) },
        ...geo, view];
    if (kind === "outlets")
      return [idCol,
        { key: "invert", label: t("col.invert"), align: "right", sortValue: num("invertLevel"), render: cell("invertLevel") },
        { key: "ground", label: t("col.ground"), align: "right", sortValue: num("groundLevel"), render: cell("groundLevel") },
        ...geo, view];
    return [
      { key: "id", label: t("col.river"), render: (r) => String(r.props.riverName ?? r.id) },
      { key: "len", label: t("col.length"), align: "right", sortValue: num("length"), render: cell("length", 1, 0) },
      ...geo, view];
  }, [kind, t, nav, setSelection]);

  function exportCsv() {
    const headers = columns.filter((c) => c.key !== "view").map((c) => c.label);
    const body = rows.map((r) =>
      columns.filter((c) => c.key !== "view").map((c) => {
        if (c.key === "id") return r.id;
        if (c.key === "lng") return r.lng.toFixed(6);
        if (c.key === "lat") return r.lat.toFixed(6);
        const v = c.render ? c.render(r) : "";
        return typeof v === "string" ? v : String(v ?? "");
      }),
    );
    downloadCsv(`vinhlong-${kind}.csv`, headers, body);
  }

  return (
    <>
      <div className="subtabs subtabs-inner">
        {NET_TABS.map((x) => (
          <button key={x.key} className={x.key === kind ? "active" : ""} onClick={() => setKind(x.key)}>{t(x.label)}</button>
        ))}
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        getKey={(r) => `${kind}-${r.id}`}
        searchText={(r) => r.id}
        toolbar={<button className="csv-btn" onClick={exportCsv}><Icon name="download" size={14} /> {t("db.export")}</button>}
      />
    </>
  );
}

// ------------------------------------------------------------- station catalog tab

function StationTab() {
  const t = useT();
  const mon = useMonitoring();

  const rows = useMemo(() => [
    ...mon.rain.map((s) => ({ id: s.id, name: s.name, type: "Rainfall", source: s.source, lng: s.lng, lat: s.lat, extra: "-" })),
    ...mon.level.map((s) => ({ id: s.id, name: s.name, type: "Water level", source: s.source, lng: s.lng, lat: s.lat, extra: `A1/A2/A3 ${s.alert1}/${s.alert2}/${s.alert3}` })),
    ...mon.gates.map((s) => ({ id: s.id, name: s.name, type: s.type === "gate" ? "Gate" : "Pump", source: "-", lng: s.lng, lat: s.lat, extra: "-" })),
  ], [mon]);

  type SRow = typeof rows[number];
  const columns: Column<SRow>[] = [
    { key: "id", label: t("col.code"), sortValue: (r) => r.id },
    { key: "name", label: t("col.name"), sortValue: (r) => r.name },
    { key: "type", label: t("col.type"), sortValue: (r) => r.type },
    { key: "source", label: t("col.source") },
    { key: "lng", label: t("col.lng"), align: "right", render: (r) => r.lng.toFixed(5) },
    { key: "lat", label: t("col.lat"), align: "right", render: (r) => r.lat.toFixed(5) },
    { key: "extra", label: "Thresholds", render: (r) => r.extra },
  ];

  function exportCsv() {
    downloadCsv(
      "vinhlong-stations.csv",
      ["id", "name", "type", "source", "lng", "lat", "thresholds"],
      rows.map((r) => [r.id, r.name, r.type, r.source, r.lng.toFixed(6), r.lat.toFixed(6), r.extra]),
    );
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getKey={(r) => r.id}
      searchText={(r) => `${r.id} ${r.name} ${r.type}`}
      toolbar={<button className="csv-btn" onClick={exportCsv}><Icon name="download" size={14} /> {t("db.export")}</button>}
    />
  );
}
