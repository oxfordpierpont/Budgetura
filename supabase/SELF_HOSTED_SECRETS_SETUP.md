# Configuring Plaid Secrets for Self-Hosted Supabase

Since you're using a self-hosted Supabase instance (supabase.sec-admn.com), the secrets configuration is different from Supabase Cloud.

## Method 1: Supabase Dashboard - Project Settings (Recommended)

### Option A: Check Project Settings
1. Go to https://supabase.sec-admn.com
2. Select your project (Budgetura)
3. Look for **Project Settings** (gear icon or settings link)
4. Navigate to one of these sections:
   - **API** section
   - **Vault** section (for secrets)
   - **Functions** section
   - **Configuration** section

### Option B: Edge Functions Section
1. Go to **Edge Functions** in the left sidebar
2. Click on one of your deployed functions
3. Look for:
   - **Environment Variables** tab
   - **Secrets** section
   - **Configuration** or **Settings** within the function

### What to add:
```
PLAID_CLIENT_ID=your_plaid_client_id_here
PLAID_SECRET=your_plaid_sandbox_secret_here
PLAID_ENV=sandbox
```

## Method 2: Using Supabase CLI (If you have access to the server)

If you have SSH access to the server running Supabase:

### Step 1: Set secrets via CLI
```bash
# Set secrets for Edge Functions
supabase secrets set PLAID_CLIENT_ID=your_client_id
supabase secrets set PLAID_SECRET=your_secret
supabase secrets set PLAID_ENV=sandbox

# Verify secrets are set
supabase secrets list
```

### Step 2: Restart Edge Functions
```bash
# Restart to pick up new secrets
supabase functions serve --reload
```

## Method 3: Docker Environment Variables (Server-level)

If Supabase is running in Docker, you may need to add secrets to the Docker configuration:

### Edit docker-compose.yml
Add environment variables to the functions service:

```yaml
services:
  functions:
    environment:
      - PLAID_CLIENT_ID=your_client_id
      - PLAID_SECRET=your_secret
      - PLAID_ENV=sandbox
```

Then restart:
```bash
docker-compose restart functions
```

## Method 4: Environment File in Functions Directory

Create a `.env` file in your Edge Functions:

### Create `.env.local` file
```bash
# In your supabase/functions directory
cd /root/Budgetura/supabase/functions
echo "PLAID_CLIENT_ID=your_client_id" > .env.local
echo "PLAID_SECRET=your_secret" >> .env.local
echo "PLAID_ENV=sandbox" >> .env.local
```

**Note:** Make sure `.env.local` is in `.gitignore`!

## Method 5: Hardcode Temporarily (NOT RECOMMENDED for Production)

For **testing only**, you can temporarily hardcode the values:

### Edit Edge Function directly
In `supabase/functions/plaid-create-link-token/index.ts`:

```typescript
// TEMPORARY - FOR TESTING ONLY
const PLAID_CLIENT_ID = 'your_client_id_here';
const PLAID_SECRET = 'your_sandbox_secret_here';
const PLAID_ENV = 'sandbox';
```

**⚠️ WARNING:** Remove these before committing to Git!

## Recommended Steps for Your Setup

### Step 1: Check Dashboard UI
1. Go to https://supabase.sec-admn.com
2. Navigate through all these sections and report what you see:
   - **Project Settings** → look for Environment Variables or Secrets
   - **Edge Functions** → click a function → look for Configuration
   - **API Settings** → look for Environment or Secrets
   - **Database** → look for Vault or Secrets

### Step 2: If Dashboard doesn't have it
Ask your Supabase administrator or check:
- How are other environment variables configured?
- Is there a configuration file for the Supabase instance?
- Do you have access to the server/Docker setup?

### Step 3: Alternative - Database Vault (Supabase Vault)

Supabase has a built-in Vault for secrets:

```sql
-- Insert secrets into Supabase Vault
SELECT vault.create_secret('PLAID_CLIENT_ID', 'your_client_id');
SELECT vault.create_secret('PLAID_SECRET', 'your_secret');
SELECT vault.create_secret('PLAID_ENV', 'sandbox');

-- Then modify Edge Functions to read from Vault
```

Then update your Edge Functions to read from Vault instead of environment variables.

## Verification

After configuring secrets, test them:

### Test Edge Function
```bash
curl -X POST https://supabase.sec-admn.com/functions/v1/plaid-create-link-token \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'
```

If secrets are configured correctly, you should get a response with a link_token.

If you get "Plaid credentials not configured", the secrets aren't accessible to the Edge Functions.

## Need Help?

**What to check:**
1. What Supabase version are you running? (check bottom of dashboard)
2. Is this Supabase hosted on Docker, Kubernetes, or managed hosting?
3. Do you have admin access to the server?
4. Can you see any existing environment variables in the dashboard?

**Next steps:**
- Screenshot where you looked in the dashboard
- Check if you have access to the hosting configuration
- Contact your Supabase administrator if this is managed by someone else
