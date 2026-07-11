import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { CurrentLocationState } from "../location/useCurrentLocation";
import type { Status } from "../domain/status";
import { formatDuration } from "../domain/time";
import { strings } from "../domain/i18n";
import StatusBadge from "../ui/StatusBadge";
import DemoBadge from "../ui/DemoBadge";

export interface AreaStatus {
  status: Status;
  forecastMinutes: number | null;
}

export interface StatusScreenProps {
  location: CurrentLocationState;
  area: AreaStatus | null;
  onViewMap: () => void;
  onChangeLocation: () => void;
}

export default function StatusScreen({ location, area, onViewMap, onChangeLocation }: StatusScreenProps) {
  return (
    <View style={styles.root}>
      <DemoBadge />

      {location.loading && (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color="#2f6fb0" />
          <Text style={styles.muted}>{strings.locating}</Text>
        </View>
      )}

      {!location.loading && !location.point && (
        <View style={styles.centerBlock}>
          <Text style={styles.muted}>{location.error ?? strings.noLocation}</Text>
          <Pressable style={styles.primaryBtn} onPress={onChangeLocation}>
            <Text style={styles.primaryBtnText}>{strings.pickOnMap}</Text>
          </Pressable>
        </View>
      )}

      {!location.loading && location.point && area && (
        <>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{strings.currentStatus}</Text>
              <Pressable onPress={location.refresh} hitSlop={10}>
                <Text style={styles.refreshIcon}>⟳ {strings.refreshLocation}</Text>
              </Pressable>
            </View>
            <StatusBadge status={area.status} />
            <Text style={styles.forecast}>{forecastText(area)}</Text>
          </View>

          <Pressable style={styles.primaryBtn} onPress={onViewMap}>
            <Text style={styles.primaryBtnText}>{strings.viewOnMap}</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onChangeLocation}>
            <Text style={styles.secondaryBtnText}>{strings.changeLocation}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function forecastText(area: AreaStatus): string {
  if (area.status === "bad") return strings.status.bad;
  if (area.forecastMinutes != null) return strings.forecastFlood(formatDuration(area.forecastMinutes));
  return strings.forecastNone;
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 16 },
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  muted: { color: "#64748b", fontSize: 14, textAlign: "center" },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16, gap: 10,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#334155" },
  refreshIcon: { fontSize: 12, color: "#2f6fb0", fontWeight: "600" },
  forecast: { fontSize: 15, color: "#334155", lineHeight: 21 },
  primaryBtn: { backgroundColor: "#1d4ed8", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  secondaryBtnText: { color: "#1d4ed8", fontSize: 14, fontWeight: "600" },
});
