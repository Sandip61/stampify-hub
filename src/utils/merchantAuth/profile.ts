
import { 
  supabase, 
  type Merchant, 
  dbMerchantToMerchant, 
  merchantToDBMerchant 
} from "@/integrations/supabase/client";

// Update merchant profile
export const updateMerchantProfile = async (
  merchantId: string,
  updates: Partial<Merchant>
): Promise<Merchant> => {
  // Convert Merchant updates to DBMerchant format
  const dbUpdates = merchantToDBMerchant(updates);
  dbUpdates.updated_at = new Date().toISOString();

  // Update merchant in Supabase
  const { data: dbMerchantData, error: merchantError } = await supabase
    .from("merchants")
    .update(dbUpdates)
    .eq("id", merchantId)
    .select()
    .single();

  if (merchantError) {
    throw new Error("Failed to update merchant profile: " + merchantError.message);
  }

  if (!dbMerchantData) {
    throw new Error("Failed to retrieve updated merchant profile");
  }

  // Convert DB merchant to frontend Merchant
  const merchantData = dbMerchantToMerchant(dbMerchantData);

  return {
    id: merchantId,
    email: merchantData.email || "",
    businessName: merchantData.businessName,
    businessLogo: merchantData.businessLogo,
    businessColor: merchantData.businessColor,
    createdAt: merchantData.createdAt,
    updatedAt: merchantData.updatedAt,
  };
};

// For demo merchants
export const initializeDemoMerchantData = async (): Promise<void> => {
  console.log("Initializing demo merchant data...");
  // In a real app with Supabase, we would have a script to seed data
  // For this demo, we'll use the existing initializeDemoMerchantData function
};

// For demo merchants
export const initializeDemoMerchantDataForLogin = (merchantId: string): void => {
  console.log("Initializing demo data for merchant:", merchantId);
  // In a real app with Supabase, this would fetch data from the database
};
