// // // InAppPurchaseImpl.tsx
// import Constants from "expo-constants";
// import { Platform } from "react-native";
// // Import the type information only (doesn't import the actual module)
// import * as InAppPurchasesType from "expo-in-app-purchases";

// // Check if we're running in Expo Go
// const isExpoGo = Constants.appOwnership === 'expo';

// // For Expo Go - mock implementation
// const mockInitializePurchases = async () => {
//   console.log("IAP initialized (mock)");
//   return true;
// };

// const mockGetProducts = async (productIds: string[]) => {
//   console.log("Getting products (mock)", productIds);
//   return [
//     {
//       id: "mock_product",
//       title: "Mock Product",
//       description: "This is a mock product for development",
//       price: "$0.99",
//     },
//   ];
// };

// const mockPurchaseProduct = async (productId: string) => {
//   console.log("Purchase initiated (mock)");
//   return false; // Mock failure in Expo Go
// };

// const mockRestorePurchases = async () => {
//   console.log("Restoring purchases (mock)");
//   return [];
// };

// // Export the appropriate implementation based on environment
// export const initializePurchases = isExpoGo ? mockInitializePurchases : async () => {
//   try {
//     // Only import when we need it (not in Expo Go)
//     if (!isExpoGo) {
//       // Type the imported module for better IntelliSense
//       const InAppPurchases = require("expo-in-app-purchases") as typeof InAppPurchasesType;
//       try {
//         await InAppPurchases.connectAsync();
//       } catch (error) {
//         if (error.code === "ERR_IN_APP_PURCHASES_CONNECTION") {
//           console.log("IAP already connected, continuing...");
//           return true;
//         }
//         throw error;
//       }
//       return true;
//     }
//     return mockInitializePurchases();
//   } catch (e) {
//     console.error("Failed to initialize IAP:", e);
//     return false;
//   }
// };

// export const getProducts = isExpoGo ? mockGetProducts : async (productIds: string[]) => {
//   try {
//     if (!isExpoGo) {
//       // Type the imported module for better IntelliSense
//       const InAppPurchases = require("expo-in-app-purchases") as typeof InAppPurchasesType;
//       console.log("Requesting products with IDs:", productIds);
//       const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
//       console.log("Products response code:", responseCode);
//       console.log("Returned products:", JSON.stringify(results, null, 2));
//       if (responseCode === InAppPurchases.IAPResponseCode.OK) {
//         return results;
//       }
//     }
//     return mockGetProducts(productIds);
//   } catch (e) {
//     console.error("Failed to get products:", e);
//     return [];
//   }
// };

// export const purchaseProduct = isExpoGo ? mockPurchaseProduct : async (productId: string) => {
//   try {
//     if (!isExpoGo) {
//       // Type the imported module for better IntelliSense
//       const InAppPurchases = require("expo-in-app-purchases") as typeof InAppPurchasesType;
//       console.log("Starting purchase for product:", productId);

//       console.log("Setting up purchase listener");
//       InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
//         console.log("Purchase listener triggered, code:", responseCode);
//         if (responseCode === InAppPurchases.IAPResponseCode.OK) {
//           results.forEach(async (purchase) => {
//             try {
//               if (!purchase.acknowledged) {
//                 await InAppPurchases.finishTransactionAsync(purchase, true);
//                 console.log("Purchase completed and acknowledged");
//               }
//             } catch (e) {
//               console.error("Error acknowledging purchase:", e);
//             }
//           });
//         }
//       });

//       console.log("Calling purchaseItemAsync");
//       const { responseCode } = await InAppPurchases.purchaseItemAsync(productId);
//       console.log("Purchase response code:", responseCode);
//       return responseCode === InAppPurchases.IAPResponseCode.OK;
//     }
//     return mockPurchaseProduct(productId);
//   } catch (e) {
//     console.error("Purchase failed:", e);
//     return false;
//   }
// };

