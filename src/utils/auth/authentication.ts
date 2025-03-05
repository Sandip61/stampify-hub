
import { supabase } from "@/integrations/supabase/client";
import { User } from "./types";
import { getUserProfile } from "./profile";
import { toast } from "sonner";

// Check if a user is a merchant
export const isUserMerchant = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Error checking merchant status:", error);
    return false;
  }
};

// Register a new user
export const registerUser = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    throw new Error("An account with this email already exists");
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
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error("Registration failed");
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
};

// Login a user
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  // Login the user with Supabase
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
          emailRedirectTo: `${window.location.origin}/login?confirmed=true`
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

  // Check if this is a merchant account
  const isMerchant = await isUserMerchant(authData.user.id);
  
  if (isMerchant) {
    throw new Error("This appears to be a merchant account. Please use the merchant login page.");
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
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
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
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast.error("Error signing out: " + error.message);
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<boolean> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }

  toast.success("Password reset email sent. Check your inbox!");
  return true;
};
