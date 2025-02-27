
import { toast } from "sonner";

// Merchant interface
export interface Merchant {
  id: string;
  email: string;
  businessName: string;
  businessLogo: string;
  businessColor: string;
  createdAt: string;
}

// Local storage keys
const MERCHANT_KEY = "stampify-merchant";
const MERCHANTS_KEY = "stampify-merchants";

// Register a new merchant
export const registerMerchant = (
  email: string,
  password: string,
  businessName: string,
  businessLogo: string = "🏪",
  businessColor: string = "#3B82F6"
): Promise<Merchant> => {
  return new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      // Get existing merchants
      const merchantsJson = localStorage.getItem(MERCHANTS_KEY);
      const merchants = merchantsJson ? JSON.parse(merchantsJson) : {};

      // Check if email is already registered
      if (merchants[email]) {
        reject(new Error("Email already registered"));
        return;
      }

      // Create a new merchant
      const newMerchant: Merchant = {
        id: Date.now().toString(),
        email,
        businessName,
        businessLogo,
        businessColor,
        createdAt: new Date().toISOString()
      };

      // Add password to merchants object (in a real app, this would be properly hashed)
      merchants[email] = { password, merchantId: newMerchant.id };
      localStorage.setItem(MERCHANTS_KEY, JSON.stringify(merchants));

      // Store all merchants except their passwords in a merchants array
      const currentMerchants = getAllMerchants();
      currentMerchants.push(newMerchant);
      localStorage.setItem("stampify-all-merchants", JSON.stringify(currentMerchants));

      // Set current merchant
      localStorage.setItem(MERCHANT_KEY, JSON.stringify(newMerchant));

      resolve(newMerchant);
    }, 800);
  });
};

// Login a merchant
export const loginMerchant = (
  email: string,
  password: string
): Promise<Merchant> => {
  return new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      // Get existing merchants
      const merchantsJson = localStorage.getItem(MERCHANTS_KEY);
      const merchants = merchantsJson ? JSON.parse(merchantsJson) : {};

      // Check if merchant exists and password matches
      const merchant = merchants[email];
      if (!merchant || merchant.password !== password) {
        reject(new Error("Invalid email or password"));
        return;
      }

      // Get merchant from all merchants
      const allMerchantsJson = localStorage.getItem("stampify-all-merchants");
      const allMerchants = allMerchantsJson ? JSON.parse(allMerchantsJson) : [];
      const merchantData = allMerchants.find((m: Merchant) => m.id === merchant.merchantId);

      if (!merchantData) {
        reject(new Error("Merchant data not found"));
        return;
      }

      // Set current merchant
      localStorage.setItem(MERCHANT_KEY, JSON.stringify(merchantData));

      resolve(merchantData);
    }, 800);
  });
};

// Get current merchant
export const getCurrentMerchant = (): Merchant | null => {
  const merchantJson = localStorage.getItem(MERCHANT_KEY);
  if (!merchantJson) return null;
  return JSON.parse(merchantJson);
};

// Logout merchant
export const logoutMerchant = (): void => {
  localStorage.removeItem(MERCHANT_KEY);
};

// Update merchant profile
export const updateMerchantProfile = (
  merchantId: string,
  updates: Partial<Merchant>
): Promise<Merchant> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Get all merchants
      const allMerchantsJson = localStorage.getItem("stampify-all-merchants");
      const allMerchants = allMerchantsJson ? JSON.parse(allMerchantsJson) : [];
      
      // Find the merchant to update
      const merchantIndex = allMerchants.findIndex((m: Merchant) => m.id === merchantId);
      
      if (merchantIndex === -1) {
        reject(new Error("Merchant not found"));
        return;
      }
      
      // Update the merchant
      const updatedMerchant = {
        ...allMerchants[merchantIndex],
        ...updates,
      };
      
      allMerchants[merchantIndex] = updatedMerchant;
      
      // Save back to localStorage
      localStorage.setItem("stampify-all-merchants", JSON.stringify(allMerchants));
      
      // If this is the current merchant, update the current merchant as well
      const currentMerchant = getCurrentMerchant();
      if (currentMerchant && currentMerchant.id === merchantId) {
        localStorage.setItem(MERCHANT_KEY, JSON.stringify(updatedMerchant));
      }
      
      resolve(updatedMerchant);
    }, 600);
  });
};

// Reset password (simplified version)
export const resetMerchantPassword = (email: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Get existing merchants
      const merchantsJson = localStorage.getItem(MERCHANTS_KEY);
      const merchants = merchantsJson ? JSON.parse(merchantsJson) : {};
      
      // Check if merchant exists
      if (!merchants[email]) {
        reject(new Error("Email not registered"));
        return;
      }
      
      // In a real app, this would send an email with a reset link
      // Here we'll just simulate success
      toast.success("Password reset email sent. Check your inbox!");
      resolve(true);
    }, 1000);
  });
};

// Get all merchants (helper function)
const getAllMerchants = (): Merchant[] => {
  const allMerchantsJson = localStorage.getItem("stampify-all-merchants");
  return allMerchantsJson ? JSON.parse(allMerchantsJson) : [];
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Initialize demo merchant data
export const initializeDemoMerchantData = (): void => {
  const allMerchantsJson = localStorage.getItem("stampify-all-merchants");
  const allMerchants = allMerchantsJson ? JSON.parse(allMerchantsJson) : [];
  
  // Only initialize if no merchants exist
  if (allMerchants.length === 0) {
    const demoMerchants = [
      {
        id: "m1",
        email: "coffee@example.com",
        businessName: "Morning Brew Coffee",
        businessLogo: "☕",
        businessColor: "#8B4513",
        createdAt: new Date().toISOString()
      },
      {
        id: "m2",
        email: "sandwich@example.com",
        businessName: "Sandwich Heaven",
        businessLogo: "🥪",
        businessColor: "#228B22",
        createdAt: new Date().toISOString()
      }
    ];
    
    // Save demo merchants
    localStorage.setItem("stampify-all-merchants", JSON.stringify(demoMerchants));
    
    // Create merchant login credentials
    const merchantsJson = localStorage.getItem(MERCHANTS_KEY);
    const merchants = merchantsJson ? JSON.parse(merchantsJson) : {};
    
    demoMerchants.forEach(merchant => {
      merchants[merchant.email] = { 
        password: "password", 
        merchantId: merchant.id 
      };
    });
    
    localStorage.setItem(MERCHANTS_KEY, JSON.stringify(merchants));
    
    console.log("Demo merchant data initialized");
  }
};
