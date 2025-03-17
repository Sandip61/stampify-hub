
// Mock merchant data for direct access across all merchant pages
import { initializeDemoMerchantDataForLogin } from "@/utils/merchantData";

export const mockMerchant = {
  id: "demo-merchant-id",
  businessName: "Demo Business",
  email: "demo@example.com",
  businessLogo: "🏪",
  businessColor: "#3B82F6",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Initialize merchant data for the mock merchant
export const initMockMerchantData = () => {
  try {
    // Direct import instead of require
    initializeDemoMerchantDataForLogin(mockMerchant.id);
    console.log("Demo merchant data initialized for merchant", mockMerchant.id);
    return true;
  } catch (error) {
    console.error("Failed to initialize mock merchant data:", error);
    return false;
  }
};
