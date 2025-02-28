import { getCurrentMerchant } from "./merchantAuth";

// Interfaces
export interface MerchantStampCard {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  totalStamps: number;
  reward: string;
  color: string;
  logo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expiryDays?: number;
}

export interface MerchantCustomer {
  id: string;
  name: string;
  email: string;
  totalStampsEarned: number;
  totalRewardsRedeemed: number;
  joinedAt: string;
  lastActivityAt: string;
}

export interface MerchantTransaction {
  id: string;
  merchantId: string;
  customerId: string;
  cardId: string;
  type: "stamp" | "redeem";
  count?: number;
  timestamp: string;
  customerName: string;
  customerEmail: string;
  rewardCode?: string;
}

// Local storage keys
const MERCHANT_CARDS_KEY = "stampify-merchant-cards";
const MERCHANT_CUSTOMERS_KEY = "stampify-merchant-customers";
const MERCHANT_TRANSACTIONS_KEY = "stampify-merchant-transactions";

// Get all stamp cards for current merchant
export const getMerchantStampCards = (): MerchantStampCard[] => {
  try {
    const merchant = localStorage.getItem('current-merchant');
    if (!merchant) return [];
    
    const parsedMerchant = JSON.parse(merchant);
    const merchantId = parsedMerchant.id;
    
    const allCardsJson = localStorage.getItem(MERCHANT_CARDS_KEY);
    const allCards = allCardsJson ? JSON.parse(allCardsJson) : {};
    
    return allCards[merchantId] || [];
  } catch (error) {
    console.error("Error getting merchant stamp cards:", error);
    return [];
  }
};

// Get a specific stamp card
export const getMerchantStampCard = (cardId: string): MerchantStampCard | null => {
  const cards = getMerchantStampCards();
  return cards.find(card => card.id === cardId) || null;
};

// Create a new stamp card
export const createMerchantStampCard = (
  cardData: Omit<MerchantStampCard, "id" | "merchantId" | "createdAt" | "updatedAt">
): Promise<MerchantStampCard> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const merchant = localStorage.getItem('current-merchant');
        if (!merchant) {
          reject(new Error("Not authenticated"));
          return;
        }
        
        const parsedMerchant = JSON.parse(merchant);
        const merchantId = parsedMerchant.id;
        
        const now = new Date().toISOString();
        
        const newCard: MerchantStampCard = {
          ...cardData,
          id: `card-${Date.now()}`,
          merchantId: merchantId,
          createdAt: now,
          updatedAt: now
        };
        
        // Save to localStorage
        const allCardsJson = localStorage.getItem(MERCHANT_CARDS_KEY);
        const allCards = allCardsJson ? JSON.parse(allCardsJson) : {};
        
        const merchantCards = allCards[merchantId] || [];
        merchantCards.push(newCard);
        
        allCards[merchantId] = merchantCards;
        localStorage.setItem(MERCHANT_CARDS_KEY, JSON.stringify(allCards));
        
        resolve(newCard);
      } catch (error) {
        reject(error);
      }
    }, 600);
  });
};

// Update a stamp card
export const updateMerchantStampCard = (
  cardId: string,
  updates: Partial<Omit<MerchantStampCard, "id" | "merchantId" | "createdAt">>
): Promise<MerchantStampCard> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const merchant = localStorage.getItem('current-merchant');
        if (!merchant) {
          reject(new Error("Not authenticated"));
          return;
        }
        
        const parsedMerchant = JSON.parse(merchant);
        const merchantId = parsedMerchant.id;
        
        // Get all cards
        const allCardsJson = localStorage.getItem(MERCHANT_CARDS_KEY);
        const allCards = allCardsJson ? JSON.parse(allCardsJson) : {};
        
        const merchantCards = allCards[merchantId] || [];
        const cardIndex = merchantCards.findIndex((card: MerchantStampCard) => card.id === cardId);
        
        if (cardIndex === -1) {
          reject(new Error("Card not found"));
          return;
        }
        
        // Update the card
        const updatedCard = {
          ...merchantCards[cardIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        merchantCards[cardIndex] = updatedCard;
        allCards[merchantId] = merchantCards;
        
        localStorage.setItem(MERCHANT_CARDS_KEY, JSON.stringify(allCards));
        
        resolve(updatedCard);
      } catch (error) {
        reject(error);
      }
    }, 600);
  });
};

