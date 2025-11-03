import { Stack } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { useLocalization } from "@/context/LocalizationContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function CopyrightScreen() {
  const { t } = useLocalization();
  
  return (
    <>
      <Stack.Screen
        options={{ title: t("copyrightNotice"), headerBackTitle: t("home") }}
      />
      <ScrollView style={styles.container}>
        <ThemedView style={styles.contentContainer}>
          <ThemedText style={styles.paragraph}>
            {t("copyrightText1")}
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            {t("copyrightText2")}
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