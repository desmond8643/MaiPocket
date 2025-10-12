// In GameQueryProvider.tsx
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { getCrystalStatus, getHighScores } from "@/api/client";
import React, { createContext, ReactNode, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Add this function to GameQueryProvider.tsx
export function fetchDataImmediately(queryKey: string | string[]) {
  return queryClient.fetchQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      switch (queryKey) {
        case "gameScores":
        case ["gameScores"]:
          return getHighScores();
        case "crystalStatus":
        case ["crystalStatus"]:
          return getCrystalStatus();
        default:
          throw new Error(`Unknown query key: ${queryKey}`);
      }
    },
    staleTime: 0, // Consider data immediately stale
  });
}
// Create query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Keep unused data cached for 30 minutes
    },
  },
});

// Create context to expose custom hooks
const GameQueryContext = createContext({});

export function GameQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <GameQueryContextProvider>{children}</GameQueryContextProvider>
    </QueryClientProvider>
  );
}

function GameQueryContextProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Check login status when component mounts
    const checkLoginStatus = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setIsLoggedIn(!!userData);
    };

    checkLoginStatus();
  }, []);

  return (
    <GameQueryContext.Provider value={{ isLoggedIn }}>
      {children}
    </GameQueryContext.Provider>
  );
}

export function useGameScores() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const checkLogin = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setIsLoggedIn(!!userData);
    };
    checkLogin();
  }, []);

  return useQuery({
    queryKey: ["gameScores"],
    queryFn: async () => {
      // Still check here in case enabled runs before the state is updated
      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        return [];
      }
      return getHighScores();
    },
    // refetchOnMount: true,
    // retry: 2,
    // refetchInterval: 5000,
    // enabled: isLoggedIn, // Now using a boolean state
  });
}

export function useCrystalStatus() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const checkLogin = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setIsLoggedIn(!!userData);
    };
    checkLogin();
  }, []);

  return useQuery({
    queryKey: ["crystalStatus"],
    queryFn: async () => {
      // Still check here in case enabled runs before the state is updated
      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        return {
          crystals: 0,
          dailyCrystalsEarned: 0,
          dailyLimit: 50,
          remainingToday: 50,
          nextResetTime: null,
          timeUntilReset: null,
        };
      }
      return getCrystalStatus();
    },
    // refetchOnMount: true,
    // retry: 2,
    // refetchInterval: 5000,
    // enabled: isLoggedIn, // Now using a boolean state
    placeholderData: {
      crystals: 0,
      dailyCrystalsEarned: 0,
      dailyLimit: 50,
      remainingToday: 50,
      nextResetTime: null,
      timeUntilReset: null,
    },
  });
}
