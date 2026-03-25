import React from "react";
import { Platform } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

export default function InlineBannerAdImpl() {
  const adUnitId = Platform.select({
    ios: "ca-app-pub-7106153117550777/5330249389",
    default: "",
  });

  return (
    <BannerAd
      unitId={adUnitId}
      size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
    />
  );
}
