// import {
//   fetchDataImmediately,
//   queryClient,
//   useCrystalStatus,
//   useThreeLifeDayPassStatus,
// } from "@/context/GameQueryProvider";
// import { ThemedText } from "@/components/ThemedText";
// import { ThemedView } from "@/components/ThemedView";
// import { useAds } from "@/context/AdContext";
// import { Ionicons } from "@expo/vector-icons";
// import { router } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { showRewardedAd } from "@/components/RewardedAd";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { addCrystalsToBalance, purchaseThreeLifeDayPass } from "@/api/client";
// import { Image } from "expo-image";
// import {
//   initializePurchases,
//   getProducts,
//   purchaseProduct,
//   restorePurchases as restoreIAPPurchases,
// } from "@/components/InAppPurchaseImpl";

// // This would be moved to a separate context file in a real implementation
// interface ShopContext {
//   crystalBalance: number;
//   addCrystals: (amount: number) => Promise<boolean>;
//   purchaseItem: (itemId: string, price: number | null) => Promise<boolean>;
// }

// type Purchase = {
//   productId: string;
//   // Add other properties if needed
// };

// const useShop = (): ShopContext => {
//   const { data: crystalData } = useCrystalStatus();
//   const crystalBalance = crystalData?.crystals || 0;

//   const addCrystals = async (amount: number) => {
//     try {
//       // Call the actual API
//       const success = await addCrystalsToBalance(amount);

//       if (success) {
//         await fetchDataImmediately("crystalStatus");
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error("Failed to add crystals:", error);
//       return false;
//     }
//   };

//   const purchaseItem = async (
//     itemId: string,
//     price: number | null
//   ): Promise<boolean> => {
//     if (price === null) {
//       return true; // Real money purchase, handled separately
//     }

//     if (crystalBalance < price) {
//       Alert.alert(
//         "Insufficient Crystals",
//         `You need ${price} crystals for this purchase.`
//       );
//       return false;
//     }

//     try {
//       await fetchDataImmediately("crystalStatus");
//       return true;
//     } catch (error) {
//       console.error("Purchase failed:", error);
//       Alert.alert("Purchase Failed", "An error occurred during your purchase.");
//       return false;
//     }
//   };

//   return { crystalBalance, addCrystals, purchaseItem };
// };

// export default function ShopScreen() {
//   const insets = useSafeAreaInsets();
//   const [loading, setLoading] = useState(false);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const {
//     removeAdsTemporarily,
//     removeAdsPermanently,
//     restorePurchases,
//     temporaryAdRemoval,
//     temporaryAdRemovalEndTime,
//     adsRemoved,
//   } = useAds();
//   const { crystalBalance, addCrystals, purchaseItem } = useShop();

//   const [remainingTime, setRemainingTime] = useState("");

//   const [threeLifedayPassRemainingTime, setThreeLifeDayPassRemainingTime] =
//     useState("");
//   const { data: threeLifeDayPassStatus } = useThreeLifeDayPassStatus();

//   const [products, setProducts] = useState<any[]>([]);

//   // Add a new useEffect for IAP initialization
//   useEffect(() => {
//     const setupIAP = async () => {
//       try {
//         const initialized = await initializePurchases();
//         if (initialized) {
//           // Define your product IDs - must match App Store/Google Play
//           const productIds = [
//             "removeadpermanent",
//             "crystal100",
//             "crystal250",
//             "crystal400",
//             "crystal1000",
//             "com.anonymous.maipocket.crystal100",
//           ];

//           const iapProducts = await getProducts(productIds);
//           console.log("Products fetched:", JSON.stringify(iapProducts));
//           setProducts(iapProducts);
//         }
//       } catch (error) {
//         console.error("Failed to initialize IAP:", error);
//       }
//     };

//     setupIAP();
//   }, []);

//   useEffect(() => {
//     // Check if user is logged in
//     const checkLoginStatus = async () => {
//       const userData = await AsyncStorage.getItem("userData");
//       setIsLoggedIn(!!userData);
//     };

//     checkLoginStatus();
//   }, []);

//   useEffect(() => {
//     if (!temporaryAdRemoval || !temporaryAdRemovalEndTime) {
//       setRemainingTime("");
//       return;
//     }

//     const calculateRemainingTime = () => {
//       const now = Date.now();
//       const diff = temporaryAdRemovalEndTime - now;

//       if (diff <= 0) {
//         setRemainingTime("Expired");
//         return;
//       }

