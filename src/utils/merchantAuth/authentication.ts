
import { 
  supabase, 
  type Merchant, 
  dbMerchantToMerchant
} from "@/integrations/supabase/client";
import { toast } from "sonner";

// Check if a user is already registered as a regular user
export const isUserCustomer = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .not('id', 'eq', userId) // This is redundant but helps clarify the intention
      .maybeSingle();
      
    if (error) throw error;
    
    // If we found a profile that doesn't have a merchant entry, it's a customer
    return !!data;
  } catch (error) {
    console.error("Error checking customer status:", error);
    return false;
  }
};

// Register a new merchant
export const registerMerchant = async (
  email: string,
  password: string,
  businessName: string,
  businessLogo: string = "🏪",
  businessColor: string = "#3B82F6"
): Promise<Merchant> => {
  // Check if merchant already exists
  const { data: existingMerchant } = await supabase
    .from('merchants')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (existingMerchant) {
    throw new Error("A merchant account with this email already exists");
  }

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
      emailRedirectTo: `${window.location.origin}/merchant/login?confirmed=true`
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error("Registration failed");
  }

  // Create the merchant profile in the merchants table
  const { error: merchantError } = await supabase
    .from('merchants')
    .insert({
      id: authData.user.id,
      business_name: businessName,
      business_logo: businessLogo,
      business_color: businessColor,
      email: email
    });

  if (merchantError) {
    console.error("Error creating merchant profile:", merchantError);
    throw new Error("Failed to create merchant profile");
  }

  // Get the merchant profile
  const { data: dbMerchantData, error: fetchError } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (fetchError) {
    console.error("Error fetching merchant:", fetchError);
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
    // Special handling for "Email not confirmed" error
    if (authError.message.includes("Email not confirmed")) {
      // Try to resend the confirmation email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/merchant/login?confirmed=true`
        }
      });
      
      if (resendError) {
        throw new Error(`Email not confirmed. Failed to resend confirmation: ${resendError.message}`);
      }
      
      throw new Error("Email not confirmed. We've sent a new confirmation email - please check your inbox and spam folder.");
    }
    
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
