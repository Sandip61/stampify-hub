import { getCurrentUser } from "./auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  fetchUserStampCards, 
  fetchStampCard, 
  fetchUserTransactions, 
  addStampToCard, 
  redeemCardReward 
} from "./dataSync";

// Type definitions
export interface StampCard {
  id: string;
  businessId: string;
  businessName: string;
  businessLogo: string;
  totalStamps: number;
  currentStamps: number;
  reward: string;
  color: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  logo: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: 'stamp' | 'reward' | 'redeem';
  timestamp: string;
  businessName: string;
  count?: number;
  rewardCode?: string;
}

// Local storage keys (kept for backward compatibility)
const STAMP_CARDS_KEY = "stampify-stamp-cards";
const TRANSACTIONS_KEY = "stampify-transactions";
const BUSINESSES_KEY = "stampify-businesses";

// Demo businesses (kept for backward compatibility)
const demoBusiness: Business[] = [
  {
    id: "b1",
    name: "Morning Brew Coffee",
    logo: "☕",
    color: "#8B4513"
  },
  {
    id: "b2",
    name: "Sandwich Heaven",
    logo: "🥪",
    color: "#228B22"
  },
  {
    id: "b3",
    name: "Smoothie Paradise",
    logo: "🥤",
    color: "#FF6347"
  },
  {
    id: "b4",
    name: "Pizza Palace",
    logo: "🍕",
    color: "#B22222"
  },
  {
    id: "b5",
    name: "Bakery Delight",
    logo: "🥐",
    color: "#9B870C" 
  },
  {
    id: "b6",
    name: "Sushi Master",
    logo: "🍣",
    color: "#2E8B57"
  }
];

// Initialize demo data (kept for backward compatibility but marked as deprecated)
/**
 * @deprecated This method uses localStorage for demo data. 
 * Use generateDummyData() from utils/generateDummyData.ts instead,
 * which creates data in the Supabase database.
 */
export const initializeDemoData = async (): Promise<void> => {
  console.warn("initializeDemoData() is deprecated. Use generateDummyData() instead which creates data in Supabase");
  
  // Check if businesses exist
  if (!localStorage.getItem(BUSINESSES_KEY)) {
    localStorage.setItem(BUSINESSES_KEY, JSON.stringify(demoBusiness));
  }

  const user = await getCurrentUser();
  if (!user) return;

  // Check if user has stamp cards
  const allCardsJson = localStorage.getItem(STAMP_CARDS_KEY);
  const allCards = allCardsJson ? JSON.parse(allCardsJson) : {};
  
  // If user doesn't have cards, create demo cards
  if (!allCards[user.id]) {
    // Create demoCards array with two Morning Brew Coffee cards
    const demoCards: StampCard[] = [
      // First Morning Brew Coffee card (complete)
      {
        id: "card-0",
        businessId: demoBusiness[0].id,
        businessName: demoBusiness[0].name,
        businessLogo: demoBusiness[0].logo,
        totalStamps: 10,
        currentStamps: 10,
        reward: "Free Coffee",
        color: demoBusiness[0].color,
        createdAt: getRandomPastDate(30).toISOString()
      },
      // Second Morning Brew Coffee card (halfway)
      {
        id: "card-special",
        businessId: demoBusiness[0].id,
        businessName: demoBusiness[0].name,
        businessLogo: demoBusiness[0].logo,
        totalStamps: 8,
        currentStamps: 4,
        reward: "Free Specialty Coffee",
        color: demoBusiness[0].color,
        createdAt: getRandomPastDate(15).toISOString()
      }
    ];
    
    // Add the rest of the businesses' cards
    for (let i = 1; i < demoBusiness.length; i++) {
      demoCards.push({
        id: `card-${i}`,
        businessId: demoBusiness[i].id,
        businessName: demoBusiness[i].name,
        businessLogo: demoBusiness[i].logo,
        totalStamps: 10,
        currentStamps: i === 1 ? 6 : i, // Second card halfway, others as index
        reward: generateReward(demoBusiness[i].name, i),
        color: demoBusiness[i].color,
        createdAt: getRandomPastDate(30).toISOString()
      });
    }
    
    allCards[user.id] = demoCards;
    localStorage.setItem(STAMP_CARDS_KEY, JSON.stringify(allCards));
    
    // Create some demo transactions
    const allTransactionsJson = localStorage.getItem(TRANSACTIONS_KEY);
    const allTransactions = allTransactionsJson ? JSON.parse(allTransactionsJson) : {};
    
    const demoTransactions: Transaction[] = [];
    
    // Add stamp transactions for each card
    demoCards.forEach(card => {
      for (let i = 0; i < card.currentStamps; i++) {
        // Create a date in the past, with more recent dates for higher stamp counts
        const daysAgo = card.currentStamps - i;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        demoTransactions.push({
          id: `tr-${Date.now()}-${i}-${card.id}`,
          userId: user.id,
          cardId: card.id,
          businessName: card.businessName,
          type: "stamp",
          count: 1,
          timestamp: date.toISOString()
        });
      }
      
      // Add redemption transactions for completed cards
      if (card.currentStamps >= card.totalStamps) {
        const redeemDate = new Date();
        redeemDate.setDate(redeemDate.getDate() - 1); // Redeemed yesterday
        
        demoTransactions.push({
          id: `tr-redeem-${Date.now()}-${card.id}`,
          userId: user.id,
          cardId: card.id,
          businessName: card.businessName,
          type: "redeem",
          timestamp: redeemDate.toISOString(),
          rewardCode: generateRedemptionCode()
        });
      }
    });
    
    allTransactions[user.id] = demoTransactions;
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(allTransactions));
  }
};

