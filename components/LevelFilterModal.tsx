import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LEVEL_OPTIONS } from "@/hooks/useLevelFilter";
import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface LevelFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedLevel: string;
  onSelectLevel: (level: string) => void;
  accentColor?: string;
}

export function LevelFilterModal({
  visible,
  onClose,
  selectedLevel,
  onSelectLevel,
  accentColor = "#E91E63",
}: LevelFilterModalProps) {
  const colorScheme = useColorScheme();
  const { t } = useLocalization();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.levelModalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.levelModalContainer,
            {
              backgroundColor:
                colorScheme === "dark"
                  ? Colors.dark.background
                  : Colors.light.background,
            },
          ]}
        >
          <ThemedText type="defaultSemiBold" style={styles.levelModalTitle}>
            {t("filterByLevel")}
          </ThemedText>
          <ScrollView style={styles.levelModalScroll}>
            {LEVEL_OPTIONS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.levelOption,
                  {
                    backgroundColor:
                      selectedLevel === level
                        ? accentColor
                        : colorScheme === "dark"
                        ? "#2A2D2F"
                        : "#F5F5F5",
                  },
                ]}
                onPress={() => {
                  onSelectLevel(level);
                  onClose();
                }}
              >
                <ThemedText
                  style={[
                    styles.levelOptionText,
                    selectedLevel === level && {
                      color: "white",
                      fontWeight: "600",
                    },
                  ]}
                >
                  {level === "All" ? t("all") : level}
                </ThemedText>
                {selectedLevel === level && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  levelModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  levelModalContainer: {
    width: "80%",
    maxHeight: "70%",
    borderRadius: 16,
    padding: 16,
  },
  levelModalTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: "center",
  },
  levelModalScroll: {
    maxHeight: 400,
  },
  levelOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  levelOptionText: {
    fontSize: 16,
  },
});
