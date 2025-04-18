
// Mock merchant data for direct access across all merchant pages

export const mockMerchant = {
  id: "demo-merchant-id",
  businessName: "Demo Business",
  email: "demo@example.com",
  businessLogo: "🏪",
  businessColor: "#3B82F6",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// No longer needed, as we're using Supabase directly
export const initMockMerchantData = () => {
  console.log("Mock initialization is deprecated. Using Supabase directly.");
  return true;
};
