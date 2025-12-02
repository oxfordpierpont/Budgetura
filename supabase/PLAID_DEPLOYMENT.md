# Plaid Integration Deployment Guide

This guide will help you deploy the Plaid integration for Budgetura.

## Prerequisites

- Plaid account (sign up at https://plaid.com)
- Plaid API credentials (Client ID and Secret)
- Access to Supabase dashboard at https://supabase.sec-admn.com

## Step 1: Create Database Tables

1. Go to your Supabase dashboard: https://supabase.sec-admn.com
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the entire contents of `/supabase/migrations/001_plaid_tables.sql`
5. Click **Run** to execute the migration
6. Verify tables were created by going to **Database > Tables** and checking for:
   - `plaid_items`
   - `plaid_accounts`
   - `plaid_transactions`

## Step 2: Configure Plaid API Secrets

1. Get your Plaid credentials:
   - Go to https://dashboard.plaid.com
   - Navigate to **Team Settings > Keys**
   - Copy your **Client ID** and **Secret** (use Sandbox for testing, Production for live)

2. Add secrets to Supabase:
   - In Supabase dashboard, go to **Settings > Edge Functions**
   - Scroll to **Secrets**
   - Add the following secrets:

   ```
   PLAID_CLIENT_ID=your_client_id_here
   PLAID_SECRET=your_secret_here
   PLAID_ENV=sandbox
   ```

   Note: Set `PLAID_ENV` to `production` when ready for live use.

## Step 3: Deploy Edge Functions

Since Supabase CLI is not installed, you'll need to deploy the Edge Functions manually through the Supabase dashboard:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **Edge Functions** in your Supabase dashboard
2. Click **New Function**
3. For the first function:
   - **Name**: `plaid-create-link-token`
   - **Code**: Copy from `/supabase/functions/plaid-create-link-token/index.ts`
   - Click **Deploy**
4. Repeat for the second function:
   - **Name**: `plaid-exchange-token`
   - **Code**: Copy from `/supabase/functions/plaid-exchange-token/index.ts`
   - Click **Deploy**

### Option B: Using Supabase CLI (If available)

If you install the Supabase CLI later:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy Edge Functions
supabase functions deploy plaid-create-link-token
supabase functions deploy plaid-exchange-token
```

## Step 4: Install Plaid React SDK

The frontend needs the Plaid Link SDK:

```bash
npm install react-plaid-link
```

This will be installed automatically when you run `npm install` after the frontend component is added.

## Step 5: Test the Integration

1. Build and deploy the app
2. Log in to your account
3. Navigate to the Bank Accounts section (will be added in frontend component)
4. Click "Connect Bank Account"
5. Test with Plaid Sandbox credentials:
   - Username: `user_good`
   - Password: `pass_good`
   - Select any test bank
   - Complete the flow

6. Verify in Supabase dashboard:
   - Go to **Database > Tables > plaid_items**
   - You should see a new row with your connection
   - Check `plaid_accounts` for imported accounts

## Verification Checklist

- [ ] Database tables created successfully
- [ ] Plaid secrets configured in Supabase
- [ ] Edge Functions deployed
- [ ] Plaid React SDK installed
- [ ] Frontend component integrated
- [ ] Test connection successful in Sandbox mode
- [ ] Data visible in Supabase tables

## Troubleshooting

### "Plaid credentials not configured" error
- Verify secrets are set in Supabase Edge Functions settings
- Check secret names match exactly: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`
- Redeploy Edge Functions after adding secrets

### "Failed to store Plaid connection" error
- Verify database tables exist
- Check RLS policies are enabled
- Ensure user is authenticated

### Edge Functions return 500 error
- Check Edge Function logs in Supabase dashboard
- Verify Plaid credentials are valid
- Check Plaid dashboard for API errors

## Next Steps

After successful deployment:

1. Test with real bank account (switch to Production credentials)
2. Implement transaction sync
3. Add bank balance to dashboard
4. Set up automatic transaction categorization

## Security Notes

- **Never commit Plaid credentials to Git**
- Access tokens are stored encrypted in Supabase
- RLS policies ensure users only see their own data
- Use Production credentials only when ready for live banking data
