
import { supabase } from "@/integrations/supabase/client";
import { User } from "./types";
import { getUserProfile } from "./profile";
import { toast } from "sonner";

// Register a new user
export const registerUser = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  // Register the user with Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        is_merchant: false,
      },
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
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    // We can still proceed since the user was created
    return {
      id: authData.user.id,
      email: authData.user.email || "",
      name: name,
      notificationsEnabled: true,
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
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error("Login failed");
  }

  // Get the user profile
  try {
    const profileData = await getUserProfile(authData.user.id);
    
    return {
      id: authData.user.id,
      email: authData.user.email || "",
      name: profileData?.name || authData.user.user_metadata.name || "",
      notificationsEnabled: profileData?.notificationsEnabled || false,
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    // We can still return basic user info
    return {
      id: authData.user.id,
      email: authData.user.email || "",
      name: authData.user.user_metadata.name || "",
      notificationsEnabled: true,
    };
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return null;
  }

  // Get the user profile
  try {
    const profileData = await getUserProfile(session.user.id);
    
    return {
      id: session.user.id,
      email: session.user.email || "",
      name: profileData?.name || session.user.user_metadata.name || "",
      notificationsEnabled: profileData?.notificationsEnabled || false,
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    // We can still return basic user info
    return {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.user_metadata.name || "",
      notificationsEnabled: true,
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
