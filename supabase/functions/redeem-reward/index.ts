
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
          error: 'Missing Authorization header' 
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
          error: 'Unauthorized' 
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
          error: 'Missing reward code' 
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
      .single()

    if (transactionError || !transaction) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid reward code' 
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
          error: 'You are not authorized to redeem this reward' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 403
        }
      )
    }

    // Get the stamp card to include reward information
    const { data: stampCard, error: cardError } = await supabase
      .from('stamp_cards')
      .select('*')
      .eq('id', transaction.card_id)
      .single()

    if (cardError || !stampCard) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Stamp card not found' 
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
      .single()

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
          error: 'Failed to record redemption' 
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
        error: 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500
      }
    )
  }
})
