import { ThemedText } from "@/components/ThemedText";
import { useLocalization } from "@/context/LocalizationContext";
import { Chart } from "@/types/chart";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { DIFF_PARAM, SongJump, hasDiff } from "./songJump";
import { chartMatchesQuery } from "@/lib/chartSearch";

type Props = {
  visible: boolean;
  loading: boolean;
  charts: Chart[];
  onJump: (jump: SongJump) => void;
  onClose: () => void;
};

export function SongFinderModal({
  visible,
  loading,
  charts,
  onJump,
  onClose,
}: Props) {
  const colorScheme = useColorScheme();
  const { t } = useLocalization();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Chart | null>(null);
  const bg = colorScheme === "dark" ? "#1a1a1a" : "#fff";
  const optionBg =
    colorScheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

  useEffect(() => {
    if (!visible) {
      setPicked(null);
      setQuery("");
    }
  }, [visible]);

  // const filtered = charts.filter((c) =>
  //   c.title.toLowerCase().includes(query.toLowerCase())
  // );
  const filtered = charts.filter((c) => chartMatchesQuery(c, query));

  if (!visible) return null;

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable
        style={[styles.box, { backgroundColor: bg }]}
        onPress={(e) => e.stopPropagation()}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
          </View>
        ) : picked ? (
          <>
            <ThemedText style={styles.title}>{picked.title}</ThemedText>
            <ScrollView style={styles.scroll}>
              {(["deluxe", "standard"] as const)
                .filter((v) => picked[v])
                .map((version) =>
                  (["master", "remaster", "expert"] as const)
                    .filter((d) => hasDiff(picked, version, d))
                    .map((d) => (
                      <TouchableOpacity
                        key={`${version}-${d}`}
                        style={[styles.option, { backgroundColor: optionBg }]}
                        onPress={() =>
                          onJump({
                            title: picked.title,
                            wantDx: version === "deluxe",
                            category: picked.category || "",
                            diff: DIFF_PARAM[d],
                          })
                        }
                      >
                        <ThemedText style={styles.optionText}>
                          {version === "deluxe" ? "DX" : "STD"}{" "}
                          {d === "remaster"
                            ? "Re:Master"
                            : d[0].toUpperCase() + d.slice(1)}
                        </ThemedText>
                      </TouchableOpacity>
                    ))
                )}
            </ScrollView>
          </>
        ) : (
          <>
            <ThemedText style={styles.title}>{t("findSong")}</ThemedText>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("filterFavorites")}
              placeholderTextColor="#888"
              style={[
                styles.input,
                { color: colorScheme === "dark" ? "#fff" : "#000" },
              ]}
            />
            <ScrollView style={styles.scroll}>
              {filtered.length === 0 ? (
                <ThemedText style={styles.empty}>{t("noFavorites")}</ThemedText>
              ) : (
                filtered.map((chart) => (
                  <TouchableOpacity
                    key={chart._id}
                    style={[styles.option, { backgroundColor: optionBg }]}
                    onPress={() => setPicked(chart)}
                  >
                    <ThemedText style={styles.optionText} numberOfLines={1}>
                      {chart.title}
                    </ThemedText>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </>
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  box: {
    width: "80%",
    maxHeight: "70%",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  scroll: { maxHeight: 400 },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  optionText: { fontSize: 16, fontWeight: "600" },
  loading: { paddingVertical: 40, alignItems: "center" },
  empty: { textAlign: "center", opacity: 0.6, paddingVertical: 20 },
});
