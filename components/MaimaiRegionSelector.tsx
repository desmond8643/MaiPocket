import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { useLocalization } from "@/context/LocalizationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MaimaiRegionSelector() {
  const { t } = useLocalization();
  const [defaultRegion, setDefaultRegion] = useState("international");

  useEffect(() => {
    const checkDefaultRegion = async () => {
      const data = await AsyncStorage.getItem("defaultRegion");
      if (data) {
        const defaultRegionData = JSON.parse(data);
        setDefaultRegion(defaultRegionData);
      }
    };
    checkDefaultRegion();
  }, []);

  const setDefaultRegionFunction = async (region: string) => {
    setDefaultRegion(region);

    await AsyncStorage.setItem("defaultRegion", JSON.stringify(region));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          defaultRegion === "japan" ? styles.active : null,
        ]}
        onPress={() => {
          setDefaultRegionFunction("japan");
        }}
      >
        <ThemedText
          style={[
            styles.text,
            defaultRegion === "japan" ? styles.activeText : null,
          ]}
        >
          🇯🇵 {t("japan")}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          defaultRegion === "international" ? styles.active : null,
        ]}
        onPress={() => {
          setDefaultRegionFunction("international");
        }}
      >
        <ThemedText
          style={[
            styles.text,
            defaultRegion === "international" ? styles.activeText : null,
          ]}
        >
          🌐 {t("international")}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  active: {
    backgroundColor: "#9944DD",
    borderColor: "#9944DD",
  },
  text: {
    fontSize: 16,
  },
  activeText: {
    color: "white",
  },
});
