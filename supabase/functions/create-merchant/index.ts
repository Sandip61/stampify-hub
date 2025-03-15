
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log("Supabase client created");

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

    // First, verify that the user exists in auth.users
    console.log("Checking if user exists in auth system:", id);
    const { data: userExists, error: userCheckError } = await supabase.auth.admin.getUserById(id)
    
    if (userCheckError || !userExists) {
      // Add small delay to allow auth system to finish processing
      console.log("User not found initially, waiting 1 second and trying again");
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check again after the delay
      const { data: userAfterDelay, error: userDelayError } = await supabase.auth.admin.getUserById(id)
      
      if (userDelayError || !userAfterDelay) {
        console.error('User does not exist in auth system after delay:', id, userDelayError);
        return new Response(JSON.stringify({ 
          error: 'User not found in authentication system. Please try again.' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      console.log("User found after delay:", userAfterDelay.user.id);
    } else {
      console.log("User found immediately:", userExists.user.id);
    }

    // Since we're using the service role, we need to directly insert into the users table as well
    // to ensure the foreign key constraint is satisfied
    console.log("Checking if user record exists in public.users table");
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError && !checkError.message.includes('No rows found')) {
      console.error("Error checking for existing user:", checkError);
    }

    if (!existingUser) {
      console.log("User record doesn't exist in public.users table, creating it");
      const { error: userInsertError } = await supabase
        .from('users')
        .upsert({ id })

      if (userInsertError) {
        console.error('Failed to insert user record:', userInsertError);
        // Continue anyway, as insertion might have failed due to a race condition
        // where the user was created between our check and insert
      } else {
        console.log("Successfully created user record in public.users table");
      }
    } else {
      console.log("User record already exists in public.users table");
    }

    // Now create the merchant record
    console.log("Creating merchant record");
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
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log("Merchant record created successfully");
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
