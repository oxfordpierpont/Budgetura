# ✅ Vault Setup Complete - Next Steps

Great! You've successfully created the Plaid secrets in Supabase Vault. I've updated both Edge Functions to read from the Vault.

## What You Created in Vault

At https://supabase.sec-admn.com/project/default/integrations/vault/secrets, you created:

- **client_id** = `6925352b71597c0023c9ae3a`
- **secret** = `ee182357eb440f9e1ac158cd54af34`
- **environment** = `sandbox`

✅ Perfect! These match Plaid's sandbox credentials.

## What I Updated

I've modified both Edge Functions to read from Supabase Vault instead of environment variables:

### Files Updated:
1. [supabase/functions/plaid-create-link-token/index.ts](supabase/functions/plaid-create-link-token/index.ts)
   - Now reads `client_id`, `secret`, and `environment` from Vault
   - Uses `vault.decrypted_secrets` table

2. [supabase/functions/plaid-exchange-token/index.ts](supabase/functions/plaid-exchange-token/index.ts)
   - Same Vault integration
   - Stores bank connections in database

## ⚠️ Important: Edge Functions Need SERVICE_ROLE_KEY

The Edge Functions now need **SERVICE_ROLE_KEY** to read from Vault (not just ANON_KEY).

Check if your Edge Functions have access to `SUPABASE_SERVICE_ROLE_KEY`:

### Where to find it:
1. Go to https://supabase.sec-admn.com
2. Navigate to **Settings** → **API**
3. Look for **service_role** key (secret, never expose publicly)

### How Edge Functions typically access it:
- It's usually automatically available as `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`
- Self-hosted Supabase should have this configured in the Docker/server setup

## Next Steps

### Step 1: Deploy the Updated Edge Functions

Now you need to deploy these updated Edge Functions to Supabase:

**Option A: Copy/Paste in Dashboard (Recommended)**

1. Go to **Edge Functions** in your Supabase dashboard
2. Find `plaid-create-link-token` function (or create it)
3. Copy the entire content from `supabase/functions/plaid-create-link-token/index.ts`
4. Paste and deploy
5. Repeat for `plaid-exchange-token`

**Option B: Using Supabase CLI**

If you have CLI access:
```bash
supabase functions deploy plaid-create-link-token
supabase functions deploy plaid-exchange-token
```

### Step 2: Run the Database Migration

You still need to create the Plaid tables:

1. Go to https://supabase.sec-admn.com → **SQL Editor**
2. Copy the entire content of `supabase/migrations/001_plaid_tables.sql`
3. Paste and **Run**

This creates:
- `plaid_items` table
- `plaid_accounts` table
- `plaid_transactions` table

### Step 3: Test the Integration

Once Edge Functions are deployed and tables created:

1. Deploy the app to Dokploy (code is already pushed to GitHub)
2. Navigate to **Bank Accounts** in the sidebar
3. Click **Connect Bank Account**
4. Plaid Link should open
5. Use test credentials:
   - Username: `user_good`
   - Password: `pass_good`
6. Select "First Platypus Bank" or any test bank
7. Complete the connection

### Step 4: Verify Success

After connecting, check:

1. **In the app**: Connected accounts should appear
2. **In Supabase** → Database → Tables:
   - `plaid_items` should have 1 row (your connection)
   - `plaid_accounts` should have rows for each account you connected

## Troubleshooting

### "Plaid credentials not found in Vault"
- **Cause**: Edge Functions can't read from Vault
- **Fix**: Ensure SERVICE_ROLE_KEY is available to Edge Functions
- **Check**: Supabase logs to see if there's a Vault access error

### "Permission denied for table vault.decrypted_secrets"
- **Cause**: SERVICE_ROLE_KEY not properly configured
- **Fix**: Check your Supabase configuration for service_role key
- **Alternative**: Contact Supabase admin if this is managed

### Edge Functions still show old error
- **Cause**: Functions not redeployed with updated code
- **Fix**: Make sure to deploy the updated versions
- **Verify**: Check function code in dashboard matches local files

## Security Note

⚠️ **About the credentials you shared:**

The credentials you showed (`6925352b71597c0023c9ae3a` and `ee182357eb440f9e1ac158cd54af34`) appear to be Plaid **Sandbox** credentials, which are safe for testing. However:

- **Never share Production credentials** (they can access real banking data)
- **Sandbox credentials** are okay for development but should still be kept private
- **Rotate secrets regularly** for security

Your Sandbox credentials are fine for testing, but be careful with Production keys when you switch!

## Summary

✅ **Completed:**
- Plaid credentials stored in Supabase Vault
- Edge Functions updated to read from Vault
- Code committed and pushed to GitHub

🔧 **Your Tasks:**
1. Deploy updated Edge Functions (copy/paste or CLI)
2. Run database migration SQL
3. Deploy app to Dokploy
4. Test bank connection

📖 **Full deployment guide**: [DEPLOYMENT_STEPS.md](../DEPLOYMENT_STEPS.md)
