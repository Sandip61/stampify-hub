
import { 
  supabase, 
  type Merchant, 
  dbMerchantToMerchant, 
  merchantToDBMerchant 
} from "@/integrations/supabase/client";
import {
  AppError,
  ErrorType,
  handleSupabaseError
} from "@/utils/errorHandling";

// Get merchant profile by ID
export const getMerchantProfile = async (merchantId: string): Promise<Merchant | null> => {
  const { data: dbMerchantData, error: fetchError } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", merchantId)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching merchant profile:", fetchError);
    return null;
  }

  if (!dbMerchantData) {
    return null;
  }

  // Convert DB merchant to frontend Merchant
  return dbMerchantToMerchant(dbMerchantData);
};

// Update merchant profile
export const updateMerchantProfile = async (
  merchantId: string,
  updates: Partial<Merchant>
): Promise<Merchant> => {
  try {
    // Convert Merchant updates to DBMerchant format
    const dbUpdates = merchantToDBMerchant(updates);
    dbUpdates.updated_at = new Date().toISOString();

    // Update merchant in Supabase
    const { data: dbMerchantData, error: merchantError } = await supabase
      .from("merchants")
      .update(dbUpdates)
      .eq("id", merchantId)
      .select()
      .maybeSingle();

    if (merchantError) {
      throw handleSupabaseError(
        merchantError, 
        "updating merchant profile", 
        ErrorType.MERCHANT_UPDATE_FAILED
      );
    }

    if (!dbMerchantData) {
      throw new AppError(
        ErrorType.MERCHANT_NOT_FOUND,
        "Failed to retrieve updated merchant profile"
      );
    }

    // Convert DB merchant to frontend Merchant
    return dbMerchantToMerchant(dbMerchantData);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorType.MERCHANT_UPDATE_FAILED,
      "Failed to update merchant profile",
      error
    );
  }
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
