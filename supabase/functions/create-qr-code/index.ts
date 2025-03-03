
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
    const { cardId, expiresInHours = 24, isSingleUse = false } = await req.json() as RequestBody

    if (!cardId) {
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

    // Verify the merchant owns this stamp card
    const { data: cardData, error: cardError } = await supabase
      .from('stamp_cards')
      .select('id')
      .eq('id', cardId)
      .eq('merchant_id', user.id)
      .single()

    if (cardError || !cardData) {
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

    // Generate a unique code
    const code = crypto.randomUUID()
    
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

    // Create a QR code value
    const qrValue = JSON.stringify({
      type: 'stamp',
      code,
      card_id: cardId,
      merchant_id: user.id
    })

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
