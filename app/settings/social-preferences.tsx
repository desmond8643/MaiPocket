import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SocialPreferencesScreen() {
  const router = useRouter();
  const [preference, setPreference] = useState("facebook");
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadPreference();
  }, []);

  const loadPreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem(
        "socialFeedPreference"
      );
      if (savedPreference) {
        setPreference(savedPreference);
      }
    } catch (error) {
      console.error("Error loading preference:", error);
    }
  };

  const savePreference = async (newPreference: string) => {
    try {
      await AsyncStorage.setItem("socialFeedPreference", newPreference);
      setPreference(newPreference);
    } catch (error) {
      console.error("Error saving preference:", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#AE75DA" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.title}>Choose Social Media Feed</ThemedText>
          <ThemedText style={styles.description}>
            Select which social media feed you would like to see on the home
            page.
          </ThemedText>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionItem,
                preference === "facebook" && styles.selectedOption,
              ]}
              onPress={() => savePreference("facebook")}
            >
              <Ionicons
                name="logo-facebook"
                size={24}
                color={preference === "facebook" ? "#FFFFFF" : "#4267B2"}
              />
              <ThemedText
                style={[
                  styles.optionText,
                  preference === "facebook" && styles.selectedOptionText,
                ]}
              >
                Facebook
              </ThemedText>
              {preference === "facebook" && (
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionItem,
                preference === "twitter" && styles.selectedOption,
              ]}
              onPress={() => savePreference("twitter")}
            >
              <Ionicons
                name="logo-x"
                size={24}
                color={
                  preference === "twitter"
                    ? "#FFFFFF"
                    : colorScheme === "dark"
                    ? "#FFFFFF"
                    : "#000000"
                }
              />
              <ThemedText
                style={[
                  styles.optionText,
                  preference === "twitter" && styles.selectedOptionText,
                ]}
              >
                X (Twitter)
              </ThemedText>
              {preference === "twitter" && (
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionItem,
                preference === "off" && styles.selectedOption,
              ]}
              onPress={() => savePreference("off")}
            >
              <Ionicons
                name="eye-off-outline"
                size={24}
                color={preference === "off" ? "#FFFFFF" : "#888888"}
              />
              <ThemedText
                style={[
                  styles.optionText,
                  preference === "off" && styles.selectedOptionText,
                ]}
              >
                Don't show feeds
              </ThemedText>
              {preference === "off" && (
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
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
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  optionsContainer: {
    gap: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.3)",
  },
  selectedOption: {
    backgroundColor: "#AE75DA",
    borderColor: "#AE75DA",
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  selectedOptionText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
});
