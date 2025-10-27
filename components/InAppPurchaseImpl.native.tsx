// InAppPurchaseImpl.native.tsx
import * as InAppPurchases from "expo-in-app-purchases";

export const initializePurchases = async () => {
  try {
    // Try to connect, but handle the "already connected" error gracefully
    try {
      await InAppPurchases.connectAsync();
    } catch (error) {
      // If the error is "already connected", consider this a success
      if (error.code === "ERR_IN_APP_PURCHASES_CONNECTION") {
        console.log("IAP already connected, continuing...");
        return true;
      }
      // Otherwise, re-throw the error
      throw error;
    }
    return true;
  } catch (e) {
    console.error("Failed to initialize IAP:", e);
    return false;
  }
};

// In InAppPurchaseImpl.native.tsx, modify getProducts:
export const getProducts = async (productIds: string[]) => {
  try {
    console.log("Requesting products with IDs:", productIds);
    const { responseCode, results } = await InAppPurchases.getProductsAsync(
      productIds
    );
    console.log("Products response code:", responseCode);
    console.log("Returned products:", JSON.stringify(results, null, 2));
    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      return results;
    }
    return [];
  } catch (e) {
    console.error("Failed to get products:", e);
    return [];
  }
};
// InAppPurchaseImpl.native.tsx - Updated purchaseProduct function
export const purchaseProduct = async (productId: string) => {
  try {
    // Set up purchase listener to handle purchases
    InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        // Process successful purchases
        results.forEach(async (purchase) => {
          try {
            if (!purchase.acknowledged) {
              // Important: Finish the transaction to avoid being charged multiple times
              await InAppPurchases.finishTransactionAsync(purchase, true);
              console.log("Purchase completed and acknowledged");
            }
          } catch (e) {
            console.error("Error acknowledging purchase:", e);
          }
        });
      }
    });

    // Initiate the purchase
    const { responseCode } = await InAppPurchases.purchaseItemAsync(productId);
    return responseCode === InAppPurchases.IAPResponseCode.OK;
  } catch (e) {
    console.error("Purchase failed:", e);
    return false;
  }
};

export const restorePurchases = async () => {
  try {
    const { responseCode, results } =
      await InAppPurchases.getPurchaseHistoryAsync();
    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      return results;
    }
    return [];
  } catch (e) {
    console.error("Failed to restore purchases:", e);
    return [];
  }
};

export const validatePurchase = async (purchase, productId) => {
  try {
    // Get the receipt
    const receipt = purchase.transactionReceipt;

    // Call your server to validate the receipt
    const response = await fetch("https://your-server.com/validate-purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receipt,
        productId,
        // Include other relevant information
      }),
    });

    if (!response.ok) {
      throw new Error("Receipt validation failed");
    }

    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error("Purchase validation failed:", error);
    return false;
  }
};
