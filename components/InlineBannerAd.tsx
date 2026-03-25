import React from "react";
import { View, StyleSheet } from "react-native";
import { SHOW_ADS } from "@/constants/adsConfig";
import { useAds } from "@/context/AdContext";

const InlineBannerAdImpl = React.lazy(() => import("./InlineBannerAdImpl"));

export function InlineBannerAd() {
  const { adsRemoved, temporaryAdRemoval } = useAds();

  if (!SHOW_ADS || adsRemoved || temporaryAdRemoval) {
    return null;
  }

  return (
    <View style={styles.container}>
      <React.Suspense fallback={<View />}>
        <InlineBannerAdImpl />
      </React.Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 8,
  },
});
