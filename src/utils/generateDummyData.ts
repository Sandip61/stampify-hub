
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

/**
 * Generate dummy data for the application
 * This is for development and demonstration purposes only
 */
export const generateDummyData = async () => {
  try {
    // Check if we've already generated dummy data
    const { data: existingData, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "test_customer@example.com")
      .limit(1);
      
    if (checkError) {
      console.error("Error checking for existing dummy data:", checkError);
      throw new Error("Failed to check for existing dummy data");
    }
    
    // If we've already generated dummy data, don't do it again
    if (existingData && existingData.length > 0) {
      console.log("Dummy data already exists");
      toast.info("Dummy data already exists in the database");
      return;
    }
    
    toast.info("Generating dummy data...");
    
    // Generate dummy merchants
    const merchantsData = [
      {
        id: uuidv4(),
        business_name: "Coffee Haven",
        business_logo: "☕",
        business_color: "#8B4513",
        email: "coffee_haven@example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        business_name: "Pizza Paradise",
        business_logo: "🍕",
        business_color: "#FF4500",
        email: "pizza_paradise@example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        business_name: "Smoothie Station",
        business_logo: "🥤",
        business_color: "#2E8B57",
        email: "smoothie_station@example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Insert merchants
    const { error: merchantError } = await supabase
      .from("merchants")
      .insert(merchantsData);
      
    if (merchantError) {
      console.error("Error inserting merchants:", merchantError);
      throw new Error("Failed to insert merchants");
    }
    
    // Generate dummy test customer
    const customerId = uuidv4();
    const { error: customerError } = await supabase
      .from("profiles")
      .insert({
        id: customerId,
        name: "Test Customer",
        email: "test_customer@example.com",
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (customerError) {
      console.error("Error inserting customer:", customerError);
      throw new Error("Failed to insert customer");
    }
    
    // Generate stamp cards for each merchant
    const stampCardsData = merchantsData.map((merchant, index) => {
      return {
        id: uuidv4(),
        name: index === 0 ? "Coffee Loyalty Card" : 
              index === 1 ? "Pizza Lover Card" : "Smoothie Rewards",
        description: index === 0 ? "Collect stamps with every coffee purchase" : 
                    index === 1 ? "Get rewarded for your pizza addiction" : 
                    "Stay healthy and get rewarded",
        merchant_id: merchant.id,
        total_stamps: index === 0 ? 8 : index === 1 ? 10 : 6,
        reward: index === 0 ? "Free Coffee" : 
               index === 1 ? "Free Medium Pizza" : "Free Large Smoothie",
        business_logo: merchant.business_logo,
        business_color: merchant.business_color,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    // Insert stamp cards
    const { error: stampCardsError, data: insertedCards } = await supabase
      .from("stamp_cards")
      .insert(stampCardsData)
      .select();
      
    if (stampCardsError) {
      console.error("Error inserting stamp cards:", stampCardsError);
      throw new Error("Failed to insert stamp cards");
    }
    
    // Assign stamp cards to customer
    if (insertedCards) {
      const customerStampCardsData = insertedCards.map((card, index) => {
        // Give different number of stamps to each card
        return {
          id: uuidv4(),
          customer_id: customerId,
          card_id: card.id,
          current_stamps: index === 0 ? 6 : // Almost complete for coffee shop
                          index === 1 ? 3 : // In progress for pizza shop
                          0, // Just started for smoothie shop
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      // Insert customer stamp cards
      const { error: customerStampCardsError } = await supabase
        .from("customer_stamp_cards")
        .insert(customerStampCardsData);
        
      if (customerStampCardsError) {
        console.error("Error inserting customer stamp cards:", customerStampCardsError);
        throw new Error("Failed to insert customer stamp cards");
      }
      
      // Generate transactions for the customer
      const transactionsData = [];
      
      // Coffee shop transactions
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i)); // Transactions over the past 6 days
        
        transactionsData.push({
          id: uuidv4(),
          customer_id: customerId,
          card_id: insertedCards[0].id,
          merchant_id: merchantsData[0].id,
          type: "stamp",
          count: 1,
          timestamp: date.toISOString()
        });
      }
      
      // Pizza shop transactions
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (14 - i * 4)); // Transactions over the past couple weeks
        
        transactionsData.push({
          id: uuidv4(),
          customer_id: customerId,
          card_id: insertedCards[1].id,
          merchant_id: merchantsData[1].id,
          type: "stamp",
          count: 1,
          timestamp: date.toISOString()
        });
      }
      
      // Insert transactions
      const { error: transactionsError } = await supabase
        .from("stamp_transactions")
        .insert(transactionsData);
        
      if (transactionsError) {
        console.error("Error inserting transactions:", transactionsError);
        throw new Error("Failed to insert transactions");
      }
    }
    
    toast.success("Dummy data generated successfully!");
    return true;
  } catch (error) {
    console.error("Error generating dummy data:", error);
    toast.error("Failed to generate dummy data");
    return false;
  }
};