// Delete a stamp card
export const deleteMerchantStampCard = (cardId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const merchant = localStorage.getItem('current-merchant');
        if (!merchant) {
          reject(new Error("Not authenticated"));
          return;
        }
        
        const parsedMerchant = JSON.parse(merchant);
        const merchantId = parsedMerchant.id;
        
        // Get all cards
        const allCardsJson = localStorage.getItem(MERCHANT_CARDS_KEY);
        const allCards = allCardsJson ? JSON.parse(allCardsJson) : {};
        
        const merchantCards = allCards[merchantId] || [];
        const cardIndex = merchantCards.findIndex((card: MerchantStampCard) => card.id === cardId);
        
        if (cardIndex === -1) {
          reject(new Error("Card not found"));
          return;
        }
        
        // Remove the card
        merchantCards.splice(cardIndex, 1);
        allCards[merchantId] = merchantCards;
        
        localStorage.setItem(MERCHANT_CARDS_KEY, JSON.stringify(allCards));
        
        resolve(true);
      } catch (error) {
        reject(error);
      }
    }, 600);
  });
};

// Get all customers
export const getMerchantCustomers = (): MerchantCustomer[] => {
  try {
    const merchant = localStorage.getItem('current-merchant');
    if (!merchant) return [];
    
    const parsedMerchant = JSON.parse(merchant);
    const merchantId = parsedMerchant.id;
    
    const allCustomersJson = localStorage.getItem(MERCHANT_CUSTOMERS_KEY);
    const allCustomers = allCustomersJson ? JSON.parse(allCustomersJson) : {};
    
    return allCustomers[merchantId] || [];
  } catch (error) {
    console.error("Error getting merchant customers:", error);
    return [];
  }
};

// Get a specific customer
export const getMerchantCustomer = (customerId: string): MerchantCustomer | null => {
  const customers = getMerchantCustomers();
  return customers.find(customer => customer.id === customerId) || null;
};

// Get all transactions
export const getMerchantTransactions = (): MerchantTransaction[] => {
  try {
    const merchant = localStorage.getItem('current-merchant');
    if (!merchant) return [];
    
    const parsedMerchant = JSON.parse(merchant);
    const merchantId = parsedMerchant.id;
    
    const allTransactionsJson = localStorage.getItem(MERCHANT_TRANSACTIONS_KEY);
    const allTransactions = allTransactionsJson ? JSON.parse(allTransactionsJson) : {};
    
    return (allTransactions[merchantId] || []).sort((a: MerchantTransaction, b: MerchantTransaction) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error("Error getting merchant transactions:", error);
    return [];
  }
};

// Add a new transaction
export const addMerchantTransaction = (
  transaction: Omit<MerchantTransaction, "id" | "merchantId" | "timestamp">
): Promise<MerchantTransaction> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const merchant = localStorage.getItem('current-merchant');
        if (!merchant) {
          reject(new Error("Not authenticated"));
          return;
        }
        
        const parsedMerchant = JSON.parse(merchant);
        const merchantId = parsedMerchant.id;
        
        const newTransaction: MerchantTransaction = {
          ...transaction,
          id: `txn-${Date.now()}`,
          merchantId: merchantId,
          timestamp: new Date().toISOString()
        };
        
        // Save to localStorage
        const allTransactionsJson = localStorage.getItem(MERCHANT_TRANSACTIONS_KEY);
        const allTransactions = allTransactionsJson ? JSON.parse(allTransactionsJson) : {};
        
        const merchantTransactions = allTransactions[merchantId] || [];
        merchantTransactions.push(newTransaction);
        
        allTransactions[merchantId] = merchantTransactions;
        localStorage.setItem(MERCHANT_TRANSACTIONS_KEY, JSON.stringify(allTransactions));
        
        // Update customer stats
        updateCustomerStats(transaction.customerId, transaction.type);
        
        resolve(newTransaction);
      } catch (error) {
        reject(error);
      }
    }, 600);
  });
};

