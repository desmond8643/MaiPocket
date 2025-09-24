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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#AE75DA",
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarBackground: TabBarBackground,
            tabBarStyle: Platform.select({
              ios: {
                position: "absolute",
                // Add bottom margin to account for the ad height
                bottom: 50, // Adjust this value based on your ad height
              },
              default: {
                // Add bottom margin for Android too
                marginBottom: 50, // Adjust this value based on your ad height
              },
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
        
        {/* Position the ad at the bottom, above the tab bar */}
        <View style={{
          position: "absolute",
          bottom: Platform.OS === "ios" ? 83 : 49, // Adjust based on tab bar height
          left: 0,
          right: 0,
          backgroundColor: "#ffffff",
        }}>
          <BannerAdComponent />
        </View>
      </View>
    </SafeAreaView>
  );
}