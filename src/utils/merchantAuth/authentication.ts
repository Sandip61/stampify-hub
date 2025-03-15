
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

    console.log("Auth signup successful, creating merchant profile for:", authData.user.id);

    // Create the merchant profile using direct API call to our Edge Function
    try {
      // First, create the user record to prevent foreign key constraint failures
      const { error: userInsertError } = await supabase
        .from('users')
        .upsert({ id: authData.user.id })
      
      if (userInsertError) {
        console.warn("Could not create users record directly:", userInsertError);
        // Continue with edge function which will retry this
      } else {
        console.log("Created users record directly");
      }
      
      // Call the edge function (with full URL to work around 404 issues)
      const response = await fetch(`${window.location.origin}/functions/create-merchant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: authData.user.id,
          business_name: businessName,
          business_logo: businessLogo,
          business_color: businessColor,
          email: email
        })
      });
      
      if (!response.ok) {
        let errorData;
        let errorMessage = "Failed to create merchant profile.";
        
        try {
          const responseText = await response.text();
          console.log("Error response text:", responseText);
          
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
              console.error("Error from create-merchant endpoint:", errorData);
              errorMessage = errorData.error || errorMessage;
            } catch (jsonError) {
              console.error("Error parsing JSON from response:", jsonError);
              errorMessage += " Invalid response format.";
            }
          } else {
            console.error("Empty response from create-merchant endpoint");
            errorMessage += " Empty response from server.";
          }
        } catch (textError) {
          console.error("Error reading response text:", textError);
          errorMessage += " Could not read response.";
        }
        
        // Despite the error, try direct database insert as a fallback
        console.log("Trying direct database insert as fallback");
        const { error: merchantError } = await supabase
          .from('merchants')
          .upsert({
            id: authData.user.id,
            business_name: businessName,
            business_logo: businessLogo,
            business_color: businessColor,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (merchantError) {
          console.error("Direct database insert also failed:", merchantError);
          throw new AppError(
            ErrorType.MERCHANT_UPDATE_FAILED,
            errorMessage
          );
        } else {
          console.log("Direct database insert succeeded!");
          // Continue execution without throwing an error
        }
      }
      
      // Parse the response data if we got a successful response
      let responseData;
      try {
        if (response.ok && response.status !== 204) {
          const responseText = await response.text();
          if (responseText) {
            responseData = JSON.parse(responseText);
          }
        }
      } catch (jsonError) {
        console.error("Error parsing successful response from create-merchant endpoint:", jsonError);
        // Continue without the response data, we'll fall back to getting the profile
      }
      
      if (responseData?.merchant) {
        return dbMerchantToMerchant(responseData.merchant);
      }
    } catch (edgeFunctionError) {
      console.error("Edge function error:", edgeFunctionError);
      
      // Try direct insert now
      console.log("Trying direct insert after edge function error");
      
      // First sign in to ensure we have a valid session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        console.error("Sign-in failed:", signInError);
        throw new AppError(
          ErrorType.AUTH_INVALID_CREDENTIALS,
          "Authentication failed after registration. Please try logging in directly."
        );
      }
      
      // Try to create the user record first
      const { error: userError } = await supabase
        .from('users')
        .upsert({ id: authData.user.id });
      
      if (userError) {
        console.error("Error creating user record:", userError);
      } else {
        console.log("Successfully created user record");
      }
      
      // Now try to create the merchant
      const { error: merchantError } = await supabase
        .from('merchants')
        .upsert({
          id: authData.user.id,
          business_name: businessName,
          business_logo: businessLogo,
          business_color: businessColor,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (merchantError) {
        console.error("Error creating merchant after sign-in:", merchantError);
        throw new AppError(
          ErrorType.MERCHANT_UPDATE_FAILED,
          "Failed to create merchant profile. Please try again later."
        );
      }
      
      console.log("Successfully created merchant directly");
    }

    // Wait a short time to allow database operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the created merchant profile
    const merchantProfile = await getMerchantProfile(authData.user.id);
    
    if (!merchantProfile) {
      console.log("No merchant profile found, creating a temporary one");
      // Return a temporary merchant profile
      return {
        id: authData.user.id,
        businessName: businessName,
        businessLogo: businessLogo,
        businessColor: businessColor,
        email: email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    console.log("Merchant registration completed successfully");
    return merchantProfile;
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
