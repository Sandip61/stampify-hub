
import { merchantSupabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleSupabaseError, ErrorType } from "@/utils/errors";
import { getCurrentMerchant } from "@/utils/merchantAuth";

export interface MerchantStampCard {
  id: string;
  name: string;
  description: string;
  totalStamps: number;
  reward: string;
  logo: string;
  color: string;
  isActive: boolean;
  expiryDays?: number;
  createdAt: string;
  updatedAt: string;
  merchantId: string;
}

export interface MerchantTransaction {
  id: string;
  cardId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  type: 'stamp' | 'redeem' | 'card_created' | 'card_updated' | 'card_deactivated';
  count?: number;
  timestamp: string;
  rewardCode?: string;
}

export interface MerchantCustomer {
  id: string;
  name: string;
  email: string;
  totalStampsEarned: number;
  totalRewardsRedeemed: number;
  lastActivityAt: string;
}

export interface AnalyticsData {
  totalStamps: number;
  totalRedemptions: number;
  activeCustomers: number;
  totalCustomers: number;
  redemptionRate: number;
  retentionRate: number;
  transactionsByDay: Array<{
    date: string;
    stamps: number;
    redemptions: number;
  }>;
  transactionsByCard: Array<{
    cardId: string;
    cardName: string;
    stamps: number;
    redemptions: number;
  }>;
}

export const getMerchantStampCard = async (cardId: string) => {
  try {
    const { data, error } = await merchantSupabase
      .from("stamp_cards")
      .select("*")
      .eq("id", cardId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description || "",
      totalStamps: data.total_stamps,
      reward: data.reward,
      logo: data.business_logo || "🏪",
      color: data.business_color || "#3B82F6",
      isActive: data.is_active,
      expiryDays: data.expiry_days,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      merchantId: data.merchant_id
    };
  } catch (error) {
    console.error("Error fetching stamp card:", error);
    return null;
  }
};

export const getMerchantStampCards = async () => {
  try {
    const { data, error } = await merchantSupabase
      .from("stamp_cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map(card => ({
      id: card.id,
      name: card.name,
      description: card.description || "",
      totalStamps: card.total_stamps,
      reward: card.reward,
      logo: card.business_logo || "🏪",
      color: card.business_color || "#3B82F6",
      isActive: card.is_active,
      expiryDays: card.expiry_days,
      createdAt: card.created_at,
      updatedAt: card.updated_at,
      merchantId: card.merchant_id
    }));
  } catch (error) {
    console.error("Error fetching stamp cards:", error);
    return [];
  }
};

export const createMerchantStampCard = async (cardData: Omit<MerchantStampCard, "id" | "createdAt" | "updatedAt" | "merchantId">) => {
  try {
    console.log("=== STAMP CARD CREATION DEBUG START ===");
    console.log("Creating stamp card with data:", cardData);
    
    // Get current session and check JWT contents
    const { data: { session }, error: sessionError } = await merchantSupabase.auth.getSession();
    console.log("Current session exists:", !!session);
    console.log("Session error:", sessionError);
    
    if (sessionError || !session) {
      console.error("No valid session found");
      throw new Error("No merchant session found. Please log in again.");
    }
    
    // Log JWT metadata to see if role is set correctly (fix TypeScript error)
    console.log("User metadata:", session.user.user_metadata);
    console.log("User ID (auth.uid()):", session.user.id);
    console.log("User email:", session.user.email);
    
    // Check if user has merchant role in metadata
    const userRole = session.user.user_metadata?.role;
    const isMerchant = session.user.user_metadata?.is_merchant;
    console.log("Role from JWT metadata:", userRole);
    console.log("Is merchant from JWT metadata:", isMerchant);
    
    // Verify the user exists in merchants table
    const { data: merchantExists, error: merchantCheckError } = await merchantSupabase
      .from("merchants")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();
    
    console.log("Merchant exists in database:", !!merchantExists);
    console.log("Merchant check error:", merchantCheckError);
    
    if (!merchantExists) {
      console.error("User not found in merchants table");
      throw new Error("User is not registered as a merchant");
    }

    const insertData = {
      name: cardData.name,
      description: cardData.description,
      total_stamps: cardData.totalStamps,
      reward: cardData.reward,
      business_logo: cardData.logo,
      business_color: cardData.color,
      is_active: cardData.isActive,
      expiry_days: cardData.expiryDays,
      merchant_id: session.user.id // This should match auth.uid() in RLS policy
    };
    
    console.log("Insert data prepared:", insertData);
    console.log("merchant_id being set to:", session.user.id);
    console.log("=== ABOUT TO ATTEMPT INSERT ===");

    const { data, error } = await merchantSupabase
      .from("stamp_cards")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("=== INSERT FAILED ===");
      console.error("Database error details:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
      throw error;
    }
    
    console.log("=== INSERT SUCCESSFUL ===");
    console.log("Stamp card created successfully:", data);
    console.log("=== STAMP CARD CREATION DEBUG END ===");
    return data;
  } catch (error) {
    console.error("Error in createMerchantStampCard:", error);
    throw error;
  }
};

