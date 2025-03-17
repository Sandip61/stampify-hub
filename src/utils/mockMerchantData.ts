
// Mock merchant data for direct access across all merchant pages
export const mockMerchant = {
  id: "demo-merchant-id",
  businessName: "Demo Business",
  email: "demo@example.com",
  businessLogo: "🏪",
  businessColor: "#3B82F6"
};

// Initialize merchant data for the mock merchant
export const initMockMerchantData = () => {
  try {
    const { initializeDemoMerchantDataForLogin } = require('./merchantData');
    initializeDemoMerchantDataForLogin(mockMerchant.id);
    return true;
  } catch (error) {
    console.error("Failed to initialize mock merchant data:", error);
    return false;
  }
};
