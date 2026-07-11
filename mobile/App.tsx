import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { FeatureCollection } from "geojson";
import type { MapStyleConfig, Simulation, LocationPoint } from "./src/domain/types";
import { useCurrentLocation } from "./src/location/useCurrentLocation";
import { nearestManhole } from "./src/domain/nearest";
import { computeStatus, computeForecastMinutes } from "./src/domain/status";
import { NOW_STEP } from "./src/domain/nowStep";
import { strings } from "./src/domain/i18n";
import StatusScreen, { type AreaStatus } from "./src/screens/StatusScreen";
import MapScreen from "./src/screens/MapScreen";

// Data bundled at build time by scripts/sync-data.mjs
const config: MapStyleConfig = require("./assets/data/map-style.json");
const manholes: FeatureCollection = require("./assets/data/manholes.json");
const boundary: FeatureCollection = require("./assets/data/boundary.json");
const provinceBoundary: FeatureCollection = require("./assets/data/province-boundary.json");
const rivers: FeatureCollection = require("./assets/data/rivers.json");
const floodZones: FeatureCollection = require("./assets/data/flood-zones.json");
const simulation: Simulation = require("./assets/data/simulation.json");

export default function App() {
  const [tab, setTab] = useState<"status" | "map">("status");
  const [pickMode, setPickMode] = useState(false);
  const location = useCurrentLocation();

  const area: AreaStatus | null = useMemo(() => {
    if (!location.point) return null;
    const nearestId = nearestManhole(manholes, location.point);
    const series = nearestId ? simulation.nodeFill[nearestId] : undefined;
    if (!series) return null;
    const fill = series[NOW_STEP] ?? 0;
    const status = computeStatus(fill, config.simThresholds);
    const forecastMinutes = computeForecastMinutes(series, NOW_STEP, config.simThresholds, simulation.stepMinutes);
    return { status, forecastMinutes };
  }, [location.point]);

  function handleChangeLocation() {
    setPickMode(true);
    setTab("map");
  }

  function handlePick(lngLat: LocationPoint) {
    location.setManual(lngLat);
    setPickMode(false);
    setTab("status");
  }

  function handleCancelPick() {
    setPickMode(false);
    setTab("status");
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>{strings.appTitle}</Text>
      </View>

      <View style={styles.content}>
        {tab === "status" ? (
          <StatusScreen
            location={location}
            area={area}
            onViewMap={() => setTab("map")}
            onChangeLocation={handleChangeLocation}
          />
        ) : (
          <MapScreen
            config={config}
            boundary={boundary}
            provinceBoundary={provinceBoundary}
            rivers={rivers}
            floodZones={floodZones}
            statusPoint={location.point && area ? { lngLat: location.point, status: area.status } : null}
            pickMode={pickMode}
            onPick={handlePick}
            onCancelPick={handleCancelPick}
          />
        )}
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabBtn, tab === "status" && styles.tabBtnActive]}
          onPress={() => { setPickMode(false); setTab("status"); }}
        >
          <Text style={[styles.tabLabel, tab === "status" && styles.tabLabelActive]}>{strings.tabStatus}</Text>
        </Pressable>
        <Pressable style={[styles.tabBtn, tab === "map" && styles.tabBtnActive]} onPress={() => setTab("map")}>
          <Text style={[styles.tabLabel, tab === "map" && styles.tabLabelActive]}>{strings.tabMap}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#0f2a43" },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  content: { flex: 1 },
  tabBar: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e2e8f0", backgroundColor: "#fff" },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnActive: { borderTopWidth: 2, borderTopColor: "#1d4ed8" },
  tabLabel: { color: "#94a3b8", fontSize: 13, fontWeight: "600" },
  tabLabelActive: { color: "#1d4ed8" },
});
