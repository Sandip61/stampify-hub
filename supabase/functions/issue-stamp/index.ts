
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
    
    // Get the authenticated user (could be customer or merchant)
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
    console.log('Authenticated user ID:', user.id)
    console.log('User metadata:', user.user_metadata)

    let cardId = body.cardId
    let customerEmail = body.customerEmail
    let customerId = body.customerId
    let merchantId = user.id // Default to authenticated user
    const count = body.count || 1

    // If QR code is provided, parse it and validate
    if (body.qrCode) {
      try {
        const qrData = JSON.parse(body.qrCode)
        if (qrData.type !== 'stamp' || !qrData.code || !qrData.card_id) {
          throw new Error('Invalid QR code format')
        }
        cardId = qrData.card_id
        
        // For QR codes, we need to validate the QR code exists and get the merchant_id
        const { data: qrCodeData, error: qrError } = await supabase
          .from('stamp_qr_codes')
          .select('merchant_id, card_id, expires_at, is_used, is_single_use')
          .eq('code', qrData.code)
          .eq('card_id', qrData.card_id)
          .single()

        if (qrError || !qrCodeData) {
          console.error('QR code validation error:', qrError)
          return new Response(
            JSON.stringify({ error: 'Invalid or expired QR code' }),
            { status: 400, headers: corsHeaders }
          )
        }

        // Check if QR code is expired
        if (qrCodeData.expires_at && new Date(qrCodeData.expires_at) < new Date()) {
          return new Response(
            JSON.stringify({ error: 'QR code has expired' }),
            { status: 400, headers: corsHeaders }
          )
        }

        // Check if single-use QR code has already been used
        if (qrCodeData.is_single_use && qrCodeData.is_used) {
          return new Response(
            JSON.stringify({ error: 'QR code has already been used' }),
            { status: 400, headers: corsHeaders }
          )
        }

        merchantId = qrCodeData.merchant_id

        // Mark single-use QR code as used
        if (qrCodeData.is_single_use) {
          await supabase
            .from('stamp_qr_codes')
            .update({ is_used: true })
            .eq('code', qrData.code)
        }

      } catch (e) {
        console.error('QR code parsing error:', e)
        return new Response(
          JSON.stringify({ error: 'Invalid QR code format' }),
          { status: 400, headers: corsHeaders }
        )
      }
    } else {
      // For direct method, verify the user is a merchant who owns the card
      console.log('=== DIRECT METHOD VERIFICATION ===')
      console.log('Checking if user is merchant for card:', cardId)
      
      // First check if the user exists in the merchants table
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('id', user.id)
        .single()

      console.log('Merchant lookup result:', merchantData)
      console.log('Merchant lookup error:', merchantError)

      if (merchantError || !merchantData) {
        console.error('User is not a merchant:', merchantError)
        return new Response(
          JSON.stringify({ error: 'User is not registered as a merchant' }),
          { status: 403, headers: corsHeaders }
        )
      }

      // Then verify the card belongs to this merchant
      const { data: card, error: cardError } = await supabase
        .from('stamp_cards')
        .select('merchant_id, name')
        .eq('id', cardId)
        .single()

      console.log('Card lookup result:', card)
      console.log('Card lookup error:', cardError)

      if (cardError || !card) {
        console.error('Card not found:', cardError)
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 404, headers: corsHeaders }
        )
      }

      if (card.merchant_id !== user.id) {
        console.error('Card does not belong to merchant. Card merchant_id:', card.merchant_id, 'User ID:', user.id)
        return new Response(
          JSON.stringify({ error: 'Access denied - card belongs to different merchant' }),
          { status: 403, headers: corsHeaders }
        )
      }

      console.log('=== VERIFICATION PASSED ===')
      merchantId = user.id
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

    // Get the stamp card details
    const { data: card, error: cardError } = await supabase
      .from('stamp_cards')
      .select('*')
      .eq('id', cardId)
      .single()

    if (cardError || !card) {
      console.error('Card fetch error:', cardError)
      return new Response(
        JSON.stringify({ error: 'Card not found' }),
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

    // Get or create customer stamp card with explicit locking to prevent race conditions
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

    // Calculate new stamp count - ensure we don't exceed total stamps
    const currentStamps = customerCard.current_stamps || 0
    const newStampCount = Math.min(currentStamps + count, card.total_stamps)
    const actualStampsAdded = newStampCount - currentStamps
    const rewardEarned = newStampCount >= card.total_stamps

    console.log(`Current stamps: ${currentStamps}, Adding: ${count}, New total: ${newStampCount}, Reward earned: ${rewardEarned}`)

    // Update customer stamp card - reset to 0 if reward is earned
    const finalStampCount = rewardEarned ? 0 : newStampCount
    const { error: updateError } = await supabase
      .from('customer_stamp_cards')
      .update({
        current_stamps: finalStampCount,
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

    // Create transaction record - record the actual stamps that were processed
    const rewardCode = rewardEarned ? Math.random().toString(36).substring(2, 8).toUpperCase() : null
    const transactionType = rewardEarned ? 'redeem' : 'stamp'
    
    const { error: transactionError } = await supabase
      .from('stamp_transactions')
      .insert({
        card_id: cardId,
        customer_id: customerId || 'unregistered',
        merchant_id: merchantId,
        type: transactionType,
        count: actualStampsAdded, // Record actual stamps added, not requested
        reward_code: rewardCode,
        metadata: {
          customer_email: customerEmail,
          method: body.method,
          requested_count: count,
          stamps_before: currentStamps,
          stamps_after: finalStampCount
        }
      })

    if (transactionError) {
      console.error('Transaction error:', transactionError)
    }

    // Create/update merchant customer record
    if (customerEmail) {
      const merchantCustomerData = {
        merchant_id: merchantId,
        merchant_user_id: merchantId,
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
        .eq('merchant_id', merchantId)
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
        current_stamps: finalStampCount,
        card: {
          total_stamps: card.total_stamps,
          reward: card.reward
        }
      },
      stampsAdded: actualStampsAdded,
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
