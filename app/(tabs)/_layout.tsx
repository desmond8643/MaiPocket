import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useLocalization } from "@/context/LocalizationContext";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  const { t } = useLocalization();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#AE75DA",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
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