//       const hours = Math.floor(diff / (1000 * 60 * 60));
//       const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//       const seconds = Math.floor((diff % (1000 * 60)) / 1000);

//       setRemainingTime(
//         `${hours.toString().padStart(2, "0")}:${minutes
//           .toString()
//           .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
//       );
//     };

//     calculateRemainingTime();
//     const interval = setInterval(calculateRemainingTime, 1000);

//     return () => clearInterval(interval);
//   }, [temporaryAdRemoval, temporaryAdRemovalEndTime]);

//   useEffect(() => {
//     if (
//       !threeLifeDayPassStatus?.active ||
//       !threeLifeDayPassStatus?.expiration
//     ) {
//       setThreeLifeDayPassRemainingTime("");
//       return;
//     }

//     const calculateRemainingTime = () => {
//       const now = Date.now();
//       const expiration = new Date(threeLifeDayPassStatus.expiration).getTime();
//       const diff = expiration - now;

//       if (diff <= 0) {
//         setThreeLifeDayPassRemainingTime("Expired");
//         return;
//       }

//       const hours = Math.floor(diff / (1000 * 60 * 60));
//       const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//       const seconds = Math.floor((diff % (1000 * 60)) / 1000);

//       setThreeLifeDayPassRemainingTime(
//         `${hours.toString().padStart(2, "0")}:${minutes
//           .toString()
//           .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
//       );
//     };

//     calculateRemainingTime();
//     const interval = setInterval(calculateRemainingTime, 1000);

//     return () => clearInterval(interval);
//   }, [threeLifeDayPassStatus]);

//   // Add this helper function
//   const getProductIdFromItemId = (itemId: string): string | null => {
//     switch (itemId) {
//       case "removeadpermanent":
//         return "removeadpermanent";
//       case "crystal100":
//         return "crystal100";
//       case "crystal250":
//         return "crystal250";
//       case "crystal400":
//         return "crystal400";
//       case "crystal1000":
//         return "crystal1000";
//       default:
//         return null;
//     }
//   };

//   const handlePurchase = async (
//     itemId: string,
//     itemName: string,
//     price: number | null,
//     currencyType: "USD" | "crystal",
//     onSuccess: () => Promise<void>
//   ) => {
//     setLoading(true);

//     try {
//       if (currencyType === "USD") {
//         // Real money purchase via IAP
//         const productId = getProductIdFromItemId(itemId);
//         if (!productId) {
//           throw new Error("Invalid product ID");
//         }

//         Alert.alert(
//           "In-App Purchase",
//           `Would you like to purchase ${itemName}?`,
//           [
//             {
//               text: "Yes",
//               // Update the purchaseProduct function in handlePurchase:
//               onPress: async () => {
//                 try {
//                   // First, check if the product exists in the fetched products
//                   console.log("Available products:", JSON.stringify(products));
//                   const product = products.find(
//                     (p) => p.productId === productId
//                   );
//                   console.log(
//                     "Found product for purchase:",
//                     product ? JSON.stringify(product) : "NOT FOUND"
//                   );

//                   if (!product) {
//                     // Re-query if product not found
//                     const refreshedProducts = await getProducts([productId]);
//                     console.log("Refreshed products:", refreshedProducts);
//                     if (!refreshedProducts || refreshedProducts.length === 0) {
//                       throw new Error("Product not available for purchase");
//                     }
//                   }

//                   console.log("Starting direct purchase for:", productId);
//                   const success = await purchaseProduct(productId);
//                   console.log("Purchase result:", success);

//                   if (success) {
//                     await onSuccess();
//                     Alert.alert(
//                       "Purchase Successful",
//                       `Thank you for your purchase!`
//                     );
//                   } else {
//                     Alert.alert(
//                       "Purchase Failed",
//                       "The purchase could not be completed."
//                     );
//                   }
//                 } catch (error) {
//                   console.error("Purchase error:", error);
//                   Alert.alert(
//                     "Purchase Failed",
//                     "An error occurred during your purchase."
//                   );
//                 }
//                 setLoading(false);
//               },
//             },
//             {
//               text: "Cancel",
//               style: "cancel",
//               onPress: () => {
//                 setLoading(false);
//               },
//             },
//           ]
//         );
//       } else {
//         // Crystal purchase - same as your existing implementation
//         Alert.alert(
//           "Confirm Purchase",
//           `Are you sure you want to purchase ${itemName} for ${price} crystals?`,
//           [
//             {
//               text: "Yes",
//               onPress: async () => {
//                 const success = await purchaseItem(itemId, price);
//                 if (success) {
//                   await onSuccess();
//                   Alert.alert(
//                     "Purchase Successful",
//                     `You have purchased ${itemName}!`
//                   );
//                 }
//                 setLoading(false);
//               },
//             },
//             {
//               text: "Cancel",
//               style: "cancel",
//               onPress: () => {
//                 setLoading(false);
//               },
//             },
//           ]
//         );
//       }
//     } catch (error) {
//       console.error("Purchase error:", error);
//       Alert.alert("Purchase Failed", "An error occurred during your purchase.");
//       setLoading(false);
//     }
//   };

