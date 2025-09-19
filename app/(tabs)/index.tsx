import { Image } from "expo-image";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function HomeScreen() {
  const colorScheme = useColorScheme();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">MaiPocket</ThemedText>
      </ThemedView>
      <ThemedView style={styles.featureContainer}>
        <ThemedText type="subtitle">Search By Level</ThemedText>
        <ThemedText>
          Looking for challenges? Find songs by difficulty level, from
          beginner-friendly to expert charts.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.featureContainer}>
        <ThemedText type="subtitle">Find Songs</ThemedText>
        <ThemedText>
          Search for specific songs by title, artist, or genre to quickly find
          what you're looking for.
        </ThemedText>
      </ThemedView>
      <ThemedView 
        style={styles.featureContainer}
      >
        <ThemedText type="subtitle">Browse Song Charts</ThemedText>
        <ThemedText>
          Explore maimai songs by genre, level, or version. Find your favorite
          tracks and check their difficulties.
        </ThemedText>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: Colors[colorScheme ?? "light"].tint,
            },
          ]}
          onPress={() => router.push("/charts")}
        >
          <ThemedText style={styles.buttonText}>Browse Charts</ThemedText>
          <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.featureContainer}>
        <ThemedText type="subtitle">Your Profile</ThemedText>
        <ThemedText>
          Manage your account, track your favorite songs, and customize your
          experience.
        </ThemedText>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: Colors[colorScheme ?? "light"].tint,
            },
          ]}
          onPress={() => router.push("/profile")}
        >
          <ThemedText style={styles.buttonText}>View Profile</ThemedText>
          <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  featureContainer: {
    gap: 8,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 0,
    elevation: 0,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 4,

  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
