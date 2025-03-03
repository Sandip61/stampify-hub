
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_KEY") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Function to generate a random code for reward redemption
function generateRewardCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with the user's JWT
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the requesting user (merchant)
    const {
      data: { user: merchant },
      error: merchantError,
    } = await supabase.auth.getUser();

    if (merchantError || !merchant) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const requestData = await req.json();
    const { 
      qrCode = null,
      cardId = null,
      customerId = null,
      customerEmail = null,
      count = 1,
      method = "direct" // "direct" or "qr"
    } = requestData;

    // Validation
    if (method === "qr" && !qrCode) {
      return new Response(
        JSON.stringify({ error: "QR code is required for QR method" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (method === "direct" && !cardId) {
      return new Response(
        JSON.stringify({ error: "Card ID is required for direct method" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customerId && !customerEmail) {
      return new Response(
        JSON.stringify({ error: "Customer ID or email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let actualCardId = cardId;
    let actualCustomerId = customerId;
    
    // If using QR method, get the card ID from the QR code
    if (method === "qr") {
      // Verify QR code exists and hasn't expired
      const { data: qrData, error: qrError } = await supabase
        .from('stamp_qr_codes')
        .select('*, stamp_cards!inner(*)')
        .eq('code', qrCode)
        .single();

      if (qrError || !qrData) {
        return new Response(
          JSON.stringify({ error: "Invalid QR code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if QR code has expired
      if (qrData.expires_at && new Date(qrData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "QR code has expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if QR code is single use and already used
      if (qrData.is_single_use && qrData.is_used) {
        return new Response(
          JSON.stringify({ error: "QR code has already been used" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the merchant owns this card
      if (qrData.stamp_cards.merchant_id !== merchant.id) {
        return new Response(
          JSON.stringify({ error: "You don't have permission to use this QR code" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      actualCardId = qrData.card_id;
    } else {
      // Verify the merchant owns this card for direct method
      const { data: cardData, error: cardError } = await supabase
        .from('stamp_cards')
        .select('*')
        .eq('id', cardId)
        .eq('merchant_id', merchant.id)
        .single();

      if (cardError || !cardData) {
        return new Response(
          JSON.stringify({ error: "Card not found or you don't have permission" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If we have an email but no customer ID, look up the customer
    if (!actualCustomerId && customerEmail) {
      // Use service role to look up customer by email
      const serviceClient = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: userData, error: userError } = await serviceClient
        .from('customers') // Assuming a customers view or table exists
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle();

      if (userError) {
        console.error("Customer lookup error:", userError);
        return new Response(
          JSON.stringify({ error: "Failed to lookup customer" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!userData) {
        return new Response(
          JSON.stringify({ error: "Customer not found with that email" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      actualCustomerId = userData.id;
    }

    // Check if customer has a stamp card, if not create one
    const { data: customerCard, error: customerCardError } = await supabase
      .from('customer_stamp_cards')
      .select('*')
      .eq('card_id', actualCardId)
      .eq('customer_id', actualCustomerId)
      .maybeSingle();

    if (customerCardError) {
      console.error("Customer card lookup error:", customerCardError);
      return new Response(
        JSON.stringify({ error: "Failed to lookup customer's stamp card" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let customerStampCard;
    
    // Get the card information to know total stamps needed
    const { data: cardInfo, error: cardInfoError } = await supabase
      .from('stamp_cards')
      .select('*')
      .eq('id', actualCardId)
      .single();
      
    if (cardInfoError || !cardInfo) {
      return new Response(
        JSON.stringify({ error: "Failed to get card information" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customerCard) {
      // Create a new customer stamp card
      const { data: newCard, error: newCardError } = await supabase
        .from('customer_stamp_cards')
        .insert({
          card_id: actualCardId,
          customer_id: actualCustomerId,
          current_stamps: count,
        })
        .select()
        .single();

      if (newCardError) {
        console.error("Create customer card error:", newCardError);
        return new Response(
          JSON.stringify({ error: "Failed to create customer's stamp card" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      customerStampCard = newCard;
    } else {
      // Update existing customer stamp card
      const newStampCount = Math.min(customerCard.current_stamps + count, cardInfo.total_stamps);
      
      const { data: updatedCard, error: updateError } = await supabase
        .from('customer_stamp_cards')
        .update({ 
          current_stamps: newStampCount
        })
        .eq('id', customerCard.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update customer card error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update customer's stamp card" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      customerStampCard = updatedCard;
    }

    // Record the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('stamp_transactions')
      .insert({
        card_id: actualCardId,
        customer_id: actualCustomerId,
        merchant_id: merchant.id,
        type: 'stamp',
        count,
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Transaction creation error:", transactionError);
      // Continue anyway as the stamps were added successfully
    }

    // If using QR method and it's single use, mark it as used
    if (method === "qr") {
      const { error: qrUpdateError } = await supabase
        .from('stamp_qr_codes')
        .update({ is_used: true })
        .eq('code', qrCode);

      if (qrUpdateError) {
        console.error("QR code update error:", qrUpdateError);
        // Continue anyway as the stamps were added successfully
      }
    }

    // Check if customer has earned a reward
    let rewardEarned = false;
    let rewardCode = null;
    
    if (customerStampCard.current_stamps >= cardInfo.total_stamps) {
      rewardEarned = true;
      rewardCode = generateRewardCode();
      
      // Record the reward transaction
      const { error: rewardTransactionError } = await supabase
        .from('stamp_transactions')
        .insert({
          card_id: actualCardId,
          customer_id: actualCustomerId,
          merchant_id: merchant.id,
          type: 'redeem',
          reward_code: rewardCode,
        });
        
      if (rewardTransactionError) {
        console.error("Reward transaction error:", rewardTransactionError);
        // Continue anyway
      }
      
      // Reset the stamp count
      const { error: resetError } = await supabase
        .from('customer_stamp_cards')
        .update({ current_stamps: 0 })
        .eq('id', customerStampCard.id);
        
      if (resetError) {
        console.error("Reset stamps error:", resetError);
        // Continue anyway
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        stampCard: {
          ...customerStampCard,
          card: cardInfo
        },
        rewardEarned,
        rewardCode,
        transaction
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