//   const handleRestorePurchases = async () => {
//     setLoading(true);
//     try {
//       // Call both restore functions
//       await restorePurchases(); // Your existing function from useAds
//       const purchasedItems = await restoreIAPPurchases();

//       // Create a mapping of productId to handler functions
//       const productHandlers = {
//         "com.anonymous.maipocket.removeadpermanent": async () => {
//           await removeAdsPermanently();
//           return "ad removal";
//         },
//         "com.anonymous.maipocket.crystal100": async () => {
//           await addCrystals(100);
//           return "100 crystals";
//         },
//         "com.anonymous.maipocket.crystal250": async () => {
//           await addCrystals(250);
//           return "250 crystals";
//         },
//         "com.anonymous.maipocket.crystal400": async () => {
//           await addCrystals(400);
//           return "400 crystals";
//         },
//         "com.anonymous.maipocket.crystal1000": async () => {
//           await addCrystals(1000);
//           return "1000 crystals";
//         },
//       };

//       // Process all restored purchases
//       let restoredItemsList = []; // Changed variable name here
//       for (const purchase of purchasedItems as Purchase[]) {
//         const handler =
//           productHandlers[purchase.productId as keyof typeof productHandlers];
//         if (handler) {
//           const itemName = await handler();
//           restoredItemsList.push(itemName);
//         }
//       }

//       // Show appropriate message based on what was restored
//       if (restoredItemsList.length > 0) {
//         Alert.alert(
//           "Purchases Restored",
//           `The following items were restored: ${restoredItemsList.join(", ")}`
//         );
//       } else {
//         Alert.alert("No Purchases", "No purchases found to restore.");
//       }
//     } catch (error) {
//       console.error("Restore purchase error:", error);
//       Alert.alert(
//         "Restore Failed",
//         "An error occurred while restoring purchases."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };
//   return (
//     <View style={[styles.container, { paddingTop: insets.top }]}>
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={styles.backButton}
//         >
//           <Ionicons name="arrow-back" size={24} color="#AE75DA" />
//         </TouchableOpacity>
//         <ThemedText
//           style={{
//             fontSize: 24,
//             fontWeight: "bold",
//             flex: 1,
//             textAlign: "center",
//           }}
//         >
//           Shop
//         </ThemedText>
//         {/* Empty view with the same width as the back button for balance */}
//         <View style={{ width: 32 }}></View>
//       </View>

//       {/* Only display crystal count if user is logged in */}
//       {isLoggedIn && (
//         <View
//           style={{
//             flexDirection: "row",
//             justifyContent: "flex-end",
//             paddingBottom: 8,
//             paddingHorizontal: 16,
//           }}
//         >
//           <View style={styles.crystalContainer}>
//             <Image
//               source={require("@/assets/images/crystal.png")}
//               style={styles.crystalIcon}
//             />
//             <ThemedText style={styles.crystalText}>{crystalBalance}</ThemedText>
//           </View>
//         </View>
//       )}

//       <ScrollView style={styles.scrollContainer}>
//         {!adsRemoved && (
//           <ThemedView style={styles.section}>
//             <ThemedText type="subtitle">Remove Ads</ThemedText>

