
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  cardId: string;
  expiresInHours: number;
  isSingleUse: boolean;
  securityLevel?: string;
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
      console.error('Missing Authorization header')
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
      console.error('Unauthorized access attempt:', userError)
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
    const { cardId, expiresInHours = 24, isSingleUse = false, securityLevel = 'M' } = await req.json() as RequestBody

    if (!cardId) {
      console.error('Missing required parameter: cardId')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Validate expiry hours are within acceptable range (1-72 hours)
    if (expiresInHours < 1 || expiresInHours > 72) {
      console.error('Invalid expiry hours:', expiresInHours)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Expiry hours must be between 1 and 72' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Verify the merchant owns this stamp card
    const { data: cardData, error: cardError } = await supabase
      .from('stamp_cards')
      .select('id, is_active')
      .eq('id', cardId)
      .eq('merchant_id', user.id)
      .single()

    if (cardError || !cardData) {
      console.error('Stamp card not found or unauthorized:', cardError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Stamp card not found or you do not have permission' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404
        }
      )
    }

    // Check if the card is active
    if (cardData && cardData.is_active === false) {
      console.error('Attempt to create QR code for inactive card:', cardId)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cannot create QR code for inactive stamp card' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400
        }
      )
    }

    // Generate a unique code with more entropy
    const timestamp = Date.now().toString(36)
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    const code = `${timestamp}-${randomPart}-${user.id.substring(0, 8)}`
    
    // Calculate expiry time
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expiresInHours)

    // Create QR code record in the database
    const { data: qrCode, error: qrError } = await supabase
      .from('stamp_qr_codes')
      .insert({
        merchant_id: user.id,
        card_id: cardId,
        code,
        expires_at: expiresAt.toISOString(),
        is_single_use: isSingleUse,
        is_used: false
      })
      .select()
      .single()

    if (qrError) {
      console.error('Error creating QR code:', qrError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create QR code' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    // Create a more structured QR code value
    const qrValue = JSON.stringify({
      v: 1, // version
      type: 'stamp',
      code,
      card_id: cardId,
      merchant_id: user.id,
      security: securityLevel
    })

    console.log(`QR code created successfully for card ${cardId}, merchant ${user.id}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        qrCode,
        qrValue
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in create-qr-code function:', error)
    
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
