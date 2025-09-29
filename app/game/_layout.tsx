import { Stack } from "expo-router";
import React from "react";

export default function GameLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Song Quiz" }} />
      <Stack.Screen name="play" options={{ title: "Playing Quiz", headerShown: false }} />
      <Stack.Screen name="leaderboard" options={{ title: "Leaderboards" }} />
    </Stack>
  );
} 