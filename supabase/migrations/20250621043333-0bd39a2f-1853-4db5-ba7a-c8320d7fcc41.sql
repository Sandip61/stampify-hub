
-- Update the stamp_transactions table to allow 'reward' transaction type
-- First, drop the existing check constraint
ALTER TABLE public.stamp_transactions DROP CONSTRAINT IF EXISTS stamp_transactions_type_check;

-- Create a new check constraint that includes 'reward' type
ALTER TABLE public.stamp_transactions ADD CONSTRAINT stamp_transactions_type_check 
CHECK (type IN ('stamp', 'redeem', 'reward', 'card_created', 'card_updated', 'card_deactivated'));
