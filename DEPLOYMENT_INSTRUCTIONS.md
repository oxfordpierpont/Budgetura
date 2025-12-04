# Settings Enhancement Deployment Guide

**Date:** December 4, 2025
**Migration:** 003_settings_enhancement.sql

## ✅ Changes Implemented

All code changes are complete and ready for deployment:

1. ✅ Database migration created
2. ✅ Backend operations updated
3. ✅ Type definitions extended
4. ✅ Context layer updated
5. ✅ UI components fully functional

## 🚀 Deployment Steps

### Step 1: Deploy Database Migration

**Option A: Via Supabase Dashboard (Recommended)**

1. Log into your Supabase Dashboard: https://supabase.com/dashboard
2. Select your Budgetura project
3. Go to **SQL Editor** (left sidebar)
4. Click **New query**
5. Copy the entire contents of `/root/Budgetura/supabase/migrations/003_settings_enhancement.sql`
6. Paste into the SQL editor
7. Click **Run** (or press `Ctrl+Enter`)
8. Verify you see success message: "Settings Enhancement Migration (003) completed successfully"

**Option B: Via Supabase CLI (If installed)**

```bash
cd /root/Budgetura
supabase db push
```

### Step 2: Configure Encryption Key in Supabase Vault

The encryption key is required for AI settings and Plaid configuration to work.

1. In Supabase Dashboard, go to **Project Settings** → **Vault**
2. Click **New secret**
3. Enter the following:
   - **Name:** `encryption_key`
   - **Secret:** Generate a secure random key (see below)
4. Click **Add secret**

**Generate a secure encryption key:**

Run this command on your server:
```bash
openssl rand -base64 32
```

Or use this online tool: https://generate-random.org/encryption-key-generator

**Example output:**
```
xK7pQ9mN2vL5tR8wY4aF6bG1cH3dJ0eS9fT2gU5hV8i=
```

Copy this key and add it to Supabase Vault.

### Step 3: Enable Google OAuth (Optional)

Only needed if users want to link Google accounts.

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list and click to expand
3. Toggle **Enable Google provider**
4. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
5. Create OAuth 2.0 Client ID (if not already done):
   - Application type: **Web application**
   - Authorized redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
6. Copy **Client ID** and **Client Secret** from Google
7. Paste them into Supabase Google provider settings
8. Click **Save**

### Step 4: Rebuild and Deploy Frontend

The code changes are already in place. You just need to rebuild the Docker container.

**Via Dokploy:**

1. Log into your Dokploy dashboard
2. Find your Budgetura application
3. Go to the **Deployments** tab
4. Click **Redeploy** or **Rebuild**
5. Wait for the build to complete
6. Verify the new Settings page loads correctly

**Manually via Docker:**

```bash
cd /root/Budgetura
docker build -t budgetura-frontend .
docker stop budgetura-frontend
docker rm budgetura-frontend
docker run -d --name budgetura-frontend -p 3000:3000 budgetura-frontend
```

## 🧪 Testing Checklist

After deployment, test each feature:

### General Configuration
- [ ] Navigate to Settings page
- [ ] General Configuration section visible
- [ ] Change Currency Symbol to €
- [ ] Set Default Interest Rate to 20.0
- [ ] Change Payoff Strategy to Snowball
- [ ] Change Snapshot Frequency to Weekly
- [ ] Toggle Email Notifications
- [ ] Click "Save Changes"
- [ ] Verify toast notification shows "Settings saved successfully"
- [ ] Refresh page - settings should persist

### AI Settings
- [ ] AI Financial Coach section visible
- [ ] Change AI Provider to OpenAI
- [ ] Enter a test API key (e.g., sk-test123)
- [ ] Select model: GPT-4o
- [ ] Adjust Temperature slider to 0.5
- [ ] Set Max Tokens to 4000
- [ ] Click "Save AI Settings"
- [ ] Verify toast notification shows success
- [ ] Refresh page - provider, model, temperature, and tokens should persist
- [ ] API key input should be empty (for security)
- [ ] Should show "(Configured)" next to API Key label

