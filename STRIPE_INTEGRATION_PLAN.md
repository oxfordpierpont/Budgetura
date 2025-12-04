# Stripe Integration Plan for Budgetura Billing

**Version:** 1.0
**Date:** December 4, 2025
**Status:** Planning Phase

---

## Overview

This document outlines the complete implementation plan for integrating Stripe payment processing with the Budgetura billing section. The integration will enable:
- Subscription management (Free, Plus, Premium tiers)
- Secure payment processing
- Automatic billing and invoicing
- Customer portal for self-service management
- Webhook handling for subscription events

---

## Prerequisites

### 1. Stripe Account Setup
- [ ] Create Stripe account at https://stripe.com
- [ ] Complete business verification
- [ ] Set up products and pricing in Stripe Dashboard:
  - **Free Plan**: $0/month (no Stripe subscription needed)
  - **Plus Plan**: $9/month (price_plus)
  - **Premium Plan**: $29/month (price_premium)
- [ ] Get API keys:
  - Test mode: `pk_test_...` and `sk_test_...`
  - Production mode: `pk_live_...` and `sk_live_...`
- [ ] Configure webhook endpoint

### 2. Environment Variables
Add to `.env` and Dokploy:
```bash
# Stripe Keys (Frontend - Publishable)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Keys (Backend - Secret) - NEVER expose to frontend!
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Frontend  │────────>│ Supabase Edge    │────────>│   Stripe    │
│  (React)    │         │   Functions      │         │     API     │
└─────────────┘         └──────────────────┘         └─────────────┘
      │                          │                           │
      │                          │                           │
      v                          v                           v
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Stripe.js  │         │    Supabase      │         │  Webhooks   │
│   Library   │         │    Database      │         │             │
└─────────────┘         └──────────────────┘         └─────────────┘
```

---

## Database Schema

### New Tables

#### 1. `subscriptions` Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL, -- 'free', 'plus', 'premium'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'incomplete', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### 2. `invoices` Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  amount_paid INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- 'paid', 'open', 'void', 'uncollectible'
  invoice_pdf TEXT, -- URL to Stripe-hosted PDF
  hosted_invoice_url TEXT, -- URL to Stripe-hosted invoice page
  billing_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all invoices"
  ON invoices FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_stripe_customer ON invoices(stripe_customer_id);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
