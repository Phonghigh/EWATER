import { StyleSheet, Text, View } from "react-native";
import { strings } from "../domain/i18n";

export default function DemoBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{strings.demoBadge}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start", backgroundColor: "#fef3c7", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  text: { color: "#92600a", fontSize: 11, fontWeight: "700" },
});
