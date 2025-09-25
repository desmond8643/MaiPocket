import { AuthAPI, NotificationAPI } from "@/api/client";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// API URL
const BASE_URL = "https://maipocket-backend.vercel.app";

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      checkLoginStatus();
      fetchNotificationCount();
    }, [])
  );

  const checkLoginStatus = async () => {
    setLoading(true);
    try {
      const isLoggedIn = await AuthAPI.isLoggedIn();
      if (isLoggedIn) {
        const userDataStr = await AsyncStorage.getItem("userData");
        if (userDataStr) {
          setUserData(JSON.parse(userDataStr));
        } else {
          // Fetch fresh user data
          const freshUserData = await AuthAPI.getCurrentUser();
          setUserData(freshUserData);
        }
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const isLoggedIn = await AuthAPI.isLoggedIn();
      if (isLoggedIn) {
        const count = await NotificationAPI.getUnreadCount();
        setNotificationCount(count);
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthAPI.logout();
      setUserData(null);
      Alert.alert("Success", "You have been logged out");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to log out");
    }
  };

  const navigateToLogin = () => {
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AE75DA" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Add settings icon to header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.settingsIconContainer}
            onPress={() => router.push("/settings/social-preferences")}
          >
            <Ionicons name="settings-outline" size={24} color="#AE75DA" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {userData ? (
            // Logged in view
            <View style={styles.profileContainer}>
              <View style={styles.avatarContainer}>
                {userData.currentAvatar ? (
                  <Image
                    source={{ uri: userData.currentAvatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.defaultAvatar}>
                    <Ionicons name="person" size={60} color="#AE75DA" />
                  </View>
                )}
              </View>

              <ThemedText style={styles.displayName}>
                {userData.displayName}
              </ThemedText>
              <ThemedText style={styles.username}>
                @{userData.username}
              </ThemedText>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>
                    {userData.exp || 0}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>EXP</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>
                    {userData.crystals || 0}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Crystals</ThemedText>
                </View>
                {userData.isPro && (
                  <View style={[styles.statItem, styles.proBadge]}>
                    <ThemedText style={styles.proText}>PRO</ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.settingsSection}>
                <ThemedText style={styles.sectionTitle}>Settings</ThemedText>

                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={() => router.push("/settings/edit-profile")}
                >
                  <Ionicons name="person-outline" size={24} color="#AE75DA" />
                  <ThemedText style={styles.settingLabel}>
                    Edit Profile
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={24} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={() => router.push("/settings/notifications")}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color="#AE75DA"
                  />
                  <ThemedText style={styles.settingLabel}>
                    Notifications
                  </ThemedText>
                  {notificationCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <ThemedText style={styles.notificationCount}>
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </ThemedText>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={24} color="#999" />
                </TouchableOpacity>

                {/* <TouchableOpacity 
                style={styles.settingsItem}
                onPress={() => router.push('/settings/appearance')}
              >
                <Ionicons name="color-palette-outline" size={24} color="#AE75DA" />
                <ThemedText style={styles.settingLabel}>Appearance</ThemedText>
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity> */}

                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={() => router.push("/settings/change-password")}
                >
                  <Ionicons name="key-outline" size={24} color="#AE75DA" />
                  <ThemedText style={styles.settingLabel}>
                    Change Password
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={24} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                  <ThemedText style={[styles.settingLabel, styles.logoutText]}>
                    Log Out
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Not logged in view
            <View style={styles.notLoggedInContainer}>
              <View style={styles.defaultAvatar}>
                <Ionicons name="person" size={60} color="#AE75DA" />
              </View>
              <ThemedText style={styles.notLoggedInText}>
                You're not logged in
              </ThemedText>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={navigateToLogin}
              >
                <ThemedText style={styles.loginButtonText}>
                  Log In / Register
                </ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.benefitsText}>
                Create an account to track your progress, save favorites, and
                more!
              </ThemedText>
              <View style={{ marginTop: 8 }}></View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  profileContainer: {
    padding: 20,
    marginTop: 64,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(174, 117, 218, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  displayName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  username: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
    backgroundColor: "rgba(174, 117, 218, 0.1)",
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    color: "#999",
  },
  proBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: "center",
  },
  proText: {
    color: "#000",
    fontWeight: "bold",
  },
  settingsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  logoutText: {
    color: "#FF6B6B",
  },
  notLoggedInContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 64,
  },
  notLoggedInText: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 20,
  },
  loginButton: {
    backgroundColor: "#AE75DA",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginVertical: 16,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  benefitsText: {
    textAlign: "center",
    color: "#999",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  // New styles for notification badge
  notificationBadge: {
    backgroundColor: "#FF5555",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  notificationCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 6,
  },
  header: {
    position: "absolute",
    paddingHorizontal: 16,
    top: 40,
    left: 0,
    right: 0,
    // height: 60,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 10,
  },
  settingsIconContainer: {
    padding: 8,
  },
  featureContainer: {
    padding: 20,
    // marginTop: 10,
    backgroundColor: "rgba(174, 117, 218, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.3)",
  },
});
