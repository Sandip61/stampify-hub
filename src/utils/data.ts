
import { getCurrentUser } from "./auth";

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
  userId: string;
  cardId: string;
  businessName: string;
  type: "stamp" | "redeem";
  count?: number;
  timestamp: string;
  rewardCode?: string;
}

// Local storage keys
const STAMP_CARDS_KEY = "stampify-stamp-cards";
const TRANSACTIONS_KEY = "stampify-transactions";
const BUSINESSES_KEY = "stampify-businesses";

// Demo businesses
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

// Initialize demo data
export const initializeDemoData = async (): Promise<void> => {
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
    const demoCards: StampCard[] = demoBusiness.map((business, index) => ({
      id: `card-${index}`,
      businessId: business.id,
      businessName: business.name,
      businessLogo: business.logo,
      totalStamps: 10,
      currentStamps: index === 0 ? 10 : index === 1 ? 6 : index, // First card complete, second halfway, others as index
      reward: generateReward(business.name, index),
      color: business.color,
      createdAt: getRandomPastDate(30).toISOString() // Within last 30 days
    }));
    
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

// Helper function to generate a reward based on the business name
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

// Helper function to generate a random date in the past
function getRandomPastDate(maxDaysAgo: number): Date {
  const date = new Date();
  const daysAgo = Math.floor(Math.random() * maxDaysAgo);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

// Get all stamp cards for the current user
export const getUserStampCards = async (): Promise<StampCard[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  
  const allCardsJson = localStorage.getItem(STAMP_CARDS_KEY);
  const allCards = allCardsJson ? JSON.parse(allCardsJson) : {};
  
  return allCards[user.id] || [];
};

// Get a specific stamp card by ID
export const getStampCard = async (cardId: string): Promise<StampCard | null> => {
  const cards = await getUserStampCards();
  return cards.find(card => card.id === cardId) || null;
};

// Add a stamp to a card
export const addStamp = async (cardId: string, count: number = 1): Promise<StampCard> => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        reject(new Error("User not logged in"));
        return;
      }
      
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
      
      // Record transaction
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
    } catch (error) {
      reject(error);
    }
  });
};

// Redeem a reward
export const redeemReward = async (cardId: string): Promise<{ card: StampCard, code: string, transaction: Transaction }> => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        reject(new Error("User not logged in"));
        return;
      }
      
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
    } catch (error) {
      reject(error);
    }
  });
};

// Get all transactions for the current user
export const getUserTransactions = async (): Promise<Transaction[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  
  const allTransactionsJson = localStorage.getItem(TRANSACTIONS_KEY);
  const allTransactions = allTransactionsJson ? JSON.parse(allTransactionsJson) : {};
  
  return (allTransactions[user.id] || []).sort((a: Transaction, b: Transaction) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
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
