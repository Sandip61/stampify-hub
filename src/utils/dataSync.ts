import { supabase } from "@/integrations/supabase/client";
import { User } from "@/utils/auth/types";
import { StampCard, Transaction } from "@/utils/data";
import { toast } from "sonner";

export interface CustomerStampCard {
  id: string;
  customer_id: string;
  card_id: string;
  current_stamps: number;
  created_at: string;
  updated_at: string;
  card: {
    id: string;
    name: string;
    description: string | null;
    merchant_id: string;
    total_stamps: number;
    reward: string;
    business_logo: string | null;
    business_color: string | null;
  };
}

/**
 * Fetches all stamp cards for the current user from Supabase
 */
export const fetchUserStampCards = async (userId: string): Promise<StampCard[]> => {
  try {
    const { data: customerCards, error } = await supabase
      .from('customer_stamp_cards')
      .select(`
        id,
        card_id,
        current_stamps,
        created_at,
        card:card_id (
          id,
          name,
          merchant_id,
          total_stamps,
          reward,
          business_logo,
          business_color
        )
      `)
      .eq('customer_id', userId);

    if (error) {
      console.error("Error fetching user stamp cards:", error);
      throw new Error("Failed to fetch your loyalty cards");
    }

    if (!customerCards?.length) {
      return [];
    }

    // Transform data to match the StampCard interface
    return customerCards.map((item: any) => {
      const businessLogo = item.card?.business_logo || "🏪";
      const businessColor = item.card?.business_color || "#3B82F6";
      
      // Get merchant name by querying merchants table
      return {
        id: item.card_id,
        businessId: item.card?.merchant_id || "",
        businessName: item.card?.name.split(' ')[0] || "Business", // Temporary until we fetch business name
        businessLogo,
        totalStamps: item.card?.total_stamps || 10,
        currentStamps: item.current_stamps,
        reward: item.card?.reward || "Free Item",
        color: businessColor,
        createdAt: item.created_at
      };
    });
  } catch (error) {
    console.error("Error in fetchUserStampCards:", error);
    throw error;
  }
};

/**
 * Fetches a specific stamp card for the current user
 */
export const fetchStampCard = async (userId: string, cardId: string): Promise<StampCard | null> => {
  try {
    const { data: customerCard, error } = await supabase
      .from('customer_stamp_cards')
      .select(`
        id,
        card_id,
        current_stamps,
        created_at,
        card:card_id (
          id,
          name,
          merchant_id,
          total_stamps,
          reward,
          business_logo,
          business_color
        )
      `)
      .eq('customer_id', userId)
      .eq('card_id', cardId)
      .single();

    if (error) {
      console.error("Error fetching stamp card:", error);
      throw new Error("Failed to fetch loyalty card details");
    }

    if (!customerCard) {
      return null;
    }

    // Get merchant details
    const { data: merchant } = await supabase
      .from('merchants')
      .select('business_name, business_logo, business_color')
      .eq('id', customerCard.card.merchant_id)
      .single();

    const businessName = merchant?.business_name || customerCard.card.name.split(' ')[0] || "Business";
    const businessLogo = customerCard.card.business_logo || merchant?.business_logo || "🏪";
    const businessColor = customerCard.card.business_color || merchant?.business_color || "#3B82F6";

    // Transform data to match the StampCard interface
    return {
      id: customerCard.card_id,
      businessId: customerCard.card.merchant_id,
      businessName,
      businessLogo,
      totalStamps: customerCard.card.total_stamps,
      currentStamps: customerCard.current_stamps,
      reward: customerCard.card.reward,
      color: businessColor,
      createdAt: customerCard.created_at
    };
  } catch (error) {
    console.error("Error in fetchStampCard:", error);
    throw error;
  }
};

/**
 * Fetches all transactions for the current user
 */
export const fetchUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('stamp_transactions')
      .select(`
        id,
        type,
        count,
        reward_code,
        timestamp,
        card:card_id (
          name,
          business_logo,
          business_color
        )
      `)
      .eq('customer_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error("Error fetching user transactions:", error);
      throw new Error("Failed to fetch transaction history");
    }

    // Transform data to match the Transaction interface
    return data?.map((item: any) => {
      return {
        id: item.id,
        type: item.type,
        count: item.count,
        timestamp: item.timestamp,
        rewardCode: item.reward_code,
        businessName: item.card?.name || "Unknown Business",
        cardId: item.card_id
      };
    }) || [];
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    throw error;
  }
};

