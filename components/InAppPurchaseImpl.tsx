// InAppPurchaseImpl.tsx
import Constants from "expo-constants";

// Dummy implementation for Expo Go
export const initializePurchases = async () => {
  console.log("IAP initialized (mock)");
  return true;
};

export const getProducts = async (productIds: string[]) => {
  console.log("Getting products (mock)");
  return [
    {
      id: "mock_product",
      title: "Mock Product",
      description: "This is a mock product for development",
      price: "$0.99",
    },
  ];
};

export const purchaseProduct = async (productIds: string) => {
  console.log("Purchase initiated (mock)");
  return false; // Mock failure in Expo Go
};

export const restorePurchases = async () => {
  console.log("Restoring purchases (mock)");
  return [];
};
