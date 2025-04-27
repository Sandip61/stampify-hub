import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleSupabaseError, ErrorType } from "@/utils/errors";

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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const merchant = await getCurrentMerchant();
    if (!merchant) {
      throw new Error("No merchant session found");
    }

    const { data, error } = await supabase
      .from("stamp_cards")
      .insert({
        name: cardData.name,
        description: cardData.description,
        total_stamps: cardData.totalStamps,
        reward: cardData.reward,
        business_logo: cardData.logo,
        business_color: cardData.color,
        is_active: cardData.isActive,
        expiry_days: cardData.expiryDays,
        merchant_id: merchant.id
      })
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating stamp card:", error);
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

    const { data, error } = await supabase
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
    const { error } = await supabase
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
    const { data, error } = await supabase
      .from("stamp_transactions")
      .select(`
        *,
        profiles:customer_id(name, email)
      `)
      .order("timestamp", { ascending: false });

    if (error) throw error;

    return data.map(tx => ({
      id: tx.id,
      cardId: tx.card_id,
      customerId: tx.customer_id,
      customerName: tx.profiles?.name || "Unknown",
      customerEmail: tx.profiles?.email || "unknown@example.com",
      type: tx.type as 'stamp' | 'redeem' | 'card_created' | 'card_updated' | 'card_deactivated',
      count: tx.count,
      timestamp: tx.timestamp,
      rewardCode: tx.reward_code
    }));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

export const getMerchantCustomers = async () => {
  try {
    const { data: customerData, error: customerError } = await supabase
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

const getCurrentMerchant = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    if (!session) return null;
    
    const { data, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (merchantError) throw merchantError;
    return data;
  } catch (error) {
    console.error("Error getting current merchant:", error);
    return null;
  }
};