/**
 * Adds stamps to a card in Supabase
 */
export const addStampToCard = async (userId: string, cardId: string, count: number = 1): Promise<StampCard> => {
  try {
    // First, get the current stamp card
    const { data: customerCard, error: fetchError } = await supabase
      .from('customer_stamp_cards')
      .select(`
        id,
        card_id,
        current_stamps,
        card:card_id (
          total_stamps,
          merchant_id
        )
      `)
      .eq('customer_id', userId)
      .eq('card_id', cardId)
      .single();

    if (fetchError) {
      console.error("Error fetching stamp card for update:", fetchError);
      throw new Error("Failed to find loyalty card");
    }

    // Calculate new stamp count (don't exceed total stamps)
    const totalStamps = customerCard.card.total_stamps;
    const newStampCount = Math.min(customerCard.current_stamps + count, totalStamps);

    // Update the stamp count
    const { error: updateError } = await supabase
      .from('customer_stamp_cards')
      .update({ current_stamps: newStampCount, updated_at: new Date().toISOString() })
      .eq('id', customerCard.id);

    if (updateError) {
      console.error("Error updating stamp count:", updateError);
      throw new Error("Failed to update stamp count");
    }

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('stamp_transactions')
      .insert({
        customer_id: userId,
        card_id: cardId,
        merchant_id: customerCard.card.merchant_id || '00000000-0000-0000-0000-000000000000',
        type: 'stamp',
        count,
        timestamp: new Date().toISOString()
      });

    if (transactionError) {
      console.error("Error recording transaction:", transactionError);
      // Don't throw here, as the stamp was already added
    }

    // Fetch the updated card to return
    return await fetchStampCard(userId, cardId) as StampCard;
  } catch (error) {
    console.error("Error in addStampToCard:", error);
    throw error;
  }
};

/**
 * Redeems a reward from a stamp card
 */
export const redeemCardReward = async (userId: string, cardId: string): Promise<{ card: StampCard, code: string, transaction: any }> => {
  try {
    // First, get the current stamp card
    const { data: customerCard, error: fetchError } = await supabase
      .from('customer_stamp_cards')
      .select(`
        id,
        card_id,
        current_stamps,
        card:card_id (
          id,
          total_stamps,
          merchant_id,
          reward
        )
      `)
      .eq('customer_id', userId)
      .eq('card_id', cardId)
      .single();

    if (fetchError) {
      console.error("Error fetching stamp card for redemption:", fetchError);
      throw new Error("Failed to find loyalty card");
    }

    // Check if enough stamps
    if (customerCard.current_stamps < customerCard.card.total_stamps) {
      throw new Error(`Not enough stamps to redeem. You need ${customerCard.card.total_stamps - customerCard.current_stamps} more stamps.`);
    }

    // Generate redemption code
    const rewardCode = generateRedemptionCode();

    // Reset the stamp count
    const { error: updateError } = await supabase
      .from('customer_stamp_cards')
      .update({ current_stamps: 0, updated_at: new Date().toISOString() })
      .eq('id', customerCard.id);

    if (updateError) {
      console.error("Error resetting stamp count:", updateError);
      throw new Error("Failed to redeem reward");
    }

    // Record the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('stamp_transactions')
      .insert({
        customer_id: userId,
        card_id: cardId,
        merchant_id: customerCard.card.merchant_id || '00000000-0000-0000-0000-000000000000',
        type: 'redeem',
        reward_code: rewardCode,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error recording redemption:", transactionError);
      throw new Error("Failed to record redemption");
    }

    // Fetch the updated card
    const updatedCard = await fetchStampCard(userId, cardId) as StampCard;
    
    return {
      card: updatedCard,
      code: rewardCode,
      transaction
    };
  } catch (error) {
    console.error("Error in redeemCardReward:", error);
    throw error;
  }
};

// Helper function to generate a redemption code
const generateRedemptionCode = (): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};
