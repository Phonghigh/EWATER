import { StyleSheet, Text, View } from "react-native";
import type { Status } from "../domain/status";
import { strings } from "../domain/i18n";

const COLORS: Record<Status, { bg: string; fg: string }> = {
  ok: { bg: "#dcfce7", fg: "#166534" },
  warn: { bg: "#fef3c7", fg: "#92600a" },
  bad: { bg: "#fee2e2", fg: "#991b1b" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const { bg, fg } = COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{strings.status[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  text: { fontSize: 18, fontWeight: "800" },
});
