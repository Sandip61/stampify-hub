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
  // Temporarily disable this check
  return false;
};

// Check if an email is already used by a customer account
export const isEmailUsedByCustomer = async (email: string): Promise<boolean> => {
  // Temporarily disable this check
  return false;
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
    // Important: Sign out from any existing session before creating a new account
    // This ensures we don't have session conflicts
    await supabase.auth.signOut();
    
    console.log("Starting merchant registration for:", email);

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
      console.error("Auth error during registration:", authError);
      throw handleSupabaseError(authError, "merchant registration", ErrorType.UNKNOWN_ERROR);
    }

    if (!authData.user) {
      console.error("No user returned from auth signup");
      throw new AppError(
        ErrorType.UNKNOWN_ERROR,
        "Registration failed"
      );
    }

    console.log("Auth signup successful, creating merchant profile via edge function for user:", authData.user.id);

    // Instead of direct database operations, call the create-merchant edge function
    try {
      const { data: merchantData, error: functionError } = await supabase.functions.invoke('create-merchant', {
        body: {
          id: authData.user.id,
          business_name: businessName,
          business_logo: businessLogo,
          business_color: businessColor,
          email: email
        }
      });
      
      if (functionError) {
        console.error("Error calling create-merchant function:", functionError);
        throw new AppError(
          ErrorType.MERCHANT_UPDATE_FAILED,
          "Failed to create merchant profile. Please try again later."
        );
      }
      
      if (!merchantData || !merchantData.merchant) {
        console.error("No merchant data returned from function:", merchantData);
        throw new AppError(
          ErrorType.MERCHANT_UPDATE_FAILED,
          "Failed to create merchant profile. No data returned."
        );
      }
      
      console.log("Successfully created merchant via edge function:", merchantData.merchant);
      
      // Return the merchant data from the edge function response
      return {
        id: merchantData.merchant.id,
        businessName: merchantData.merchant.business_name,
        businessLogo: merchantData.merchant.business_logo || businessLogo,
        businessColor: merchantData.merchant.business_color || businessColor,
        email: merchantData.merchant.email || email,
        createdAt: merchantData.merchant.created_at,
        updatedAt: merchantData.merchant.updated_at
      };
    } catch (error) {
      console.error("Error creating merchant profile via edge function:", error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(
        ErrorType.MERCHANT_UPDATE_FAILED,
        "Failed to create merchant profile. Please try again later."
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    throw handleError(error, ErrorType.UNKNOWN_ERROR, "Merchant registration failed");
  }
};

// Login a merchant
export const loginMerchant = async (
  email: string,
  password: string
): Promise<Merchant> => {
  try {
    // Sign out from any existing session before attempting login
    // This ensures clean authentication state
    await supabase.auth.signOut();
    
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
    // Set a flag indicating we're logging out
    sessionStorage.setItem('just_logged_out', 'true');
    
    // Clear any local storage items that might be keeping authentication state
    localStorage.removeItem('supabase.auth.token');
    
    // Try signing out, but don't throw if there's no session
    try {
      const { error } = await supabase.auth.signOut();
      if (error && !error.message.includes("session missing")) {
        console.error("Error during signOut:", error);
      }
    } catch (signOutError) {
      console.error("Sign out error caught:", signOutError);
      // Continue with the rest of logout process even if signOut fails
    }
    
    // Clear any other auth-related storage that might be persisting
    sessionStorage.removeItem('supabase.auth.expires_at');
    sessionStorage.removeItem('supabase.auth.token.created_at');
    
    // Small delay to ensure everything is cleared
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force refresh Supabase auth state
    await supabase.auth.refreshSession();

  } catch (error) {
    console.error("Error in logoutMerchant:", error);
    // Don't throw the error, just log it and let logout continue
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
