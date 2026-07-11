import { Pressable, StyleSheet, Text, View } from "react-native";
import type { FeatureCollection } from "geojson";
import type { MapStyleConfig, LocationPoint } from "../domain/types";
import type { Status } from "../domain/status";
import FloodMapWebView from "../map/FloodMapWebView";
import { strings } from "../domain/i18n";

export interface MapScreenProps {
  config: MapStyleConfig;
  boundary: FeatureCollection;
  provinceBoundary: FeatureCollection;
  rivers: FeatureCollection;
  floodZones: FeatureCollection;
  statusPoint: { lngLat: LocationPoint; status: Status } | null;
  pickMode: boolean;
  onPick: (lngLat: LocationPoint) => void;
  onCancelPick: () => void;
}

export default function MapScreen({
  config, boundary, provinceBoundary, rivers, floodZones, statusPoint, pickMode, onPick, onCancelPick,
}: MapScreenProps) {
  return (
    <View style={styles.root}>
      <FloodMapWebView
        config={config}
        boundary={boundary}
        provinceBoundary={provinceBoundary}
        rivers={rivers}
        floodZones={floodZones}
        statusPoint={statusPoint}
        pickMode={pickMode}
        onPick={onPick}
      />
      {pickMode && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{strings.pickPrompt}</Text>
          <Pressable onPress={onCancelPick}>
            <Text style={styles.cancel}>{strings.cancel}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: {
    position: "absolute", top: 12, left: 12, right: 12,
    backgroundColor: "#1e293b", borderRadius: 10, padding: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12,
  },
  bannerText: { color: "#fff", fontSize: 13, flex: 1 },
  cancel: { color: "#fbbf24", fontSize: 13, fontWeight: "700" },
});
