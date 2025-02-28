
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Merchant interface
export interface Merchant {
  id: string;
  email: string;
  businessName: string;
  businessLogo: string;
  businessColor: string;
  createdAt: string;
}

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
  const { data: merchantData, error: merchantError } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (merchantError) {
    console.error("Error fetching merchant:", merchantError);
    // We can still proceed since the user was created
  }

  return {
    id: authData.user.id,
    email: authData.user.email || "",
    businessName: merchantData?.business_name || businessName,
    businessLogo: merchantData?.business_logo || businessLogo,
    businessColor: merchantData?.business_color || businessColor,
    createdAt: merchantData?.created_at || new Date().toISOString(),
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
  const { data: merchantData, error: merchantError } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (merchantError) {
    console.error("Error fetching merchant:", merchantError);
    throw new Error("Could not find merchant account. Are you sure you registered as a merchant?");
  }

  return {
    id: authData.user.id,
    email: authData.user.email || "",
    businessName: merchantData.business_name,
    businessLogo: merchantData.business_logo,
    businessColor: merchantData.business_color,
    createdAt: merchantData.created_at,
  };
};

// Get current merchant
export const getCurrentMerchant = async (): Promise<Merchant | null> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return null;
  }

  // Get the merchant profile
  const { data: merchantData, error: merchantError } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (merchantError) {
    console.error("Error fetching merchant:", merchantError);
    return null; // Not a merchant or not found
  }

  return {
    id: session.user.id,
    email: session.user.email || "",
    businessName: merchantData.business_name,
    businessLogo: merchantData.business_logo,
    businessColor: merchantData.business_color,
    createdAt: merchantData.created_at,
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
  // Update merchant in Supabase
  const { data: merchantData, error: merchantError } = await supabase
    .from("merchants")
    .update({
      business_name: updates.businessName,
      business_logo: updates.businessLogo,
      business_color: updates.businessColor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", merchantId)
    .select()
    .single();

  if (merchantError) {
    throw new Error("Failed to update merchant profile: " + merchantError.message);
  }

  return {
    id: merchantId,
    email: merchantData.email,
    businessName: merchantData.business_name,
    businessLogo: merchantData.business_logo,
    businessColor: merchantData.business_color,
    createdAt: merchantData.created_at,
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
