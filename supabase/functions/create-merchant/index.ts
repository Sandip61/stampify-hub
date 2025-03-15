
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Ensure we're only handling POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse the request body
    const data = await req.json()
    const { id, business_name, business_logo, business_color, email } = data

    if (!id || !business_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // First, verify that the user exists in auth.users
    const { data: userExists, error: userCheckError } = await supabase.auth.admin.getUserById(id)
    
    if (userCheckError || !userExists) {
      // Add small delay to allow auth system to finish processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check again after the delay
      const { data: userAfterDelay, error: userDelayError } = await supabase.auth.admin.getUserById(id)
      
      if (userDelayError || !userAfterDelay) {
        console.error('User does not exist in auth system:', id)
        return new Response(JSON.stringify({ 
          error: 'User not found in authentication system. Please try again.' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Since we're using the service role, we need to directly insert into the users table as well
    // to ensure the foreign key constraint is satisfied
    const { error: userInsertError } = await supabase
      .from('users')
      .upsert({ id: id })
      .select()

    if (userInsertError) {
      console.warn('Failed to insert user record, continuing with merchant creation:', userInsertError)
      // Continue anyway, as the user may already exist
    }

    // Now create the merchant record
    const { data: merchant, error } = await supabase
      .from('merchants')
      .upsert({
        id,
        business_name,
        business_logo: business_logo || '🏪',
        business_color: business_color || '#3B82F6',
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating merchant:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Return the created merchant
    return new Response(JSON.stringify({ merchant }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
