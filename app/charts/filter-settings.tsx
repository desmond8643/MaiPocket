import { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from "react-native";
import { Stack, useRouter } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

export default function FilterSettingsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  // Filter states
  const [sortBy, setSortBy] = useState("releaseDate"); // releaseDate, title, level
  const [showDeluxe, setShowDeluxe] = useState(true);
  const [showStandard, setShowStandard] = useState(true);
  const [difficultyFilters, setDifficultyFilters] = useState({
    basic: true,
    advanced: true,
    expert: true,
    master: true,
    remaster: true,
  });

  // Function to toggle difficulty filter
  const toggleDifficulty = (difficulty) => {
    setDifficultyFilters(prev => ({
      ...prev,
      [difficulty]: !prev[difficulty]
    }));
  };
  
  // Function to apply filters and navigate back
  const applyFilters = () => {
    // Here you would save these filters to a global state or context
    // For now, we'll just navigate back
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Filter Settings",
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Sort By Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Sort By</ThemedText>
          
          <TouchableOpacity 
            style={styles.optionRow} 
            onPress={() => setSortBy("releaseDate")}
          >
            <ThemedText>Release Date</ThemedText>
            <IconSymbol 
              name={sortBy === "releaseDate" ? "checkmark.circle.fill" : "circle"} 
              size={22} 
              color={Colors[colorScheme ?? "light"].tint} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionRow} 
            onPress={() => setSortBy("title")}
          >
            <ThemedText>Title (A-Z)</ThemedText>
            <IconSymbol 
              name={sortBy === "title" ? "checkmark.circle.fill" : "circle"} 
              size={22} 
              color={Colors[colorScheme ?? "light"].tint} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionRow} 
            onPress={() => setSortBy("level")}
          >
            <ThemedText>Level (Highest First)</ThemedText>
            <IconSymbol 
              name={sortBy === "level" ? "checkmark.circle.fill" : "circle"} 
              size={22} 
              color={Colors[colorScheme ?? "light"].tint} 
            />
          </TouchableOpacity>
        </ThemedView>
        
        {/* Chart Type Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Chart Type</ThemedText>
          
          <ThemedView style={styles.optionRow}>
            <ThemedText>Standard</ThemedText>
            <Switch 
              value={showStandard}
              onValueChange={setShowStandard}
              trackColor={{ false: "#767577", true: Colors[colorScheme ?? "light"].tint }}
            />
          </ThemedView>
          
          <ThemedView style={styles.optionRow}>
            <ThemedText>Deluxe</ThemedText>
            <Switch 
              value={showDeluxe}
              onValueChange={setShowDeluxe}
              trackColor={{ false: "#767577", true: Colors[colorScheme ?? "light"].tint }}
            />
          </ThemedView>
        </ThemedView>
        
        {/* Difficulty Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Difficulty</ThemedText>
          
          {Object.entries(difficultyFilters).map(([difficulty, isEnabled]) => (
            <ThemedView key={difficulty} style={styles.optionRow}>
              <ThemedView style={styles.difficultyOption}>
                <ThemedView 
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(difficulty) }
                  ]}
                />
                <ThemedText style={{ textTransform: 'capitalize' }}>{difficulty}</ThemedText>
              </ThemedView>
              
              <Switch 
                value={isEnabled}
                onValueChange={() => toggleDifficulty(difficulty)}
                trackColor={{ false: "#767577", true: Colors[colorScheme ?? "light"].tint }}
              />
            </ThemedView>
          ))}
        </ThemedView>
      </ScrollView>
      
      <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
        <ThemedText style={styles.applyButtonText}>Apply Filters</ThemedText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function getDifficultyColor(type) {
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
      return "#00BBDD";
    default:
      return "#888888";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  difficultyOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  difficultyBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  applyButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});