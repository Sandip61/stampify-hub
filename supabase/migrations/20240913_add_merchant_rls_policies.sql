
-- Enable Row Level Security on merchants table (already enabled but making it explicit)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own merchant profile
CREATE POLICY "Users can view their own merchant profile" 
  ON public.merchants 
  FOR SELECT 
  USING (auth.uid() = id);

-- Create policy that allows users to insert their own merchant profile
CREATE POLICY "Users can create their own merchant profile" 
  ON public.merchants 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create policy that allows users to update their own merchant profile
CREATE POLICY "Users can update their own merchant profile" 
  ON public.merchants 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create policy that allows the service role to perform all operations
-- This is crucial for the edge function that uses the service role
CREATE POLICY "Service role can manage merchants" 
  ON public.merchants 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

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
