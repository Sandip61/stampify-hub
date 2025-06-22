
-- Delete data in dependency order to avoid foreign key conflicts

-- 1. Delete stamp transactions first (references other tables)
DELETE FROM public.stamp_transactions;

-- 2. Delete customer stamp cards (references customers and cards)
DELETE FROM public.customer_stamp_cards;

-- 3. Delete QR codes (references merchants and cards)
DELETE FROM public.stamp_qr_codes;

-- 4. Delete merchant customers (references merchants)
DELETE FROM public.merchant_customers;

-- 5. Delete stamp cards (references merchants)
DELETE FROM public.stamp_cards;

-- 6. Delete merchants
DELETE FROM public.merchants;

-- 7. Delete profiles
DELETE FROM public.profiles;

-- 8. Delete users (if any custom user records exist)
DELETE FROM public.users;
