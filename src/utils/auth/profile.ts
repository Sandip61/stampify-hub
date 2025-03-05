
import { supabase, dbProfileToProfile, profileToDBProfile } from "@/integrations/supabase/client";
import { User } from "./types";

// Get user profile by ID
export const getUserProfile = async (userId: string) => {
  const { data: dbProfileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw profileError;
  }

  return dbProfileData ? dbProfileToProfile(dbProfileData) : null;
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
    isMerchant: false, // Add the missing isMerchant property
  };
};
