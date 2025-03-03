
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  qrCode?: string;
  cardId?: string;
  customerId?: string;
  customerEmail?: string;
  count?: number;
  method: "direct" | "qr";
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
    
    // Get service role client for admin operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    )

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
    const body = await req.json() as RequestBody
    
    let cardId: string | undefined = body.cardId
    let customerId: string | undefined = body.customerId
    let customerEmail: string | undefined = body.customerEmail
    const count = body.count || 1
    const method = body.method || 'direct'

    // Validate required parameters
    if (method === 'direct' && (!cardId || (!customerId && !customerEmail))) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters for direct method' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    if (method === 'qr' && !body.qrCode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing QR code for QR method' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Process QR code if using QR method
    if (method === 'qr' && body.qrCode) {
      try {
        // Parse the QR code value
        const qrData = JSON.parse(body.qrCode) as {
          type: string;
          code: string;
          card_id: string;
          merchant_id: string;
        }

        if (qrData.type !== 'stamp') {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Invalid QR code type' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 400
            }
          )
        }

        // Get the QR code from the database
        const { data: qrCode, error: qrError } = await supabase
          .from('stamp_qr_codes')
          .select('*')
          .eq('code', qrData.code)
          .single()

        if (qrError || !qrCode) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'QR code not found' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 404
            }
          )
        }

        // Check if the QR code is expired
        if (new Date(qrCode.expires_at) < new Date()) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'QR code has expired' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 400
            }
          )
        }

        // Check if QR code is already used (if single use)
        if (qrCode.is_single_use && qrCode.is_used) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'QR code has already been used' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 400
            }
          )
        }

        // Verify merchant has permission to issue stamps for this card
        if (qrCode.merchant_id !== user.id) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'You do not have permission to issue stamps for this QR code' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 403
            }
          )
        }

        cardId = qrCode.card_id

        // Mark QR code as used if it's single use
        if (qrCode.is_single_use) {
          await supabase
            .from('stamp_qr_codes')
            .update({ is_used: true })
            .eq('id', qrCode.id)
        }
      } catch (error) {
        console.error('Error processing QR code:', error)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid QR code format' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 400
          }
        )
      }
    }

    // Get the stamp card
    const { data: stampCard, error: cardError } = await supabase
      .from('stamp_cards')
      .select('*')
      .eq('id', cardId)
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

    // Verify merchant has permission to issue stamps for this card
    if (stampCard.merchant_id !== user.id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You do not have permission to issue stamps for this card' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 403
        }
      )
    }

    // If customerEmail is provided but not customerId, look up the user
    if (customerEmail && !customerId) {
      const { data: userData, error: userLookupError } = await supabaseAdmin.auth
        .admin
        .listUsers()

      if (userLookupError) {
        console.error('Error looking up user by email:', userLookupError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Error looking up user' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500
          }
        )
      }

      const foundUser = userData.users.find(u => u.email === customerEmail)
      if (!foundUser) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Customer with this email not found' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 404
          }
        )
      }

      customerId = foundUser.id
    }

    // Check if customer already has a stamp card
    const { data: existingCard, error: existingCardError } = await supabase
      .from('customer_stamp_cards')
      .select('*')
      .eq('card_id', cardId)
      .eq('customer_id', customerId)
      .single()

    let stampCardId: string
    let currentStamps: number
    let newStampCount: number
    let rewardEarned = false
    let rewardCode: string | null = null

    // If customer doesn't have a card yet, create one
    if (existingCardError || !existingCard) {
      const { data: newCard, error: newCardError } = await supabase
        .from('customer_stamp_cards')
        .insert({
          card_id: cardId,
          customer_id: customerId,
          current_stamps: count
        })
        .select()
        .single()

      if (newCardError || !newCard) {
        console.error('Error creating new stamp card for customer:', newCardError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create stamp card for customer' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500
          }
        )
      }

      stampCardId = newCard.id
      currentStamps = newCard.current_stamps
      newStampCount = currentStamps
    } else {
      // Update existing stamp card
      newStampCount = existingCard.current_stamps + count
      
      // Check if customer has earned a reward
      if (newStampCount >= stampCard.total_stamps && existingCard.current_stamps < stampCard.total_stamps) {
        rewardEarned = true
        rewardCode = crypto.randomUUID()
      }

      // If stamps exceed the total, cap at total stamps
      if (newStampCount > stampCard.total_stamps) {
        newStampCount = stampCard.total_stamps
      }

      const { data: updatedCard, error: updateError } = await supabase
        .from('customer_stamp_cards')
        .update({ current_stamps: newStampCount })
        .eq('id', existingCard.id)
        .select()
        .single()

      if (updateError || !updatedCard) {
        console.error('Error updating stamp card:', updateError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to update stamp card' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500
          }
        )
      }

      stampCardId = existingCard.id
      currentStamps = updatedCard.current_stamps
    }

    // Create a transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('stamp_transactions')
      .insert({
        card_id: cardId,
        customer_id: customerId,
        merchant_id: user.id,
        type: 'stamp',
        count: count,
        reward_code: rewardEarned ? rewardCode : null
      })
      .select()
      .single()

    if (transactionError || !transaction) {
      console.error('Error creating transaction:', transactionError)
      // Continue anyway, this is not critical
    }

    // Get the full stamp card with customer stamps for the response
    const { data: fullStampCard, error: fullCardError } = await supabase
      .from('customer_stamp_cards')
      .select(`
        id,
        card_id,
        customer_id,
        current_stamps,
        created_at,
        updated_at,
        card:card_id (
          id,
          name,
          description,
          total_stamps,
          reward,
          business_logo,
          business_color
        )
      `)
      .eq('id', stampCardId)
      .single()

    if (fullCardError || !fullStampCard) {
      console.error('Error fetching full stamp card:', fullCardError)
      // Use basic response instead
      return new Response(
        JSON.stringify({ 
          success: true, 
          stampCard: {
            id: stampCardId,
            card_id: cardId,
            customer_id: customerId,
            current_stamps: currentStamps
          },
          rewardEarned,
          rewardCode,
          transaction: transaction || null
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        stampCard: fullStampCard,
        rewardEarned,
        rewardCode,
        transaction: transaction || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in issue-stamp function:', error)
    
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
