
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
    const stampCardsData = [
      // First coffee card
      {
        id: uuidv4(),
        name: "Coffee Loyalty Card",
        description: "Collect stamps with every coffee purchase",
        merchant_id: merchantsData[0].id,
        total_stamps: 8,
        reward: "Free Coffee",
        business_logo: merchantsData[0].business_logo,
        business_color: merchantsData[0].business_color,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Second coffee card (new)
      {
        id: uuidv4(),
        name: "Coffee Bean Collector",
        description: "Buy coffee beans and earn rewards",
        merchant_id: merchantsData[0].id,
        total_stamps: 5,
        reward: "250g Premium Coffee Beans",
        business_logo: merchantsData[0].business_logo,
        business_color: merchantsData[0].business_color,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Pizza card
      {
        id: uuidv4(),
        name: "Pizza Lover Card",
        description: "Get rewarded for your pizza addiction",
        merchant_id: merchantsData[1].id,
        total_stamps: 10,
        reward: "Free Medium Pizza",
        business_logo: merchantsData[1].business_logo,
        business_color: merchantsData[1].business_color,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Smoothie card
      {
        id: uuidv4(),
        name: "Smoothie Rewards",
        description: "Stay healthy and get rewarded",
        merchant_id: merchantsData[2].id,
        total_stamps: 6,
        reward: "Free Large Smoothie",
        business_logo: merchantsData[2].business_logo,
        business_color: merchantsData[2].business_color,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
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
        let currentStamps = 0;
        
        if (index === 0) currentStamps = 6; // First coffee card (almost complete)
        else if (index === 1) currentStamps = 3; // Second coffee card (mid-progress)
        else if (index === 2) currentStamps = 3; // Pizza card (in progress)
        else currentStamps = 0; // Smoothie card (just started)
        
        return {
          id: uuidv4(),
          customer_id: customerId,
          card_id: card.id,
          current_stamps: currentStamps,
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
      
      // First coffee card transactions
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
      
      // Second coffee card transactions
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (10 - i)); // Transactions over the past 10 days
        
        transactionsData.push({
          id: uuidv4(),
          customer_id: customerId,
          card_id: insertedCards[1].id,
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
          card_id: insertedCards[2].id,
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
