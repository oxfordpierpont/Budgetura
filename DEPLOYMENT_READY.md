# 🚀 DEPLOYMENT READY - Settings Enhancement

**Generated:** December 4, 2025
**Status:** ✅ All code complete - Ready to deploy

---

## ⚡ Quick Deployment (15 minutes)

### Step 1: Deploy Database Migration (5 min)

**Go to Supabase Dashboard:**
1. Open: https://supabase.com/dashboard
2. Select your **Budgetura** project
3. Click **SQL Editor** (left sidebar)
4. Click **New query**

**Run the migration:**
1. Open this file on your server: `/root/Budgetura/supabase/migrations/003_settings_enhancement.sql`
2. Copy ALL contents (451 lines)
3. Paste into Supabase SQL Editor
4. Click **Run** (or Ctrl+Enter)

**Expected Result:**
```
✅ Settings Enhancement Migration (003) completed successfully
```

If you see this message, the migration worked! ✅

---

### Step 2: Add Encryption Key to Vault (2 min)

**Your Generated Encryption Key:**
```
tg+XnR996fIrNqdWxi36KZUDzwlpaMxFcwPjJlsmK/4=
```

**Add to Supabase Vault:**
1. In Supabase Dashboard → **Settings** → **Vault**
2. Click **New secret**
3. Enter:
   - **Name:** `encryption_key`
   - **Secret:** `tg+XnR996fIrNqdWxi36KZUDzwlpaMxFcwPjJlsmK/4=`
4. Click **Add secret**

⚠️ **IMPORTANT:** Keep this key safe! It encrypts all API keys and Plaid credentials.

---

### Step 3: Rebuild Frontend (5 min)

**Option A: Via Dokploy Dashboard**
1. Log into your Dokploy dashboard
2. Find the **Budgetura** application
3. Click **Deployments** tab
4. Click **Redeploy** or **Rebuild**
5. Wait for build to complete (~3 minutes)
6. Verify deployment succeeded

**Option B: Manual Docker Build**
```bash
cd /root/Budgetura

# Build new image
docker build -t budgetura-frontend:latest .

# If using docker-compose
docker-compose down
docker-compose up -d

# Or if running standalone container
docker stop budgetura-frontend
docker rm budgetura-frontend
docker run -d --name budgetura-frontend -p 3000:3000 budgetura-frontend:latest
```

---

## ✅ Verify Deployment

After completing all 3 steps, verify everything works:

### 1. Check Database Migration
Run this in Supabase SQL Editor:
```sql
-- Should return 2 rows (ai_settings, plaid_config)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ai_settings', 'plaid_config');
```

### 2. Test General Configuration
1. Log into Budgetura
2. Go to **Settings**
3. Scroll to **General Configuration**
4. Change currency symbol to `€`
5. Click **Save Changes**
6. Should see: ✅ "Settings saved successfully!"
7. Refresh page - settings should persist

### 3. Test AI Settings
1. In Settings → **AI Financial Coach**
2. Select provider: **OpenRouter**
3. Enter test key: `sk-test-abc123`
4. Click **Save AI Settings**
5. Should see: ✅ "AI settings saved successfully!"
6. Refresh - settings should persist (key will be hidden)

### 4. Check Browser Console
- Press F12 to open DevTools
- Go to Console tab
- Should see NO red errors
- Settings page should load cleanly

---

## 🔧 Optional: Enable Google OAuth

Only needed if you want users to link Google accounts.

**In Supabase Dashboard:**
1. Go to **Authentication** → **Providers**
2. Find **Google** and toggle **Enable**

**In Google Cloud Console:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create **OAuth 2.0 Client ID** (if not exists)
3. Add authorized redirect URI:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   (Replace YOUR_PROJECT_REF with your actual Supabase project reference)
4. Copy **Client ID** and **Client Secret**

**Back in Supabase:**
1. Paste Client ID and Secret into Google provider settings
2. Click **Save**

**Test it:**
1. In Budgetura Settings → Profile section
2. Click **Connect Google Account**
3. Should redirect to Google sign-in
4. After auth, redirects back to Settings

---

## 🎯 What's Now Available

After deployment, your users get:

### ✅ General Configuration
- Custom currency symbol ($, €, £, etc.)
- Default interest rate for calculations
- Debt payoff strategy (Avalanche/Snowball/Custom)
- Snapshot frequency (Weekly/Monthly/Quarterly)
- Email notification preferences

### ✅ AI Financial Coach
- Choose AI provider (OpenRouter, OpenAI, Anthropic)
- Securely stored API keys (encrypted at rest)
- Model selection with custom model support
- Temperature control (0.0 - 1.0)
- Max tokens setting (up to 128k)

### ✅ Plaid Integration (Admin Only)
- Encrypted Plaid Client ID storage
- Encrypted Plaid Secret storage
- Environment selector (Sandbox/Dev/Production)
- Centralized config for all users

### ✅ Google OAuth
- One-click Google account linking
- Seamless authentication
- Account connection status

---

## 📊 Files Deployed

All these files have been updated and are ready:

```
✅ supabase/migrations/003_settings_enhancement.sql    (NEW - 451 lines)
✅ types.ts                                            (MODIFIED)
✅ src/lib/supabase/operations.ts                      (MODIFIED)
✅ context/DebtContext.tsx                             (MODIFIED)
✅ components/SettingsView.tsx                         (MODIFIED)
```

---

## 🚨 Troubleshooting

### ❌ "Encryption key not found in vault"
**Fix:** Make sure you added the encryption_key to Supabase Vault (Step 2)

### ❌ "Failed to save AI settings"
**Fix:**
- Verify migration ran successfully (check SQL Editor history)
- Confirm ai_settings table exists
- Try running migration again

### ❌ Settings don't save
**Fix:**
- Check browser console for errors (F12)
- Verify Supabase connection is working
- Check Network tab for failed requests

### ❌ Frontend not updating
**Fix:**
- Clear browser cache (Ctrl+Shift+R)
- Verify Docker container restarted
- Check if new build deployed successfully

---

## 📝 Rollback Instructions

If you need to rollback, run this in Supabase SQL Editor:

```sql
-- Remove new tables
DROP TABLE IF EXISTS ai_settings CASCADE;
DROP TABLE IF EXISTS plaid_config CASCADE;

-- Remove added columns
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

Then rebuild frontend with previous code.

---

## 🎉 Success!

Once all steps are complete:

✅ Database migration applied
✅ Encryption key configured
✅ Frontend rebuilt and deployed
✅ All settings sections working
✅ No console errors
✅ Settings persist after refresh

**Your extended settings page is now live!** 🚀

---

## 📞 Need Help?

- **Full Documentation:** `/root/Budgetura/DEPLOYMENT_INSTRUCTIONS.md`
- **Quick Guide:** `/root/Budgetura/DEPLOY_NOW.md`
- **Supabase Docs:** https://supabase.com/docs
- **Check Logs:** Supabase Dashboard → Logs

---

**Encryption Key (Save This):** `tg+XnR996fIrNqdWxi36KZUDzwlpaMxFcwPjJlsmK/4=`

**Deployment Time:** ~15 minutes
**Risk Level:** Low (all changes have rollback)
**Testing Required:** Yes (verify each section works)
