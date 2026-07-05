import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Slider from "@react-native-community/slider";
import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";

// Data bundled at build time by scripts/sync-data.mjs
const config = require("./assets/data/map-style.json");
const manholes = require("./assets/data/manholes.json");
const links = require("./assets/data/links.json");
const outlets = require("./assets/data/outlets.json");
const rivers = require("./assets/data/rivers.json");
const boundary = require("./assets/data/boundary.json");
const floodZones = require("./assets/data/flood-zones.json");
const simulation = require("./assets/data/simulation.json");

MapLibreGL.setAccessToken(null);

const RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [config.basemaps.osm.tiles],
      tileSize: 256,
      attribution: config.basemaps.osm.attribution,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

function stepLabel(step: number): string {
  const minutes = step * simulation.stepMinutes;
  const h = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** GeoJSON with per-feature sim fill baked into properties for the current step. */
function withFill(fc: any, step: number): any {
  return {
    ...fc,
    features: fc.features.map((f: any) => ({
      ...f,
      properties: {
        ...f.properties,
        fill: simulation.nodeFill[String(f.properties.muid)]?.[step] ?? 0,
      },
    })),
  };
}

function floodWithSeverity(step: number): any {
  return {
    ...floodZones,
    features: floodZones.features.map((f: any) => ({
      ...f,
      properties: { ...f.properties, sev: f.properties.severity[step] ?? 0 },
    })),
  };
}

export default function App() {
  const [simMode, setSimMode] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const cameraRef = useRef<MapLibreGL.Camera>(null);

  useEffect(() => {
    if (!playing || !simMode) return;
    const id = setInterval(
      () => setStep((s) => (s + 1 >= simulation.steps ? (setPlaying(false), s) : s + 1)),
      250,
    );
    return () => clearInterval(id);
  }, [playing, simMode]);

  const manholeData = useMemo(
    () => (simMode ? withFill(manholes, step) : manholes),
    [simMode, step],
  );
  const floodData = useMemo(
    () => (simMode ? floodWithSeverity(step) : null),
    [simMode, step],
  );

  const locateMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const pos = await Location.getCurrentPositionAsync({});
    cameraRef.current?.setCamera({
      centerCoordinate: [pos.coords.longitude, pos.coords.latitude],
      zoomLevel: 16,
      animationDuration: 800,
    });
  };

  const c = config.colors;
  const simColor = [
    "interpolate", ["linear"], ["coalesce", ["get", "fill"], 0],
    0, c.simOk, config.simThresholds.warn, c.simWarn, config.simThresholds.surcharge, c.simSurcharge,
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>EWATER - Vĩnh Long</Text>
        <View style={styles.simSwitch}>
          <Text style={styles.headerLabel}>Simulation</Text>
          <Switch value={simMode} onValueChange={(v) => { setSimMode(v); setPlaying(false); }} />
        </View>
      </View>

      <MapLibreGL.MapView style={styles.map} styleJSON={JSON.stringify(RASTER_STYLE)}>
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: config.center, zoomLevel: config.zoom }}
        />
        <MapLibreGL.UserLocation visible />

        <MapLibreGL.ShapeSource id="boundary" shape={boundary}>
          <MapLibreGL.LineLayer
            id="boundary-line"
            style={{ lineColor: c.boundary, lineWidth: 2, lineDasharray: [3, 2] }}
          />
        </MapLibreGL.ShapeSource>

        <MapLibreGL.ShapeSource id="rivers" shape={rivers}>
          <MapLibreGL.LineLayer id="rivers-line" style={{ lineColor: c.river, lineWidth: 3 }} />
        </MapLibreGL.ShapeSource>

        {floodData && (
          <MapLibreGL.ShapeSource id="flood" shape={floodData}>
            <MapLibreGL.FillLayer
              id="flood-fill"
              style={{ fillColor: c.flood, fillOpacity: ["*", 0.55, ["get", "sev"]] as any }}
            />
          </MapLibreGL.ShapeSource>
        )}

        <MapLibreGL.ShapeSource
          id="links"
          shape={links}
          onPress={(e) => setSelected({ kind: "Pipe", ...e.features[0]?.properties })}
        >
          <MapLibreGL.LineLayer
            id="links-line"
            style={{ lineColor: c.pipeMedium, lineWidth: 2 }}
          />
        </MapLibreGL.ShapeSource>

        <MapLibreGL.ShapeSource
          id="manholes"
          shape={manholeData}
          onPress={(e) => setSelected({ kind: "Manhole", ...e.features[0]?.properties })}
        >
          <MapLibreGL.CircleLayer
            id="manholes-circle"
            style={{
              circleColor: (simMode ? simColor : c.manhole) as any,
              circleRadius: 4,
              circleStrokeColor: "#fff",
              circleStrokeWidth: 1,
            }}
          />
        </MapLibreGL.ShapeSource>

        <MapLibreGL.ShapeSource
          id="outlets"
          shape={outlets}
          onPress={(e) => setSelected({ kind: "Outlet", ...e.features[0]?.properties })}
        >
          <MapLibreGL.CircleLayer
            id="outlets-circle"
            style={{ circleColor: c.outlet, circleRadius: 6, circleStrokeColor: "#fff", circleStrokeWidth: 1.5 }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>

      <Pressable style={styles.locateBtn} onPress={locateMe}>
        <Text style={styles.locateTxt}>📍</Text>
      </Pressable>

      {simMode && (
        <View style={styles.simBar}>
          <View style={styles.simRow}>
            <Pressable style={styles.playBtn} onPress={() => setPlaying((p) => !p)}>
              <Text style={styles.playTxt}>{playing ? "⏸" : "▶"}</Text>
            </Pressable>
            <Slider
              style={{ flex: 1 }}
              minimumValue={0}
              maximumValue={simulation.steps - 1}
              step={1}
              value={step}
              onValueChange={setStep}
            />
            <Text style={styles.clock}>{stepLabel(step)}</Text>
          </View>
          <Text style={styles.demoBadge}>
            DEMO DATA · rain {simulation.rainfall[step]?.toFixed(1)} mm/h
          </Text>
        </View>
      )}

      {selected && (
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {String(selected.kind)} {String(selected.muid ?? "")}
            </Text>
            <Pressable onPress={() => setSelected(null)}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 180 }}>
            {Object.entries(selected)
              .filter(([k]) => !["kind", "fill"].includes(k))
              .map(([k, v]) => (
                <View key={k} style={styles.row}>
                  <Text style={styles.rowKey}>{k}</Text>
                  <Text style={styles.rowVal}>
                    {typeof v === "number" ? v.toFixed(2) : String(v)}
                  </Text>
                </View>
              ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f2a43" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 10,
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  headerLabel: { color: "#9fb8cf", marginRight: 8, fontSize: 13 },
  simSwitch: { flexDirection: "row", alignItems: "center" },
  map: { flex: 1 },
  locateBtn: {
    position: "absolute", right: 14, top: 110, backgroundColor: "#fff",
    borderRadius: 22, width: 44, height: 44, alignItems: "center",
    justifyContent: "center", elevation: 4,
  },
  locateTxt: { fontSize: 20 },
  simBar: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8 },
  simRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  playBtn: {
    backgroundColor: "#1d4ed8", borderRadius: 8, width: 40, height: 36,
    alignItems: "center", justifyContent: "center",
  },
  playTxt: { color: "#fff", fontSize: 16 },
  clock: { fontWeight: "700", width: 48, textAlign: "right" },
  demoBadge: { color: "#92600a", fontSize: 11, fontWeight: "700", marginTop: 4 },
  sheet: {
    position: "absolute", left: 10, right: 10, bottom: 10, backgroundColor: "#fff",
    borderRadius: 12, padding: 14, elevation: 6,
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  close: { fontSize: 18, color: "#64748b" },
  row: {
    flexDirection: "row", justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#e2e8f0", paddingVertical: 4,
  },
  rowKey: { color: "#64748b" },
  rowVal: { fontWeight: "600" },
});
