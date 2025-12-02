import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get Plaid credentials from Vault
async function getPlaidCredentials() {
  // Try environment variables first (for testing/override)
  if (process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET) {
    return {
      clientId: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      env: process.env.PLAID_ENV || 'sandbox'
    };
  }

  // Otherwise, read from Supabase Vault
  const { data: clientIdData } = await supabase
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', 'client_id')
    .single();

  const { data: secretData } = await supabase
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', 'secret')
    .single();

  const { data: envData } = await supabase
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', 'environment')
    .single();

  if (!clientIdData || !secretData) {
    throw new Error('Plaid credentials not found in Vault or environment');
  }

  return {
    clientId: clientIdData.decrypted_secret,
    secret: secretData.decrypted_secret,
    env: envData?.decrypted_secret || 'sandbox'
  };
}

// Initialize Plaid client
let plaidClient;
(async () => {
  try {
    const credentials = await getPlaidCredentials();

    const configuration = new Configuration({
      basePath: credentials.env === 'production'
        ? PlaidEnvironments.production
        : PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': credentials.clientId,
          'PLAID-SECRET': credentials.secret,
        },
      },
    });

    plaidClient = new PlaidApi(configuration);
    console.log(`✅ Plaid client initialized (${credentials.env} mode)`);
  } catch (error) {
    console.error('❌ Failed to initialize Plaid client:', error.message);
    process.exit(1);
  }
})();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'budgetura-plaid-backend' });
});

// Create Plaid Link token
app.post('/api/plaid/create-link-token', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!plaidClient) {
      return res.status(500).json({ error: 'Plaid client not initialized' });
    }

    // Create link token
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'Budgetura',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Error creating Plaid link token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exchange public token for access token
app.post('/api/plaid/exchange-token', async (req, res) => {
  try {
    const { publicToken, userId } = req.body;

    if (!publicToken || !userId) {
      return res.status(400).json({ error: 'Public token and user ID are required' });
    }

    if (!plaidClient) {
      return res.status(500).json({ error: 'Plaid client not initialized' });
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Store the access token and item ID in Supabase
    const { error: dbError } = await supabase
      .from('plaid_items')
      .insert({
        user_id: userId,
        item_id: itemId,
        access_token: accessToken,
        institution_id: accountsResponse.data.item.institution_id,
      });

    if (dbError) {
      console.error('Error storing Plaid item:', dbError);
      throw new Error('Failed to store Plaid connection');
    }

    // Store account information
    for (const account of accountsResponse.data.accounts) {
      await supabase
        .from('plaid_accounts')
        .insert({
          user_id: userId,
          item_id: itemId,
          account_id: account.account_id,
          name: account.name,
          official_name: account.official_name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          current_balance: account.balances.current,
          available_balance: account.balances.available,
        });
    }

    res.json({
      success: true,
      accounts: accountsResponse.data.accounts.length,
    });
  } catch (error) {
    console.error('Error exchanging Plaid token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Plaid backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Create link token: POST http://localhost:${PORT}/api/plaid/create-link-token`);
  console.log(`📍 Exchange token: POST http://localhost:${PORT}/api/plaid/exchange-token`);
});
