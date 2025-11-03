import { AuthAPI, NotificationAPI } from "@/api/client";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalization } from "@/context/LocalizationContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "post_approval" | "post_rejection" | "system" | "user";
  read: boolean;
  chartId?: {
    _id: string;
    title: string;
    image?: string;
  };
  chartType?: "standard" | "deluxe";
  chartDifficulty?: "basic" | "advanced" | "expert" | "master" | "remaster";
  createdAt: string;
}

// API URL
const BASE_URL = "https://maipocket-backend.vercel.app";
// const BASE_URL = "http://localhost:3001";

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
      setPage(0);
      setHasMore(true);
    } else if (!hasMore) {
      return;
    } else {
      setLoading(true);
    }

    try {
      const isLoggedIn = await AuthAPI.isLoggedIn();
      if (!isLoggedIn) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const currentPage = refresh ? 0 : page;
      const limit = 10;
      const skip = currentPage * limit;

      const response = await NotificationAPI.getNotifications(limit, skip);

      const newNotifications = response.notifications;

      if (refresh) {
        setNotifications(newNotifications);
      } else {
        setNotifications((prev) => [...prev, ...newNotifications]);
      }

      setHasMore(newNotifications.length === limit);
      setPage(currentPage + 1);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadNotifications(true);
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read if not already read
      if (!notification.read) {
        await NotificationAPI.markAsRead(notification._id);

        // Update local state to mark as read
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
      }

      // If it's a post approval with chart info, navigate to the chart
      if (notification.type === "post_approval" && notification.chartId) {
        router.push({
          pathname: "/charts/[id]",
          params: {
            id: notification.chartId._id,
            type: notification.chartType,
            difficulty: notification.chartDifficulty,
          },
        });
      }
    } catch (error) {
      console.error("Error handling notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationAPI.markAllAsRead();
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    // Format date
    const date = new Date(item.createdAt);
    const formattedDate =
      date.toLocaleDateString() + " " + date.toLocaleTimeString();

    // Get translated title and message based on notification type
    let translatedTitle = item.title;
    let translatedMessage = item.message;

    if (item.type === "post_approval") {
      translatedTitle = t("postApprovedTitle");
      translatedMessage = t("postApprovedMessage");
    } else if (item.type === "post_rejection") {
      translatedTitle = t("postRejectedTitle");
      // Check if there's an admin comment in the message
      const adminCommentMatch = item.message.match(/Reason: (.+)$/);
      if (adminCommentMatch && adminCommentMatch[1]) {
        translatedMessage = t("postRejectedWithReasonMessage", {
          reason: adminCommentMatch[1],
        });
      } else {
        translatedMessage = t("postRejectedMessage");
      }
    } else if (item.type === "system") {
      translatedTitle = t("systemNotificationTitle");
      translatedMessage = item.message; // Keep original message for system notifications
    } else if (item.type === "user") {
      translatedTitle = t("userNotificationTitle");
      translatedMessage = item.message; // Keep original message for user notifications
    }

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationIcon}>
          {item.type === "post_approval" ? (
            <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
          ) : item.type === "post_rejection" ? (
            <Ionicons name="close-circle" size={24} color="#f44336" />
          ) : (
            <Ionicons name="information-circle" size={24} color="#2196f3" />
          )}
        </View>

        <View style={styles.notificationContent}>
          <ThemedText style={styles.notificationTitle}>
            {translatedTitle}
          </ThemedText>
          <ThemedText style={styles.notificationMessage}>
            {translatedMessage}
          </ThemedText>
          <ThemedText style={styles.notificationDate}>
            {formattedDate}
          </ThemedText>
        </View>

        {!item.read && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: t("notifications"),
          headerBackButtonDisplayMode: "minimal",
        }}
      />

      {loading && page === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#AE75DA" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color="#CCCCCC"
          />
          <ThemedText style={styles.emptyText}>
            {t("noNotifications")}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={() => loadNotifications()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            loading && page > 0 ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator color="#AE75DA" />
              </View>
            ) : null
          }
        />
      )}
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
  listContainer: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
    position: "relative",
  },
  unreadNotification: {
    backgroundColor: "rgba(174, 117, 218, 0.1)",
  },
  notificationIcon: {
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: "#999",
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#AE75DA",
    position: "absolute",
    top: 16,
    right: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: "#999",
  },
  loadingMore: {
    padding: 16,
    alignItems: "center",
  },
  markAllButton: {
    paddingHorizontal: 12,
  },
  markAllText: {
    color: "#AE75DA",
    fontSize: 14,
  },
});
