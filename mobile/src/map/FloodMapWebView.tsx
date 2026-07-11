import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import type { FeatureCollection } from "geojson";
import type { MapStyleConfig, LocationPoint } from "../domain/types";
import { buildMapHtml } from "./mapHtml";
import { strings } from "../domain/i18n";

export interface FloodMapWebViewProps {
  config: MapStyleConfig;
  boundary: FeatureCollection;
  provinceBoundary: FeatureCollection;
  rivers: FeatureCollection;
  floodZones: FeatureCollection;
  initialCenter: LocationPoint;
  /** Bump alongside flyToPoint to command the map to animate to a new center (e.g. "locate me"). */
  flyToSignal: number;
  flyToPoint: LocationPoint | null;
  onCenterChange: (point: LocationPoint) => void;
}

export default function FloodMapWebView({
  config, boundary, provinceBoundary, rivers, floodZones, initialCenter, flyToSignal, flyToPoint, onCenterChange,
}: FloodMapWebViewProps) {
  const webviewRef = useRef<WebView>(null);
  const ready = useRef(false);

  const html = useMemo(
    () => buildMapHtml({ config, boundary, provinceBoundary, rivers, floodZones, initialCenter }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!ready.current || !flyToPoint) return;
    webviewRef.current?.postMessage(JSON.stringify({ type: "flyTo", lngLat: flyToPoint }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToSignal]);

  function handleMessage(event: WebViewMessageEvent) {
    let msg: { type: string; lngLat?: LocationPoint };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === "ready") {
      ready.current = true;
    } else if (msg.type === "center" && msg.lngLat) {
      onCenterChange(msg.lngLat);
    }
  }

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={["*"]}
      source={{ html }}
      onMessage={handleMessage}
      style={styles.webview}
      renderError={() => (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>{strings.mapLoadError}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1 },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  fallbackText: { color: "#64748b", fontSize: 14, textAlign: "center" },
});
