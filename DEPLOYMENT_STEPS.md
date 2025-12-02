# Plaid Integration - Deployment Steps

## ✅ Completed (Already Done)

### Code Implementation
- ✅ Database schema created ([supabase/migrations/001_plaid_tables.sql](supabase/migrations/001_plaid_tables.sql))
- ✅ TypeScript types added ([types.ts:205-249](types.ts))
- ✅ Backend operations implemented ([src/lib/supabase/operations.ts:375-456](src/lib/supabase/operations.ts))
- ✅ Frontend components created:
  - [components/PlaidLink.tsx](components/PlaidLink.tsx) - Connect bank button
  - [components/BankAccounts.tsx](components/BankAccounts.tsx) - Bank accounts view
  - [src/hooks/usePlaid.ts](src/hooks/usePlaid.ts) - Plaid data hook
- ✅ UI integration completed:
  - Bank Accounts added to [App.tsx](App.tsx) routing
  - Navigation item added to [Sidebar.tsx](components/Sidebar.tsx)
- ✅ Dependency added to [package.json](package.json) - `react-plaid-link`
- ✅ All code committed and pushed to GitHub
- ✅ Documentation created
- ✅ **Plaid credentials stored in Supabase Vault**
- ✅ **Edge Functions updated to read from Vault**

## 🔧 Manual Steps Required (You Need To Do)

### ~~Step 1: Get Plaid Credentials~~ ✅ DONE
You've already signed up for Plaid and obtained sandbox credentials.

### ~~Step 2: Configure Vault Secrets~~ ✅ DONE
You've successfully stored these in Supabase Vault:
- `client_id` = Your Plaid Client ID
- `secret` = Your Plaid Sandbox Secret
- `environment` = `sandbox`

📖 **Details**: [supabase/VAULT_SETUP_COMPLETE.md](supabase/VAULT_SETUP_COMPLETE.md)

### Step 1: Run Database Migration (NEXT STEP)

**Using Supabase Dashboard:**
1. Go to https://supabase.sec-admn.com
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/001_plaid_tables.sql`
5. Paste into the query editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify success - you should see "Success. No rows returned"
8. Go to **Database > Tables** to confirm these tables exist:
   - `plaid_items`
   - `plaid_accounts`
   - `plaid_transactions`

### Step 2: Deploy Edge Functions (NEXT STEP)

**Option A: Using Supabase Dashboard (Recommended)**

1. In Supabase dashboard, go to **Edge Functions**
2. Click **Create Function**

**First Function:**
- **Name**: `plaid-create-link-token`
- **Copy code from**: `supabase/functions/plaid-create-link-token/index.ts`
- Click **Deploy**

**Second Function:**
- Click **Create Function** again
- **Name**: `plaid-exchange-token`
- **Copy code from**: `supabase/functions/plaid-exchange-token/index.ts`
- Click **Deploy**

**Option B: Using Supabase CLI (If installed)**

If you have the Supabase CLI installed locally:
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy plaid-create-link-token
supabase functions deploy plaid-exchange-token
```

### Step 3: Deploy to Dokploy

The code is already pushed to GitHub. Dokploy should automatically:
1. Detect the new commit
2. Pull the latest code
3. Run `npm install` (installs react-plaid-link dependency)
4. Build the app
5. Deploy the new version

**Manual deployment (if needed):**
1. Go to your Dokploy dashboard
2. Find the Budgetura project
3. Click **Redeploy** or **Rebuild**
4. Wait for deployment to complete

### Step 4: Test the Integration

**Once deployed:**
1. Go to your deployed Budgetura app
2. Log in to your account
3. Click **Bank Accounts** in the sidebar (new menu item)
4. Click **Connect Bank Account** button
5. Plaid Link modal should appear

**Use Plaid Sandbox test credentials:**
- Username: `user_good`
- Password: `pass_good`
- Select any test bank (e.g., "First Platypus Bank")
- Select one or more accounts
- Click **Continue**

**Verify success:**
1. Bank accounts should appear in the UI
2. Check Supabase dashboard → **Database > Tables > plaid_items**
   - Should see 1 row with your connection
3. Check **plaid_accounts** table
   - Should see rows for each connected account

## 🔍 Verification Checklist

Use this checklist to verify everything is working:

- [ ] Database migration ran successfully
- [ ] Three Plaid tables exist in database (`plaid_items`, `plaid_accounts`, `plaid_transactions`)
- [ ] Plaid secrets configured in Supabase (`PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`)
- [ ] Both Edge Functions deployed (`plaid-create-link-token`, `plaid-exchange-token`)
- [ ] `npm install` completed (react-plaid-link installed)
- [ ] App deployed to Dokploy successfully
- [ ] Bank Accounts menu item visible in sidebar
- [ ] Clicking "Connect Bank Account" opens Plaid Link
- [ ] Can complete connection with test credentials
- [ ] Connected accounts appear in UI after linking
- [ ] Data visible in Supabase database tables

## 🐛 Troubleshooting

### "Plaid credentials not configured" error
- **Cause:** Secrets not set in Supabase
- **Fix:** Go to Supabase → Settings → Edge Functions → Secrets and add the three secrets
- **Verify:** Secret names must be exact: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`
- **Note:** You may need to redeploy Edge Functions after adding secrets

### "Failed to create link token" error
- **Cause:** Edge Function not deployed or has errors
- **Fix:** Check Edge Function logs in Supabase dashboard
- **Verify:** Function is deployed and shows as "Active"
- **Check:** Plaid credentials are valid (try them in Plaid dashboard)

### "Failed to store Plaid connection" error
- **Cause:** Database tables don't exist or RLS policies blocking
- **Fix:** Verify migration ran successfully
- **Check:** Tables exist and have correct structure
- **Verify:** User is authenticated (logged in)

### Bank Accounts page blank or won't load
- **Cause:** npm dependencies not installed
- **Fix:** Run `npm install` locally and redeploy
- **Check:** Browser console for errors
- **Verify:** `react-plaid-link` is in package.json dependencies

### Plaid Link modal doesn't open
- **Cause:** JavaScript errors or missing dependencies
- **Fix:** Check browser console for errors
- **Verify:** react-plaid-link loaded correctly
- **Clear:** Browser cache and hard refresh (Ctrl+Shift+R)

## 📚 Additional Resources

- [Plaid Quickstart Guide](https://plaid.com/docs/quickstart/)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deployment Guide](supabase/PLAID_DEPLOYMENT.md)
- [Implementation Summary](PLAID_IMPLEMENTATION_SUMMARY.md)

## 🎯 Next Steps After Testing

Once basic integration works:
1. Test with multiple bank accounts
2. Test disconnect functionality
3. Implement transaction sync (future enhancement)
4. Add bank balances to main dashboard
5. Switch to Production Plaid credentials for live use

## ⚠️ Security Reminders

- **Never commit Plaid credentials to Git** (they're in Supabase secrets, not code)
- Use **Sandbox** for all testing
- Switch to **Production** only when ready for real banking data
- **Regularly rotate** API secrets
- **Monitor** Edge Function logs for suspicious activity
