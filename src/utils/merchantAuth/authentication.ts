
import { 
  supabase, 
  type Merchant, 
  dbMerchantToMerchant
} from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getMerchantProfile } from "./profile";
import {
  AppError,
  ErrorType,
  handleError,
  handleSupabaseError,
  isValidEmail as validateEmail
} from "@/utils/errorHandling";
import { getCurrentUser } from "@/utils/auth";

// Validate email format
export const isValidEmail = (email: string): boolean => {
  return validateEmail(email);
};

// Check if a user is already registered as a regular user
export const isUserCustomer = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .not('id', 'eq', userId) // This is redundant but helps clarify the intention
      .maybeSingle();
      
    if (error) {
      throw handleSupabaseError(error, "checking customer status", ErrorType.UNKNOWN_ERROR);
    }
    
    // If we found a profile that doesn't have a merchant entry, it's a customer
    return !!data;
  } catch (error) {
    console.error("Error checking customer status:", error);
    return false;
  }
};

// Check if an email is already used by a customer account
export const isEmailUsedByCustomer = async (email: string): Promise<boolean> => {
  try {
    // First check if the email exists in auth.users table via profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();
      
    if (error) {
      throw handleSupabaseError(error, "checking if email is used by customer", ErrorType.UNKNOWN_ERROR);
    }
    
    return !!data;
  } catch (error) {
    console.error("Error checking if email is used by customer:", error);
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
  try {
    // Check if merchant already exists
    const { data: existingMerchant, error: existingError } = await supabase
      .from('merchants')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      throw handleSupabaseError(existingError, "checking existing merchant", ErrorType.UNKNOWN_ERROR);
    }

    if (existingMerchant) {
      throw new AppError(
        ErrorType.AUTH_EMAIL_IN_USE,
        "A merchant account with this email already exists"
      );
    }
    
    // Check if the email is already used by a customer account
    const isEmailUsed = await isEmailUsedByCustomer(email);
    if (isEmailUsed) {
      throw new AppError(
        ErrorType.AUTH_EMAIL_IN_USE,
        "This email is already registered as a customer. Please use a different email for your merchant account."
      );
    }

    // Check if there's a logged-in user that may conflict with merchant creation
    // This should happen before any registration attempts
    const currentUser = await getCurrentUser();
    if (currentUser) {
      // The user is already logged in, we need to log them out first
      throw new AppError(
        ErrorType.PERMISSION_DENIED,
        "You're currently logged in as a customer. Please log out before creating a merchant account."
      );
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
      throw handleSupabaseError(authError, "merchant registration", ErrorType.UNKNOWN_ERROR);
    }

    if (!authData.user) {
      throw new AppError(
        ErrorType.UNKNOWN_ERROR,
        "Registration failed"
      );
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
      
      // Check if this is an RLS error, which likely means the user is logged in as a customer
      if (merchantError.code === "42501" || merchantError.message?.includes("violates row-level security policy")) {
        throw new AppError(
          ErrorType.PERMISSION_DENIED,
          "You may be logged in as a customer. Please log out before creating a merchant account."
        );
      }
      
      throw handleSupabaseError(merchantError, "creating merchant profile", ErrorType.MERCHANT_UPDATE_FAILED);
    }

    // Get the created merchant profile
    const merchantProfile = await getMerchantProfile(authData.user.id);
    
    if (!merchantProfile) {
      throw new AppError(
        ErrorType.MERCHANT_NOT_FOUND,
        "Failed to retrieve merchant profile after creation"
      );
    }
    
    return merchantProfile;
  } catch (error) {
    throw handleError(error, ErrorType.UNKNOWN_ERROR, "Merchant registration failed");
  }
};

// Login a merchant
export const loginMerchant = async (
  email: string,
  password: string
): Promise<Merchant> => {
  try {
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
          throw new AppError(
            ErrorType.AUTH_EMAIL_NOT_CONFIRMED,
            `Email not confirmed. Failed to resend confirmation: ${resendError.message}`,
            resendError
          );
        }
        
        throw new AppError(
          ErrorType.AUTH_EMAIL_NOT_CONFIRMED,
          "Email not confirmed. We've sent a new confirmation email - please check your inbox and spam folder."
        );
      }
      
      throw handleSupabaseError(authError, "merchant login", ErrorType.AUTH_INVALID_CREDENTIALS);
    }

    if (!authData.user) {
      throw new AppError(
        ErrorType.UNKNOWN_ERROR,
        "Login failed"
      );
    }

    // Get the merchant profile
    const merchantProfile = await getMerchantProfile(authData.user.id);
    
    if (!merchantProfile) {
      throw new AppError(
        ErrorType.MERCHANT_NOT_FOUND,
        "Could not find merchant account. Are you sure you registered as a merchant?"
      );
    }

    return merchantProfile;
  } catch (error) {
    throw handleError(error, ErrorType.AUTH_INVALID_CREDENTIALS, "Merchant login failed");
  }
};

// Get current merchant
export const getCurrentMerchant = async (): Promise<Merchant | null> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw handleSupabaseError(sessionError, "getting merchant session", ErrorType.UNKNOWN_ERROR);
    }
    
    if (!session) {
      return null;
    }

    // Get the merchant profile using the shared function
    return getMerchantProfile(session.user.id);
  } catch (error) {
    console.error("Error getting current merchant:", error);
    return null;
  }
};

// Logout merchant
export const logoutMerchant = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw handleSupabaseError(error, "signing out merchant", ErrorType.UNKNOWN_ERROR);
    }
  } catch (error) {
    handleError(error, ErrorType.UNKNOWN_ERROR, "Error signing out");
  }
};

// Reset password
export const resetMerchantPassword = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/merchant/reset-password`,
    });

    if (error) {
      throw handleSupabaseError(error, "resetting merchant password", ErrorType.UNKNOWN_ERROR);
    }

    toast.success("Password reset email sent. Check your inbox!");
    return true;
  } catch (error) {
    throw handleError(error, ErrorType.UNKNOWN_ERROR, "Failed to reset merchant password");
  }
};
