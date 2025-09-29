import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ChartAPI } from "@/api/client";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { YouTubePreview } from "@/components/YouTubePreview";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Chart } from "@/types/chart";
import { extractYouTubeVideoId } from "@/utils/youtubeUtils";

export default function CreatePostScreen() {
  const { chartId, chartType, difficulty } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [chart, setChart] = useState<Chart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [postContent, setPostContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [postError, setPostError] = useState<string | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

  // Available tags for posts
  const AVAILABLE_TAGS = ["chart video", "gameplay", "insight", "analysis"];

  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      if (!chartId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await ChartAPI.getChartById(chartId.toString());
        setChart(data);
      } catch (err) {
        console.error("Error fetching chart:", err);
        setError("Failed to load chart details");
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [chartId]);

  // Function to toggle tags
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Handle post submission
  const handlePostSubmit = async () => {
    if (!postContent.trim()) {
      setPostError("Post content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setPostError(null);

    try {
      // Replace with your actual API endpoint
      await ChartAPI.createPost({
        content: postContent,
        tags: selectedTags,
        chartId: chartId,
        chartType: chartType,
        chartDifficulty: difficulty,
        anonymous: isAnonymous,
      });

      // Return to chart detail page
      Alert.alert("Success", "Your post has been submitted for review", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Error creating post:", err);
      setPostError("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get difficulty color
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

  const handlePostContentChange = (text: string) => {
    setPostContent(text);
    setCharacterCount(text.length);

    // Check for YouTube links
    const videoId = extractYouTubeVideoId(text);
    setYoutubeVideoId(videoId);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Create New Post",
          headerBackTitle: "Chart",
        }}
      />

      <ThemedView style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={Colors[colorScheme ?? "light"].tint}
              />
              <ThemedText style={styles.loadingText}>
                Loading chart details...
              </ThemedText>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : !chart ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>Chart not found</ThemedText>
            </View>
          ) : (
            <>
              {/* Chart Info Section */}
              <View style={styles.chartInfoSection}>
                <Image
                  source={{ uri: chart.image }}
                  style={styles.chartThumbnail}
                  contentFit="cover"
                />

                <View style={styles.chartDetails}>
                  <ThemedText style={styles.chartTitle} numberOfLines={2}>
                    {chart.title}
                  </ThemedText>

                  <View style={styles.badgesContainer}>
                    {/* Chart Type Badge */}
                    <View
                      style={[
                        styles.chartTypeBadge,
                        chartType === "standard"
                          ? styles.standardBadge
                          : styles.deluxeBadge,
                      ]}
                    >
                      {chartType === "standard" ? (
                        <ThemedText style={styles.badgeText}>
                          スタンダード
                        </ThemedText>
                      ) : (
                        <ThemedText>
                          <ThemedText
                            style={[styles.badgeText, { color: "#FF0000" }]}
                          >
                            で
                          </ThemedText>
                          <ThemedText
                            style={[styles.badgeText, { color: "#FF8C00" }]}
                          >
                            ら
                          </ThemedText>
                          <ThemedText
                            style={[styles.badgeText, { color: "#FFD93D" }]}
                          >
                            っ
                          </ThemedText>
                          <ThemedText
                            style={[styles.badgeText, { color: "#7ADAA5" }]}
                          >
                            く
                          </ThemedText>
                          <ThemedText
                            style={[styles.badgeText, { color: "#3396D3" }]}
                          >
                            す
                          </ThemedText>
                        </ThemedText>
                      )}
                    </View>

                    {/* Difficulty Badge */}
                    <View
                      style={[
                        styles.difficultyBadge,
                        {
                          backgroundColor: getDifficultyColor(
                            difficulty as string
                          ),
                        },
                      ]}
                    >
                      <ThemedText style={styles.badgeText}>
                        {typeof difficulty === "string"
                          ? difficulty === "remaster"
                            ? "Re:Master"
                            : difficulty.charAt(0).toUpperCase() +
                              difficulty.slice(1)
                          : "Unknown"}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Separator */}
              <View
                style={[
                  styles.separator,
                  { backgroundColor: Colors[colorScheme ?? "light"].icon },
                ]}
              />

              {/* Post Form */}
              <View style={styles.formSection}>
                {/* Post Content */}
                <ThemedText style={styles.formLabel}>
                  Share your thoughts
                </ThemedText>
                <TextInput
                  style={[
                    styles.postInput,
                    {
                      color: Colors[colorScheme ?? "light"].text,
                      borderColor:
                        Colors[colorScheme ?? "light"].tabIconSelected,
                    },
                  ]}
                  placeholder="What do you think about this chart?"
                  placeholderTextColor={
                    Colors[colorScheme ?? "light"].text + "80"
                  }
                  multiline
                  maxLength={1000}
                  value={postContent}
                  onChangeText={handlePostContentChange}
                />

                {youtubeVideoId && <YouTubePreview videoId={youtubeVideoId} />}

                <ThemedText style={styles.charCounter}>
                  {characterCount}/1000
                </ThemedText>

                {/* Tags Selection */}
                <ThemedText style={styles.formLabel}>
                  Add Tags (Optional)
                </ThemedText>
                <View style={styles.tagsContainer}>
                  {AVAILABLE_TAGS.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagButton,
                        selectedTags.includes(tag) ? styles.tagSelected : null,
                        { borderColor: "#AE75DA" },
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <ThemedText
                        style={[
                          styles.tagText,
                          selectedTags.includes(tag)
                            ? { color: "#FFFFFF" }
                            : { color: Colors[colorScheme ?? "light"].text },
                        ]}
                      >
                        {tag}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Anonymous Toggle */}
                <ThemedText style={styles.formLabel}>Post Settings</ThemedText>
                <View style={styles.settingRow}>
                  <ThemedText>Post Anonymously</ThemedText>
                  <Switch
                    value={isAnonymous}
                    onValueChange={setIsAnonymous}
                    trackColor={{
                      false: "#767577",
                      true: "#AE75DA",
                    }}
                  />
                </View>

                {/* Error Message */}
                {postError && (
                  <ThemedText style={styles.postErrorText}>
                    {postError}
                  </ThemedText>
                )}
              </View>
            </>
          )}
        </ScrollView>

        {/* Fixed Action Buttons */}
        <View
          style={[
            styles.actionButtonsContainer,
            { backgroundColor: Colors[colorScheme ?? "light"].background },
          ]}
        >
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting || postContent.trim().length === 0
                ? styles.submitButtonDisabled
                : { backgroundColor: "#AE75DA" },
            ]}
            onPress={handlePostSubmit}
            disabled={isSubmitting || postContent.trim().length === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.submitButtonText}>
                Submit for Review
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100, // Extra space for fixed buttons
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    textAlign: "center",
  },
  chartInfoSection: {
    flexDirection: "row",
    marginBottom: 20,
  },
  chartThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  chartDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: "row",
  },
  chartTypeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  standardBadge: {
    backgroundColor: "#4BAEEA",
  },
  deluxeBadge: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    width: "100%",
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  postInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    height: 180,
    textAlignVertical: "top",
    fontSize: 16,
  },
  charCounter: {
    fontSize: 14,
    alignSelf: "flex-end",
    marginTop: 6,
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  tagButton: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 6,
  },
  tagSelected: {
    backgroundColor: "#AE75DA",
  },
  tagText: {
    fontSize: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  postErrorText: {
    color: "#FF3B30",
    marginBottom: 12,
    textAlign: "center",
    marginTop: 12,
  },
  actionButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingBottom: 32, // Extra padding for iOS safe area
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 2,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
    backgroundColor: "#999",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
