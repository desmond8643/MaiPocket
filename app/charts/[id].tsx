import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

import { AuthAPI, ChartAPI, UserAPI } from "@/api/client";
import { FormattedText } from "@/components/FormattedText";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { YouTubePreview } from "@/components/YouTubePreview";
import { Colors } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useShowAds } from "@/hooks/useShowAds";
import { Chart, Post } from "@/types/chart";
import { User } from "@/types/user";
import { extractYouTubeVideoId } from "@/utils/youtubeUtils";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

export default function ChartDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [chart, setChart] = useState<Chart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"standard" | "deluxe">(
    "standard"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const headerBtnRef = useRef<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [optionsPostId, setOptionsPostId] = useState<string | null>(null);
  const [showPostOptionsDropdown, setShowPostOptionsDropdown] = useState(false);
  const [postOptionsPosition, setPostOptionsPosition] = useState({
    top: 0,
    right: 0,
  });
  const [postsLoading, setPostsLoading] = useState(false);
  const { t } = useLocalization();
  const { showAds } = useShowAds();
  const [simaiExpanded, setSimaiExpanded] = useState(false);
  const [simaiDisplayMode, setSimaiDisplayMode] = useState<'raw' | 'combo' | 'time'>('raw');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Function to open YouTube search
  const openYouTubeSearch = () => {
    if (!chart) return;

    setShowDropdown(false);
    const searchQuery = encodeURIComponent(`${chart.title} maimai`);
    const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    Linking.openURL(youtubeUrl).catch((err) =>
      console.error("Error opening YouTube:", err)
    );
  };

  const openSimaiSearch = () => {
    if (!chart) return;
    setShowDropdown(false);
    const simaiUrl = `https://w.atwiki.jp/simai/search?andor=and&keyword=${chart.title}`;
    Linking.openURL(simaiUrl).catch((err) =>
      console.error("Error opening Simai:", err)
    );
  };

  // Function to handle copy title
  const handleCopyTitle = () => {
    if (!chart) return;
    setShowDropdown(false);
    copyToClipboard(chart.title);
  };

  const openDropdown = () => {
    if (headerBtnRef.current) {
      headerBtnRef.current.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          setDropdownPosition({
            top: pageY + height,
            right: 20,
          });
          setShowDropdown(true);
        }
      );
    } else {
      setShowDropdown(true);
    }
  };

  // Add this function inside the ChartDetailScreen component
  const fetchPosts = async (
    chartId: string,
    chartType: string,
    difficulty: string
  ) => {
    setPostsLoading(true);
    try {
      const response = await ChartAPI.getPostsByChart(
        chartId,
        chartType,
        difficulty
      );
      setPosts(response);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const data = await ChartAPI.getChartById(id.toString());
        setChart(data);

        // Set default selections
        if (data.standard && data.standard.difficulties.length > 0) {
          setSelectedType("standard");
          const masterDiff = data.standard.difficulties.find(
            (d: { type: string }) => d.type === "master"
          );
          setSelectedDifficulty(
            masterDiff ? masterDiff.type : data.standard.difficulties[0].type
          );
        } else if (data.deluxe && data.deluxe.difficulties.length > 0) {
          setSelectedType("deluxe");
          const masterDiff = data.deluxe.difficulties.find(
            (d: { type: string }) => d.type === "master"
          );
          setSelectedDifficulty(
            masterDiff ? masterDiff.type : data.deluxe.difficulties[0].type
          );
        }
      } catch (err) {
        console.error("Error fetching chart:", err);
        setError("Failed to load chart details");
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [id]);

  // Helper function to format level display
  const formatLevelDisplay = (levelObj: {
    jp?: number;
    international?: number;
  }) => {
    const levelValue = levelObj.jp || levelObj.international || 0;

    return Math.round((levelValue % 1) * 100) / 100 >= 0.6
      ? `${Math.floor(levelValue)}+`
      : `${Math.floor(levelValue)}`;
  };

  // When type or difficulty changes, fetch corresponding posts
  useEffect(() => {
    if (!chart || !selectedDifficulty) return;

    // Fetch posts for the selected chart type and difficulty
    fetchPosts(chart._id, selectedType, selectedDifficulty);
  }, [chart, selectedType, selectedDifficulty]);

  const getDifficultyColor = (type: string) => {
    switch (type) {
      case "basic":
        return "#88CC00";
      case "advanced":
        return "#FFCC00";
      case "expert":
        return "#FF5599";
      case "master":
        return "#9944DD";
      case "remaster":
        return "#E9A5F1";
      default:
        return "#888888";
    }
  };

  // Function to handle copying text to clipboard
  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);

    // Show feedback based on platform
    if (Platform.OS === "android") {
      ToastAndroid.show(t("titleCopied"), ToastAndroid.SHORT);
    } else {
      // For iOS, show an alert instead of visual feedback
      Alert.alert(t("copied"), t("titleCopied"));
    }
  };

  const handleShowPostOptions = (postId: string, event: any) => {
    setOptionsPostId(postId);

    if (event.target) {
      event.target.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          setPostOptionsPosition({
            top: pageY + height,
            right: 20,
          });
          setShowPostOptionsDropdown(true);
        }
      );
    } else {
      setShowPostOptionsDropdown(true);
    }
  };

  const handleDeletePost = async (postId: string) => {
    // Add confirmation alert
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await ChartAPI.deletePost(postId);
            // Remove the post from the list
            setPosts(posts.filter((p) => p.id !== postId));
          } catch (err) {
            console.error("Error deleting post:", err);
            Alert.alert("Error", "Failed to delete post");
          }
        },
      },
    ]);
  };

  const handleLikePost = async (postId: string) => {
    try {
      const isLoggedIn = await AuthAPI.isLoggedIn();

      if (isLoggedIn) {
        const updatedPost = await ChartAPI.likePost(postId);
        // Update the posts list with the updated like count
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, likes: updatedPost.likes } : p
          )
        );
      } else {
        // Redirect to login
        router.push({
          pathname: "/auth/login",
        });
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AuthAPI.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, []);

  // Check if chart is favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!id) return;
      try {
        const isLoggedIn = await AuthAPI.isLoggedIn();
        if (isLoggedIn) {
          const result = await ChartAPI.checkFavorite(id.toString());
          setIsFavorite(result.isFavorite);
        }
      } catch (err) {
        console.error("Error checking favorite status:", err);
      }
    };

    checkFavoriteStatus();
  }, [id]);

  // Toggle favorite handler
  const handleToggleFavorite = async () => {
    try {
      const isLoggedIn = await AuthAPI.isLoggedIn();

      if (!isLoggedIn) {
        router.push({
          pathname: "/auth/login",
        });
        return;
      }

      setFavoriteLoading(true);
      const result = await ChartAPI.toggleFavorite(id!.toString());
      setIsFavorite(result.isFavorite);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  console.log(user);
  console.log(posts);

  // Add to the ChartDetailScreen component
  const handleHidePost = async (postId: string) => {
    try {
      const isLoggedIn = await AuthAPI.isLoggedIn();

      if (isLoggedIn) {
        await ChartAPI.hidePost(postId);
        // Remove the post from the list immediately
        setPosts(posts.filter((p) => p.id !== postId));
      } else {
        // Redirect to login
        router.push({
          pathname: "/auth/login",
        });
      }
    } catch (err) {
      console.error("Error hiding post:", err);
    }
  };

  // Add this function to the ChartDetailScreen component
  const handleFlagPost = async (postId: string) => {
    try {
      const isLoggedIn = await AuthAPI.isLoggedIn();

      if (isLoggedIn) {
        // Show flag reason selection modal
        Alert.alert(t("reportContent"), t("reportContentQuestion"), [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("inappropriateContent"),
            onPress: () => submitFlag(postId, "inappropriate_content"),
          },
          {
            text: t("spam"),
            onPress: () => submitFlag(postId, "spam"),
          },
          {
            text: t("harassment"),
            onPress: () => submitFlag(postId, "harassment"),
          },
          {
            text: t("misinformation"),
            onPress: () => submitFlag(postId, "misinformation"),
          },
        ]);
      } else {
        // Redirect to login
        router.push({
          pathname: "/auth/login",
        });
      }
    } catch (err) {
      console.error("Error flagging post:", err);
    }
  };

  const submitFlag = async (
    postId: string,
    reason: string,
    description?: string
  ) => {
    try {
      await ChartAPI.flagPost(postId, reason, description);
      Alert.alert(t("contentReported"), t("thankYouReport"));
    } catch (err) {
      console.error("Error submitting flag:", err);
      Alert.alert("Error", "Failed to report content. Please try again.");
    }
  };

  // Add this function to the ChartDetailScreen component near the other handler functions
  const handleBlockUser = async (userId: string) => {
    try {
      const isLoggedIn = await AuthAPI.isLoggedIn();

      if (isLoggedIn) {
        // Show confirmation dialog
        Alert.alert(t("blockUserTitle"), t("blockUserConfirm"), [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("block"),
            style: "destructive",
            onPress: async () => {
              await UserAPI.blockUser(userId);
              // Remove all posts by this user from the current view
              const blockedUserId = posts.find((p) => p.id === optionsPostId)
                ?.user?.id;
              if (blockedUserId) {
                setPosts(posts.filter((p) => p.user?.id !== blockedUserId));
              }
              Alert.alert(t("success"), t("userBlocked"));
            },
          },
        ]);
      } else {
        // Redirect to login
        router.push({
          pathname: "/auth/login",
        });
      }
    } catch (err) {
      console.error("Error blocking user:", err);
      Alert.alert("Error", "Failed to block user");
    }
  };

  // Add the tag translation function to your component
  const getTagDisplay = (tag: string) => {
    return t(`tag_${tag.replace(/\s+/g, "_")}`);
  };

  const getCurrentSimai = (): string | null => {
    if (!chart || !selectedDifficulty) return null;
    const currentDifficulty = chart[selectedType]?.difficulties.find(
      (d) => d.type === selectedDifficulty
    );
    return currentDifficulty?.simai || null;
  };

  // Format simai with combo numbers for easier pattern tracking
  const formatSimaiWithCombo = (simai: string): string => {
    if (!simai) return '';

    // Split by newlines first to preserve original line structure
    const originalLines = simai.split('\n');
    let combo = 0;
    const resultLines: string[] = [];

    const slidePattern = /[-vpqszwVPQSZW^<>]/

    for (const line of originalLines) {
      // Record combo at the start of this line
      const lineStartCombo = combo;

      // Split by commas to count notes in this line
      const measures = line.split(',');

      for (const measure of measures) {
        // Clean measure for counting (remove BPM/division markers)
        const cleanMeasure = measure
          .replace(/\(\d+(?:\.\d+)?\)/g, '')
          .replace(/\{\d+\}/g, '');

        // Count notes in this beat
        if (cleanMeasure.trim()) {

          // Count each simultaneous note group
          const groups = cleanMeasure.split('/');
          for (const group of groups) {
            if (/^[A-E][1-8]/i.test(group.trim())) {
              combo++;  // Touch note counts as 1 combo
            } else if (/[1-8]/.test(group)) {
              combo++;

              if (slidePattern.test(group)) {
                // Count number of slides: split by * and count non-empty slide segments
                const slideSegments = group.split('*');
                combo += slideSegments.filter(seg => slidePattern.test(seg)).length;
              }
            }

          }
        }
      }

      // Format: [combo] original_line (combo at start of line)
      const comboStr = String(lineStartCombo).padStart(4, ' ');
      resultLines.push(`[${comboStr}] ${line}`);
    }

    return resultLines.join('\n');
  };

  // Format simai with timestamps for easier pattern tracking
  const formatSimaiWithTime = (simai: string): string => {
    if (!simai) return '';

    // Split by newlines first to preserve original line structure
    const originalLines = simai.split('\n');
    let currentBeat = 0;
    let currentBpm = 120; // Default BPM
    const beatsPerMeasure = 4;
    let currentDivision = 4;
    const resultLines: string[] = [];

    const formatTime = (ms: number): string => {
      const totalSec = ms / 1000;
      const min = Math.floor(totalSec / 60);
      const sec = Math.floor(totalSec % 60);
      return `${min}:${String(sec).padStart(2, '0')}`;
    };

    for (const line of originalLines) {
      // Record time at the start of this line
      const lineStartTimeMs = (currentBeat / currentBpm) * 60000;

      // Split by commas to process measures in this line
      const measures = line.split(',');

      for (const measure of measures) {
        // Check for BPM change
        const bpmMatch = measure.match(/\((\d+(?:\.\d+)?)\)/);
        if (bpmMatch) {
          currentBpm = parseFloat(bpmMatch[1]);
        }

        // Check for division change
        const divisionMatch = measure.match(/\{(\d+)\}/);
        if (divisionMatch) {
          currentDivision = parseInt(divisionMatch[1]);
        }

        // Advance beat
        currentBeat += beatsPerMeasure / currentDivision;
      }

      // Format: [m:ss] original_line (time at start of line)
      const timeStr = formatTime(lineStartTimeMs);
      resultLines.push(`[${timeStr}] ${line}`);
    }

    return resultLines.join('\n');
  };

  // Memoize formatted simai for performance
  const formattedSimaiCombo = useMemo(() => {
    const simai = getCurrentSimai();
    return simai ? formatSimaiWithCombo(simai) : '';
  }, [chart, selectedType, selectedDifficulty]);

  const formattedSimaiTime = useMemo(() => {
    const simai = getCurrentSimai();
    return simai ? formatSimaiWithTime(simai) : '';
  }, [chart, selectedType, selectedDifficulty]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: chart ? chart.title : "Chart Details",
          headerBackTitle: t("charts"),
          headerRight: () => (
            <TouchableOpacity
              ref={headerBtnRef}
              onPress={openDropdown}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="more-vert"
                size={24}
                color={Colors[colorScheme ?? "light"].text}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Dropdown Menu Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(0, 0, 0, 0.2)" },
          ]}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.dropdownContainer,
              {
                backgroundColor: Colors[colorScheme ?? "light"].background,
                borderColor: Colors[colorScheme ?? "light"].background,
                position: "absolute",
                top: dropdownPosition.top,
                right: dropdownPosition.right,
              },
            ]}
          >
            {showAds && (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  router.push("/shop");
                  setShowDropdown(false);
                }}
              >
                <Image
                  source={require("@/assets/images/star.svg")}
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: Colors[colorScheme ?? "light"].text,
                  }}
                />
                <ThemedText style={styles.dropdownText}>
                  {t("removeAds")}
                </ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleCopyTitle}
            >
              <MaterialIcons
                name="content-copy"
                size={22}
                color={Colors[colorScheme ?? "light"].text}
              />
              <ThemedText style={styles.dropdownText}>
                {t("copyTitle")}
              </ThemedText>
            </TouchableOpacity>

            <View
              style={[
                styles.dropdownSeparator,
                { backgroundColor: Colors[colorScheme ?? "light"].background },
              ]}
            />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={openYouTubeSearch}
            >
              <Image
                source={require("@/assets/images/youtube-logo.svg")}
                style={{
                  width: 22,
                  height: 22,
                  tintColor: Colors[colorScheme ?? "light"].text,
                }}
              />

              <ThemedText style={styles.dropdownText}>
                {t("searchYoutube")}
              </ThemedText>
            </TouchableOpacity>
            <View
              style={[
                styles.dropdownSeparator,
                { backgroundColor: Colors[colorScheme ?? "light"].background },
              ]}
            />
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={openSimaiSearch}
            >
              <Image
                source={require("@/assets/images/atwiki_logo_small.svg")}
                style={{
                  width: 22,
                  height: 22,
                  tintColor: Colors[colorScheme ?? "light"].text,
                }}
              />
              <ThemedText style={styles.dropdownText}>
                {t("searchSimai")}
              </ThemedText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={showPostOptionsDropdown}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowPostOptionsDropdown(false)}
      >
        <TouchableOpacity
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(0, 0, 0, 0.2)" },
          ]}
          activeOpacity={1}
          onPress={() => setShowPostOptionsDropdown(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.dropdownContainer,
              {
                backgroundColor: Colors[colorScheme ?? "light"].background,
                borderColor: Colors[colorScheme ?? "light"].background,
                position: "absolute",
                top: postOptionsPosition.top,
                right: postOptionsPosition.right,
              },
            ]}
          >
            {/* Show delete option only for owner */}
            {user &&
              posts.find((p) => p.id === optionsPostId)?.user?.id ===
              user._id && (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowPostOptionsDropdown(false);
                    handleDeletePost(optionsPostId as string);
                  }}
                >
                  <MaterialIcons name="delete" size={22} color="#E53935" />
                  <ThemedText
                    style={[styles.dropdownText, { color: "#E53935" }]}
                  >
                    {t("deletePost")}
                  </ThemedText>
                </TouchableOpacity>
              )}

            {/* Hide Post option for all users */}
            {(!user ||
              posts.find((p) => p.id === optionsPostId)?.user?.id !==
              user._id) && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShowPostOptionsDropdown(false);
                      handleHidePost(optionsPostId as string);
                    }}
                  >
                    <MaterialIcons
                      name="visibility-off"
                      size={22}
                      color="#888888"
                    />
                    <ThemedText style={styles.dropdownText}>
                      {t("hidePost")}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShowPostOptionsDropdown(false);
                      handleFlagPost(optionsPostId as string);
                    }}
                  >
                    <MaterialIcons name="flag" size={22} color="#E53935" />
                    <ThemedText style={[styles.dropdownText]}>
                      {t("reportContent")}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShowPostOptionsDropdown(false);
                      const userId = posts.find((p) => p.id === optionsPostId)
                        ?.user?.id;
                      if (userId) {
                        handleBlockUser(userId);
                      }
                    }}
                  >
                    <MaterialIcons name="block" size={22} color="#E53935" />
                    <ThemedText style={[styles.dropdownText]}>
                      {t("blockUser")}
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ThemedView style={{ flex: 1 }}>
        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={Colors[colorScheme ?? "light"].tint}
            />
            <ThemedText style={styles.loadingText}>
              {t("loadingChartDetails")}
            </ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        ) : !chart ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>Chart not found</ThemedText>
          </ThemedView>
        ) : (
          <ScrollView style={styles.container}>
            {/* Chart Info Section */}
            <View style={styles.chartHeader}>
              <Image
                source={{ uri: chart.image }}
                style={styles.chartImage}
                contentFit="cover"
              />
              <View style={styles.chartInfo}>
                <TouchableOpacity
                  onPress={() => copyToClipboard(chart.title)}
                  activeOpacity={0.7}
                >
                  <ThemedText type="defaultSemiBold" style={styles.title}>
                    {chart.title}
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.artist}>{chart.artist}</ThemedText>
                <ThemedText style={styles.category}>
                  {chart.category}
                </ThemedText>
                <ThemedText style={styles.bpm}>
                  BPM: {chart.bpm || "N/A"}
                </ThemedText>
              </View>
            </View>

            {/* Chart Type Selector */}
            <View style={styles.selectorContainer}>
              {chart.standard && (
                <TouchableOpacity
                  style={[
                    styles.typeSelector,
                    styles.standardLabel,
                    selectedType !== "standard" && styles.dimmedButton,
                  ]}
                  onPress={() => setSelectedType("standard")}
                >
                  <ThemedText style={styles.standardLabelText}>
                    スタンダード
                  </ThemedText>
                </TouchableOpacity>
              )}

              {chart.deluxe && (
                <TouchableOpacity
                  style={[
                    styles.typeSelector,
                    styles.deluxeLabel,
                    selectedType !== "deluxe" && styles.dimmedButton,
                  ]}
                  onPress={() => setSelectedType("deluxe")}
                >
                  <ThemedText>
                    <ThemedText
                      style={[styles.deluxeLabelText, { color: "#FF0000" }]}
                    >
                      で
                    </ThemedText>
                    <ThemedText
                      style={[styles.deluxeLabelText, { color: "#FF8C00" }]}
                    >
                      ら
                    </ThemedText>
                    <ThemedText
                      style={[styles.deluxeLabelText, { color: "#FFD93D" }]}
                    >
                      っ
                    </ThemedText>
                    <ThemedText
                      style={[styles.deluxeLabelText, { color: "#7ADAA5" }]}
                    >
                      く
                    </ThemedText>
                    <ThemedText
                      style={[styles.deluxeLabelText, { color: "#3396D3" }]}
                    >
                      す
                    </ThemedText>
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {/* Difficulty Selector */}
            <View style={styles.difficultyContainer}>
              {chart[selectedType]?.difficulties
                .sort((a, b) => {
                  const difficultyOrder = [
                    "basic",
                    "advanced",
                    "expert",
                    "master",
                    "remaster",
                  ];
                  return (
                    difficultyOrder.indexOf(a.type) -
                    difficultyOrder.indexOf(b.type)
                  );
                })
                .map((diff) => (
                  <TouchableOpacity
                    key={diff.type}
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(diff.type) },
                      selectedDifficulty !== diff.type && styles.dimmedButton,
                    ]}
                    onPress={() => setSelectedDifficulty(diff.type)}
                  >
                    <ThemedText style={styles.difficultyText}>
                      {formatLevelDisplay(
                        typeof diff.level === "number"
                          ? { jp: diff.level }
                          : diff.level
                      )}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Favorite Button */}
            <TouchableOpacity
              style={[
                styles.favoriteButton,
                {
                  backgroundColor: isFavorite
                    ? "rgba(224, 36, 94, 0.1)"
                    : colorScheme === "dark"
                      ? "#333333"
                      : "#F5F5F5",
                  borderColor: isFavorite ? "#E0245E" : "transparent",
                },
              ]}
              onPress={handleToggleFavorite}
              disabled={favoriteLoading}
            >
              <MaterialIcons
                name={isFavorite ? "favorite" : "favorite-border"}
                size={20}
                color={isFavorite ? "#E0245E" : Colors[colorScheme ?? "light"].text}
              />
              <ThemedText
                style={[
                  styles.favoriteButtonText,
                  isFavorite && { color: "#E0245E" },
                ]}
              >
                {isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
              </ThemedText>
            </TouchableOpacity>

            {/* Simai Chart Section */}
            {getCurrentSimai() && (
              <View style={styles.simaiSection}>
                <TouchableOpacity
                  style={styles.simaiHeader}
                  onPress={() => setSimaiExpanded(!simaiExpanded)}
                  activeOpacity={0.7}
                >
                  <View style={styles.simaiTitleContainer}>
                    <MaterialIcons
                      name="code"
                      size={20}
                      color={Colors[colorScheme ?? "light"].text}
                    />
                    <ThemedText style={styles.simaiTitle}>
                      {t('simaiChart')}
                    </ThemedText>
                  </View>
                  <View style={styles.simaiHeaderRight}>
                    {simaiExpanded && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          // Cycle through: raw → combo → time → raw
                          setSimaiDisplayMode((prev) => {
                            if (prev === 'raw') return 'combo';
                            if (prev === 'combo') return 'time';
                            return 'raw';
                          });
                        }}
                        style={[
                          styles.comboToggleButton,
                          {
                            backgroundColor: simaiDisplayMode !== 'raw'
                              ? "#9944DD"
                              : colorScheme === "dark"
                                ? "#444"
                                : "#ddd",
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.comboToggleText,
                            {
                              color: simaiDisplayMode !== 'raw'
                                ? "#FFFFFF"
                                : Colors[colorScheme ?? "light"].text,
                            },
                          ]}
                        >
                          {simaiDisplayMode === 'raw' ? t('simaiDisplayRaw') : simaiDisplayMode === 'combo' ? t('simaiDisplayCombo') : t('simaiDisplayTime')}
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                    <MaterialIcons
                      name={simaiExpanded ? "expand-less" : "expand-more"}
                      size={24}
                      color={Colors[colorScheme ?? "light"].text}
                    />
                  </View>
                </TouchableOpacity>

                {simaiExpanded && (
                  <View
                    style={[
                      styles.simaiContent,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? "#1a1a2e" : "#f5f5f5",
                      },
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.simaiText,
                        {
                          fontFamily:
                            Platform.OS === "ios" ? "Menlo" : "monospace",
                          color: colorScheme === "dark" ? "#fff" : "#000",
                        },
                      ]}
                      value={
                        simaiDisplayMode === 'raw'
                          ? (getCurrentSimai() || '')
                          : simaiDisplayMode === 'combo'
                            ? formattedSimaiCombo
                            : formattedSimaiTime
                      }
                      editable={false}
                      multiline={true}
                      scrollEnabled={false}
                    />
                    <TouchableOpacity
                      style={styles.copySimaiButton}
                      onPress={() => {
                        const simai = getCurrentSimai();
                        if (simai) copyToClipboard(simai);
                      }}
                    >
                      <MaterialIcons
                        name="content-copy"
                        size={16}
                        color="#FFFFFF"
                      />
                      <ThemedText style={styles.copySimaiButtonText}>
                        {t("copy")}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            {/* Posts Section */}
            <View style={styles.postsSection}>
              <View style={styles.postsSectionHeader}>
                <ThemedText style={styles.sectionTitle}>
                  {t("posts")}
                </ThemedText>
                <TouchableOpacity
                  style={styles.addPostButton}
                  onPress={async () => {
                    const isLoggedIn = await AuthAPI.isLoggedIn();

                    if (isLoggedIn) {
                      const postParams = {
                        chartId: chart._id,
                        chartType: selectedType,
                        difficulty: selectedDifficulty,
                      };
                      router.push({
                        pathname: "/charts/create-post",
                        params: postParams,
                      });
                    } else {
                      // For login, don't show ad
                      router.push({
                        pathname: "/auth/login",
                        params: {
                          returnTo: "charts",
                          chartId: chart._id,
                        },
                      });
                    }
                  }}
                >
                  <MaterialIcons name="add" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.addPostButtonText}>
                    {t("addPost")}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {postsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={Colors[colorScheme ?? "light"].tint}
                  />
                  <ThemedText style={styles.loadingText}>
                    {t("loadingPosts")}
                  </ThemedText>
                </View>
              ) : posts.length > 0 ? (
                <View style={styles.postsList}>
                  {posts.map((post, index) => (
                    <View key={post.id}>
                      <View
                        style={[
                          styles.postCard,
                          {
                            backgroundColor:
                              Colors[colorScheme ?? "light"].background,
                            borderColor:
                              Colors[colorScheme ?? "light"].background,
                          },
                        ]}
                      >
                        <View style={styles.postHeader}>
                          <View style={styles.userInfo}>
                            <View style={styles.avatarContainer}>
                              {
                                <View style={styles.defaultAvatarContainer}>
                                  <Ionicons
                                    name="person"
                                    size={24}
                                    color="#AE75DA"
                                  />
                                </View>
                              }
                            </View>
                            <View>
                              <ThemedText style={styles.postAuthorName}>
                                {post.anonymous ? (
                                  "Anonymous"
                                ) : (
                                  <>
                                    {post.user?.displayName}
                                    {post.user?.username && (
                                      <ThemedText style={styles.usernameText}>
                                        {" "}
                                        @{post.user.username}
                                      </ThemedText>
                                    )}
                                  </>
                                )}
                              </ThemedText>
                              <ThemedText style={styles.postDate}>
                                {format(
                                  new Date(post.createdAt),
                                  "MMM d, yyyy"
                                )}
                              </ThemedText>
                            </View>
                          </View>
                          {user && (
                            <TouchableOpacity
                              onPress={(event) =>
                                handleShowPostOptions(post.id, event)
                              }
                              style={styles.postOptionsButton}
                            >
                              <MaterialIcons
                                name="more-horiz"
                                size={24}
                                color={Colors[colorScheme ?? "light"].text}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                        <FormattedText
                          text={post.content}
                          style={[
                            styles.postContent,
                            { color: Colors[colorScheme ?? "light"].text },
                          ]}
                        />

                        {/* YouTube Preview */}
                        {extractYouTubeVideoId(post.content) && (
                          <YouTubePreview
                            videoId={extractYouTubeVideoId(post.content)!}
                          />
                        )}

                        {post.image && (
                          <Image
                            source={{ uri: post.image }}
                            style={styles.postImage}
                            contentFit="cover"
                          />
                        )}

                        {post.tags && post.tags.length > 0 && (
                          <View style={styles.tagsContainer}>
                            {post.tags.map((tag, i) => (
                              <View key={i} style={styles.tag}>
                                <ThemedText style={styles.tagText}>
                                  {getTagDisplay(tag)}
                                </ThemedText>
                              </View>
                            ))}
                          </View>
                        )}

                        <View style={styles.postActions}>
                          <TouchableOpacity
                            style={styles.likeButton}
                            onPress={() => handleLikePost(post.id)}
                          >
                            <MaterialIcons
                              name={
                                user &&
                                  Array.isArray(post.likes) &&
                                  post.likes.includes(user._id)
                                  ? "favorite"
                                  : "favorite-border"
                              }
                              size={18}
                              color={
                                user &&
                                  Array.isArray(post.likes) &&
                                  post.likes.includes(user._id)
                                  ? "#E0245E"
                                  : Colors[colorScheme ?? "light"].text
                              }
                            />
                            {Array.isArray(post.likes) &&
                              post.likes.length > 0 && (
                                <ThemedText style={styles.actionText}>
                                  {post.likes.length}
                                </ThemedText>
                              )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Add horizontal rule after each post except the last one */}
                      {index < posts.length - 1 && (
                        <View
                          style={[
                            styles.postSeparator,
                            {
                              backgroundColor:
                                colorScheme === "dark" ? "#444444" : "#e0e0e0",
                            },
                          ]}
                        />
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <ThemedText style={styles.noPosts}>
                  {t("noPostsYet")}
                </ThemedText>
              )}
            </View>
          </ScrollView>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  chartHeader: {
    flexDirection: "row",
    marginBottom: 24,
  },
  chartImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  chartInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
  },
  artist: {
    fontSize: 16,
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    marginBottom: 4,
  },
  bpm: {
    fontSize: 14,
  },
  selectorContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  typeSelector: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedType: {
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  typeSelectorText: {
    fontWeight: "600",
  },
  difficultyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  difficultyBadge: {
    width: 70,
    height: 70,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  selectedDifficulty: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  difficultyText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  difficultyType: {
    color: "white",
    fontSize: 12,
  },
  chartDetails: {
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  difficultyDetails: {
    marginBottom: 8,
  },
  postsSection: {
    marginBottom: 24,
  },
  postsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  noPosts: {
    textAlign: "center",
    color: "#888888",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
  },
  standardLabel: {
    backgroundColor: "#4BAEEA",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  standardLabelText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  deluxeLabel: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  deluxeLabelText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  selectedTypeButton: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ scale: 1.05 }],
  },
  dimmedButton: {
    opacity: 0.6,
  },
  headerButton: {
    padding: 4,
    marginRight: 0,
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
  },
  favoriteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    // Remove justifyContent: "center" to prevent vertical centering
  },
  dropdownContainer: {
    borderRadius: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    marginLeft: 12,
    fontSize: 16,
  },
  dropdownSeparator: {
    height: 1,
    marginHorizontal: 16,
  },
  addPostButton: {
    // backgroundColor: Colors.light.tint,
    backgroundColor: "#9944DD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addPostButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  postsList: {
    marginTop: 8,
  },
  postCard: {
    backgroundColor: "#f8f8f8",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postAuthorName: {
    fontWeight: "bold",
    fontSize: 15,
  },
  postDate: {
    fontSize: 13,
    color: "#888",
  },
  postOptionsButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: "row",
    marginTop: 8,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
  },
  defaultAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0E6F7",
    justifyContent: "center",
    alignItems: "center",
  },
  postSeparator: {
    height: 1,
    // marginVertical: 16,
    marginBottom: 16,
  },
  usernameText: {
    color: "#888888",
    fontWeight: "normal",
    fontSize: 13,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 0,
  },
  tag: {
    backgroundColor: "#F0E6F7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: "#9944DD",
    fontSize: 12,
  },
  simaiSection: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  simaiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  simaiTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  simaiTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  simaiHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  comboToggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comboToggleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  simaiContent: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  simaiScrollView: {
    maxHeight: 300,
  },
  simaiText: {
    fontSize: 12,
    lineHeight: 18,
  },
  copySimaiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9944DD",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: "flex-end",
  },
  copySimaiButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 14,
  },
});