// export const restorePurchases = isExpoGo ? mockRestorePurchases : async () => {
//   try {
//     if (!isExpoGo) {
//       // Type the imported module for better IntelliSense
//       const InAppPurchases = require("expo-in-app-purchases") as typeof InAppPurchasesType;
//       const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
//       if (responseCode === InAppPurchases.IAPResponseCode.OK) {
//         return results;
//       }
//     }
//     return mockRestorePurchases();
//   } catch (e) {
//     console.error("Failed to restore purchases:", e);
//     return [];
//   }
// };
// // InAppPurchaseImpl.tsx
// import { Platform } from "react-native";
// import Constants from "expo-constants";
// import {
//   initConnection,
//   fetchProducts,
//   requestPurchase,
//   finishTransaction,
//   purchaseUpdatedListener,
//   purchaseErrorListener,
//   getAvailablePurchases,
//   Purchase,
//   PurchaseError,
//   endConnection,
//   // Remove this line: flushFailedPurchasesCachedInAppStore,
// } from "react-native-iap";

// // Check if we're running in Expo Go
// const isExpoGo = Constants.appOwnership === "expo";

// // For Expo Go - mock implementation (same as your current mocks)
// const mockInitializePurchases = async () => {
//   console.log("IAP initialized (mock)");
//   return true;
// };

// const mockGetProducts = async (productIds: string[]) => {
//   console.log("Getting products (mock)", productIds);
//   return [
//     {
//       productId: "mock_product",
//       title: "Mock Product",
//       description: "This is a mock product for development",
//       price: "$0.99",
//     },
//   ];
// };

// const mockPurchaseProduct = async (productId: string) => {
//   console.log("Purchase initiated (mock)");
//   return false; // Mock failure in Expo Go
// };

// const mockRestorePurchases = async () => {
//   console.log("Restoring purchases (mock)");
//   return [];
// };

// // Export the appropriate implementation based on environment
// export const initializePurchases = isExpoGo
//   ? mockInitializePurchases
//   : async () => {
//       try {
//         if (!isExpoGo) {
//           const result = await initConnection();
//           console.log("IAP connection result", result);
//           return true;
//         }
//         return mockInitializePurchases();
//       } catch (e) {
//         console.error("Failed to initialize IAP:", e);
//         return false;
//       }
//     };

// export const getProductsAsync = isExpoGo
//   ? mockGetProducts
//   : async (productIds: string[]) => {
//       try {
//         if (!isExpoGo) {
//           console.log("Requesting products with IDs:", productIds);
//           const products = await fetchProducts({
//             // Changed from getProducts
//             skus: productIds,
//             type: "in-app", // Add type parameter (required)
//           });
//           console.log("Returned products:", JSON.stringify(products, null, 2));
//           return products;
//         }
//         return mockGetProducts(productIds);
//       } catch (e) {
//         console.error("Failed to get products:", e);
//         return [];
//       }
//     };

// export const purchaseProduct = isExpoGo
//   ? mockPurchaseProduct
//   : async (productId: string) => {
//       try {
//         if (!isExpoGo) {
//           console.log("Starting purchase for product:", productId);

//           // Set up purchase listeners
//           const purchaseUpdateSubscription = purchaseUpdatedListener(
//             async (purchase: Purchase) => {
//               console.log("Purchase successful", purchase);

//               try {
//                 if (Platform.OS === "ios") {
//                   await finishTransaction({
//                     transactionId: purchase.transactionId,
//                     isConsumable: true,
//                   });
//                 } else if (Platform.OS === "android") {
//                   // For Android consumables
//                   await finishTransaction({
//                     purchaseToken: purchase.purchaseToken,
//                     isConsumable: true,
//                   });
//                 }
//                 console.log("Transaction finished");
//               } catch (e) {
//                 console.error("Error finishing transaction:", e);
//               }
//             }
//           );

//           const purchaseErrorSubscription = purchaseErrorListener(
//             (error: PurchaseError) => {
//               console.error("Purchase error", error);
//             }
//           );

//           // Request the purchase
//           const result = await requestPurchase({
//             sku: productId,
//             andDangerouslyFinishTransactionAutomaticallyIOS: false, // Handle finishTransaction manually
//           });

//           // Clean up listeners (important to avoid memory leaks)
//           purchaseUpdateSubscription.remove();
//           purchaseErrorSubscription.remove();

//           return !!result;
//         }
//         return mockPurchaseProduct(productId);
//       } catch (e) {
//         console.error("Purchase failed:", e);
//         return false;
//       }
//     };

// export const restorePurchases = isExpoGo
//   ? mockRestorePurchases
//   : async () => {
//       try {
//         if (!isExpoGo) {
//           console.log("Restoring purchases...");
//           const availablePurchases = await getAvailablePurchases();
//           console.log("Available purchases:", availablePurchases);
//           return availablePurchases;
//         }
//         return mockRestorePurchases();
//       } catch (e) {
//         console.error("Failed to restore purchases:", e);
//         return [];
//       }
//     };

