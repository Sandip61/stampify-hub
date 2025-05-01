import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Constants
const SUPABASE_URL = 'https://ctutwgntxhpuxtfkkdiy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXR3Z250eGhwdXh0ZmtrZGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTc5NzAsImV4cCI6MjA1NjU5Mzk3MH0.0z2LAalJDYlExlM4jbMWwz1l3RZ7oPohVbHjsADT8GE';

// Storage keys for session isolation
export const MERCHANT_STORAGE_KEY = 'supabase_merchant_auth';
export const CUSTOMER_STORAGE_KEY = 'supabase_customer_auth';

// Customer Supabase client
export const customerSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: CUSTOMER_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
    }
  }
);

// Merchant Supabase client
export const merchantSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: MERCHANT_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
    }
  }
);

// Legacy client for backward compatibility during transition
// Will be removed after full migration
export const supabase = customerSupabase;

// Define types for database tables
export interface DBProfile {
  id: string;
  name: string | null;
  email: string | null;
  notifications_enabled: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Profile {
  id: string;
  name?: string;
  email?: string;
  notificationsEnabled: boolean;
}

export interface DBMerchant {
  id: string;
  business_name: string;
  business_logo: string;
  business_color: string;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Merchant {
  id: string;
  businessName: string;
  businessLogo: string;
  businessColor: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Conversion functions for Profile
export const dbProfileToProfile = (dbProfile: DBProfile): Profile => {
  return {
    id: dbProfile.id,
    name: dbProfile.name || undefined,
    email: dbProfile.email || undefined,
    notificationsEnabled: dbProfile.notifications_enabled || false
  };
};

export const profileToDBProfile = (profile: Partial<Profile>): Partial<DBProfile> => {
  const dbProfile: Partial<DBProfile> = {};
  
  if (profile.name !== undefined) dbProfile.name = profile.name;
  if (profile.email !== undefined) dbProfile.email = profile.email;
  if (profile.notificationsEnabled !== undefined) dbProfile.notifications_enabled = profile.notificationsEnabled;
  
  return dbProfile;
};

// Conversion functions for Merchant
export const dbMerchantToMerchant = (dbMerchant: DBMerchant): Merchant => {
  return {
    id: dbMerchant.id,
    businessName: dbMerchant.business_name,
    businessLogo: dbMerchant.business_logo,
    businessColor: dbMerchant.business_color,
    email: dbMerchant.email || undefined,
    createdAt: dbMerchant.created_at || undefined,
    updatedAt: dbMerchant.updated_at || undefined
  };
};

export const merchantToDBMerchant = (merchant: Partial<Merchant>): Partial<DBMerchant> => {
  const dbMerchant: Partial<DBMerchant> = {};
  
  if (merchant.businessName !== undefined) dbMerchant.business_name = merchant.businessName;
  if (merchant.businessLogo !== undefined) dbMerchant.business_logo = merchant.businessLogo;
  if (merchant.businessColor !== undefined) dbMerchant.business_color = merchant.businessColor;
  if (merchant.email !== undefined) dbMerchant.email = merchant.email;
  
  return dbMerchant;
};

// Session expiration utility
export const isSessionExpiringSoon = (expiresAt: number | undefined): boolean => {
  if (!expiresAt) return true;
  
  // expiresAt from Supabase is in seconds, convert to milliseconds
  const expiryTime = expiresAt * 1000;
  const currentTime = Date.now();
  
  // Check if token expires in less than 60 minutes (3600000 ms)
  const sixtyMinutesInMs = 60 * 60 * 1000;
  return expiryTime - currentTime < sixtyMinutesInMs;
};

// Auth retry utility for handling 401 errors
export const withAuthRetry = async (
  supabaseClient: typeof merchantSupabase | typeof customerSupabase,
  apiCallFn: () => Promise<any>,
  redirectFn?: () => void
) => {
  try {
    // First attempt at API call
    return await apiCallFn();
  } catch (error: any) {
    // Check if it's a 401 error
    if (error?.status === 401 || error?.statusCode === 401 || (error?.message && error.message.includes('unauthorized'))) {
      console.log('Received 401, attempting token refresh...');
      
      try {
        // Try to refresh the session
        const { data, error: refreshError } = await supabaseClient.auth.refreshSession();
        
        if (refreshError || !data.session) {
          console.error('Failed to refresh session:', refreshError);
          // If redirect function provided, call it
          if (redirectFn) redirectFn();
          throw new Error('Session refresh failed');
        }
        
        // Retry the original API call with fresh token
        console.log('Session refreshed, retrying API call...');
        return await apiCallFn();
      } catch (refreshError) {
        console.error('Error during auth retry:', refreshError);
        // If redirect function provided, call it
        if (redirectFn) redirectFn();
        throw error; // Re-throw the original error
      }
    }
    
    // If it's not a 401 error, just re-throw
    throw error;
  }
};

// Role types for the application
export enum UserRole {
  CUSTOMER = 'customer',
  MERCHANT = 'merchant',
}
