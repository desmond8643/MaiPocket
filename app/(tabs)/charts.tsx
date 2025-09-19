import { useState, useEffect } from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  // SafeAreaView,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { ChartAPI } from "@/api/client";
import { Chart } from "@/types/chart";
import { SymbolViewProps } from "expo-symbols";

// Category types
const FILTER_TYPES = [
  { id: "genre", name: "Genre", icon: "music.note" as SymbolViewProps["name"] },
  { id: "level", name: "Level", icon: "chart.bar" as SymbolViewProps["name"] },
  {
    id: "version",
    name: "Version",
    icon: "calendar" as SymbolViewProps["name"],
  },
];

// Categories for each type (these will be populated from the backend later)
const CATEGORIES = {
  genre: [
    "POPS & アニメ",
    "NICONICO & ボーカロイド",
    "東方Project",
    "ゲーム & バラエティー",
    "MAIMAI",
    "オンゲキ & CHUNITHM",
  ],
  level: [
    "15",
    "14+",
    "14",
    "13+",
    "13",
    "12+",
    "12",
    "11+",
    "11",
    "10+",
    "10",
    "9+",
    "9",
    "8+",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
    "1",
  ],
  version: [
    { display: "PRiSM+", value: "PRiSM+" },
    { display: "PRiSM (鏡)", value: "PRiSM" },
    { display: "BUDDiES+ (宴)", value: "BUDDiES+" },
    { display: "BUDDiES (双)", value: "BUDDiES" },
    { display: "FESTiVAL+ (祝)", value: "FESTiVAL+" },
    { display: "FESTiVAL (祭)", value: "FESTiVAL" },
    { display: "UNiVERSE+ (星)", value: "UNiVERSE+" },
    { display: "UNiVERSE (宙)", value: "UNiVERSE" },
    { display: "Splash+ (煌)", value: "Splash+" },
    { display: "Splash (爽)", value: "Splash" },
    { display: "でらっくす+ (華)", value: "でらっくす+" },
    { display: "でらっくす (熊)", value: "でらっくす" },
    { display: "FiNALE (輝)", value: "FiNALE" },
    { display: "MiLK+ (雪)", value: "MiLK+" },
    { display: "MiLK (白)", value: "MiLK" },
    { display: "MURASAKI+ (菫)", value: "MURASAKI+" },
    { display: "MURASAKI (紫)", value: "MURASAKI" },
    { display: "PiNK+ (櫻)", value: "PiNK+" },
    { display: "PiNK (桃)", value: "PiNK" },
    { display: "ORANGE+ (暁)", value: "ORANGE+" },
    { display: "ORANGE (橙)", value: "ORANGE" },
    { display: "GreeN+ (檄)", value: "GreeN+" },
    { display: "GreeN (超)", value: "GreeN" },
    { display: "maimai+ (真)", value: "maimai+" },
    { display: "maimai (真)", value: "maimai" },
  ],
};