### Plaid Integration (Admin Only)
- [ ] Log in with an admin account
- [ ] Plaid Integration section should be visible
- [ ] Select Environment: Sandbox
- [ ] Enter test Client ID
- [ ] Enter test Secret
- [ ] Click "Save Plaid Configuration"
- [ ] Verify toast notification shows success
- [ ] Log out and log in as regular user
- [ ] Plaid Integration section should NOT be visible

### Google OAuth
- [ ] Go to Settings → Profile & Security section
- [ ] Click "Connect Google Account" button
- [ ] Should redirect to Google sign-in
- [ ] Complete Google authentication
- [ ] Should redirect back to Settings
- [ ] Button should now say "Google Account Connected"

## 🔍 Troubleshooting

### Error: "Encryption key not found in vault"

**Cause:** Encryption key not configured in Supabase Vault

**Fix:**
1. Go to Supabase Dashboard → Settings → Vault
2. Add secret named `encryption_key` with a random 32-byte key
3. Retry the operation

### Error: "Failed to save AI settings"

**Cause:** Database migration not applied or RLS policies blocking access

**Fix:**
1. Check SQL Editor logs in Supabase Dashboard
2. Verify migration 003 ran successfully
3. Check that ai_settings table exists
4. Verify RLS policies are applied

### Google OAuth not working

**Cause:** Provider not configured or redirect URL mismatch

**Fix:**
1. Verify Google provider is enabled in Supabase Auth settings
2. Check redirect URL matches exactly in Google Cloud Console
3. Ensure Client ID and Secret are correct

### Plaid section not visible (when it should be)

**Cause:** User doesn't have admin role

**Fix:**
1. Go to Supabase Dashboard → Authentication → Users
2. Find your user
3. Edit **raw_user_meta_data** or **raw_app_meta_data**
4. Add: `{"role": "admin"}`
5. Save and refresh the page

## 📊 Database Verification

Verify the migration worked correctly:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ai_settings', 'plaid_config');

-- Check if user_profiles columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN (
  'currency_symbol',
  'default_interest_rate',
  'payoff_strategy',
  'snapshot_frequency',
  'email_notifications'
);

-- Check if encryption functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('encrypt_secret', 'decrypt_secret');

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('ai_settings', 'plaid_config');
```

All queries should return results. If any return empty, the migration may not have run completely.

## ✅ Success Criteria

You'll know the deployment was successful when:

- ✅ No database errors in Supabase logs
- ✅ All three settings sections visible and functional
- ✅ Settings save and persist after page refresh
- ✅ Toast notifications appear on save
- ✅ No console errors in browser DevTools
- ✅ Google OAuth redirects work
- ✅ Admin-only sections respect access control

## 🎉 Post-Deployment

After successful deployment, you can:

1. **Configure AI Settings** - Add your OpenRouter, OpenAI, or Anthropic API key
2. **Set Plaid Credentials** (Admin) - Add production Plaid credentials
3. **Customize Settings** - Set your preferred currency, interest rate, payoff strategy
4. **Enable Notifications** - Toggle email notifications on/off

## 📝 Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Remove new tables
DROP TABLE IF EXISTS ai_settings CASCADE;
DROP TABLE IF EXISTS plaid_config CASCADE;

-- Remove columns from user_profiles
ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS currency_symbol,
  DROP COLUMN IF EXISTS default_interest_rate,
  DROP COLUMN IF EXISTS payoff_strategy,
  DROP COLUMN IF EXISTS snapshot_frequency,
  DROP COLUMN IF EXISTS email_notifications;

-- Remove functions
DROP FUNCTION IF EXISTS encrypt_secret(TEXT);
DROP FUNCTION IF EXISTS decrypt_secret(TEXT);
DROP FUNCTION IF EXISTS save_ai_settings_encrypted;
DROP FUNCTION IF EXISTS get_ai_settings_decrypted;
DROP FUNCTION IF EXISTS save_plaid_config_encrypted;
DROP FUNCTION IF EXISTS get_plaid_config_decrypted;
```

Then redeploy the frontend without the changes.

## 📞 Support

If you encounter issues:

1. Check Supabase Dashboard → Logs for database errors
2. Check browser DevTools Console for frontend errors
3. Verify all deployment steps were completed
4. Review the troubleshooting section above

---

**Generated:** December 4, 2025
**Version:** 1.0
**Migration:** 003_settings_enhancement.sql
