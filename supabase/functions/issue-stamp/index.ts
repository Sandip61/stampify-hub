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

// Security validation functions
const validateRequestParameters = (body: RequestBody): { valid: boolean; error?: string } => {
  // Method validation
  if (!body.method || !['direct', 'qr'].includes(body.method)) {
    return { valid: false, error: 'Invalid method specified' };
  }
  
  // QR method validation
  if (body.method === 'qr' && !body.qrCode) {
    return { valid: false, error: 'QR code is required for QR method' };
  }
  
  // Direct method validation
  if (body.method === 'direct') {
    if (!body.cardId) {
      return { valid: false, error: 'Card ID is required for direct method' };
    }
    
    if (!body.customerId && !body.customerEmail) {
      return { valid: false, error: 'Customer ID or email is required for direct method' };
    }
  }
  
  // Count validation
  if (body.count !== undefined) {
    if (!Number.isInteger(body.count) || body.count <= 0 || body.count > 10) {
      return { valid: false, error: 'Count must be a positive integer not exceeding 10' };
    }
  }
  
  return { valid: true };
}

// Security function to validate rate limits
const checkRateLimit = async (
  supabase: any, 
  merchantId: string, 
  customerId: string
): Promise<{ allowed: boolean; error?: string }> => {
  // Check for merchant rate limiting (no more than 100 stamps per hour)
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count: merchantCount, error: merchantError } = await supabase
    .from('stamp_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .gte('timestamp', hourAgo);
    
  if (merchantError) {
    console.error('Error checking merchant rate limit:', merchantError);
    return { allowed: false, error: 'Error checking rate limits' };
  }
  
  if (merchantCount > 100) {
    return { allowed: false, error: 'Merchant rate limit exceeded (100 stamps per hour)' };
  }
  
  // Check for customer rate limiting (no more than 20 stamps per hour from same merchant)
  const { count: customerCount, error: customerError } = await supabase
    .from('stamp_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .eq('customer_id', customerId)
    .gte('timestamp', hourAgo);
    
  if (customerError) {
    console.error('Error checking customer rate limit:', customerError);
    return { allowed: false, error: 'Error checking rate limits' };
  }
  
  if (customerCount > 20) {
    return { allowed: false, error: 'Customer rate limit exceeded (20 stamps per hour from same merchant)' };
  }
  
  return { allowed: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    
    // Create two clients - one for auth and one with service role for DB operations
    const supabase = createClient(supabaseUrl, supabaseKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the JWT from the request headers
    const authHeader = req.headers.get('Authorization');
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
      );
    }

    // Verify the user's authentication using the regular client
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      );
    }

    // Get the request body with improved error handling
    let body: RequestBody;
    try {
      const requestText = await req.text();
      console.log("Raw request body:", requestText);
      
      if (!requestText || requestText.trim() === '') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Empty request body' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 400 
          }
        );
      }
      
      body = JSON.parse(requestText) as RequestBody;
      console.log('Parsed request body:', body);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid JSON in request body: ${jsonError.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    // Validate request parameters
    const validation = validateRequestParameters(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: validation.error 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    let cardId: string | undefined = body.cardId;
    let customerId: string | undefined = body.customerId;
    let customerEmail: string | undefined = body.customerEmail;
    const count = body.count || 1;
    const method = body.method || 'direct';

    // Process QR code if using QR method
    if (method === 'qr' && body.qrCode) {
      try {
        // Parse the QR code value with additional validation
        let qrData: {
          type: string;
          code: string;
          card_id: string;
          merchant_id: string;
          timestamp?: number;
        };
        
        try {
          qrData = JSON.parse(body.qrCode);
        } catch (e) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Invalid QR code format: not valid JSON' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 400
            }
          );
        }

        // Validate QR data properties
        if (!qrData.type || !qrData.code || !qrData.card_id || !qrData.merchant_id) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Invalid QR code format: missing required fields' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 400
            }
          );
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
          );
        }

        // Check for timestamp to prevent QR replay attacks
        if (qrData.timestamp) {
          const now = Date.now();
          const qrTimestamp = qrData.timestamp;
          
          // QR codes should not be from the future
          if (qrTimestamp > now) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Invalid QR code: future timestamp' 
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 400
              }
            );
          }
          
          // QR codes older than 5 minutes should be rejected
          if (now - qrTimestamp > 5 * 60 * 1000) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'QR code has expired (>5 minutes)' 
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 400
              }
            );
          }
        }

        // Get the QR code from the database
        const { data: qrCode, error: qrError } = await supabaseAdmin
          .from('stamp_qr_codes')
          .select('*')
          .eq('code', qrData.code)
          .single();

        if (qrError || !qrCode) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'QR code not found in database' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 404
            }
          );
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
          );
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
          );
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
          );
        }

        cardId = qrCode.card_id;

        // Mark QR code as used if it's single use
        if (qrCode.is_single_use) {
          await supabaseAdmin
            .from('stamp_qr_codes')
            .update({ is_used: true })
            .eq('id', qrCode.id);
        }
      } catch (error) {
        console.error('Error processing QR code:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid QR code format or processing error' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 400
          }
        );
      }
    }

    // Get the stamp card using the admin client
    console.log('Fetching stamp card with ID:', cardId);
    const { data: stampCard, error: cardError } = await supabaseAdmin
      .from('stamp_cards')
      .select('*')
      .eq('id', cardId)
      .maybeSingle();

    if (cardError) {
      console.error('Card error:', cardError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database error while fetching card: ${cardError.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500
        }
      );
    }

    if (!stampCard) {
      console.error('Card not found error for ID:', cardId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Stamp card not found. Card ID: ${cardId}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404
        }
      );
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
      );
    }

    // If customerEmail is provided but not customerId, look up the user
    if (customerEmail && !customerId) {
      try {
        const { data: userData, error: userLookupError } = await supabaseAdmin.auth
          .admin
          .listUsers();

        if (userLookupError) {
          console.error('Error looking up user by email:', userLookupError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Error looking up user' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500
            }
          );
        }

        const foundUser = userData.users.find(u => u.email === customerEmail);
        if (!foundUser) {
          // If no user found with email, create a placeholder ID based on the email
          // This allows non-registered users to collect stamps
          customerId = `email:${customerEmail}`;
          console.log(`No user found with email ${customerEmail}, using placeholder ID: ${customerId}`);
        } else {
          customerId = foundUser.id;
        }
      } catch (error) {
        console.error('Error in user lookup:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Error processing user information' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500
          }
        );
      }
    }
    
    // Check rate limiting for security
    try {
      if (customerId) {
        const rateLimitCheck = await checkRateLimit(supabaseAdmin, user.id, customerId);
        if (!rateLimitCheck.allowed) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: rateLimitCheck.error 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 429
            }
          );
        }
      }
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Continue anyway, this is not critical
    }

    // Check if customer already has a stamp card
    try {
      const { data: existingCard, error: existingCardError } = await supabaseAdmin
        .from('customer_stamp_cards')
        .select('*')
        .eq('card_id', cardId)
        .eq('customer_id', customerId)
        .maybeSingle();

      let stampCardId: string;
      let currentStamps: number;
      let newStampCount: number;
      let rewardEarned = false;
      let rewardCode: string | null = null;

      // If customer doesn't have a card yet, create one
      if (existingCardError || !existingCard) {
        const { data: newCard, error: newCardError } = await supabaseAdmin
          .from('customer_stamp_cards')
          .insert({
            card_id: cardId,
            customer_id: customerId,
            current_stamps: count
          })
          .select()
          .single();

        if (newCardError || !newCard) {
          console.error('Error creating new stamp card for customer:', newCardError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to create stamp card for customer' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500
            }
          );
        }

        stampCardId = newCard.id;
        currentStamps = newCard.current_stamps;
        newStampCount = currentStamps;
      } else {
        // Update existing stamp card
        newStampCount = existingCard.current_stamps + count;
        
        // Check if customer has earned a reward
        if (newStampCount >= stampCard.total_stamps && existingCard.current_stamps < stampCard.total_stamps) {
          rewardEarned = true;
          // Generate a secure reward code with additional entropy
          const randomBytes = new Uint8Array(16);
          crypto.getRandomValues(randomBytes);
          rewardCode = Array.from(randomBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('').substring(0, 6).toUpperCase();
        }

        // If stamps exceed the total, cap at total stamps
        if (newStampCount > stampCard.total_stamps) {
          newStampCount = stampCard.total_stamps;
        }

        const { data: updatedCard, error: updateError } = await supabaseAdmin
          .from('customer_stamp_cards')
          .update({ current_stamps: newStampCount })
          .eq('id', existingCard.id)
          .select()
          .single();

        if (updateError || !updatedCard) {
          console.error('Error updating stamp card:', updateError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to update stamp card' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500
            }
          );
        }

        stampCardId = existingCard.id;
        currentStamps = updatedCard.current_stamps;
      }

      // Create a transaction record with additional security metadata
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('stamp_transactions')
        .insert({
          card_id: cardId,
          customer_id: customerId,
          merchant_id: user.id,
          type: 'stamp',
          count: count,
          reward_code: rewardEarned ? rewardCode : null,
          metadata: {
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            method: method,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (transactionError || !transaction) {
        console.error('Error creating transaction:', transactionError);
        // Continue anyway, this is not critical
      }

      // Get the full stamp card with customer stamps for the response
      try {
        const { data: fullStampCard, error: fullCardError } = await supabaseAdmin
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
          .single();

        if (fullCardError || !fullStampCard) {
          console.error('Error fetching full stamp card:', fullCardError);
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
          );
        }

        // Create detailed security audit log
        const auditLog = {
          type: 'stamp_issuance',
          merchant_id: user.id,
          customer_id: customerId,
          card_id: cardId,
          count: count,
          method: method,
          result: 'success',
          reward_earned: rewardEarned,
          timestamp: new Date().toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
        };
        
        console.log('Stamp issuance audit log:', JSON.stringify(auditLog));

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
        );
      } catch (error) {
        console.error('Error in response generation:', error);
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
        );
      }
    } catch (error) {
      console.error('Error in stamp card processing:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error processing stamp card information' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500
        }
      );
    }
  } catch (error) {
    console.error('Error in issue-stamp function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Internal server error: ${error.message || 'Unknown error'}` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500
      }
    );
  }
})