//             <ThemedView style={[styles.itemCard, { flexDirection: "column" }]}>
//               <View
//                 style={{
//                   flexDirection: "row",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                   width: "100%",
//                 }}
//               >
//                 <View style={styles.itemInfo}>
//                   <ThemedText style={styles.itemTitle}>
//                     Remove Ads (1 Day)
//                   </ThemedText>
//                 </View>
//                 <TouchableOpacity
//                   style={[
//                     styles.button,
//                     styles.adFreeButton,
//                     temporaryAdRemoval && styles.disabledButton,
//                   ]}
//                   onPress={() => {
//                     setLoading(true);
//                     showRewardedAd(
//                       async () => {
//                         await removeAdsTemporarily();
//                         setLoading(false);
//                         Alert.alert(
//                           "Ads Removed Temporarily",
//                           "Thanks for watching! Ads have been removed for 1 day."
//                         );
//                       },
//                       () => {
//                         setLoading(false);
//                       }
//                     );
//                   }}
//                   disabled={loading || temporaryAdRemoval}
//                 >
//                   {loading ? (
//                     <ActivityIndicator color="#FFFFFF" />
//                   ) : (
//                     <ThemedText style={styles.buttonText}>
//                       {temporaryAdRemoval ? "Active" : "Watch Ad"}
//                     </ThemedText>
//                   )}
//                 </TouchableOpacity>
//               </View>
//               {temporaryAdRemoval && (
//                 <ThemedText style={{ alignSelf: "flex-start", marginTop: 10 }}>
//                   Time Remaining: {remainingTime}
//                 </ThemedText>
//               )}
//             </ThemedView>

//             <ThemedView style={styles.itemCard}>
//               <View style={styles.itemInfo}>
//                 <ThemedText style={styles.itemTitle}>
//                   Remove Ads Permanently
//                 </ThemedText>
//               </View>
//               <TouchableOpacity
//                 style={[styles.button, styles.premiumButton]}
//                 onPress={() =>
//                   handlePurchase(
//                     "removeadpermanent",
//                     "Remove Ads Permanently",
//                     null, // Price comes from App Store
//                     "USD",
//                     removeAdsPermanently
//                   )
//                 }
//                 disabled={loading} // Remove the standalone 'disabled' attribute
//               >
//                 {loading ? (
//                   <ActivityIndicator color="#FFFFFF" />
//                 ) : (
//                   <ThemedText style={styles.buttonText}>
//                     {products.find((p) => p.productId === "removeadpermanent")
//                       ?.price || "$28"}
//                   </ThemedText>
//                 )}
//               </TouchableOpacity>
//             </ThemedView>

//             <TouchableOpacity
//               style={styles.restoreButton}
//               onPress={handleRestorePurchases}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator />
//               ) : (
//                 <ThemedText style={styles.restoreText}>
//                   Restore Purchase
//                 </ThemedText>
//               )}
//             </TouchableOpacity>
//           </ThemedView>
//         )}

//         {/* Only display 3 Day Pass if user is logged in */}
//         {isLoggedIn && (
//           <ThemedView style={styles.section}>
//             <ThemedText type="subtitle">Game Passes</ThemedText>
//             <ThemedView style={[styles.itemCard, { flexDirection: "column" }]}>
//               <View style={{ flexDirection: "row" }}>
//                 <View style={styles.itemInfo}>
//                   <View
//                     style={{
//                       flexDirection: "row",
//                       gap: 12,
//                       alignItems: "center",
//                     }}
//                   >
//                     <Ionicons name="heart" size={36} color={"red"} />
//                     <ThemedText style={styles.itemTitle}>
//                       3 Life Day Pass
//                     </ThemedText>
//                   </View>
//                   {/* <ThemedText style={styles.itemDescription}>
//                   Visual and Audio Mode (24 hours)
//                 </ThemedText> */}
//                 </View>
//                 <TouchableOpacity
//                   style={[
//                     styles.button,
//                     styles.crystalButton,
//                     threeLifeDayPassStatus?.active && styles.disabledButton, // Add this to apply disabled style
//                   ]}
//                   onPress={() =>
//                     handlePurchase(
//                       "day_pass",
//                       "3 Life Day Pass",
//                       150,
//                       "crystal",
//                       async () => {
//                         try {
//                           await purchaseThreeLifeDayPass();
//                           await fetchDataImmediately("crystalStatus");
//                           await fetchDataImmediately("threeLifeDayPassStatus");
//                         } catch (error) {
//                           console.error("Failed to apply day pass:", error);
//                           Alert.alert(
//                             "Purchase Error",
//                             "Failed to apply day pass"
//                           );
//                         }
//                       }
//                     )
//                   }
//                   disabled={loading || threeLifeDayPassStatus?.active} // Add this to disable the button when pass is active
//                 >
//                   {loading ? (
//                     <ActivityIndicator color="#FFFFFF" />
//                   ) : (
//                     <View style={styles.crystalButtonContent}>
//                       {threeLifeDayPassStatus?.active ? (
//                         <ThemedText style={styles.buttonText}>
//                           Active
//                         </ThemedText>
//                       ) : (
//                         <>
//                           <Image
//                             source={require("@/assets/images/crystal.png")}
//                             style={styles.buttonCrystalIcon}
//                           />
//                           <ThemedText style={styles.buttonText}>150</ThemedText>
//                         </>
//                       )}
//                     </View>
//                   )}
//                 </TouchableOpacity>
//               </View>
//               {threeLifeDayPassStatus?.active && (
//                 <ThemedText style={{ alignSelf: "flex-start", marginTop: 10 }}>
//                   Time Remaining: {threeLifedayPassRemainingTime}
//                 </ThemedText>
//               )}
//             </ThemedView>
//           </ThemedView>
//         )}

