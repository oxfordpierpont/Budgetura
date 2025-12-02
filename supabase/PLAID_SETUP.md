# Plaid Integration Setup Guide

This document explains how to set up and deploy the Plaid integration for Budgetura.

## Overview

Budgetura uses Plaid to connect users' bank accounts and automatically sync financial data. The integration consists of:

1. **Supabase Edge Functions** - Backend API endpoints for Plaid operations
2. **Database Tables** - Storage for Plaid items, accounts, and transactions
3. **Frontend Integration** - React components using Plaid Link

## Prerequisites

- Plaid account with API credentials
- Supabase project set up
- Supabase CLI installed (for deploying functions)

## Provided Credentials

- **Client ID**: `6925352b71597c0023c9ae3a`
- **Sandbox Secret**: `Ee182357eb440f9e1ac158cd54af34`
- **Production Secret**: Unqualified (to be provided later)

## Database Setup

### Step 1: Run the Schema Migration

The Plaid tables have been added to `/supabase/schema.sql`. Run this migration in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and execute the Plaid tables section from `schema.sql` (lines 414-514)

This creates:
- `plaid_items` - Stores connected financial institutions
- `plaid_accounts` - Stores bank account details
- `plaid_transactions` - Stores synced transactions

All tables have RLS (Row Level Security) enabled to ensure users can only access their own data.

## Edge Functions Deployment

### Step 2: Deploy the Edge Functions

Install Supabase CLI if you haven't:
```bash
npm install -g supabase
```

Login to Supabase:
```bash
supabase login
```

Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Deploy the functions:
```bash
cd /root/budgetura-analysis
supabase functions deploy plaid-create-link-token
supabase functions deploy plaid-exchange-token
```

### Step 3: Set Environment Variables

Set the Plaid credentials as secrets in Supabase:

```bash
supabase secrets set PLAID_CLIENT_ID=6925352b71597c0023c9ae3a
supabase secrets set PLAID_SECRET=Ee182357eb440f9e1ac158cd54af34
supabase secrets set PLAID_ENV=sandbox
```

For production:
```bash
supabase secrets set PLAID_ENV=production
supabase secrets set PLAID_SECRET=YOUR_PRODUCTION_SECRET
```

## Edge Functions

### plaid-create-link-token

**Endpoint**: `https://YOUR_PROJECT.supabase.co/functions/v1/plaid-create-link-token`

**Purpose**: Creates a Plaid Link token for initiating the bank connection flow.

**Request**:
```json
{
  "userId": "user-uuid-here"
}
```

**Response**:
```json
{
  "link_token": "link-sandbox-xxx..."
}
```

### plaid-exchange-token

**Endpoint**: `https://YOUR_PROJECT.supabase.co/functions/v1/plaid-exchange-token`

**Purpose**: Exchanges a public token for an access token and stores the connection.

**Request**:
```json
{
  "publicToken": "public-sandbox-xxx...",
  "userId": "user-uuid-here"
}
```

**Response**:
```json
{
  "success": true,
  "accounts": 2
}
```

## Frontend Integration

To integrate Plaid Link in the frontend:

1. Install Plaid Link React:
```bash
npm install react-plaid-link
```

2. Create a Plaid integration component (example):

```tsx
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '@/lib/supabase/client';

function PlaidLinkButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // Get link token
  useEffect(() => {
    async function getLinkToken() {
      const { data: { user } } = await supabase.auth.getUser();

      const response = await supabase.functions.invoke('plaid-create-link-token', {
        body: { userId: user?.id }
      });

      setLinkToken(response.data.link_token);
    }
    getLinkToken();
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.functions.invoke('plaid-exchange-token', {
        body: {
          publicToken,
          userId: user?.id
        }
      });

      // Refresh accounts data
      alert('Bank account connected successfully!');
    },
  });

  return (
    <button onClick={() => open()} disabled={!ready}>
      Connect Bank Account
    </button>
  );
}
```

## Testing

### Sandbox Test Credentials

Use these credentials in Plaid's sandbox environment:

- **Username**: `user_good`
- **Password**: `pass_good`
- **Institution**: Search for "Platypus Bank" or any sandbox institution

### Test Flow

1. Click "Connect Bank Account"
2. Search for a test institution (e.g., "Platypus Bank")
3. Enter sandbox credentials
4. Select accounts to connect
5. Complete the flow

## Security Considerations

1. **Access Tokens**: Never expose Plaid access tokens in the frontend
2. **RLS Policies**: All Plaid tables have RLS enabled
3. **Environment Variables**: Always use Supabase secrets for credentials
4. **HTTPS Only**: Edge functions only accept HTTPS requests

## Troubleshooting

### Error: "Plaid credentials not configured"
- Ensure environment variables are set in Supabase secrets
- Redeploy functions after setting secrets

### Error: "Failed to store Plaid connection"
- Check that database tables are created
- Verify RLS policies are in place
- Check Supabase logs for specific error

### Link token creation fails
- Verify PLAID_CLIENT_ID and PLAID_SECRET are correct
- Check that PLAID_ENV matches your credentials (sandbox/production)

## Next Steps

1. Run the database migration to create Plaid tables
2. Deploy the Edge Functions
3. Set environment variables/secrets
4. Add Plaid Link to the frontend
5. Test the integration with sandbox credentials
6. Switch to production when ready

## Support

For Plaid API documentation: https://plaid.com/docs/
For Supabase Edge Functions: https://supabase.com/docs/guides/functions
