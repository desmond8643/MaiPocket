import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onSkip: () => void;
};

export function IntroOnboardingModal({ visible, onSkip }: Props) {
  const { t } = useLocalization();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <ThemedView
          style={[
            styles.card,
            { backgroundColor: isDark ? "#2A2D2F" : "#FFFFFF" },
          ]}
        >
          <ThemedText type="subtitle" style={styles.title}>
            {t("introWelcomeTitle")}
          </ThemedText>
          <ThemedText style={styles.body}>{t("introWelcomeBody")}</ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#9944DD" }]}
            onPress={onSkip}
            accessibilityRole="button"
          >
            <ThemedText style={styles.buttonText}>{t("introSkip")}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    marginBottom: 12,
  },
  body: {
    marginBottom: 20,
    lineHeight: 22,
    opacity: 0.9,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
