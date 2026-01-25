import { BANNER_AD_HEIGHT } from "@/components/GlobalBannerAd";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { SHOW_ADS } from "@/constants/adsConfig";
import { useAds } from "@/context/AdContext";
import { useLocalization } from "@/context/LocalizationContext";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  const { t } = useLocalization();
  const { adsRemoved, temporaryAdRemoval } = useAds();

  // Calculate bottom padding for tab bar when ads are shown
  const showBannerAd = SHOW_ADS && !adsRemoved && !temporaryAdRemoval;
  const tabBarBottomPadding = showBannerAd ? BANNER_AD_HEIGHT : 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#AE75DA", // Custom purple color
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          height: 60 + tabBarBottomPadding,
          paddingBottom: tabBarBottomPadding,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabHome"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: t("tabCharts"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="music.note.list" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabProfile"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
