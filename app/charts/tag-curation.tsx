import { ChartAPI } from "@/api/client";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  ADMIN_CURATOR_USER_ID,
  CHART_PATTERN_TAG_OPTIONS,
} from "@/constants/adminCurator";
import { Colors } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ChartCurationNext } from "@/types/chart";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChartTagCurationScreen() {
  const colorScheme = useColorScheme();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();
  const muted = colorScheme === "dark" ? "#aaa" : "#666";
  const chipBg = colorScheme === "dark" ? "#333" : "#e8e8e8";
  const chipSelected = colorScheme === "dark" ? "#5c4b8a" : "#d4c4f5";
  const tint = Colors[colorScheme ?? "light"].tint;

  const [allowed, setAllowed] = useState(false);
  const [candidate, setCandidate] = useState<ChartCurationNext | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    const userData = await AsyncStorage.getItem("userData");
    if (!userData) {
      setAllowed(false);
      return;
    }
    try {
      const parsed = JSON.parse(userData);
      setAllowed(parsed._id === ADMIN_CURATOR_USER_ID);
    } catch {
      setAllowed(false);
    }
  }, []);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await ChartAPI.getCurationNext();
      setCandidate(next);
      setSelected(new Set(next.tags || []));
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String(
              (e as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            )
          : "";
      setError(msg || t("chartTagCurationLoadError"));
      setCandidate(null);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    fetchNext();
  }, [allowed, fetchNext]);

  const toggleTag = (tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!candidate || saving) return;
    setSaving(true);
    try {
      await ChartAPI.patchCurationTags({
        chartId: String(candidate.chartId),
        gameVersion: candidate.gameVersion,
        difficultyType: candidate.difficultyType,
        tags: Array.from(selected),
      });
      await fetchNext();
    } catch {
      Alert.alert(t("error"), t("chartTagCurationSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    fetchNext();
  };

  if (!allowed) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen
          options={{
            title: t("chartTagCuration"),
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <ThemedText style={{ textAlign: "center" }}>
          {t("chartTagCurationNotAllowed")}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: t("chartTagCuration"),
          headerBackButtonDisplayMode: "minimal",
        }}
      />

      {loading && !candidate ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: 12, color: muted }}>
            {t("loading")}
          </ThemedText>
        </View>
      ) : error && !candidate ? (
        <View style={styles.centered}>
          <ThemedText style={{ textAlign: "center", marginBottom: 16 }}>
            {error}
          </ThemedText>
          <TouchableOpacity style={styles.primaryBtn} onPress={fetchNext}>
            <ThemedText style={styles.primaryBtnText}>{t("retry")}</ThemedText>
          </TouchableOpacity>
        </View>
      ) : candidate ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 24 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="subtitle" style={styles.title}>
            {candidate.title}
          </ThemedText>
          <ThemedText style={[styles.meta, { color: muted }]}>
            {candidate.gameVersion === "standard"
              ? t("chartTagCurationStandard")
              : t("chartTagCurationDeluxe")}{" "}
            · {candidate.difficultyType}
            {candidate.levelConstant != null &&
            candidate.levelConstant > 0 ? (
              <> · Lv. {candidate.levelConstant}</>
            ) : null}
          </ThemedText>

          <ThemedText style={styles.sectionLabel}>
            {t("chartTagCurationPickTags")}
          </ThemedText>
          <View style={styles.chipWrap}>
            {CHART_PATTERN_TAG_OPTIONS.map((tag) => {
              const on = selected.has(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: on ? chipSelected : chipBg,
                      borderColor: on ? tint : "transparent",
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      fontSize: 14,
                      fontWeight: on ? "600" : "400",
                    }}
                  >
                    {tag}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryBtn, saving && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.primaryBtnText}>
                  {t("chartTagCurationConfirm")}
                </ThemedText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleSkip}
              disabled={saving || loading}
            >
              <ThemedText>{t("chartTagCurationSkip")}</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    marginBottom: 8,
  },
  meta: {
    fontSize: 15,
    marginBottom: 24,
    textTransform: "capitalize",
  },
  sectionLabel: {
    marginBottom: 12,
    fontWeight: "600",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: "#7c5cbf",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
