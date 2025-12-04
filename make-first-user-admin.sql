-- ============================================================================
-- Make First User Admin
-- ============================================================================
-- This script makes the first registered user an admin
-- Run this in Supabase SQL Editor after deployment

-- Option 1: Make the FIRST registered user admin (oldest account)
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE id = (
  SELECT id FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1
);

-- Verify the change
SELECT
  email,
  raw_app_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at ASC
LIMIT 1;

-- ============================================================================
-- Alternative: Make SPECIFIC user admin (replace email below)
-- ============================================================================
-- Uncomment and edit the email address, then run:

-- UPDATE auth.users
-- SET raw_app_meta_data =
--   COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
-- WHERE email = 'your@email.com';

-- ============================================================================
-- View all current admins
-- ============================================================================
SELECT
  email,
  raw_app_meta_data->>'role' as app_role,
  raw_user_meta_data->>'role' as user_role,
  created_at
FROM auth.users
WHERE
  raw_app_meta_data->>'role' = 'admin'
  OR raw_user_meta_data->>'role' = 'admin'
ORDER BY created_at;
