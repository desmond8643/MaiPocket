import { BannerAdComponent } from "@/components/BannerAdComponent";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabLayout() {
  return (
    <View style={{ display: "flex", flexDirection: "row" }}>
      <BannerAdComponent />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#AE75DA", // Custom purple color
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarBackground: TabBarBackground,
            tabBarStyle: Platform.select({
              ios: {
                // Use a transparent background on iOS to show the blur effect
                position: "absolute",
              },
              default: {},
            }),
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="house.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="charts"
            options={{
              title: "Charts",
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="music.note.list" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="person.fill" color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
