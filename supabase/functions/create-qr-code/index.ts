
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_KEY") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Generate a random string for QR code
function generateRandomCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Create a new QR code for a stamp card
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

    // Get the requesting user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const requestData = await req.json();
    const { cardId, expiresInHours = 24, isSingleUse = false } = requestData;

    if (!cardId) {
      return new Response(
        JSON.stringify({ error: "Card ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the merchant owns this card
    const { data: cardData, error: cardError } = await supabase
      .from('stamp_cards')
      .select('*')
      .eq('id', cardId)
      .eq('merchant_id', user.id)
      .single();

    if (cardError || !cardData) {
      return new Response(
        JSON.stringify({ error: "Card not found or you don't have permission" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a unique QR code
    const code = generateRandomCode();
    
    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Insert the QR code record
    const { data: qrData, error: qrError } = await supabase
      .from('stamp_qr_codes')
      .insert({
        merchant_id: user.id,
        card_id: cardId,
        code,
        expires_at: expiresAt.toISOString(),
        is_single_use: isSingleUse,
      })
      .select()
      .single();

    if (qrError) {
      console.error("QR code creation error:", qrError);
      return new Response(
        JSON.stringify({ error: "Failed to create QR code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        qrCode: qrData,
        qrValue: code,
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
