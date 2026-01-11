import { BannerAdComponent } from "@/components/BannerAdComponent";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useShowAds } from "@/hooks/useShowAds";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

interface PatternCategory {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
  available: boolean;
}

const PATTERN_CATEGORIES: PatternCategory[] = [
  {
    id: "trills",
    titleKey: "patternTrills",
    descriptionKey: "patternTrillsDesc",
    icon: "swap-horizontal",
    color: "#E91E63",
    route: "/charts/patterns/trills",
    available: true,
  },
  {
    id: "slides",
    titleKey: "patternSlides",
    descriptionKey: "patternSlidesDesc",
    icon: "arrow-forward",
    color: "#2196F3",
    route: "/charts/patterns/slides",
    available: false, // Coming soon
  },
  {
    id: "spins",
    titleKey: "patternSpins",
    descriptionKey: "patternSpinsDesc",
    icon: "sync",
    color: "#4CAF50",
    route: "/charts/patterns/spins",
    available: false, // Coming soon
  },
];

export default function PatternsIndexScreen() {
  const colorScheme = useColorScheme();
  const { t } = useLocalization();
  const { showAds, dynamicStyles } = useShowAds(false);

  const renderPatternCard = (pattern: PatternCategory) => {
    return (
      <TouchableOpacity
        key={pattern.id}
        style={[
          styles.patternCard,
          { backgroundColor: pattern.color },
          !pattern.available && styles.patternCardDisabled,
        ]}
        onPress={() => {
          if (pattern.available) {
            router.push(pattern.route as any);
          }
        }}
        disabled={!pattern.available}
      >
        <View style={styles.patternCardContent}>
          <View style={styles.patternTitleRow}>
            <ThemedText type="subtitle" style={styles.patternTitle}>
              {t(pattern.titleKey)}
            </ThemedText>
            <Ionicons name={pattern.icon} size={32} color="white" />
          </View>
          <View style={styles.patternDescription}>
            <ThemedText style={styles.patternDescText}>
              {t(pattern.descriptionKey)}
            </ThemedText>
          </View>
          {!pattern.available && (
            <View style={styles.comingSoonBadge}>
              <ThemedText style={styles.comingSoonText}>
                {t("comingSoon")}
              </ThemedText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: t("chartPatterns"),
          headerBackButtonDisplayMode: "minimal",
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedView style={styles.headerSection}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {t("discoverPatterns")}
          </ThemedText>
          <ThemedText style={styles.headerDescription}>
            {t("discoverPatternsDesc")}
          </ThemedText>
        </ThemedView>

        <View style={styles.patternsGrid}>
          {PATTERN_CATEGORIES.map(renderPatternCard)}
        </View>
      </ScrollView>

      {showAds && (
        <View style={dynamicStyles.bottomAdContainer}>
          <BannerAdComponent />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    marginBottom: 8,
  },
  headerDescription: {
    opacity: 0.7,
    lineHeight: 22,
  },
  patternsGrid: {
    gap: 16,
  },
  patternCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  patternCardDisabled: {
    opacity: 0.6,
  },
  patternCardContent: {
    padding: 20,
  },
  patternTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  patternTitle: {
    color: "white",
    fontSize: 20,
  },
  patternDescription: {
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: 8,
    padding: 12,
  },
  patternDescText: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
  },
  comingSoonBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  comingSoonText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
});