export default function ChartsScreen() {

  const colorScheme = useColorScheme();
  const [activeFilterType, setActiveFilterType] = useState<
    "genre" | "level" | "version"
  >("genre");
  const [searchQuery, setSearchQuery] = useState("");

  // Remove the loading and error states since we're not fetching
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Just use the static CATEGORIES object directly
  // Remove the useEffect that fetches categories

  // Render each category item
  const renderCategoryItem = ({
    item,
  }: {
    item: string | { display: string; value: string };
  }) => {
    // Handle different item formats
    const displayText = typeof item === "string" ? item : item.display;
    const itemValue = typeof item === "string" ? item : item.value;

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => {
          // Handle special case for level ranges
          if (activeFilterType === "level") {
            const params: { type: string; value: string } = {
              type: activeFilterType,
              value: itemValue,
            };
            router.push({
              pathname: `/charts/list`,
              params,
            });
          }
          // Handle genre mapping for database values
          else if (activeFilterType === "genre") {
            const genreMap: Record<string, string> = {
              "POPS & アニメ": "POPS＆アニメ",
              "NICONICO & ボーカロイド": "niconico＆ボーカロイド",
              東方Project: "東方Project",
              "ゲーム & バラエティー": "ゲーム＆バラエティ",
              MAIMAI: "maimai",
              "オンゲキ & CHUNITHM": "オンゲキ＆CHUNITHM",
            };
            router.push({
              pathname: `/charts/list`,
              params: {
                type: activeFilterType,
                value: genreMap[itemValue],
              },
            });
          }
          // For versions, pass as is
          else {
            router.push({
              pathname: `/charts/list`,
              params: {
                type: activeFilterType,
                value: itemValue,
              },
            });
          }
        }}
      >
        <ThemedView
          style={[
            styles.categoryContent,
            { backgroundColor: colorScheme === "dark" ? "#2A2D2F" : "white" },
          ]}
        >
          <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>
            {displayText}
          </ThemedText>
          <IconSymbol
            name="chevron.right"
            size={20}
            color={colorScheme === "dark" ? "#CCCCCC" : "#888888"}
          />
        </ThemedView>
      </TouchableOpacity>
    );
  };

  // Render filter type button
  const renderFilterTypeButton = ({
    item,
  }: {
    item: { id: string; name: string; icon: SymbolViewProps["name"] };
  }) => (
    <TouchableOpacity
      style={[
        styles.filterTypeButton,
        {
          backgroundColor:
            activeFilterType === item.id
              ? Colors[colorScheme ?? "dark"].tint
              : colorScheme === "dark"
              ? "#333333"
              : "#F0F0F0",
        },
      ]}
      onPress={() =>
        setActiveFilterType(item.id as "genre" | "level" | "version")
      }
    >
      <IconSymbol
        name={item.icon}
        size={20}
        color={
          activeFilterType === item.id
            ? "#FFFFFF"
            : colorScheme === "dark"
            ? "#CCCCCC"
            : "#666666"
        }
      />
      <ThemedText
        style={[
          styles.filterTypeText,
          activeFilterType === item.id && {
            color: "#FFFFFF",
            fontWeight: "600",
          },
        ]}
      >
        {item.name}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Search and Filter Header */}
          <ThemedView style={styles.searchContainer}>
            <ThemedView
              style={[
                styles.searchInputContainer,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#333333" : "#F0F0F0",
                },
              ]}
            >
              <IconSymbol
                name="magnifyingglass"
                size={20}
                color="#888888"
                style={styles.searchIcon}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    color:
                      colorScheme === "dark"
                        ? Colors.dark.text
                        : Colors.light.text,
                  },
                ]}
                placeholder="Search charts..."
                placeholderTextColor={colorScheme === "dark" ? "#999" : "#888"}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => {
                  if (searchQuery.trim()) {
                    router.push({
                      pathname: `/charts/search`,
                      params: { query: searchQuery },
                    });
                  }
                }}
              />
            </ThemedView>
          </ThemedView>

          {/* Filter Type Selector */}
          <FlatList
            horizontal
            data={FILTER_TYPES}
            renderItem={renderFilterTypeButton}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            style={styles.filterTypeList}
          />

          {/* Category List - simplified to directly use CATEGORIES */}
          <FlatList
            data={CATEGORIES[activeFilterType]}
            renderItem={renderCategoryItem}
            keyExtractor={(item) =>
              typeof item === "string" ? item : item.value
            }
            scrollEnabled={false}
            contentContainerStyle={styles.categoryList}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  filterTypeList: {
    marginBottom: 16,
  },
  filterTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#F0F0F0",
  },
  filterTypeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  activeFilterText: {
    color: "white",
    fontWeight: "600",
  },
  categoryHeader: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryHeaderTitle: {
    fontSize: 22,
  },
  categoryList: {
    marginBottom: 16,
  },
  categoryCard: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
  },
  categoryTitle: {
    fontSize: 16,
  },
  // Add new styles for loading and error states
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
