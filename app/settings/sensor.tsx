// app/settings/sensor.tsx
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalization } from "@/context/LocalizationContext";
import { Canvas, Path } from "@shopify/react-native-skia";

export default function SensorScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const [lastActivated, setLastActivated] = useState<number | null>(null);

  const handleSensorPress = (index: number) => {
    setLastActivated(index);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#AE75DA"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("sensor")}</ThemedText>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.description}>
            {t("touchSensorsToActivate")}
          </ThemedText>
          <Canvas style={{ flex: 1 }}>
            <Path
              path="M 128 0 L 168 80 L 256 93 L 192 155 L 207 244 L 128 202 L 49 244 L 64 155 L 0 93 L 88 80 L 128 0 Z"
              color="lightblue"
            />
          </Canvas>
          {lastActivated !== null && (
            <ThemedText style={styles.statusText}>
              {t("sensorActivated", { id: lastActivated + 1 })}
            </ThemedText>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  description: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
  },
  statusText: {
    marginTop: 20,
    fontSize: 18,
    color: "#9944DD",
  },
});
