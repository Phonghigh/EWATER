import React, { useEffect, useState } from "react";
import {
  Pressable, SafeAreaView, StyleSheet, Switch, Text, View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Slider from "@react-native-community/slider";

// Data bundled at build time by scripts/sync-data.mjs
const simulation = require("./assets/data/simulation.json");

function stepLabel(step: number): string {
  const minutes = step * simulation.stepMinutes;
  const h = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export default function App() {
  const [simMode, setSimMode] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || !simMode) return;
    const id = setInterval(
      () => setStep((s) => (s + 1 >= simulation.steps ? (setPlaying(false), s) : s + 1)),
      250,
    );
    return () => clearInterval(id);
  }, [playing, simMode]);

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

      <View style={styles.map}>
        <Text style={styles.mapPlaceholderTitle}>Map view unavailable</Text>
        <Text style={styles.mapPlaceholderText}>
          The drainage map needs a custom dev client build (MapLibre's native
          module doesn't run in Expo Go). Run `npm run android` or
          `npm run ios` to build one.
        </Text>
      </View>

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
  map: {
    flex: 1, backgroundColor: "#0f2a43", alignItems: "center",
    justifyContent: "center", paddingHorizontal: 32, gap: 8,
  },
  mapPlaceholderTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  mapPlaceholderText: { color: "#9fb8cf", fontSize: 13, textAlign: "center" },
  simBar: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8 },
  simRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  playBtn: {
    backgroundColor: "#1d4ed8", borderRadius: 8, width: 40, height: 36,
    alignItems: "center", justifyContent: "center",
  },
  playTxt: { color: "#fff", fontSize: 16 },
  clock: { fontWeight: "700", width: 48, textAlign: "right" },
  demoBadge: { color: "#92600a", fontSize: 11, fontWeight: "700", marginTop: 4 },
});