export const updateMerchantStampCard = async (cardId: string, cardData: Partial<Omit<MerchantStampCard, "id" | "createdAt" | "updatedAt" | "merchantId">>) => {
  try {
    const updateData: any = {};
    
    if (cardData.name !== undefined) updateData.name = cardData.name;
    if (cardData.description !== undefined) updateData.description = cardData.description;
    if (cardData.totalStamps !== undefined) updateData.total_stamps = cardData.totalStamps;
    if (cardData.reward !== undefined) updateData.reward = cardData.reward;
    if (cardData.logo !== undefined) updateData.business_logo = cardData.logo;
    if (cardData.color !== undefined) updateData.business_color = cardData.color;
    if (cardData.isActive !== undefined) updateData.is_active = cardData.isActive;
    if (cardData.expiryDays !== undefined) updateData.expiry_days = cardData.expiryDays;

    const { data, error } = await merchantSupabase
      .from("stamp_cards")
      .update(updateData)
      .eq("id", cardId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating stamp card:", error);
    throw error;
  }
};

export const deleteMerchantStampCard = async (cardId: string) => {
  try {
    const { error } = await merchantSupabase
      .from("stamp_cards")
      .delete()
      .eq("id", cardId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting stamp card:", error);
    throw error;
  }
};

export const getMerchantTransactions = async () => {
  try {
    const { data, error } = await merchantSupabase
      .from("stamp_transactions")
      .select(`
        *,
        profiles:customer_id(name, email)
      `)
      .order("timestamp", { ascending: false });

    if (error) throw error;

    return data.map(tx => {
      // Add explicit type checking and safe access for profiles data
      type ProfileData = { name?: string; email?: string } | null;
      const profileData = tx.profiles as ProfileData;
      
      return {
        id: tx.id,
        cardId: tx.card_id,
        customerId: tx.customer_id,
        customerName: profileData && typeof profileData === 'object' && 'name' in profileData ? 
          profileData.name || "Unknown" : "Unknown",
        customerEmail: profileData && typeof profileData === 'object' && 'email' in profileData ? 
          profileData.email || "unknown@example.com" : "unknown@example.com",
        type: tx.type as 'stamp' | 'redeem' | 'card_created' | 'card_updated' | 'card_deactivated',
        count: tx.count,
        timestamp: tx.timestamp,
        rewardCode: tx.reward_code
      };
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

export const getMerchantCustomers = async () => {
  try {
    const { data: customerData, error: customerError } = await merchantSupabase
      .from("profiles")
      .select("*");

    if (customerError) throw customerError;

    const customers: MerchantCustomer[] = customerData ? customerData.map(customer => ({
      id: customer.id,
      name: customer.name || "Unknown",
      email: customer.email || "unknown@example.com",
      totalStampsEarned: 0,
      totalRewardsRedeemed: 0,
      lastActivityAt: customer.updated_at || customer.created_at || new Date().toISOString()
    })) : [];
    
    return customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
};

export const addMerchantCustomer = async (name: string, email: string) => {
  try {
    toast.info("Customer addition via API not implemented yet");
    return true;
  } catch (error) {
    console.error("Error adding customer:", error);
    throw error;
  }
};

export const getMerchantAnalytics = async (): Promise<AnalyticsData> => {
  try {
    return {
      totalStamps: 0,
      totalRedemptions: 0,
      activeCustomers: 0,
      totalCustomers: 0,
      redemptionRate: 0,
      retentionRate: 0,
      transactionsByDay: [],
      transactionsByCard: []
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
};