// Helper function to generate a reward based on the business name (kept for backward compatibility)
function generateReward(businessName: string, index: number): string {
  const rewards = [
    `Free ${businessName} Signature Item`,
    `50% Off Your Next Purchase`,
    `Buy One Get One Free`,
    `Free Upgrade to Large`,
    `Complimentary Dessert`,
    `$5 Off Your Next Purchase`
  ];
  
  return rewards[index % rewards.length];
}

// Helper function to generate a random date in the past (kept for backward compatibility)
function getRandomPastDate(maxDaysAgo: number): Date {
  const date = new Date();
  const daysAgo = Math.floor(Math.random() * maxDaysAgo);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Get all stamp cards for the current user
 * Now uses Supabase as the data source
 */
export const getUserStampCards = async (): Promise<StampCard[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    
    // Try to fetch from Supabase first
    try {
      const cards = await fetchUserStampCards(user.id);
      return cards;
    } catch (error) {
      console.error("Error fetching from Supabase, falling back to localStorage:", error);
      toast.error("Could not connect to server, using local data");
      
      // Fall back to localStorage if Supabase fails
      const allCardsJson = localStorage.getItem(STAMP_CARDS_KEY);
      const allCards = allCardsJson ? JSON.parse(allCardsJson) : {};
      return allCards[user.id] || [];
    }
  } catch (error) {
    console.error("Error in getUserStampCards:", error);
    return [];
  }
};

/**
 * Get a specific stamp card by ID
 * Now uses Supabase as the data source
 */
export const getStampCard = async (cardId: string): Promise<StampCard | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    
    // Try to fetch from Supabase first
    try {
      const card = await fetchStampCard(user.id, cardId);
      return card;
    } catch (error) {
      console.error("Error fetching card from Supabase, falling back to localStorage:", error);
      
      // Fall back to localStorage if Supabase fails
      const cards = await getUserStampCards();
      return cards.find(card => card.id === cardId) || null;
    }
  } catch (error) {
    console.error("Error in getStampCard:", error);
    return null;
  }
};

/**
 * Add a stamp to a card
 * Now uses Supabase as the data source
 */
export const addStamp = async (cardId: string, count: number = 1): Promise<StampCard> => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        reject(new Error("User not logged in"));
        return;
      }
      
      // Try to update in Supabase first
      try {
        const updatedCard = await addStampToCard(user.id, cardId, count);
        toast.success("Stamp added successfully");
        resolve(updatedCard);
        return;
      } catch (error) {
        console.error("Error updating in Supabase, falling back to localStorage:", error);
        toast.error("Could not connect to server, updating locally");
        
        // Fall back to localStorage if Supabase fails
        const allCardsJson = localStorage.getItem(STAMP_CARDS_KEY);
        const allCards = allCardsJson ? JSON.parse(allCardsJson) : {};
        
        const userCards = allCards[user.id] || [];
        const cardIndex = userCards.findIndex((card: StampCard) => card.id === cardId);
        
        if (cardIndex === -1) {
          reject(new Error("Card not found"));
          return;
        }
        
        const card = userCards[cardIndex];
        const updatedCard = {
          ...card,
          currentStamps: Math.min(card.currentStamps + count, card.totalStamps)
        };
        
        userCards[cardIndex] = updatedCard;
        allCards[user.id] = userCards;
        
        localStorage.setItem(STAMP_CARDS_KEY, JSON.stringify(allCards));
        
        // Record transaction in localStorage
        const allTransactionsJson = localStorage.getItem(TRANSACTIONS_KEY);
        const allTransactions = allTransactionsJson ? JSON.parse(allTransactionsJson) : {};
        
        const userTransactions = allTransactions[user.id] || [];
        userTransactions.push({
          id: `tr-${Date.now()}`,
          userId: user.id,
          cardId: updatedCard.id,
          businessName: updatedCard.businessName,
          type: "stamp",
          count,
          timestamp: new Date().toISOString()
        });
        
        allTransactions[user.id] = userTransactions;
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(allTransactions));
        
        // Simulate network delay
        setTimeout(() => resolve(updatedCard), 600);
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Redeem a reward
 * Now uses Supabase as the data source
 */
