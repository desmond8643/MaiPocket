import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalization } from "@/context/LocalizationContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserAPI } from "../../api/client";

interface BlockedUser {
  _id: string;
  username: string;
  displayName: string;
  currentAvatar?: string;
}

export default function BlockedUsersScreen() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const primaryColor = useThemeColor({}, "tint");
  const router = useRouter();
  const { t } = useLocalization();

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setIsLoading(true);
      const users = await UserAPI.getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      console.error("Error loading blocked users:", error);
      Alert.alert("Error", "Failed to load blocked users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await UserAPI.unblockUser(userId);
      setBlockedUsers(blockedUsers.filter((user) => user._id !== userId));
      Alert.alert(t("success"), t("userUnblocked"));
    } catch (error) {
      console.error("Error unblocking user:", error);
      Alert.alert(t("error"), t("failedToUnblock"));
    }
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
      ]}
    >
      <View style={styles.userInfo}>
        <ThemedText style={styles.displayName}>{item.displayName}</ThemedText>
        <ThemedText style={styles.username}>@{item.username}</ThemedText>
      </View>
      <TouchableOpacity
        style={[styles.unblockButton, { backgroundColor: "#AE75DA" }]}
        onPress={() => handleUnblock(item._id)}
      >
        <Text style={styles.unblockText}>{t("unblock")}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
          <ThemedText style={styles.headerTitle}>{t("blockedUsers")}</ThemedText>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.title}>{t("manageBlockedUsers")}</ThemedText>
          <ThemedText style={styles.description}>
            {t("blockedUsersDescription")}
          </ThemedText>

          {blockedUsers.length === 0 && !isLoading ? (
            <ThemedText style={styles.emptyState}>
              {t("noBlockedUsers")}
            </ThemedText>
          ) : (
            <FlatList
              data={blockedUsers}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              refreshing={isLoading}
              onRefresh={loadBlockedUsers}
              style={styles.optionsContainer}
            />
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
    marginTop: 8,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.3)",
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  username: {
    fontSize: 14,
    opacity: 0.6,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  unblockText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyState: {
    textAlign: "center",
    marginTop: 32,
    opacity: 0.6,
  },
});