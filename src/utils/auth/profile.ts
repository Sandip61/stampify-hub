
import { customerSupabase, dbProfileToProfile, profileToDBProfile } from "@/integrations/supabase/client";
import { User } from "./types";
import {
  AppError,
  ErrorType,
  handleSupabaseError
} from "@/utils/errorHandling";

// Get user profile by ID
export const getUserProfile = async (userId: string) => {
  try {
    const { data: dbProfileData, error: profileError } = await customerSupabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw handleSupabaseError(
        profileError,
        "fetching user profile",
        ErrorType.PROFILE_NOT_FOUND
      );
    }

    return dbProfileData ? dbProfileToProfile(dbProfileData) : null;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorType.PROFILE_NOT_FOUND,
      "Failed to retrieve user profile",
      error
    );
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<User> => {
  try {
    // Convert User updates to DBProfile format
    const dbUpdates = {
      name: updates.name,
      notifications_enabled: updates.notificationsEnabled,
      updated_at: new Date().toISOString(),
    };
    
    // Update profile in Supabase
    const { data: dbProfileData, error: profileError } = await customerSupabase
      .from("profiles")
      .update(dbUpdates)
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (profileError) {
      throw handleSupabaseError(
        profileError,
        "updating user profile",
        ErrorType.PROFILE_UPDATE_FAILED
      );
    }

    if (!dbProfileData) {
      throw new AppError(
        ErrorType.PROFILE_NOT_FOUND,
        "Failed to retrieve updated profile"
      );
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
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorType.PROFILE_UPDATE_FAILED,
      "Failed to update profile",
      error
    );
  }
};
