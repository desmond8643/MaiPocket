import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import LanguageSelector from "@/components/LanguageSelector";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalization } from "@/context/LocalizationContext";

export default function LanguageScreen() {
  const router = useRouter();
  const { t } = useLocalization();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#AE75DA"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("appLanguage")}</ThemedText>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.description}>
            {t("languageDescription")}
          </ThemedText>

          <View style={styles.languageContainer}>
            <LanguageSelector />
          </View>

          <ThemedText style={styles.note}>
            {t('languageNote')}
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  languageContainer: {
    marginVertical: 20,
  },
  note: {
    fontSize: 14,
    marginTop: 24,
    color: "#999",
    fontStyle: "italic",
    lineHeight: 20,
  },
});
