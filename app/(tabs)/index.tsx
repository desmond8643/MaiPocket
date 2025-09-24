import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { BannerAdComponent } from "@/components/BannerAdComponent";

export default function HomeScreen() {
  const colorScheme = useColorScheme();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/milk.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <Image
          source={require("@/assets/images/maipocket-logo.png")}
          style={styles.titleLogo}
        />
      </ThemedView>

      <ThemedView style={styles.featureContainer}>
        <ThemedText type="subtitle">Browse Song Charts</ThemedText>
        <ThemedText>
          Explore maimai songs by genre, level, or version. Find your favorite
          tracks and check their difficulties.
        </ThemedText>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              // backgroundColor: Colors[colorScheme ?? "light"].tint,
              backgroundColor: "#9944DD",
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
              // backgroundColor: Colors[colorScheme ?? "light"].tint,
              backgroundColor: "#9944DD",
            },
          ]}
          onPress={() => router.push("/profile")}
        >
          <ThemedText style={styles.buttonText}>View Profile</ThemedText>
          <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.copyrightContainer}>
        <TouchableOpacity
          style={[
            styles.copyrightButton,
            {
              backgroundColor: Colors[colorScheme ?? "light"].background,
              borderColor: Colors[colorScheme ?? "light"].tint,
            },
          ]}
          onPress={() => router.push("/copyright")}
        >
          <ThemedText style={styles.copyrightButtonText}>
            Copyright Notice
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <BannerAdComponent />
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
    height: 250,
    width: 290,
    bottom: 0,
    right: 0,
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
  titleLogo: {
    height: 45,
    width: 200,
  },
  copyrightContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  copyrightButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  copyrightButtonText: {
    fontSize: 12,
  },
});