// Add a new customer
export const addMerchantCustomer = (
  name: string,
  email: string
): Promise<MerchantCustomer> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const merchant = localStorage.getItem('current-merchant');
        if (!merchant) {
          reject(new Error("Not authenticated"));
          return;
        }
        
        const parsedMerchant = JSON.parse(merchant);
        const merchantId = parsedMerchant.id;

        // Check if customer already exists
        const customers = getMerchantCustomers();
        if (customers.some(c => c.email.toLowerCase() === email.toLowerCase())) {
          reject(new Error("Customer with this email already exists"));
          return;
        }
        
        const now = new Date().toISOString();
        
        const newCustomer: MerchantCustomer = {
          id: `cust-${Date.now()}`,
          name,
          email,
          totalStampsEarned: 0,
          totalRewardsRedeemed: 0,
          joinedAt: now,
          lastActivityAt: now
        };
        
        // Save to localStorage
        const allCustomersJson = localStorage.getItem(MERCHANT_CUSTOMERS_KEY);
        const allCustomers = allCustomersJson ? JSON.parse(allCustomersJson) : {};
        
        const merchantCustomers = allCustomers[merchantId] || [];
        merchantCustomers.push(newCustomer);
        
        allCustomers[merchantId] = merchantCustomers;
        localStorage.setItem(MERCHANT_CUSTOMERS_KEY, JSON.stringify(allCustomers));
        
        resolve(newCustomer);
      } catch (error) {
        reject(error);
      }
    }, 600);
  });
};

// Update customer stats when transactions happen
const updateCustomerStats = (customerId: string, transactionType: "stamp" | "redeem") => {
  try {
    const merchant = localStorage.getItem('current-merchant');
    if (!merchant) return;
    
    const parsedMerchant = JSON.parse(merchant);
    const merchantId = parsedMerchant.id;
    
    const allCustomersJson = localStorage.getItem(MERCHANT_CUSTOMERS_KEY);
    const allCustomers = allCustomersJson ? JSON.parse(allCustomersJson) : {};
    
    const merchantCustomers = allCustomers[merchantId] || [];
    const customerIndex = merchantCustomers.findIndex((c: MerchantCustomer) => c.id === customerId);
    
    if (customerIndex === -1) return;
    
    const customer = merchantCustomers[customerIndex];
    
    // Update stats based on transaction type
    if (transactionType === "stamp") {
      customer.totalStampsEarned += 1;
    } else if (transactionType === "redeem") {
      customer.totalRewardsRedeemed += 1;
    }
    
    customer.lastActivityAt = new Date().toISOString();
    
    merchantCustomers[customerIndex] = customer;
    allCustomers[merchantId] = merchantCustomers;
    
    localStorage.setItem(MERCHANT_CUSTOMERS_KEY, JSON.stringify(allCustomers));
  } catch (error) {
    console.error("Error updating customer stats:", error);
  }
};