```

#### 3. Migration File
Create: `supabase/migrations/003_stripe_billing.sql`

---

## Backend Implementation

### Supabase Edge Functions

#### 1. `create-checkout-session` Function
**Purpose**: Create Stripe checkout session for new subscriptions

**Endpoint**: `POST /functions/v1/create-checkout-session`

**Request Body**:
```json
{
  "priceId": "price_plus", // Stripe price ID
  "planId": "plus" // Our internal plan ID
}
```

**Implementation**:
```typescript
// supabase/functions/create-checkout-session/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  try {
    const { priceId, planId } = await req.json();

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Check if customer exists, create if not
    let customerId: string;
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;

      // Save customer ID
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan_id: 'free',
        status: 'incomplete'
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${Deno.env.get('APP_URL')}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('APP_URL')}/settings`,
      metadata: { plan_id: planId, user_id: user.id }
    });

    return new Response(JSON.stringify({ sessionUrl: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

#### 2. `create-customer-portal` Function
**Purpose**: Create Stripe customer portal session for managing subscription

**Endpoint**: `POST /functions/v1/create-customer-portal`

**Implementation**:
```typescript
// supabase/functions/create-customer-portal/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Get customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      throw new Error('No subscription found');
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${Deno.env.get('APP_URL')}/settings`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

#### 3. `stripe-webhooks` Function
**Purpose**: Handle Stripe webhook events

**Endpoint**: `POST /functions/v1/stripe-webhooks`

**Implementation**:
```typescript
// supabase/functions/stripe-webhooks/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role for database writes
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook Error', { status: 400 });
  }

  console.log('Received event:', event.type);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Webhook Error', { status: 500 });
  }
});

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  const planId = subscription.metadata.plan_id;

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    plan_id: planId,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'stripe_subscription_id' });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({
      plan_id: 'free',
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const userId = invoice.metadata?.user_id;
  if (!userId) return;

  await supabase.from('invoices').insert({
    user_id: userId,
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer as string,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status!,
    invoice_pdf: invoice.invoice_pdf || null,
    hosted_invoice_url: invoice.hosted_invoice_url || null,
    billing_reason: invoice.billing_reason || null,
    period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
    period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
    created_at: new Date(invoice.created * 1000).toISOString()
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Update subscription status to past_due
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due', updated_at: new Date().toISOString() })
    .eq('stripe_customer_id', invoice.customer as string);
}
```

---

## Frontend Implementation

### 1. Install Stripe.js
```bash
npm install @stripe/stripe-js
```

### 2. Create Stripe Context
**File**: `src/context/StripeContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase/client';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface Invoice {
  id: string;
  stripe_invoice_id: string;
  amount_paid: number;
  status: string;
  invoice_pdf: string | null;
  created_at: string;
}

interface StripeContextType {
  subscription: Subscription | null;
  invoices: Invoice[];
  loading: boolean;
  createCheckoutSession: (priceId: string, planId: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  refetchSubscription: () => Promise<void>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSubscription(), fetchInvoices()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const createCheckoutSession = async (priceId: string, planId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId, planId }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-customer-portal');

      if (error) throw error;

      // Open portal in new tab
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  };

  return (
    <StripeContext.Provider value={{
      subscription,
      invoices,
      loading,
      createCheckoutSession,
      openCustomerPortal,
      refetchSubscription: fetchSubscription
    }}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) throw new Error('useStripe must be used within StripeProvider');
  return context;
};
```

### 3. Update SettingsView.tsx

Replace hardcoded data with real Stripe data:

```typescript
import { useStripe } from '../src/context/StripeContext';

// Inside component:
const { subscription, invoices, createCheckoutSession, openCustomerPortal } = useStripe();

// Plan pricing mapping
const PLAN_PRICES = {
  plus: 'price_1DEF456...', // Replace with real Stripe price IDs
  premium: 'price_1GHI789...'
};

// Handle upgrade/downgrade
const handlePlanChange = async (planId: string) => {
  if (planId === 'free') {
    // Open customer portal to cancel
    await openCustomerPortal();
  } else {
    const priceId = PLAN_PRICES[planId];
    await createCheckoutSession(priceId, planId);
  }
};

// Download invoice
const handleDownloadInvoice = (invoiceUrl: string) => {
  window.open(invoiceUrl, '_blank');
};
```

### 4. Update App.tsx

Wrap app with StripeProvider:

```typescript
import { StripeProvider } from './src/context/StripeContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StripeProvider>
          <DebtProvider>
            {/* Rest of app */}
          </DebtProvider>
        </StripeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## Security Considerations

### 1. API Key Security
- ✅ **NEVER** expose secret key (`sk_...`) to frontend
- ✅ Use environment variables for all keys
- ✅ Publishable key (`pk_...`) is safe for frontend
- ✅ Use different keys for test/production

### 2. Webhook Security
- ✅ Verify webhook signatures using `stripe-signature` header
- ✅ Use webhook secret to prevent replay attacks
- ✅ Process events idempotently (same event multiple times should be safe)

### 3. User Authorization
- ✅ Verify user authentication in all Edge Functions
- ✅ Check user owns the subscription before modifying
- ✅ Use RLS policies on database tables

### 4. Data Validation
- ✅ Validate all inputs from frontend
- ✅ Verify price IDs exist in Stripe
- ✅ Check plan limits before allowing operations

---

## Testing Plan

### 1. Test Mode Testing
Use Stripe test mode with test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### 2. Test Scenarios
- [ ] Create new subscription (Free → Plus)
- [ ] Upgrade subscription (Plus → Premium)
- [ ] Downgrade subscription (Premium → Plus)
- [ ] Cancel subscription
- [ ] Payment failure handling
- [ ] Invoice generation
- [ ] Webhook delivery
- [ ] Customer portal access

### 3. Stripe CLI Testing
Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhooks
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

---

## Deployment Checklist

### Development
- [ ] Set up Stripe test mode
- [ ] Create test products and prices
- [ ] Deploy Edge Functions
- [ ] Run database migrations
- [ ] Test complete flow end-to-end

### Production
- [ ] Activate Stripe live mode
- [ ] Create production products and prices
- [ ] Update environment variables with live keys
- [ ] Configure production webhook endpoint
- [ ] Deploy to production
- [ ] Monitor Stripe dashboard for events
- [ ] Test with real card (refund immediately)

---

## Implementation Order

### Phase 1: Database Setup (30 mins)
1. Create migration file with subscriptions and invoices tables
2. Run migration on Supabase
3. Test RLS policies

### Phase 2: Stripe Setup (1 hour)
1. Create Stripe account
2. Set up products and prices
3. Get API keys
4. Configure webhook endpoint URL

### Phase 3: Backend (3-4 hours)
1. Create `create-checkout-session` Edge Function
2. Create `create-customer-portal` Edge Function
3. Create `stripe-webhooks` Edge Function
4. Deploy all functions
5. Test with Stripe CLI

### Phase 4: Frontend (2-3 hours)
1. Install @stripe/stripe-js
2. Create StripeContext
3. Update SettingsView with real data
4. Add loading states and error handling
5. Test complete checkout flow

### Phase 5: Testing (2 hours)
1. End-to-end testing in test mode
2. Test all webhook events
3. Test edge cases (payment failures, cancellations)
4. Verify invoice generation

### Phase 6: Production Deployment (1 hour)
1. Switch to live mode
2. Update environment variables
3. Deploy to production
4. Test with real payment (refund immediately)

**Total Estimated Time: 10-12 hours**

---

## Cost Estimate

### Stripe Fees
- **Per transaction**: 2.9% + $0.30
- **Example**: $19.99/month → $0.88 fee = $19.11 net

### Supabase Costs
- Edge Functions: Included in Pro plan ($25/month)
- Database: Minimal storage for subscriptions/invoices

---

## Support & Documentation

### Stripe Resources
- Dashboard: https://dashboard.stripe.com
- Documentation: https://stripe.com/docs
- Testing: https://stripe.com/docs/testing
- Webhooks: https://stripe.com/docs/webhooks

### Supabase Resources
- Edge Functions: https://supabase.com/docs/guides/functions
- RLS: https://supabase.com/docs/guides/auth/row-level-security

---

## Next Steps

1. Review this plan with team
2. Set up Stripe account
3. Create database migration
4. Begin Phase 1 implementation
5. Test thoroughly in development
6. Deploy to production

---

**Status**: Ready to begin implementation
