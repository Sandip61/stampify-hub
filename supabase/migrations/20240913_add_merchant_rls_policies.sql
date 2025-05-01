
-- =============================================================================
-- Cleaned-Up Row-Level Security (RLS) Policies for Stamp Card Platform
-- Applies to tables: merchants, profiles, stamp_cards,
--                   customer_stamp_cards, stamp_transactions, stamp_qr_codes
-- Assumes `role` is stored in JWT under user_metadata.role
-- Service_role key bypasses RLS automatically—no TO service_role policies needed
-- =============================================================================

-- 1. ENABLE RLS ON ALL BUSINESS TABLES
ALTER TABLE public.merchants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamp_cards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_stamp_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamp_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamp_qr_codes       ENABLE ROW LEVEL SECURITY;

-- 2. DROP ANY OLD POLICIES TO AVOID CONFLICTS
-- Drop existing policies manually instead of using a loop
DROP POLICY IF EXISTS "Merchants manage their own profile" ON public.merchants;
DROP POLICY IF EXISTS "Customers manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Merchants manage their own stamp cards" ON public.stamp_cards;
DROP POLICY IF EXISTS "Customers view active stamp cards" ON public.stamp_cards;
DROP POLICY IF EXISTS "Customers manage their own customer_stamp_cards" ON public.customer_stamp_cards;
DROP POLICY IF EXISTS "Merchants view customer_stamp_cards for their cards" ON public.customer_stamp_cards;
DROP POLICY IF EXISTS "Customers view their own transactions" ON public.stamp_transactions;
DROP POLICY IF EXISTS "Merchants view transactions for their cards" ON public.stamp_transactions;
DROP POLICY IF EXISTS "Merchants insert transactions for their cards" ON public.stamp_transactions;
DROP POLICY IF EXISTS "Merchants manage their own QR codes" ON public.stamp_qr_codes;
DROP POLICY IF EXISTS "Customers view QR code when provided" ON public.stamp_qr_codes;

-- 3. MERCHANTS TABLE
CREATE POLICY "Merchants manage their own profile" 
  ON public.merchants 
  FOR ALL 
  USING (
    auth.uid() = id
    AND auth.jwt() -> 'user_metadata' ->> 'role' = 'merchant'
  );

-- 4. PROFILES TABLE (customer profiles)
CREATE POLICY "Customers manage their own profile" 
  ON public.profiles 
  FOR ALL 
  USING (
    auth.uid() = id
    AND auth.jwt() -> 'user_metadata' ->> 'role' = 'customer'
  );

-- 5. STAMP_CARDS TABLE
CREATE POLICY "Merchants manage their own stamp cards" 
  ON public.stamp_cards 
  FOR ALL 
  USING (
    auth.uid() = merchant_id
    AND auth.jwt() -> 'user_metadata' ->> 'role' = 'merchant'
  );

CREATE POLICY "Customers view active stamp cards" 
  ON public.stamp_cards 
  FOR SELECT 
  USING (
    is_active
    AND auth.jwt() -> 'user_metadata' ->> 'role' = 'customer'
  );

-- 6. CUSTOMER_STAMP_CARDS TABLE
CREATE POLICY "Customers manage their own customer_stamp_cards" 
  ON public.customer_stamp_cards 
  FOR ALL 
  USING (
    auth.uid() = customer_id
    AND auth.jwt() -> 'user_metadata' ->> 'role' = 'customer'
  );

CREATE POLICY "Merchants view customer_stamp_cards for their cards" 
  ON public.customer_stamp_cards 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1
      FROM public.stamp_cards sc
      WHERE sc.id = customer_stamp_cards.card_id
        AND sc.merchant_id = auth.uid()
    )
    AND auth.jwt() -> 'user_metadata' ->> 'role' = 'merchant'
  );

-- 7. STAMP_TRANSACTIONS TABLE
CREATE POLICY "Customers view their own transactions" 
  ON public.stamp_transactions 
  FOR SELECT 
  USING (
    auth.uid() = customer_id
    AND auth.jwt() -> 'user_metadata' ->> 'role' = 'customer'
  );

CREATE POLICY "Merchants view transactions for their cards" 
  ON public.stamp_transactions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1
      FROM public.stamp_cards sc
      WHERE sc.id = stamp_transactions.card_id
        AND sc.merchant_id = auth.uid()
    )
    AND auth.jwt() -> 'user_metadata' ->> 'role' = 'merchant'
  );

CREATE POLICY "Merchants insert transactions for their cards" 
  ON public.stamp_transactions 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.stamp_cards sc
      WHERE sc.id = stamp_transactions.card_id
        AND sc.merchant_id = auth.uid()
    )
    AND auth.jwt() -> 'user_metadata' ->> 'role' = 'merchant'
  );

-- 8. STAMP_QR_CODES TABLE
CREATE POLICY "Merchants manage their own QR codes" 
  ON public.stamp_qr_codes 
  FOR ALL 
  USING (
    auth.uid() = merchant_id
    AND auth.jwt() -> 'user_metadata' ->> 'role' = 'merchant'
  );

CREATE POLICY "Customers view QR code when provided" 
  ON public.stamp_qr_codes 
  FOR SELECT 
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'customer'
  );

-- Create users table if it doesn't exist (to prevent foreign key constraint failures)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add policy for users table
CREATE POLICY "Users can manage their own user record" 
  ON public.users 
  FOR ALL 
  USING (auth.uid() = id);

-- Add policy for service role
CREATE POLICY "Service role can manage users" 
  ON public.users 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);