// export const cleanupIAP = async () => {
//   try {
//     // Use endConnection instead of platform-specific cleanup
//     await endConnection();
//   } catch (e) {
//     console.error("Failed to cleanup IAP:", e);
//   }
// };

// components/InAppPurchaseImpl.tsx
import { Platform } from "react-native";
import Constants from "expo-constants";
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  type Purchase,
  type PurchaseError,
} from "react-native-iap";

// Detect Expo Go (no native modules)
const isExpoGo = Constants.appOwnership === "expo";

/* ---------- MOCK IMPLEMENTATION (Expo Go) ---------- */
const mock = {
  initialize: async () => {
    console.log("[IAP Mock] Initialized");
    return true;
  },
  getProducts: async (skus: string[]) => {
    console.log("[IAP Mock] Fetching products:", skus);
    return skus.map((id) => ({
      productId: id,
      title: `Mock ${id}`,
      description: "Mock product for development",
      price: "$0.99",
    }));
  },
  purchase: async (sku: string) => {
    console.log("[IAP Mock] Purchasing:", sku);
    return false;
  },
  restore: async () => {
    console.log("[IAP Mock] Restoring purchases");
    return [];
  },
};

/* ---------- REAL IAP IMPLEMENTATION ---------- */
let purchaseUpdateSub: { remove: () => void } | null = null;
let purchaseErrorSub: { remove: () => void } | null = null;

export const initializePurchases = isExpoGo
  ? mock.initialize
  : async (): Promise<boolean> => {
      try {
        const result = await initConnection();
        console.log("[IAP] initConnection result:", result);
        return true;
      } catch (error) {
        console.error("[IAP] initConnection failed:", error);
        return false;
      }
    };

export const getProductsAsync = isExpoGo
  ? mock.getProducts
  : async (skus: string[]) => {
      try {
        console.log("[IAP] Fetching products:", skus);
        const products = await fetchProducts({
          skus,
          type: "in-app",
        });
        console.log("[IAP] Products loaded:", products);
        return products;
      } catch (error) {
        console.error("[IAP] fetchProducts failed:", error);
        return [];
      }
    };

export const purchaseProduct = isExpoGo
  ? mock.purchase
  : async (sku: string): Promise<boolean> => {
      // Clean old listeners
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();

      return new Promise((resolve) => {
        // Success listener
        purchaseUpdateSub = purchaseUpdatedListener(
          async (purchase: Purchase) => {
            console.log("[IAP] Purchase success:", purchase);

            try {
              // Finish transaction (consumable = true for crystals)
              await finishTransaction({
                purchase,
                isConsumable: true,
              });
              console.log("[IAP] Transaction finished");
            } catch (e) {
              console.error("[IAP] finishTransaction error:", e);
            }

            // Cleanup
            purchaseUpdateSub?.remove();
            purchaseErrorSub?.remove();
            resolve(true);
          }
        );

        // Error listener
        purchaseErrorSub = purchaseErrorListener((error: PurchaseError) => {
          console.error("[IAP] Purchase error:", error);
          purchaseUpdateSub?.remove();
          purchaseErrorSub?.remove();
          resolve(false);
        });

        // Trigger purchase
        requestPurchase({
          sku,
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
          type: Platform.OS === "ios" ? "consumable" : "in-app",
        }).catch((e) => {
          console.error("[IAP] requestPurchase failed:", e);
          purchaseUpdateSub?.remove();
          purchaseErrorSub?.remove();
          resolve(false);
        });
      });
    };

export const restorePurchases = isExpoGo
  ? mock.restore
  : async () => {
      try {
        console.log("[IAP] Restoring purchases...");
        const purchases = await getAvailablePurchases();
        console.log("[IAP] Restored purchases:", purchases);
        return purchases;
      } catch (error) {
        console.error("[IAP] restorePurchases failed:", error);
        return [];
      }
    };

export const cleanupIAP = async () => {
  purchaseUpdateSub?.remove();
  purchaseErrorSub?.remove();
  try {
    await endConnection();
    console.log("[IAP] Connection ended");
  } catch (e) {
    console.error("[IAP] endConnection error:", e);
  }
};
