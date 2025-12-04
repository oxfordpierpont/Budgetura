// ============================================================================
// Budgetura - Stripe Webhooks Handler
// ============================================================================
// Purpose: Handles webhook events from Stripe to sync subscription/invoice data
// Endpoint: POST /functions/v1/stripe-webhooks
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Initialize Supabase with service role (for database writes)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role has full access
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    // Get the raw body as text for signature verification
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    console.log('Received webhook event:', event.type, 'ID:', event.id);

    // Handle different event types
    try {
      switch (event.type) {
        // Subscription events
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionChange(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        // Invoice events
        case 'invoice.paid':
          await handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.finalized':
          await handleInvoiceFinalized(event.data.object as Stripe.Invoice);
          break;

        // Checkout events
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        // Customer events
        case 'customer.created':
          console.log('Customer created:', (event.data.object as Stripe.Customer).id);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      console.error('Error processing webhook event:', error);
      // Return 200 to acknowledge receipt, but log the error
      return new Response(JSON.stringify({ received: true, error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook Error', { status: 400 });
  }
});

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

/**
 * Handle subscription creation or update
 */
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log('Handling subscription change:', subscription.id);

  const userId = subscription.metadata.user_id;
  const planId = subscription.metadata.plan_id || 'plus'; // Default to plus if not set

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Upsert subscription data
  const { error } = await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan_id: planId,
      status: subscription.status,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'stripe_subscription_id',
    }
  );

  if (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }

  console.log('Subscription updated successfully');
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Handling subscription deletion:', subscription.id);

  // Update subscription to free plan with canceled status
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      plan_id: 'free',
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }

  console.log('Subscription deleted successfully');
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Handling invoice paid:', invoice.id);

  // Get user_id from customer metadata or subscription
  let userId: string | null = null;

  if (invoice.subscription && typeof invoice.subscription === 'string') {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    userId = subscription.metadata.user_id;
  }

  if (!userId) {
    const customer = await stripe.customers.retrieve(invoice.customer as string);
    if ('metadata' in customer) {
      userId = customer.metadata.supabase_user_id;
    }
  }

  if (!userId) {
    console.error('Cannot find user_id for invoice');
    return;
  }

  // Get subscription_id from our database
  const { data: subscriptionData } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('stripe_customer_id', invoice.customer as string)
    .single();

  // Insert invoice record
  const { error } = await supabaseAdmin.from('invoices').upsert(
    {
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_customer_id: invoice.customer as string,
      subscription_id: subscriptionData?.id || null,
      amount_paid: invoice.amount_paid,
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status || 'paid',
      invoice_pdf: invoice.invoice_pdf || null,
      hosted_invoice_url: invoice.hosted_invoice_url || null,
      billing_reason: invoice.billing_reason || null,
      description: invoice.description || null,
      period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null,
      period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      created_at: new Date(invoice.created * 1000).toISOString(),
    },
    {
      onConflict: 'stripe_invoice_id',
    }
  );

  if (error) {
    console.error('Error inserting invoice:', error);
    throw error;
  }

  console.log('Invoice saved successfully');
}

/**
 * Handle invoice finalization (draft becomes final)
 */
async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  console.log('Handling invoice finalized:', invoice.id);
  // Same logic as paid, but status will be 'open'
  await handleInvoicePaid(invoice);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Handling payment failure:', invoice.id);

  // Update subscription status to past_due
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', invoice.customer as string);

  if (error) {
    console.error('Error updating subscription for failed payment:', error);
    throw error;
  }

  console.log('Subscription marked as past_due');

  // Still save the invoice record
  await handleInvoicePaid(invoice);
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Handling checkout completed:', session.id);

  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // The subscription.created/updated event will handle the actual database update
  // This is just for logging/confirmation
  console.log('Checkout completed for user:', userId, 'plan:', planId);
}