//         {/* Only display Crystals section if user is logged in */}
//         {isLoggedIn && (
//           <ThemedView style={styles.section}>
//             <ThemedText type="subtitle">Crystals</ThemedText>

//             {[
//               { id: "crystal100", amount: 100, price: 8 },
//               { id: "crystal250", amount: 250, price: 18 },
//               { id: "crystal400", amount: 400, price: 28 },
//               { id: "crystal1000", amount: 1000, price: 58 },
//             ].map((item) => (
//               <ThemedView key={item.id} style={styles.itemCard}>
//                 <View style={styles.itemInfo}>
//                   <View style={styles.crystalPurchaseTitle}>
//                     <Image
//                       source={require("@/assets/images/crystal.png")}
//                       style={styles.crystalIconMedium}
//                     />
//                     <ThemedText style={styles.itemTitle}>
//                       {item.amount} Crystals
//                     </ThemedText>
//                   </View>
//                   {/* <ThemedText style={styles.itemDescription}>
//                     Use crystals to purchase special items and passes
//                   </ThemedText> */}
//                 </View>
//                 <TouchableOpacity
//                   style={[styles.button, styles.purchaseButton]}
//                   onPress={() =>
//                     handlePurchase(
//                       item.id,
//                       `${item.amount} Crystals`,
//                       null, // Price from store, not local
//                       "USD",
//                       async () => {
//                         // Add crystals to balance after successful purchase
//                         await addCrystals(item.amount);
//                         await fetchDataImmediately("crystalStatus");
//                       }
//                     )
//                   }
//                   disabled={loading} // Only disable when loading, not permanently
//                 >
//                   {loading ? (
//                     <ActivityIndicator color="#FFFFFF" />
//                   ) : (
//                     <ThemedText style={styles.buttonText}>
//                       {products.find((p) => p.productId === item.id)?.price ||
//                         `$${item.price}`}
//                     </ThemedText>
//                   )}
//                 </TouchableOpacity>
//               </ThemedView>
//             ))}
//           </ThemedView>
//         )}
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   backButton: {
//     padding: 4,
//   },
//   scrollContainer: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   section: {
//     marginBottom: 24,
//     gap: 12,
//   },
//   itemCard: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "rgba(150, 150, 150, 0.2)",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   itemInfo: {
//     flex: 1,
//     marginRight: 12,
//   },
//   itemTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     // marginBottom: 4,
//   },
//   itemDescription: {
//     fontSize: 14,
//     opacity: 0.7,
//   },
//   button: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     alignItems: "center",
//     justifyContent: "center",
//     minWidth: 80,
//   },
//   adFreeButton: {
//     backgroundColor: "#5C6BC0",
//   },
//   premiumButton: {
//     backgroundColor: "#9944DD",
//   },
//   crystalButton: {
//     backgroundColor: "#3AB795",
//   },
//   purchaseButton: {
//     backgroundColor: "#F85E9F",
//   },
//   buttonText: {
//     color: "#FFFFFF",
//     fontWeight: "600",
//   },
//   crystalContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(174, 117, 218, 0.2)",
//     paddingVertical: 4,
//     paddingHorizontal: 10,
//     borderRadius: 16,
//     justifyContent: "space-between",
//     gap: 10,
//   },
//   crystalIcon: {
//     width: 15,
//     height: 30,
//     marginRight: 10,
//   },
//   buttonCrystalIcon: {
//     width: 16,
//     height: 32,
//     marginLeft: 4,
//   },
//   crystalIconMedium: {
//     width: 24,
//     height: 48,
//     marginRight: 20,
//   },
//   crystalText: {
//     fontWeight: "600",
//   },
//   crystalPurchaseTitle: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   crystalButtonContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },
//   restoreButton: {
//     alignItems: "center",
//     paddingVertical: 8,
//   },
//   restoreText: {
//     textDecorationLine: "underline",
//   },
//   disabledButton: {
//     backgroundColor: "#8a8a8a",
//     opacity: 0.7,
//   },
// });
// screens/ShopScreen.tsx
import {
  fetchDataImmediately,
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
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showRewardedAd } from "@/components/RewardedAd";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addCrystalsToBalance, purchaseThreeLifeDayPass } from "@/api/client";
import { Image } from "expo-image";
import {
  initializePurchases,
  getProductsAsync as getProducts,
  purchaseProduct,
  restorePurchases as restoreIAPPurchases,
  cleanupIAP,
} from "@/components/InAppPurchaseImpl";

