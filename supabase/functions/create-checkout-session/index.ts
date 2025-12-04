// ============================================================================
// Budgetura - Create Stripe Checkout Session
// ============================================================================
// Purpose: Creates a Stripe checkout session for subscription purchase/upgrade
// Endpoint: POST /functions/v1/create-checkout-session
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// CORS headers for frontend requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe with secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Stripe Price IDs for test mode
// Replace these with your actual Stripe test price IDs after creating products
const PRICE_IDS = {
  basic: Deno.env.get('STRIPE_PRICE_BASIC') || 'price_1ABC123basic',
  plus: Deno.env.get('STRIPE_PRICE_PLUS') || 'price_1DEF456plus',
  premium: Deno.env.get('STRIPE_PRICE_PREMIUM') || 'price_1GHI789premium',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const { priceId, planId } = await req.json();

    console.log('Creating checkout session for:', { priceId, planId });

    // Validate inputs
    if (!priceId || !planId) {
      throw new Error('Missing required parameters: priceId and planId');
    }

    if (!['basic', 'plus', 'premium'].includes(planId)) {
      throw new Error('Invalid plan_id. Must be: basic, plus, or premium');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized - invalid or missing user token');
    }

    console.log('User authenticated:', user.id);

    // Check if customer already exists in our database
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .single();

    let customerId: string;

    if (existingSubscription?.stripe_customer_id) {
      // Use existing customer
      customerId = existingSubscription.stripe_customer_id;
      console.log('Using existing Stripe customer:', customerId);

      // If user already has an active subscription, we need to handle upgrade/downgrade
      if (existingSubscription.stripe_subscription_id && existingSubscription.status === 'active') {
        console.log('User has active subscription, redirecting to customer portal for changes');
        // Instead of creating new checkout, redirect to customer portal
        throw new Error('User already has an active subscription. Please use the customer portal to make changes.');
      }
    } else {
      // Create new Stripe customer
      console.log('Creating new Stripe customer for user:', user.email);

      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;
      console.log('Created Stripe customer:', customerId);

      // Save customer ID to database with free plan
      const { error: insertError } = await supabaseClient.from('subscriptions').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan_id: 'free',
        status: 'incomplete',
      });

      if (insertError) {
        console.error('Error saving subscription:', insertError);
        // Continue anyway - webhook will fix it
      }
    }

    // Create Stripe checkout session
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${appUrl}/settings?canceled=true`,
      metadata: {
        plan_id: planId,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          plan_id: planId,
          user_id: user.id,
        },
      },
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'auto',
    });

    console.log('Checkout session created:', session.id);

    // Return the checkout URL
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        sessionUrl: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred creating checkout session',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