// Get analytics data
export const getMerchantAnalytics = () => {
  const transactions = getMerchantTransactions();
  const customers = getMerchantCustomers();
  const cards = getMerchantStampCards();
  
  // Calculate total stamps and redemptions
  const totalStamps = transactions.filter(t => t.type === "stamp").length;
  const totalRedemptions = transactions.filter(t => t.type === "redeem").length;
  
  // Calculate customer retention rate
  const activeCustomers = customers.filter(c => {
    const lastActivity = new Date(c.lastActivityAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastActivity >= thirtyDaysAgo;
  }).length;
  
  const retentionRate = customers.length > 0 
    ? (activeCustomers / customers.length) * 100 
    : 0;
  
  // Calculate redemption rate
  const redemptionRate = totalStamps > 0 
    ? (totalRedemptions / totalStamps) * 100 
    : 0;
  
  // Get recent transactions
  const recentTransactions = transactions.slice(0, 10);
  
  // Transaction counts by day (last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();
  
  const transactionsByDay = last7Days.map(day => {
    const dayTransactions = transactions.filter(t => 
      t.timestamp.split('T')[0] === day
    );
    
    return {
      date: day,
      stamps: dayTransactions.filter(t => t.type === "stamp").length,
      redemptions: dayTransactions.filter(t => t.type === "redeem").length
    };
  });
  
  // Transaction counts by card
  const transactionsByCard = cards.map(card => {
    const cardTransactions = transactions.filter(t => t.cardId === card.id);
    
    return {
      cardId: card.id,
      cardName: card.name,
      stamps: cardTransactions.filter(t => t.type === "stamp").length,
      redemptions: cardTransactions.filter(t => t.type === "redeem").length
    };
  });
  
  // Return analytics data structure
  return {
    totalStamps,
    totalRedemptions,
    totalCustomers: customers.length,
    activeCustomers,
    retentionRate,
    redemptionRate,
    recentTransactions,
    transactionsByDay,
    transactionsByCard
  };
};

// Initialize demo merchant data for login
export const initializeDemoMerchantDataForLogin = (merchantId: string): void => {
  console.log("Initializing demo data for merchant:", merchantId);
  localStorage.setItem('current-merchant', JSON.stringify({ id: merchantId }));
  
  // Initialize demo cards
  const allCardsJson = localStorage.getItem(MERCHANT_CARDS_KEY);
  const allCards = allCardsJson ? JSON.parse(allCardsJson) : {};
  
  if (!allCards[merchantId]) {
    const demoCards: MerchantStampCard[] = [
      {
        id: "card-1",
        merchantId,
        name: "Coffee Lovers",
        description: "Buy 9 coffees, get 1 free!",
        totalStamps: 10,
        reward: "Free Coffee of Choice",
        color: "#8B4513",
        logo: "☕",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "card-2",
        merchantId,
        name: "Breakfast Club",
        description: "Earn stamps with breakfast purchases over $10",
        totalStamps: 5,
        reward: "Free Breakfast Sandwich",
        color: "#FFA500",
        logo: "🍳",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    allCards[merchantId] = demoCards;
    localStorage.setItem(MERCHANT_CARDS_KEY, JSON.stringify(allCards));
  }
  
  // Initialize demo customers
  const allCustomersJson = localStorage.getItem(MERCHANT_CUSTOMERS_KEY);
  const allCustomers = allCustomersJson ? JSON.parse(allCustomersJson) : {};
  
  if (!allCustomers[merchantId]) {
    const now = new Date().toISOString();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const demoCustomers: MerchantCustomer[] = [
      {
        id: "cust-1",
        name: "John Smith",
        email: "john@example.com",
        totalStampsEarned: 18,
        totalRewardsRedeemed: 1,
        joinedAt: twoWeeksAgo.toISOString(),
        lastActivityAt: now
      },
      {
        id: "cust-2",
        name: "Emily Johnson",
        email: "emily@example.com",
        totalStampsEarned: 23,
        totalRewardsRedeemed: 2,
        joinedAt: twoWeeksAgo.toISOString(),
        lastActivityAt: now
      },
      {
        id: "cust-3",
        name: "Michael Brown",
        email: "michael@example.com",
        totalStampsEarned: 7,
        totalRewardsRedeemed: 0,
        joinedAt: twoWeeksAgo.toISOString(),
        lastActivityAt: twoWeeksAgo.toISOString()
      }
    ];
    
    allCustomers[merchantId] = demoCustomers;
    localStorage.setItem(MERCHANT_CUSTOMERS_KEY, JSON.stringify(allCustomers));
  }
  
  // Initialize demo transactions
  const allTransactionsJson = localStorage.getItem(MERCHANT_TRANSACTIONS_KEY);
  const allTransactions = allTransactionsJson ? JSON.parse(allTransactionsJson) : {};
  
  if (!allTransactions[merchantId]) {
    const demoTransactions: MerchantTransaction[] = [];
    
    // Generate transactions for the past 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Add random number of stamp transactions for this day
      const numTransactions = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 0; j < numTransactions; j++) {
        const customers = allCustomers[merchantId];
        const cards = allCards[merchantId];
        
        if (customers && cards) {
          const customer = customers[Math.floor(Math.random() * customers.length)];
          const card = cards[Math.floor(Math.random() * cards.length)];
          
          // Randomly decide if this is a stamp or redeem transaction (mostly stamps)
          const isRedeem = Math.random() < 0.2;
          
          demoTransactions.push({
            id: `txn-${Date.now()}-${i}-${j}`,
            merchantId,
            customerId: customer.id,
            cardId: card.id,
            type: isRedeem ? "redeem" : "stamp",
            count: isRedeem ? undefined : 1,
            timestamp: date.toISOString(),
            customerName: customer.name,
            customerEmail: customer.email,
            rewardCode: isRedeem ? "ABC123" : undefined
          });
        }
      }
    }
    
    allTransactions[merchantId] = demoTransactions;
    localStorage.setItem(MERCHANT_TRANSACTIONS_KEY, JSON.stringify(allTransactions));
  }
  
  console.log("Demo merchant data initialized for merchant", merchantId);
};

// Helper function to update customer statistics
const updateCustomerStats = (customerId: string, transactionType: "stamp" | "redeem") => {
  try {
    const merchant = localStorage.getItem('current-merchant');
    if (!merchant) return;
    
    const parsedMerchant = JSON.parse(merchant);
    const merchantId = parsedMerchant.id;
    
    const allCustomersJson = localStorage.getItem(MERCHANT_CUSTOMERS_KEY);
    const allCustomers = allCustomersJson ? JSON.parse(allCustomersJson) : {};
    
    const merchantCustomers = allCustomers[merchantId] || [];
    const customerIndex = merchantCustomers.findIndex((c: MerchantCustomer) => c.id === customerId);
    
    if (customerIndex === -1) return;
    
    const customer = merchantCustomers[customerIndex];
    
    // Update stats based on transaction type
    if (transactionType === "stamp") {
      customer.totalStampsEarned += 1;
    } else if (transactionType === "redeem") {
      customer.totalRewardsRedeemed += 1;
    }
    
    customer.lastActivityAt = new Date().toISOString();
    
    merchantCustomers[customerIndex] = customer;
    allCustomers[merchantId] = merchantCustomers;
    
    localStorage.setItem(MERCHANT_CUSTOMERS_KEY, JSON.stringify(allCustomers));
  } catch (error) {
    console.error("Error updating customer stats:", error);
  }
};

// Get analytics data
export const getMerchantAnalytics = () => {
  const transactions = getMerchantTransactions();
  const customers = getMerchantCustomers();
  const cards = getMerchantStampCards();
  
  // Calculate total stamps and redemptions
  const totalStamps = transactions.filter(t => t.type === "stamp").length;
  const totalRedemptions = transactions.filter(t => t.type === "redeem").length;
  
  // Calculate customer retention rate
  const activeCustomers = customers.filter(c => {
    const lastActivity = new Date(c.lastActivityAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastActivity >= thirtyDaysAgo;
  }).length;
  
  const retentionRate = customers.length > 0 
    ? (activeCustomers / customers.length) * 100 
    : 0;
  
  // Calculate redemption rate
  const redemptionRate = totalStamps > 0 
    ? (totalRedemptions / totalStamps) * 100 
    : 0;
  
  // Get recent transactions
  const recentTransactions = transactions.slice(0, 10);
  
  // Transaction counts by day (last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();
  
  const transactionsByDay = last7Days.map(day => {
    const dayTransactions = transactions.filter(t => 
      t.timestamp.split('T')[0] === day
    );
    
    return {
      date: day,
      stamps: dayTransactions.filter(t => t.type === "stamp").length,
      redemptions: dayTransactions.filter(t => t.type === "redeem").length
    };
  });
  
  // Transaction counts by card
  const transactionsByCard = cards.map(card => {
    const cardTransactions = transactions.filter(t => t.cardId === card.id);
    
    return {
      cardId: card.id,
      cardName: card.name,
      stamps: cardTransactions.filter(t => t.type === "stamp").length,
      redemptions: cardTransactions.filter(t => t.type === "redeem").length
    };
  });
  
  return {
    totalStamps,
    totalRedemptions,
    totalCustomers: customers.length,
    activeCustomers,
    retentionRate,
    redemptionRate,
    recentTransactions,
    transactionsByDay,
    transactionsByCard
  };
};
