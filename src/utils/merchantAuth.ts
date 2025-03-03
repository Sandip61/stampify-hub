
import { 
  supabase, 
  type Merchant, 
  type DBMerchant, 
  dbMerchantToMerchant, 
  merchantToDBMerchant 
} from "@/integrations/supabase/client";
import { toast } from "sonner";

// Re-export the Merchant type from client.ts
export type { Merchant };

// Register a new merchant
export const registerMerchant = async (
  email: string,
  password: string,
  businessName: string,
  businessLogo: string = "🏪",
  businessColor: string = "#3B82F6"
): Promise<Merchant> => {
  // Register the merchant with Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        business_name: businessName,
        business_logo: businessLogo,
        business_color: businessColor,
        is_merchant: true,
      },
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error("Registration failed");
  }

  // Get the merchant profile
  const { data: dbMerchantData, error: merchantError } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (merchantError) {
    console.error("Error fetching merchant:", merchantError);
    // We can still proceed since the user was created
  }

  // Convert DB merchant to frontend Merchant if it exists
  const merchantData = dbMerchantData ? dbMerchantToMerchant(dbMerchantData) : null;

  return {
    id: authData.user.id,
    email: authData.user.email || "",
    businessName: merchantData?.businessName || businessName,
    businessLogo: merchantData?.businessLogo || businessLogo,
    businessColor: merchantData?.businessColor || businessColor,
    createdAt: merchantData?.createdAt || new Date().toISOString(),
    updatedAt: merchantData?.updatedAt || new Date().toISOString(),
  };
};

// Login a merchant
export const loginMerchant = async (
  email: string,
  password: string
): Promise<Merchant> => {
  // Login the merchant with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error("Login failed");
  }

  // Get the merchant profile
  const { data: dbMerchantData, error: merchantError } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (merchantError) {
    console.error("Error fetching merchant:", merchantError);
    throw new Error("Could not find merchant account. Are you sure you registered as a merchant?");
  }

  if (!dbMerchantData) {
    throw new Error("Could not find merchant account");
  }

  // Convert DB merchant to frontend Merchant
  const merchantData = dbMerchantToMerchant(dbMerchantData);

  return {
    id: authData.user.id,
    email: authData.user.email || "",
    businessName: merchantData.businessName,
    businessLogo: merchantData.businessLogo,
    businessColor: merchantData.businessColor,
    createdAt: merchantData.createdAt,
    updatedAt: merchantData.updatedAt,
  };
};

// Get current merchant
export const getCurrentMerchant = async (): Promise<Merchant | null> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return null;
  }

  // Get the merchant profile
  const { data: dbMerchantData, error: merchantError } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (merchantError) {
    console.error("Error fetching merchant:", merchantError);
    return null; // Not a merchant or not found
  }

  if (!dbMerchantData) {
    return null;
  }

  // Convert DB merchant to frontend Merchant
  const merchantData = dbMerchantToMerchant(dbMerchantData);

  return {
    id: session.user.id,
    email: session.user.email || "",
    businessName: merchantData.businessName,
    businessLogo: merchantData.businessLogo,
    businessColor: merchantData.businessColor,
    createdAt: merchantData.createdAt,
    updatedAt: merchantData.updatedAt,
  };
};

// Logout merchant
export const logoutMerchant = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast.error("Error signing out: " + error.message);
  }
};

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

// Reset password
export const resetMerchantPassword = async (email: string): Promise<boolean> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/merchant/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }

  toast.success("Password reset email sent. Check your inbox!");
  return true;
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Initialize demo merchant data (for development only)
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