export const redeemReward = async (cardId: string): Promise<{ card: StampCard, code: string, transaction: Transaction }> => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        reject(new Error("User not logged in"));
        return;
      }
      
      // Try to redeem in Supabase first
      try {
        const result = await redeemCardReward(user.id, cardId);
        toast.success("Reward redeemed successfully");
        
        // Convert transaction to expected format
        const transactionData: Transaction = {
          id: result.transaction.id,
          cardId: result.transaction.card_id,
          businessName: result.card.businessName,
          type: "redeem",
          timestamp: result.transaction.timestamp,
          rewardCode: result.code
        };
        
        resolve({
          card: result.card,
          code: result.code,
          transaction: transactionData
        });
        return;
      } catch (error) {
        console.error("Error redeeming in Supabase, falling back to localStorage:", error);
        toast.error("Could not connect to server, updating locally");
        
        // Fall back to localStorage if Supabase fails
        const allCardsJson = localStorage.getItem(STAMP_CARDS_KEY);
        const allCards = allCardsJson ? JSON.parse(allCardsJson) : {};
        
        const userCards = allCards[user.id] || [];
        const cardIndex = userCards.findIndex((card: StampCard) => card.id === cardId);
        
        if (cardIndex === -1) {
          reject(new Error("Card not found"));
          return;
        }
        
        const card = userCards[cardIndex];
        
        if (card.currentStamps < card.totalStamps) {
          reject(new Error("Not enough stamps to redeem"));
          return;
        }
        
        // Generate redemption code
        const rewardCode = generateRedemptionCode();
        
        // Reset the card
        const updatedCard = {
          ...card,
          currentStamps: 0
        };
        
        userCards[cardIndex] = updatedCard;
        allCards[user.id] = userCards;
        
        localStorage.setItem(STAMP_CARDS_KEY, JSON.stringify(allCards));
        
        // Record transaction
        const allTransactionsJson = localStorage.getItem(TRANSACTIONS_KEY);
        const allTransactions = allTransactionsJson ? JSON.parse(allTransactionsJson) : {};
        
        const userTransactions = allTransactions[user.id] || [];
        const transaction: Transaction = {
          id: `tr-${Date.now()}`,
          userId: user.id,
          cardId: updatedCard.id,
          businessName: updatedCard.businessName,
          type: "redeem",
          timestamp: new Date().toISOString(),
          rewardCode
        };
        
        userTransactions.push(transaction);
        allTransactions[user.id] = userTransactions;
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(allTransactions));
        
        // Simulate network delay
        setTimeout(() => resolve({ card: updatedCard, code: rewardCode, transaction }), 800);
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get all transactions for the current user
 * Now uses Supabase as the data source
 */
export const getUserTransactions = async (): Promise<Transaction[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    
    // Try to fetch from Supabase first
    try {
      const transactions = await fetchUserTransactions(user.id);
      return transactions;
    } catch (error) {
      console.error("Error fetching transactions from Supabase, falling back to localStorage:", error);
      toast.error("Could not connect to server, using local data");
      
      // Fall back to localStorage if Supabase fails
      const allTransactionsJson = localStorage.getItem(TRANSACTIONS_KEY);
      const allTransactions = allTransactionsJson ? JSON.parse(allTransactionsJson) : {};
      
      return (allTransactions[user.id] || []).sort((a: Transaction, b: Transaction) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
  } catch (error) {
    console.error("Error in getUserTransactions:", error);
    return [];
  }
};

// Helper function to generate a redemption code (kept for backward compatibility)
const generateRedemptionCode = (): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};
