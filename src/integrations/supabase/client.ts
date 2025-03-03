
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ctutwgntxhpuxtfkkdiy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXR3Z250eGhwdXh0ZmtrZGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTc5NzAsImV4cCI6MjA1NjU5Mzk3MH0.0z2LAalJDYlExlM4jbMWwz1l3RZ7oPohVbHjsADT8GE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Create a custom Database type that includes our tables
export interface CustomDatabase extends Database {
  public: {
    Tables: {
      profiles: {
        Row: DBProfile;
        Insert: DBProfile;
        Update: Partial<DBProfile>;
      };
      merchants: {
        Row: DBMerchant;
        Insert: DBMerchant;
        Update: Partial<DBMerchant>;
      };
    };
    Views: Database["public"]["Views"];
    Functions: Database["public"]["Functions"];
    Enums: Database["public"]["Enums"];
    CompositeTypes: Database["public"]["CompositeTypes"];
  };
}

// Create the supabase client with our custom database type
export const supabase = createClient<CustomDatabase>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Database interfaces for internal use
export interface DBProfile {
  id: string;
  name: string | null;
  email: string | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBMerchant {
  id: string;
  business_name: string;
  business_logo: string;
  business_color: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend interfaces (camelCase)
export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Merchant {
  id: string;
  businessName: string;
  businessLogo: string;
  businessColor: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper functions to convert between DB (snake_case) and frontend (camelCase) formats
export function dbProfileToProfile(dbProfile: DBProfile): Profile {
  return {
    id: dbProfile.id,
    name: dbProfile.name,
    email: dbProfile.email,
    notificationsEnabled: dbProfile.notifications_enabled,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at
  };
}

export function dbMerchantToMerchant(dbMerchant: DBMerchant): Merchant {
  return {
    id: dbMerchant.id,
    businessName: dbMerchant.business_name,
    businessLogo: dbMerchant.business_logo,
    businessColor: dbMerchant.business_color,
    email: dbMerchant.email,
    createdAt: dbMerchant.created_at,
    updatedAt: dbMerchant.updated_at
  };
}

export function profileToDBProfile(profile: Partial<Profile>): Partial<DBProfile> {
  const result: Partial<DBProfile> = {};
  
  if (profile.name !== undefined) result.name = profile.name;
  if (profile.email !== undefined) result.email = profile.email;
  if (profile.notificationsEnabled !== undefined) result.notifications_enabled = profile.notificationsEnabled;
  if (profile.updatedAt !== undefined) result.updated_at = profile.updatedAt;
  
  return result;
}

export function merchantToDBMerchant(merchant: Partial<Merchant>): Partial<DBMerchant> {
  const result: Partial<DBMerchant> = {};
  
  if (merchant.businessName !== undefined) result.business_name = merchant.businessName;
  if (merchant.businessLogo !== undefined) result.business_logo = merchant.businessLogo;
  if (merchant.businessColor !== undefined) result.business_color = merchant.businessColor;
  if (merchant.email !== undefined) result.email = merchant.email;
  if (merchant.updatedAt !== undefined) result.updated_at = merchant.updatedAt;
  
  return result;
}
