import { addCrystalsToBalance, purchaseThreeLifeDayPass } from "@/api/client";
import {
  cleanupIAP,
  getProductsAsync as getProducts,
  initializePurchases,
  purchaseProduct,
  restorePurchases as restoreIAPPurchases,
} from "@/components/InAppPurchaseImpl";
import { showRewardedAd } from "@/components/RewardedAd";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAds } from "@/context/AdContext";
import {
  fetchDataImmediately,
  useCrystalStatus,
  useThreeLifeDayPassStatus,
} from "@/context/GameQueryProvider";
import { useLocalization } from "@/context/LocalizationContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ShopContext {
  crystalBalance: number;
  addCrystals: (amount: number) => Promise<boolean>;
  purchaseItem: (itemId: string, price: number | null) => Promise<boolean>;
}

const useShop = (): ShopContext => {
  const { data: crystalData } = useCrystalStatus();
  const { t } = useLocalization();
  const crystalBalance = crystalData?.crystals || 0;

  const addCrystals = async (amount: number) => {
    try {
      const success = await addCrystalsToBalance(amount);
      if (success) {
        await fetchDataImmediately("crystalStatus");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to add crystals:", error);
      return false;
    }
  };

  const purchaseItem = async (
    itemId: string,
    price: number | null
  ): Promise<boolean> => {
    if (price === null) return true;
    if (crystalBalance < price) {
      Alert.alert(
        t("insufficientCrystals"),
        t("needMoreCrystals", { amount: price })
      );
      return false;
    }
    await fetchDataImmediately("crystalStatus");
    return true;
  };

  return { crystalBalance, addCrystals, purchaseItem };
};

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
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
  const { crystalBalance, addCrystals, purchaseItem } = useShop();
  const { data: threeLifeDayPassStatus } = useThreeLifeDayPassStatus();

  const [remainingTime, setRemainingTime] = useState("");
  const [threeLifedayPassRemainingTime, setThreeLifeDayPassRemainingTime] =
    useState("");
  const [products, setProducts] = useState<any[]>([]);

  // IAP Initialization
  useEffect(() => {
    let isMounted = true;

    const setupIAP = async () => {
      const initialized = await initializePurchases();
      if (!initialized || !isMounted) return;

      const productIds = [
        "removeadspermanent",
        "crystal100",
        "crystal250",
        "crystal400",
        "crystal1000",
      ];

      const iapProducts = await getProducts(productIds);
      if (isMounted) setProducts(iapProducts);
    };

    setupIAP();

    return () => {
      isMounted = false;
      cleanupIAP();
    };
  }, []);

  // Check login status
  useEffect(() => {
    const checkLogin = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setIsLoggedIn(!!userData);
    };
    checkLogin();
  }, []);

  // Temporary ad removal timer
  useEffect(() => {
    if (!temporaryAdRemoval || !temporaryAdRemovalEndTime) {
      setRemainingTime("");
      return;
    }

    const update = () => {
      const diff = temporaryAdRemovalEndTime - Date.now();
      if (diff <= 0) {
        setRemainingTime("Expired");
        return;
      }
      const h = Math.floor(diff / 3600000)
        .toString()
        .padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setRemainingTime(`${h}:${m}:${s}`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [temporaryAdRemoval, temporaryAdRemovalEndTime]);

  // 3 Life Day Pass timer
  useEffect(() => {
    if (
      !threeLifeDayPassStatus?.active ||
      !threeLifeDayPassStatus?.expiration
    ) {
      setThreeLifeDayPassRemainingTime("");
      return;
    }

    const update = () => {
      const diff =
        new Date(threeLifeDayPassStatus.expiration).getTime() - Date.now();
      if (diff <= 0) {
        setThreeLifeDayPassRemainingTime("Expired");
        return;
      }
      const h = Math.floor(diff / 3600000)
        .toString()
        .padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setThreeLifeDayPassRemainingTime(`${h}:${m}:${s}`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [threeLifeDayPassStatus]);

  const getProductIdFromItemId = (itemId: string): string | null => {
    const map: Record<string, string> = {
      removeadspermanent: "removeadspermanent",
      crystal100: "crystal100",
      crystal250: "crystal250",
      crystal400: "crystal400",
      crystal1000: "crystal1000",
    };
    return map[itemId] || null;
  };

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
        const sku = getProductIdFromItemId(itemId);
        if (!sku) throw new Error("Invalid product ID");

        let product = products.find((p) => p.productId === sku);
        if (!product) {
          const refreshed = await getProducts([sku]);
          product = refreshed[0];
        }
        if (!product) throw new Error("Product not found");

        Alert.alert(
          t("confirmPurchase"),
          t("buyItemForPrice", { itemName, price: product.price }),
          [
            {
              text: t("buy"),
              onPress: async () => {
                try {
                  const success = await purchaseProduct(sku);
                  if (success) {
                    await onSuccess();
                    Alert.alert(
                      t("success"),
                      t("purchaseSuccessful", { itemName })
                    );
                  } else {
                    Alert.alert(t("failed"), t("purchaseCouldNotBeCompleted"));
                  }
                } catch (e: any) {
                  Alert.alert(t("error"), e.message || t("purchaseFailed"));
                } finally {
                  setLoading(false);
                }
              },
            },
            {
              text: t("cancel"),
              style: "cancel",
              onPress: () => setLoading(false),
            },
          ]
        );
      } else {
        Alert.alert(
          t("confirm"),
          t("spendCrystalsOnItem", { price, itemName }),
          [
            {
              text: t("yes"),
              onPress: async () => {
                const success = await purchaseItem(itemId, price);
                if (success) {
                  await onSuccess();
                  Alert.alert(
                    t("success"),
                    t("purchaseSuccessful", { itemName })
                  );
                }
                setLoading(false);
              },
            },
            {
              text: t("cancel"),
              style: "cancel",
              onPress: () => setLoading(false),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(t("error"), error.message || t("somethingWentWrong"));
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      await restorePurchases();
      const restored = await restoreIAPPurchases();

      const handlers: Record<string, () => Promise<string>> = {
        removeadspermanent: async () => {
          await removeAdsPermanently();
          return "permanent ad removal";
        },
        crystal100: async () => {
          await addCrystals(100);
          return "100 crystals";
        },
        crystal250: async () => {
          await addCrystals(250);
          return "250 crystals";
        },
        crystal400: async () => {
          await addCrystals(400);
          return "400 crystals";
        },
        crystal1000: async () => {
          await addCrystals(1000);
          return "1000 crystals";
        },
      };

      const items: string[] = [];
      for (const p of restored as any[]) {
        const handler = handlers[p.productId];
        if (handler) items.push(await handler());
      }

      Alert.alert(
        items.length ? t("restored") : t("noPurchases"),
        items.length
          ? t("restoredItems", { items: items.join(", ") })
          : t("noPreviousPurchasesFound")
      );
    } catch (e) {
      Alert.alert(t("restoreFailed"), t("couldNotRestorePurchases"));
    } finally {
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
          {t("shop")}
        </ThemedText>
        <View style={{ width: 32 }} />
      </View>

      {isLoggedIn && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingHorizontal: 16,
            paddingBottom: 8,
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
            <ThemedText type="subtitle">{t("removeAds")}</ThemedText>

            <ThemedView style={[styles.itemCard, { flexDirection: "column" }]}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={styles.itemInfo}>
                  <ThemedText style={styles.itemTitle}>
                    {t("removeAdsOneDay")}
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
                        Alert.alert(t("success"), t("adsRemovedForOneDay"));
                      },
                      () => setLoading(false)
                    );
                  }}
                  disabled={loading || temporaryAdRemoval}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <ThemedText style={styles.buttonText}>
                      {temporaryAdRemoval ? t("active") : t("watchAd")}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
              {temporaryAdRemoval && (
                <ThemedText style={{ marginTop: 10, alignSelf: "flex-start" }}>
                  {t("timeRemaining")}: {remainingTime}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.itemCard}>
              <ThemedText style={styles.itemTitle}>
                {t("removeAdsPermanently")}
              </ThemedText>
              <TouchableOpacity
                style={[styles.button, styles.premiumButton]}
                onPress={() =>
                  handlePurchase(
                    "removeadspermanent",
                    t("removeAdsPermanently"),
                    null,
                    "USD",
                    removeAdsPermanently
                  )
                }
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={styles.buttonText}>
                    {products.find((p) => p.id === "removeadspermanent")
                      ?.displayPrice || t("loading")}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </ThemedView>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <ThemedText style={styles.restoreText}>
                  {t("restorePurchase")}
                </ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        )}

        {isLoggedIn && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">{t("gamePasses")}</ThemedText>
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
                    <Ionicons name="heart" size={36} color="red" />
                    <ThemedText style={styles.itemTitle}>
                      {t("threeLifeDayPass")}
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.crystalButton,
                    threeLifeDayPassStatus?.active && styles.disabledButton,
                  ]}
                  onPress={() =>
                    handlePurchase(
                      "day_pass",
                      t("threeLifeDayPass"),
                      150,
                      "crystal",
                      async () => {
                        await purchaseThreeLifeDayPass();
                        await fetchDataImmediately("crystalStatus");
                        await fetchDataImmediately("threeLifeDayPassStatus");
                      }
                    )
                  }
                  disabled={loading || threeLifeDayPassStatus?.active}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : threeLifeDayPassStatus?.active ? (
                    <ThemedText style={styles.buttonText}>
                      {t("active")}
                    </ThemedText>
                  ) : (
                    <View style={styles.crystalButtonContent}>
                      <Image
                        source={require("@/assets/images/crystal.png")}
                        style={styles.buttonCrystalIcon}
                      />
                      <ThemedText style={styles.buttonText}>150</ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              {threeLifeDayPassStatus?.active && (
                <ThemedText style={{ marginTop: 10, alignSelf: "flex-start" }}>
                  {t("timeRemaining")}: {threeLifedayPassRemainingTime}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        )}

        {isLoggedIn && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">{t("crystals")}</ThemedText>
            {[
              { id: "crystal100", amount: 100, price: 8 },
              { id: "crystal250", amount: 250, price: 18 },
              { id: "crystal400", amount: 400, price: 28 },
              { id: "crystal1000", amount: 1000, price: 58 },
            ].map((item) => (
              <ThemedView key={item.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <View style={styles.crystalPurchaseTitle}>
                    <Image
                      source={require("@/assets/images/crystal.png")}
                      style={styles.crystalIconMedium}
                    />
                    <ThemedText style={styles.itemTitle}>
                      {t("crystalAmount", { amount: item.amount })}
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.purchaseButton]}
                  onPress={() =>
                    handlePurchase(
                      item.id,
                      t("crystalAmount", { amount: item.amount }),
                      null,
                      "USD",
                      async () => {
                        await addCrystals(item.amount);
                        await fetchDataImmediately("crystalStatus");
                      }
                    )
                  }
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <ThemedText style={styles.buttonText}>
                      {products.find((p) => p.id === item.id)?.displayPrice ||
                        t("loading")}
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
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  scrollContainer: { flex: 1, paddingHorizontal: 16 },
  section: { marginBottom: 24, gap: 12 },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemTitle: { fontSize: 16, fontWeight: "600" },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  adFreeButton: { backgroundColor: "#5C6BC0" },
  premiumButton: { backgroundColor: "#9944DD" },
  crystalButton: { backgroundColor: "#3AB795" },
  purchaseButton: { backgroundColor: "#F85E9F" },
  buttonText: { color: "#FFF", fontWeight: "600" },
  crystalContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(174,117,218,0.2)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 10,
  },
  crystalIcon: { width: 15, height: 30 },
  buttonCrystalIcon: { width: 16, height: 32, marginLeft: 4 },
  crystalIconMedium: { width: 24, height: 48, marginRight: 20 },
  crystalText: { fontWeight: "600" },
  crystalPurchaseTitle: { flexDirection: "row", alignItems: "center" },
  crystalButtonContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  restoreButton: { alignItems: "center", paddingVertical: 8 },
  restoreText: { textDecorationLine: "underline" },
  disabledButton: { backgroundColor: "#8a8a8a", opacity: 0.7 },
});
