import { Stack } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function CopyrightScreen() {
  return (
    <>
      <Stack.Screen
        options={{ title: "Copyright Notice", headerBackTitle: "Home" }}
      />
      <ScrollView style={styles.container}>
        <ThemedView style={styles.contentContainer}>
          <ThemedText style={styles.paragraph}>
            maimai でらっくす and maimai DX are trademarks of SEGA Interactive
            Co., Ltd.
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            This app is not associated or officially connected with maimai
            でらっくす or SEGA Interactive Co., Ltd.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  paragraph: {
    marginBottom: 12,
    lineHeight: 22,
  },
});
