
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  rewardCode: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the JWT from the request headers
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing Authorization header',
          errorType: 'UNAUTHORIZED'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      )
    }

    // Get the current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized',
          errorType: 'UNAUTHORIZED'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      )
    }

    // Get the request body
    const { rewardCode } = await req.json() as RequestBody

    if (!rewardCode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing reward code',
          errorType: 'VALIDATION_ERROR'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Validate the reward code format
    if (!/^[A-Z0-9]{6}$/.test(rewardCode)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid reward code format. Code should be 6 alphanumeric characters',
          errorType: 'VALIDATION_ERROR'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Check if this code has already been redeemed
    const { data: existingRedemption, error: existingError } = await supabase
      .from('stamp_transactions')
      .select('id')
      .eq('reward_code', rewardCode)
      .eq('type', 'redeem')
      .maybeSingle()

    if (existingRedemption) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'This reward has already been redeemed',
          errorType: 'QR_CODE_ALREADY_USED'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Find the transaction with this reward code
    const { data: transaction, error: transactionError } = await supabase
      .from('stamp_transactions')
      .select(`
        id,
        card_id,
        customer_id,
        merchant_id,
        type,
        reward_code,
        timestamp
      `)
      .eq('reward_code', rewardCode)
      .eq('type', 'stamp')
      .maybeSingle()

    if (transactionError || !transaction) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid reward code',
          errorType: 'QR_CODE_INVALID'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404 
        }
      )
    }

    // Check if this merchant is authorized to redeem this reward
    if (transaction.merchant_id !== user.id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You are not authorized to redeem this reward',
          errorType: 'PERMISSION_DENIED'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 403
        }
      )
    }

    // Check if the reward code is expired (more than 24 hours old)
    const redemptionTimestamp = new Date(transaction.timestamp);
    const currentTime = new Date();
    const hoursDifference = (currentTime.getTime() - redemptionTimestamp.getTime()) / (1000 * 60 * 60);
    
    if (hoursDifference > 24) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'This reward code has expired',
          errorType: 'QR_CODE_EXPIRED'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400
        }
      )
    }

    // Get the stamp card to include reward information
    const { data: stampCard, error: cardError } = await supabase
      .from('stamp_cards')
      .select('*')
      .eq('id', transaction.card_id)
      .maybeSingle()

    if (cardError || !stampCard) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Stamp card not found',
          errorType: 'STAMP_CARD_NOT_FOUND'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404
        }
      )
    }

    // Get customer information
    const { data: customerCard, error: customerError } = await supabase
      .from('customer_stamp_cards')
      .select('*')
      .eq('card_id', transaction.card_id)
      .eq('customer_id', transaction.customer_id)
      .maybeSingle()

    if (customerError) {
      console.error('Error fetching customer stamp card:', customerError)
      // Not critical, continue
    }

    // Create a redeem transaction
    const { data: redeemTransaction, error: redeemError } = await supabase
      .from('stamp_transactions')
      .insert({
        card_id: transaction.card_id,
        customer_id: transaction.customer_id,
        merchant_id: user.id,
        type: 'redeem',
        reward_code: rewardCode
      })
      .select()
      .single()

    if (redeemError || !redeemTransaction) {
      console.error('Error creating redeem transaction:', redeemError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to record redemption',
          errorType: 'STAMP_REDEEM_FAILED'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500
        }
      )
    }

    // Reset the customer's stamp count
    if (customerCard) {
      const { error: resetError } = await supabase
        .from('customer_stamp_cards')
        .update({ current_stamps: 0 })
        .eq('id', customerCard.id)

      if (resetError) {
        console.error('Error resetting customer stamps:', resetError)
        // Not critical, continue
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction: {
          ...redeemTransaction,
          redeemed_at: new Date().toISOString()
        },
        reward: stampCard.reward,
        customerInfo: {
          id: transaction.customer_id
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in redeem-reward function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        errorType: 'UNKNOWN_ERROR'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500
      }
    )
  }
})
