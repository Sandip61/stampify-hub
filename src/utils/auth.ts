
import { 
  supabase, 
  type Profile, 
  type DBProfile, 
  dbProfileToProfile, 
  profileToDBProfile 
} from "@/integrations/supabase/client";
import { toast } from "sonner";

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  notificationsEnabled: boolean;
}

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
  const { data: dbProfileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    // We can still proceed since the user was created
  }

  // Convert DB profile to frontend Profile if it exists
  const profileData = dbProfileData ? dbProfileToProfile(dbProfileData) : null;

  return {
    id: authData.user.id,
    email: authData.user.email || "",
    name: profileData?.name || name,
    notificationsEnabled: profileData?.notificationsEnabled || true,
  };
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
  const { data: dbProfileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    // We can still return basic user info
    return {
      id: authData.user.id,
      email: authData.user.email || "",
      name: authData.user.user_metadata.name || "",
      notificationsEnabled: true,
    };
  }

  // Convert DB profile to frontend Profile
  const profileData = dbProfileData ? dbProfileToProfile(dbProfileData) : null;

  return {
    id: authData.user.id,
    email: authData.user.email || "",
    name: profileData?.name || "",
    notificationsEnabled: profileData?.notificationsEnabled || false,
  };
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return null;
  }

  // Get the user profile
  const { data: dbProfileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    // We can still return basic user info
    return {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.user_metadata.name || "",
      notificationsEnabled: true,
    };
  }

  // Convert DB profile to frontend Profile
  const profileData = dbProfileData ? dbProfileToProfile(dbProfileData) : null;

  return {
    id: session.user.id,
    email: session.user.email || "",
    name: profileData?.name || "",
    notificationsEnabled: profileData?.notificationsEnabled || false,
  };
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast.error("Error signing out: " + error.message);
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<User> => {
  // Convert User updates to DBProfile format
  const dbUpdates = {
    name: updates.name,
    notifications_enabled: updates.notificationsEnabled,
    updated_at: new Date().toISOString(),
  };
  
  // Update profile in Supabase
  const { data: dbProfileData, error: profileError } = await supabase
    .from("profiles")
    .update(dbUpdates)
    .eq("id", userId)
    .select()
    .single();

  if (profileError) {
    throw new Error("Failed to update profile: " + profileError.message);
  }

  if (!dbProfileData) {
    throw new Error("Failed to retrieve updated profile");
  }

  // Convert DB profile to frontend Profile
  const profileData = dbProfileToProfile(dbProfileData);

  return {
    id: userId,
    email: profileData.email || "",
    name: profileData.name || "",
    notificationsEnabled: profileData.notificationsEnabled,
  };
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

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
