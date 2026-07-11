import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { FeatureCollection } from "geojson";
import type { CurrentLocationState } from "../location/useCurrentLocation";
import type { AreaStatus, LocationPoint, MapStyleConfig } from "../domain/types";
import { formatDuration } from "../domain/time";
import { strings } from "../domain/i18n";
import StatusBadge, { STATUS_COLORS } from "../ui/StatusBadge";
import DemoBadge from "../ui/DemoBadge";
import FloodMapWebView from "../map/FloodMapWebView";

export interface HomeScreenProps {
  location: CurrentLocationState;
  center: LocationPoint | null;
  area: AreaStatus | null;
  config: MapStyleConfig;
  boundary: FeatureCollection;
  provinceBoundary: FeatureCollection;
  rivers: FeatureCollection;
  floodZones: FeatureCollection;
  flyToSignal: number;
  flyToPoint: LocationPoint | null;
  onCenterChange: (point: LocationPoint) => void;
  onLocateMe: () => void;
  onSaveLocation: () => void;
}

export default function HomeScreen({
  location, center, area, config, boundary, provinceBoundary, rivers, floodZones,
  flyToSignal, flyToPoint, onCenterChange, onLocateMe, onSaveLocation,
}: HomeScreenProps) {
  const [justSaved, setJustSaved] = useState(false);

  function handleSave() {
    onSaveLocation();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  const pinColor = area ? STATUS_COLORS[area.status].fg : "#64748b";

  return (
    <View style={styles.root}>
      <View style={styles.mapWrap}>
        {center ? (
          <>
            <FloodMapWebView
              config={config}
              boundary={boundary}
              provinceBoundary={provinceBoundary}
              rivers={rivers}
              floodZones={floodZones}
              initialCenter={center}
              flyToSignal={flyToSignal}
              flyToPoint={flyToPoint}
              onCenterChange={onCenterChange}
            />
            <View pointerEvents="none" style={styles.pinWrap}>
              <View style={[styles.pin, { backgroundColor: pinColor }]} />
              <View style={styles.pinTip} />
            </View>
            <Pressable style={styles.locateBtn} onPress={onLocateMe} hitSlop={10}>
              <Text style={styles.locateIcon}>◎</Text>
            </Pressable>
            {location.error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{location.error} {strings.manualFallbackHint}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color="#2f6fb0" />
            <Text style={styles.muted}>{strings.locating}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.dashboard} contentContainerStyle={styles.dashboardContent}>
        <DemoBadge />
        {area && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{strings.currentStatus}</Text>
              <Text style={styles.dragHint}>{strings.dragHint}</Text>
            </View>
            <StatusBadge status={area.status} />
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{area.riskPercent}%</Text>
                <Text style={styles.statLabel}>{strings.riskIndexLabel}</Text>
              </View>
            </View>
            <Text style={styles.forecast}>{forecastText(area)}</Text>
            <Text style={styles.recommendation}>{area.recommendation}</Text>

            <Pressable style={styles.primaryBtn} onPress={handleSave}>
              <Text style={styles.primaryBtnText}>{justSaved ? strings.savedConfirmation : strings.saveThisLocation}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function forecastText(area: AreaStatus): string {
  if (area.status === "bad") return strings.status.bad;
  if (area.forecastMinutes != null) return strings.forecastFlood(formatDuration(area.forecastMinutes));
  return strings.forecastNone;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapWrap: { height: "42%", backgroundColor: "#e2e8f0" },
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  muted: { color: "#64748b", fontSize: 14, textAlign: "center" },
  pinWrap: {
    position: "absolute", top: "50%", left: "50%",
    marginLeft: -12, marginTop: -30, alignItems: "center",
  },
  pin: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 4,
  },
  pinTip: {
    width: 2, height: 14, backgroundColor: "#0f172a", opacity: 0.5, marginTop: -1,
  },
  locateBtn: {
    position: "absolute", right: 12, bottom: 12, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  locateIcon: { fontSize: 18, color: "#1d4ed8" },
  errorBanner: {
    position: "absolute", top: 12, left: 12, right: 12,
    backgroundColor: "#1e293b", borderRadius: 10, padding: 10,
  },
  errorBannerText: { color: "#fff", fontSize: 12 },
  dashboard: { flex: 1 },
  dashboardContent: { padding: 16, gap: 16 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16, gap: 10,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#334155" },
  dragHint: { fontSize: 11, color: "#94a3b8", flexShrink: 1, textAlign: "right" },
  statRow: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 10, padding: 10, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#0f2a43" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 2, textAlign: "center" },
  forecast: { fontSize: 15, color: "#334155", lineHeight: 21 },
  recommendation: { fontSize: 14, fontWeight: "700", color: "#1d4ed8", lineHeight: 20 },
  primaryBtn: { backgroundColor: "#1d4ed8", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
