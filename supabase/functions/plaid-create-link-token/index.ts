import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'npm:plaid@15.0.0';

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

    // Get user ID from request
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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

    return new Response(
      JSON.stringify({ link_token: response.data.link_token }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error creating Plaid link token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
