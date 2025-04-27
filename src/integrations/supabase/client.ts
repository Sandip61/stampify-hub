
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  'https://ctutwgntxhpuxtfkkdiy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXR3Z250eGhwdXh0ZmtrZGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTc5NzAsImV4cCI6MjA1NjU5Mzk3MH0.0z2LAalJDYlExlM4jbMWwz1l3RZ7oPohVbHjsADT8GE'
);

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
