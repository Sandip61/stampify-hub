
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface StampRequest {
  qrCode?: string
  cardId?: string
  customerId?: string
  customerEmail?: string
  count?: number
  method: 'qr' | 'direct'
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get the authenticated user (merchant)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const body: StampRequest = await req.json()
    console.log('Received request:', body)

    let cardId = body.cardId
    let customerEmail = body.customerEmail
    let customerId = body.customerId
    const count = body.count || 1

    // If QR code is provided, parse it
    if (body.qrCode) {
      try {
        const qrData = JSON.parse(body.qrCode)
        if (qrData.type !== 'stamp' || !qrData.code || !qrData.card_id) {
          throw new Error('Invalid QR code format')
        }
        cardId = qrData.card_id
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid QR code format' }),
          { status: 400, headers: corsHeaders }
        )
      }
    }

    if (!cardId) {
      return new Response(
        JSON.stringify({ error: 'Card ID is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!customerEmail && !customerId) {
      return new Response(
        JSON.stringify({ error: 'Customer email or ID is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get the stamp card and verify it belongs to the merchant
    const { data: card, error: cardError } = await supabase
      .from('stamp_cards')
      .select('*')
      .eq('id', cardId)
      .eq('merchant_id', user.id)
      .single()

    if (cardError || !card) {
      console.error('Card error:', cardError)
      return new Response(
        JSON.stringify({ error: 'Card not found or access denied' }),
        { status: 404, headers: corsHeaders }
      )
    }

    // If we have customer email but no customer ID, try to find the customer
    if (customerEmail && !customerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .single()
      
      if (profile) {
        customerId = profile.id
      }
    }

    // Get or create customer stamp card
    let { data: customerCard, error: customerCardError } = await supabase
      .from('customer_stamp_cards')
      .select('*')
      .eq('card_id', cardId)
      .eq('customer_id', customerId || 'unregistered')
      .single()

    if (customerCardError && customerCardError.code !== 'PGRST116') {
      console.error('Customer card error:', customerCardError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch customer card' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Create customer stamp card if it doesn't exist
    if (!customerCard) {
      const { data: newCustomerCard, error: createError } = await supabase
        .from('customer_stamp_cards')
        .insert({
          card_id: cardId,
          customer_id: customerId || 'unregistered',
          current_stamps: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('Create customer card error:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create customer card' }),
          { status: 500, headers: corsHeaders }
        )
      }
      customerCard = newCustomerCard
    }

    // Add stamps
    const newStampCount = customerCard.current_stamps + count
    const rewardEarned = newStampCount >= card.total_stamps

    // Update customer stamp card
    const { error: updateError } = await supabase
      .from('customer_stamp_cards')
      .update({
        current_stamps: rewardEarned ? 0 : newStampCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerCard.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update stamps' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Create transaction record
    const rewardCode = rewardEarned ? Math.random().toString(36).substring(2, 8).toUpperCase() : null
    
    const { error: transactionError } = await supabase
      .from('stamp_transactions')
      .insert({
        card_id: cardId,
        customer_id: customerId || 'unregistered',
        merchant_id: user.id,
        type: rewardEarned ? 'reward' : 'stamp',
        count: count,
        reward_code: rewardCode,
        metadata: {
          customer_email: customerEmail,
          method: body.method
        }
      })

    if (transactionError) {
      console.error('Transaction error:', transactionError)
    }

    // Create/update merchant customer record
    if (customerEmail) {
      const merchantCustomerData = {
        merchant_id: user.id,
        merchant_user_id: user.id,
        customer_id: customerId,
        customer_email: customerEmail,
        customer_name: customerId ? null : customerEmail.split('@')[0], // Use email prefix for unregistered
        last_interaction_at: new Date().toISOString(),
        total_stamps_earned: count
      }

      // Try to update existing merchant customer record
      const { data: existingCustomer } = await supabase
        .from('merchant_customers')
        .select('*')
        .eq('merchant_id', user.id)
        .eq('customer_email', customerEmail)
        .single()

      if (existingCustomer) {
        // Update existing record
        await supabase
          .from('merchant_customers')
          .update({
            customer_id: customerId || existingCustomer.customer_id,
            last_interaction_at: new Date().toISOString(),
            total_stamps_earned: existingCustomer.total_stamps_earned + count,
            total_rewards_redeemed: rewardEarned ? existingCustomer.total_rewards_redeemed + 1 : existingCustomer.total_rewards_redeemed
          })
          .eq('id', existingCustomer.id)
      } else {
        // Create new record
        await supabase
          .from('merchant_customers')
          .insert({
            ...merchantCustomerData,
            total_rewards_redeemed: rewardEarned ? 1 : 0
          })
      }
    }

    // Prepare response
    const response = {
      success: true,
      message: rewardEarned ? 'Stamps issued and reward earned!' : 'Stamps issued successfully',
      stampCard: {
        current_stamps: rewardEarned ? 0 : newStampCount,
        card: {
          total_stamps: card.total_stamps,
          reward: card.reward
        }
      },
      rewardEarned,
      rewardCode,
      customerInfo: {
        id: customerId || 'unregistered',
        email: customerEmail
      }
    }

    console.log('Success response:', response)
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
