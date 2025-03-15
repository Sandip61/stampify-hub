
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  console.log("Create merchant function called");

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables:", { 
        hasUrl: Boolean(supabaseUrl), 
        hasServiceKey: Boolean(supabaseServiceKey) 
      });
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing environment variables' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Use the service role key which bypasses RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log("Supabase client created with service role key");

    // Ensure we're only handling POST requests
    if (req.method !== 'POST') {
      console.error("Method not allowed:", req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse the request body
    const data = await req.json()
    console.log("Request data received:", { ...data, id: data.id?.slice(0, 8) + '...' });
    const { id, business_name, business_logo, business_color, email } = data

    if (!id || !business_name) {
      console.error("Missing required fields:", { hasId: Boolean(id), hasBusinessName: Boolean(business_name) });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // First, create entry in users table if it doesn't exist - using service role which bypasses RLS
    console.log("Creating entry in users table if it doesn't exist:", id);
    const { error: userInsertError } = await supabase
      .from('users')
      .upsert({ id })
      .select()
      .single();

    if (userInsertError) {
      console.error('Failed to create user record:', userInsertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to initialize user record', 
        details: userInsertError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log("Successfully initialized user record, now creating merchant record");

    // Now create the merchant record - service role bypasses RLS
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
      console.error('Error creating merchant:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to create merchant profile', 
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log("Merchant record created successfully:", merchant?.id);
    // Return the created merchant
    return new Response(JSON.stringify({ merchant }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Unexpected error in create-merchant function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
