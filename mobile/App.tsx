import { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { FeatureCollection } from "geojson";
import type { MapStyleConfig, Simulation, LocationPoint, AreaStatus } from "./src/domain/types";
import { useCurrentLocation } from "./src/location/useCurrentLocation";
import { nearestManhole } from "./src/domain/nearest";
import { computeStatus, computeForecastMinutes } from "./src/domain/status";
import { computeRiskPercent, recommendationFor } from "./src/domain/level";
import { NOW_STEP } from "./src/domain/nowStep";
import { strings } from "./src/domain/i18n";
import HomeScreen from "./src/screens/HomeScreen";

// Data bundled at build time by scripts/sync-data.mjs
const config: MapStyleConfig = require("./assets/data/map-style.json");
const manholes: FeatureCollection = require("./assets/data/manholes.json");
const boundary: FeatureCollection = require("./assets/data/boundary.json");
const provinceBoundary: FeatureCollection = require("./assets/data/province-boundary.json");
const rivers: FeatureCollection = require("./assets/data/rivers.json");
const floodZones: FeatureCollection = require("./assets/data/flood-zones.json");
const simulation: Simulation = require("./assets/data/simulation.json");

export default function App() {
  const location = useCurrentLocation();
  const [center, setCenter] = useState<LocationPoint | null>(null);
  const [flyToPoint, setFlyToPoint] = useState<LocationPoint | null>(null);
  const [flyToSignal, setFlyToSignal] = useState(0);
  const pendingLocate = useRef(false);

  // Seed the initial map center once GPS resolves (or falls back to the city center if unavailable).
  useEffect(() => {
    if (center !== null || location.loading) return;
    setCenter(location.point ?? config.center);
  }, [center, location.point, location.loading]);

  // After a "locate me" tap, once a fresh GPS point lands, fly the map there.
  useEffect(() => {
    if (!pendingLocate.current || location.loading || !location.point) return;
    pendingLocate.current = false;
    setCenter(location.point);
    setFlyToPoint(location.point);
    setFlyToSignal((s) => s + 1);
  }, [location.point, location.loading]);

  const area: AreaStatus | null = useMemo(() => {
    if (!center) return null;
    const nearestId = nearestManhole(manholes, center);
    const series = nearestId ? simulation.nodeFill[nearestId] : undefined;
    if (!series || !nearestId) return null;
    const fill = series[NOW_STEP] ?? 0;
    const status = computeStatus(fill, config.simThresholds);
    const forecastMinutes = computeForecastMinutes(series, NOW_STEP, config.simThresholds, simulation.stepMinutes);

    return {
      status,
      forecastMinutes,
      riskPercent: computeRiskPercent(fill),
      recommendation: recommendationFor(status),
    };
  }, [center]);

  async function handleLocateMe() {
    pendingLocate.current = true;
    await location.refresh();
  }

  async function handleSaveLocation() {
    if (!center) return;
    await location.setManual(center);
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>{strings.appTitle}</Text>
      </View>

      <HomeScreen
        location={location}
        center={center}
        area={area}
        config={config}
        boundary={boundary}
        provinceBoundary={provinceBoundary}
        rivers={rivers}
        floodZones={floodZones}
        flyToSignal={flyToSignal}
        flyToPoint={flyToPoint}
        onCenterChange={setCenter}
        onLocateMe={handleLocateMe}
        onSaveLocation={handleSaveLocation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#0f2a43" },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
