
import { supabase } from "@/integrations/supabase/client";
import { User } from "./types";
import { getUserProfile } from "./profile";
import { toast } from "sonner";
import { 
  AppError, 
  ErrorType, 
  handleError, 
  handleSupabaseError,
  isValidEmail as validateEmail
} from "@/utils/errorHandling";

// Check if a user is a merchant
export const isUserMerchant = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) throw handleSupabaseError(error, "checking merchant status", ErrorType.UNKNOWN_ERROR);
    return !!data;
  } catch (error) {
    console.error("Error checking merchant status:", error);
    return false;
  }
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  return validateEmail(email);
};

// Register a new user
export const registerUser = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  try {
    // Check if user already exists
    const { data: existingUser, error: existingError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      throw handleSupabaseError(existingError, "checking existing user", ErrorType.UNKNOWN_ERROR);
    }

    if (existingUser) {
      throw new AppError(
        ErrorType.AUTH_EMAIL_IN_USE,
        "An account with this email already exists"
      );
    }

    // Register the user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          is_merchant: false,
        },
        emailRedirectTo: `${window.location.origin}/login?confirmed=true`
      },
    });

    if (authError) {
      throw handleSupabaseError(authError, "user registration", ErrorType.UNKNOWN_ERROR);
    }

    if (!authData.user) {
      throw new AppError(
        ErrorType.UNKNOWN_ERROR,
        "Registration failed"
      );
    }

    // Get the user profile
    try {
      const profileData = await getUserProfile(authData.user.id);
      
      return {
        id: authData.user.id,
        email: authData.user.email || "",
        name: profileData?.name || name,
        notificationsEnabled: profileData?.notificationsEnabled || true,
        isMerchant: false,
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      // We can still proceed since the user was created
      return {
        id: authData.user.id,
        email: authData.user.email || "",
        name: name,
        notificationsEnabled: true,
        isMerchant: false,
      };
    }
  } catch (error) {
    throw handleError(error, ErrorType.UNKNOWN_ERROR, "Registration failed");
  }
};

// Login a user
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    // Login the user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Special handling for specific error messages
      if (authError.message.includes("Email not confirmed")) {
        // Try to resend the confirmation email
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: `${window.location.origin}/login?confirmed=true`
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
      
      throw handleSupabaseError(authError, "user login", ErrorType.AUTH_INVALID_CREDENTIALS);
    }

    if (!authData.user) {
      throw new AppError(
        ErrorType.UNKNOWN_ERROR,
        "Login failed"
      );
    }

    // Check if this is a merchant account
    const isMerchant = await isUserMerchant(authData.user.id);
    
    if (isMerchant) {
      throw new AppError(
        ErrorType.PERMISSION_DENIED,
        "This appears to be a merchant account. Please use the merchant login page."
      );
    }

    // Get the user profile
    try {
      const profileData = await getUserProfile(authData.user.id);
      
      return {
        id: authData.user.id,
        email: authData.user.email || "",
        name: profileData?.name || authData.user.user_metadata.name || "",
        notificationsEnabled: profileData?.notificationsEnabled || false,
        isMerchant: false,
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      // We can still return basic user info
      return {
        id: authData.user.id,
        email: authData.user.email || "",
        name: authData.user.user_metadata.name || "",
        notificationsEnabled: true,
        isMerchant: false,
      };
    }
  } catch (error) {
    throw handleError(error, ErrorType.AUTH_INVALID_CREDENTIALS, "Login failed");
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw handleSupabaseError(sessionError, "getting session", ErrorType.UNKNOWN_ERROR);
    }
    
    if (!session) {
      return null;
    }

    // Check if this is a merchant account
    const isMerchant = await isUserMerchant(session.user.id);
    
    // Get the user profile
    try {
      const profileData = await getUserProfile(session.user.id);
      
      return {
        id: session.user.id,
        email: session.user.email || "",
        name: profileData?.name || session.user.user_metadata.name || "",
        notificationsEnabled: profileData?.notificationsEnabled || false,
        isMerchant,
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      // We can still return basic user info
      return {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.user_metadata.name || "",
        notificationsEnabled: true,
        isMerchant,
      };
    }
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw handleSupabaseError(error, "signing out", ErrorType.UNKNOWN_ERROR);
    }
  } catch (error) {
    handleError(error, ErrorType.UNKNOWN_ERROR, "Error signing out");
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw handleSupabaseError(error, "resetting password", ErrorType.UNKNOWN_ERROR);
    }

    toast.success("Password reset email sent. Check your inbox!");
    return true;
  } catch (error) {
    throw handleError(error, ErrorType.UNKNOWN_ERROR, "Failed to reset password");
  }
};
