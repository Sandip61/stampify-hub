
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_KEY") as string;

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
    const { rewardCode } = requestData;

    if (!rewardCode) {
      return new Response(
        JSON.stringify({ error: "Reward code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the transaction with this reward code
    const { data: transaction, error: transactionError } = await supabase
      .from('stamp_transactions')
      .select('*, stamp_cards!inner(*)')
      .eq('reward_code', rewardCode)
      .eq('type', 'redeem')
      .single();

    if (transactionError || !transaction) {
      return new Response(
        JSON.stringify({ error: "Invalid reward code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the merchant owns this card
    if (transaction.stamp_cards.merchant_id !== merchant.id) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to redeem this reward" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark the transaction as redeemed (we'll add a redeemed_at timestamp)
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('stamp_transactions')
      .update({ 
        redeemed_at: new Date().toISOString() 
      })
      .eq('id', transaction.id)
      .select()
      .single();

    if (updateError) {
      console.error("Transaction update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to mark reward as redeemed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction: updatedTransaction,
        reward: transaction.stamp_cards.reward,
        customerInfo: {
          id: transaction.customer_id
        }
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
