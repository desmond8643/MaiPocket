import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthAPI } from "@/api/client";

export default function SettingsScreen() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setIsLoggedIn(!!userData);
    };

    checkLoginStatus();
  }, []);

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
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        </View>

        <View style={styles.content}>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => router.push("/settings/social-preferences")}
            >
              <Ionicons name="share-social-outline" size={24} color="#AE75DA" />
              <ThemedText style={styles.optionText}>
                Social Preferences
              </ThemedText>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>

            {isLoggedIn && (
              <>
                <TouchableOpacity
                  style={styles.dangerOptionItem}
                  onPress={() => router.push("/settings/delete-account")}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                  <ThemedText style={styles.dangerOptionText}>
                    Delete Account
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={24} color="#999" />
                </TouchableOpacity>
              </>
            )}
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
  dangerOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  dangerOptionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    color: "#FF6B6B",
  },
});
