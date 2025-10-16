import {
  fetchDataImmediately,
  queryClient,
  useCrystalStatus,
  useThreeLifeDayPassStatus,
} from "@/context/GameQueryProvider";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAds } from "@/context/AdContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showRewardedAd } from "@/components/RewardedAd";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { purchaseThreeLifeDayPass } from "@/api/client";

// This would be moved to a separate context file in a real implementation
interface ShopContext {
  crystalBalance: number;
  addCrystals: (amount: number) => Promise<void>;
  purchaseItem: (itemId: string, price: number | null) => Promise<boolean>;
}

const useShop = (): ShopContext => {
  const { data: crystalData } = useCrystalStatus();
  const crystalBalance = crystalData?.crystals || 0;

  // We need to add API calls to update crystals on the server
  const addCrystals = async (amount: number) => {
    // Replace with actual API call
    try {
      // Example API call (you'll need to implement this in your API client)
      // await addCrystalsToBalance(amount);

      // After successful API call, invalidate the query to refetch
      queryClient.invalidateQueries(["crystalStatus"]);
      return true;
    } catch (error) {
      console.error("Failed to add crystals:", error);
      return false;
    }
  };

  const purchaseItem = async (
    itemId: string,
    price: number | null
  ): Promise<boolean> => {
    if (price === null) {
      return true; // Real money purchase, handled separately
    }

    if (crystalBalance < price) {
      Alert.alert(
        "Insufficient Crystals",
        `You need ${price} crystals for this purchase.`
      );
      return false;
    }

    try {
      // Replace with actual API call
      // await purchaseItemWithCrystals(itemId, price);

      // After successful API call, invalidate the query to refetch
      queryClient.invalidateQueries(["crystalStatus"]);
      return true;
    } catch (error) {
      console.error("Purchase failed:", error);
      Alert.alert("Purchase Failed", "An error occurred during your purchase.");
      return false;
    }
  };

  return { crystalBalance, addCrystals, purchaseItem };
};

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const {
    removeAdsTemporarily,
    removeAdsPermanently,
    restorePurchases,
    temporaryAdRemoval,
    temporaryAdRemovalEndTime,
    adsRemoved,
  } = useAds();
  const { crystalBalance, purchaseItem } = useShop();

  const [remainingTime, setRemainingTime] = useState("");

  const [threeLifedayPassRemainingTime, setThreeLifeDayPassRemainingTime] =
    useState("");
  const { data: threeLifeDayPassStatus } = useThreeLifeDayPassStatus();

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setIsLoggedIn(!!userData);
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (!temporaryAdRemoval || !temporaryAdRemovalEndTime) {
      setRemainingTime("");
      return;
    }

    const calculateRemainingTime = () => {
      const now = Date.now();
      const diff = temporaryAdRemovalEndTime - now;

      if (diff <= 0) {
        setRemainingTime("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemainingTime(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [temporaryAdRemoval, temporaryAdRemovalEndTime]);

  useEffect(() => {
    if (
      !threeLifeDayPassStatus?.active ||
      !threeLifeDayPassStatus?.expiration
    ) {
      setThreeLifeDayPassRemainingTime("");
      return;
    }

    const calculateRemainingTime = () => {
      const now = Date.now();
      const expiration = new Date(threeLifeDayPassStatus.expiration).getTime();
      const diff = expiration - now;

      if (diff <= 0) {
        setThreeLifeDayPassRemainingTime("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setThreeLifeDayPassRemainingTime(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [threeLifeDayPassStatus]);

  const handlePurchase = async (
    itemId: string,
    itemName: string,
    price: number | null,
    currencyType: "USD" | "crystal",
    onSuccess: () => Promise<void>
  ) => {
    setLoading(true);

    try {
      if (currencyType === "USD") {
        // In a real app, this would trigger platform-specific IAP
        Alert.alert(
          "In-App Purchase",
          `Would you like to purchase ${itemName} for ${
            price ? "$" + price : "free"
          }?`,
          [
            {
              text: "Yes",
              onPress: async () => {
                await onSuccess();
                setLoading(false);
                Alert.alert(
                  "Purchase Successful",
                  `Thank you for your purchase!`
                );
              },
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setLoading(false);
              },
            },
          ]
        );
      } else {
        // Crystal purchase - Add confirmation alert
        Alert.alert(
          "Confirm Purchase",
          `Are you sure you want to purchase ${itemName} for ${price} crystals?`,
          [
            {
              text: "Yes",
              onPress: async () => {
                const success = await purchaseItem(itemId, price);
                if (success) {
                  await onSuccess();
                  Alert.alert(
                    "Purchase Successful",
                    `You have purchased ${itemName}!`
                  );
                }
                setLoading(false);
              },
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setLoading(false);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Purchase error:", error);
      Alert.alert("Purchase Failed", "An error occurred during your purchase.");
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#AE75DA" />
        </TouchableOpacity>
        <ThemedText
          style={{
            fontSize: 24,
            fontWeight: "bold",
            flex: 1,
            textAlign: "center",
          }}
        >
          Shop
        </ThemedText>
        {/* Empty view with the same width as the back button for balance */}
        <View style={{ width: 32 }}></View>
      </View>

      {/* Only display crystal count if user is logged in */}
      {isLoggedIn && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingBottom: 8,
            paddingHorizontal: 16,
          }}
        >
          <View style={styles.crystalContainer}>
            <Image
              source={require("@/assets/images/crystal.png")}
              style={styles.crystalIcon}
            />
            <ThemedText style={styles.crystalText}>{crystalBalance}</ThemedText>
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollContainer}>
        {!adsRemoved && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Remove Ads</ThemedText>

            <ThemedView style={[styles.itemCard, { flexDirection: "column" }]}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <View style={styles.itemInfo}>
                  <ThemedText style={styles.itemTitle}>
                    Remove Ads (1 Day)
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.adFreeButton,
                    temporaryAdRemoval && styles.disabledButton,
                  ]}
                  onPress={() => {
                    setLoading(true);
                    showRewardedAd(
                      async () => {
                        await removeAdsTemporarily();
                        setLoading(false);
                        Alert.alert(
                          "Ads Removed Temporarily",
                          "Thanks for watching! Ads have been removed for 1 day."
                        );
                      },
                      () => {
                        setLoading(false);
                      }
                    );
                  }}
                  disabled={loading || temporaryAdRemoval}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.buttonText}>
                      {temporaryAdRemoval ? "Active" : "Watch Ad"}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
              {temporaryAdRemoval && (
                <ThemedText style={{ alignSelf: "flex-start", marginTop: 10 }}>
                  Time Remaining: {remainingTime}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemTitle}>
                  Remove Ads Permanently
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.premiumButton]}
                onPress={() =>
                  handlePurchase(
                    "remove_ads_perm",
                    "Remove Ads Permanently",
                    28,
                    "USD",
                    removeAdsPermanently
                  )
                }
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.buttonText}>$28</ThemedText>
                )}
              </TouchableOpacity>
            </ThemedView>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={async () => {
                setLoading(true);
                await restorePurchases();
                setLoading(false);
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <ThemedText style={styles.restoreText}>
                  Restore Purchase
                </ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Only display 3 Day Pass if user is logged in */}
        {isLoggedIn && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Game Passes</ThemedText>
            <ThemedView style={[styles.itemCard, { flexDirection: "column" }]}>
              <View style={{ flexDirection: "row" }}>
                <View style={styles.itemInfo}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="heart" size={36} color={"red"} />
                    <ThemedText style={styles.itemTitle}>
                      3 Life Day Pass
                    </ThemedText>
                  </View>
                  {/* <ThemedText style={styles.itemDescription}>
                  Visual and Audio Mode (24 hours)
                </ThemedText> */}
                </View>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.crystalButton,
                    threeLifeDayPassStatus?.active && styles.disabledButton, // Add this to apply disabled style
                  ]}
                  onPress={() =>
                    handlePurchase(
                      "day_pass",
                      "3 Life Day Pass",
                      150,
                      "crystal",
                      async () => {
                        try {
                          await purchaseThreeLifeDayPass();
                          await fetchDataImmediately("crystalStatus");
                          await fetchDataImmediately("threeLifeDayPassStatus");
                        } catch (error) {
                          console.error("Failed to apply day pass:", error);
                          Alert.alert(
                            "Purchase Error",
                            "Failed to apply day pass"
                          );
                        }
                      }
                    )
                  }
                  disabled={loading || threeLifeDayPassStatus?.active} // Add this to disable the button when pass is active
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.crystalButtonContent}>
                      {threeLifeDayPassStatus?.active ? (
                        <ThemedText style={styles.buttonText}>
                          Active
                        </ThemedText>
                      ) : (
                        <>
                          <Image
                            source={require("@/assets/images/crystal.png")}
                            style={styles.buttonCrystalIcon}
                          />
                          <ThemedText style={styles.buttonText}>150</ThemedText>
                        </>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <ThemedText style={{ alignSelf: "flex-start", marginTop: 10 }}>
                Time Remaining: {threeLifedayPassRemainingTime}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {/* Only display Crystals section if user is logged in */}
        {isLoggedIn && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Crystals</ThemedText>

            {[
              { id: "crystal_100", amount: 100, price: 8 },
              { id: "crystal_200", amount: 200, price: 15 },
              { id: "crystal_400", amount: 400, price: 28 },
              { id: "crystal_1000", amount: 1000, price: 58 },
            ].map((item) => (
              <ThemedView key={item.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <View style={styles.crystalPurchaseTitle}>
                    <Image
                      source={require("@/assets/images/crystal.png")}
                      style={styles.crystalIconMedium}
                    />
                    <ThemedText style={styles.itemTitle}>
                      {item.amount} Crystals
                    </ThemedText>
                  </View>
                  {/* <ThemedText style={styles.itemDescription}>
                    Use crystals to purchase special items and passes
                  </ThemedText> */}
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.purchaseButton]}
                  onPress={() =>
                    handlePurchase(
                      item.id,
                      `${item.amount} Crystals`,
                      item.price,
                      "USD",
                      async () => {
                        /* Add crystals to balance */
                      }
                    )
                  }
                  // disabled={loading}
                  disabled
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.buttonText}>
                      ${item.price}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    // marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  adFreeButton: {
    backgroundColor: "#5C6BC0",
  },
  premiumButton: {
    backgroundColor: "#9944DD",
  },
  crystalButton: {
    backgroundColor: "#3AB795",
  },
  purchaseButton: {
    backgroundColor: "#F85E9F",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  crystalContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(174, 117, 218, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    justifyContent: "space-between",
    gap: 10,
  },
  crystalIcon: {
    width: 15,
    height: 30,
    marginRight: 10,
  },
  buttonCrystalIcon: {
    width: 16,
    height: 32,
    marginLeft: 4,
  },
  crystalIconMedium: {
    width: 24,
    height: 48,
    marginRight: 20,
  },
  crystalText: {
    fontWeight: "600",
  },
  crystalPurchaseTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  crystalButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  restoreText: {
    textDecorationLine: "underline",
  },
  disabledButton: {
    backgroundColor: "#8a8a8a",
    opacity: 0.7,
  },
});
