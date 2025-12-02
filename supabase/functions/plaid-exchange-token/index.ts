import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, PlaidApi, PlaidEnvironments } from 'npm:plaid@15.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client to read from Vault
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get Plaid credentials from Supabase Vault
    // Note: The user created secrets named: client_id, secret, environment
    const { data: clientIdData, error: clientIdError } = await supabaseClient
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', 'client_id')
      .single();

    const { data: secretData, error: secretError } = await supabaseClient
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', 'secret')
      .single();

    const { data: envData, error: envError } = await supabaseClient
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', 'environment')
      .single();

    if (clientIdError || secretError || !clientIdData || !secretData) {
      throw new Error('Plaid credentials not found in Vault');
    }

    const PLAID_CLIENT_ID = clientIdData.decrypted_secret;
    const PLAID_SECRET = secretData.decrypted_secret;
    const PLAID_ENV = envData?.decrypted_secret || 'sandbox';

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      throw new Error('Plaid credentials not configured');
    }

    // Initialize Plaid client
    const configuration = new Configuration({
      basePath: PLAID_ENV === 'production'
        ? PlaidEnvironments.production
        : PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
          'PLAID-SECRET': PLAID_SECRET,
        },
      },
    });

    const plaidClient = new PlaidApi(configuration);

    // Get public token and user ID from request
    const { publicToken, userId } = await req.json();

    if (!publicToken || !userId) {
      return new Response(
        JSON.stringify({ error: 'Public token and user ID are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
    // (supabaseClient already initialized at the top for Vault access)
    const { error: dbError } = await supabaseClient
      .from('plaid_items')
      .insert({
        user_id: userId,
        item_id: itemId,
        access_token: accessToken,
        institution_id: accountsResponse.data.item.institution_id,
      });

    if (dbError) {
      console.error('Error storing Plaid data:', dbError);
      throw new Error('Failed to store Plaid connection');
    }

    // Store account information
    for (const account of accountsResponse.data.accounts) {
      await supabaseClient
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

    return new Response(
      JSON.stringify({
        success: true,
        accounts: accountsResponse.data.accounts.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error exchanging Plaid token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