interface ShopContext {
  crystalBalance: number;
  addCrystals: (amount: number) => Promise<boolean>;
  purchaseItem: (itemId: string, price: number | null) => Promise<boolean>;
}

const useShop = (): ShopContext => {
  const { data: crystalData } = useCrystalStatus();
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
      Alert.alert("Insufficient Crystals", `You need ${price} crystals.`);
      return false;
    }
    await fetchDataImmediately("crystalStatus");
    return true;
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
        "removeadpermanent",
        "crystal100",
        "crystal250",
        "crystal400",
        "crystal1000",
        "com.anonymous.maipocket.crystal100", // Optional: for Android
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
      removeadpermanent: "removeadpermanent",
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
          "Confirm Purchase",
          `Buy ${itemName} for ${product.price}?`,
          [
            {
              text: "Buy",
              onPress: async () => {
                try {
                  const success = await purchaseProduct(sku);
                  if (success) {
                    await onSuccess();
                    Alert.alert("Success", `You bought ${itemName}!`);
                  } else {
                    Alert.alert("Failed", "Purchase could not be completed.");
                  }
                } catch (e: any) {
                  Alert.alert("Error", e.message || "Purchase failed");
                } finally {
                  setLoading(false);
                }
              },
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setLoading(false),
            },
          ]
        );
      } else {
        Alert.alert("Confirm", `Spend ${price} crystals on ${itemName}?`, [
          {
            text: "Yes",
            onPress: async () => {
              const success = await purchaseItem(itemId, price);
              if (success) {
                await onSuccess();
                Alert.alert("Success", `You bought ${itemName}!`);
              }
              setLoading(false);
            },
          },
          { text: "Cancel", style: "cancel", onPress: () => setLoading(false) },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      await restorePurchases();
      const restored = await restoreIAPPurchases();

      const handlers: Record<string, () => Promise<string>> = {
        removeadpermanent: async () => {
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
        items.length ? "Restored" : "No Purchases",
        items.length
          ? `Restored: ${items.join(", ")}`
          : "No previous purchases found."
      );
    } catch (e) {
      Alert.alert("Restore Failed", "Could not restore purchases.");
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
          Shop
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
            <ThemedText type="subtitle">Remove Ads</ThemedText>

            <ThemedView style={[styles.itemCard, { flexDirection: "column" }]}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <ThemedText style={styles.itemTitle}>
                  Remove Ads (1 Day)
                </ThemedText>
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
                        Alert.alert("Success", "Ads removed for 1 day!");
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
                      {temporaryAdRemoval ? "Active" : "Watch Ad"}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
              {temporaryAdRemoval && (
                <ThemedText style={{ marginTop: 10 }}>
                  Time Remaining: {remainingTime}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.itemCard}>
              <ThemedText style={styles.itemTitle}>
                Remove Ads Permanently
              </ThemedText>
              <TouchableOpacity
                style={[styles.button, styles.premiumButton]}
                onPress={() =>
                  handlePurchase(
                    "removeadpermanent",
                    "Remove Ads Permanently",
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
                    {products.find((p) => p.productId === "removeadpermanent")
                      ?.price || "$28"}
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
                  Restore Purchase
                </ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        )}

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
                    <Ionicons name="heart" size={36} color="red" />
                    <ThemedText style={styles.itemTitle}>
                      3 Life Day Pass
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
                      "3 Life Day Pass",
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
                    <ThemedText style={styles.buttonText}>Active</ThemedText>
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
                <ThemedText style={{ marginTop: 10 }}>
                  Time Remaining: {threeLifedayPassRemainingTime}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        )}

        {isLoggedIn && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Crystals</ThemedText>
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
                      {item.amount} Crystals
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.purchaseButton]}
                  onPress={() =>
                    handlePurchase(
                      item.id,
                      `${item.amount} Crystals`,
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
                      {products.find((p) => p.productId === item.id)?.price ||
                        `$${item.price}`}
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
