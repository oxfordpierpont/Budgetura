# Stripe Integration Setup Guide

**Quick Start Guide for Budgetura Stripe Integration**

This guide will walk you through setting up Stripe payments for Budgetura in **test mode** so you can start testing immediately.

---

## 🚀 Quick Start (15 minutes)

### Step 1: Create Stripe Account

1. Go to https://stripe.com and sign up for a free account
2. Skip business verification (test mode works without it)
3. Go to **Dashboard** → You'll start in test mode automatically

### Step 2: Get Your API Keys

1. In Stripe Dashboard, click **Developers** → **API keys**
2. Copy these two keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

### Step 3: Create Products and Prices

1. Go to **Products** → **Add product**
2. Create 2 products:

   **Plus Plan:**
   - Name: `Plus Plan`
   - Description: `Full debt management suite`
   - Price: `$9.00` USD
   - Billing: `Recurring` → `Monthly`
   - Copy the **Price ID** (starts with `price_...`)

   **Premium Plan:**
   - Name: `Premium Plan`
   - Description: `Everything plus AI & live coaching`
   - Price: `$29.00` USD
   - Billing: `Recurring` → `Monthly`
   - Copy the **Price ID**

### Step 4: Configure Environment Variables

Add these to your Supabase project and Dokploy:

#### Frontend Environment Variables (Dokploy Build Args)
```bash
# Stripe Publishable Key (safe for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Stripe Price IDs
VITE_STRIPE_PRICE_PLUS=price_YOUR_PLUS_PRICE_ID
VITE_STRIPE_PRICE_PREMIUM=price_YOUR_PREMIUM_PRICE_ID
```

#### Backend Environment Variables (Supabase Secrets)

1. Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Add these secrets:

```bash
# Stripe Secret Key (NEVER expose to frontend!)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY

# Stripe Webhook Secret (get this in Step 6)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Your app URL
APP_URL=https://your-app-url.com
```

### Step 5: Run Database Migration

```bash
# Option 1: Via Supabase Dashboard
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of supabase/migrations/002_stripe_billing.sql
# 3. Paste and click "Run"

# Option 2: Via Supabase CLI (if installed)
supabase db push
```

### Step 6: Deploy Edge Functions

```bash
# Navigate to your project
cd /root/Budgetura

# Deploy each function to Supabase
supabase functions deploy create-checkout-session
supabase functions deploy create-customer-portal
supabase functions deploy stripe-webhooks

# Set environment secrets (from Step 4)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set APP_URL=https://your-app-url.com
```

### Step 7: Configure Stripe Webhooks

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhooks`
4. Description: `Budgetura Subscription Events`
5. **Events to send** → Select these:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.finalized`
   - `checkout.session.completed`
6. Click **Add endpoint**
7. Copy the **Signing secret** (starts with `whsec_...`)
8. Add it to Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Step 8: Test the Integration

#### Test with Stripe Test Cards

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Payment Declined:**
- Card: `4000 0000 0000 0002`

**3D Secure Authentication:**
- Card: `4000 0025 0000 3155`

#### Testing Flow

1. **Log into Budgetura**
2. **Go to Settings** → Billing & Subscription
3. **Click "Upgrade"** on Plus or Premium plan
4. **You'll be redirected to Stripe Checkout**
5. **Enter test card info** (4242 4242 4242 4242)
6. **Complete checkout**
7. **You'll be redirected back to Settings**
8. **Verify**:
   - Current plan shows as upgraded
   - Status badge shows "ACTIVE"
   - Next billing date is displayed
9. **Check Stripe Dashboard**:
   - Go to **Payments** → See the test payment
   - Go to **Subscriptions** → See active subscription
10. **Check Supabase Database**:
    - Go to **Table Editor** → `subscriptions` table
    - Verify your subscription record exists
    - Go to `invoices` table
    - Verify invoice record exists

#### Test Customer Portal

1. In Settings, click **"Manage Subscription"**
2. Opens Stripe Customer Portal in new tab
3. You can:
   - Update payment method
   - Cancel subscription
   - View billing history
   - Download invoices

---

## 📊 What You've Built

### Database Tables

1. **subscriptions** - Stores user subscription data
   - Current plan (free, plus, premium)
   - Stripe customer ID
   - Subscription status
   - Billing dates

2. **invoices** - Stores billing history
   - Invoice amounts
   - Payment status
   - PDF download links
   - Invoice dates

### Edge Functions

1. **create-checkout-session** - Creates Stripe checkout for upgrades
2. **create-customer-portal** - Opens Stripe portal for management
3. **stripe-webhooks** - Receives events from Stripe (payments, cancellations)

### Frontend Components

1. **StripeContext** - Manages subscription state
2. **SettingsView** - Displays plans, billing history
3. **Dynamic UI** - Shows current plan, upgrade/downgrade buttons

---

## 🧪 Testing Checklist

- [ ] Plus plan upgrade works
- [ ] Premium plan upgrade works
- [ ] Downgrade to free (via customer portal)
- [ ] Customer portal opens
- [ ] Payment method can be updated
- [ ] Subscription can be canceled
- [ ] Invoice PDF downloads
- [ ] Webhook events arrive (check Supabase logs)
- [ ] Database updates after payment
- [ ] UI updates after successful checkout

---

## 🔍 Troubleshooting

### Issue: "No subscription found to manage"
**Solution**: User hasn't subscribed yet. Subscribe first, then manage.

### Issue: Webhooks not working
**Solutions**:
1. Check webhook endpoint URL is correct
2. Verify webhook secret is set in Supabase
3. Check Supabase Edge Function logs
4. Verify webhook events are selected in Stripe

### Issue: Environment variables not working
**Solutions**:
1. Rebuild frontend with build args: `--build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`
2. Restart Supabase Edge Functions after setting secrets
3. Check variables are spelled correctly (VITE_ prefix for frontend)

### Issue: "Unauthorized" errors
**Solutions**:
1. Make sure user is logged in
2. Check Supabase auth token is being passed
3. Verify RLS policies are set up correctly

---

## 📈 Monitoring

### Stripe Dashboard
- **Payments** - See all test payments
- **Subscriptions** - Active/canceled subscriptions
- **Customers** - User accounts
- **Webhooks** - Event delivery logs

### Supabase Dashboard
- **Table Editor** → `subscriptions` - View user subscriptions
- **Table Editor** → `invoices` - View invoice history
- **Edge Functions** → Logs - See function execution logs
- **Database** → Logs - See webhook processing

---

## 🚀 Going Live (Production)

### When Ready for Real Payments

1. **Activate Stripe Account**
   - Complete business verification
   - Add bank account for payouts
   - Activate live mode in Stripe

2. **Create Live Products**
   - Create same 2 plans in **live mode**
   - Get new live price IDs

3. **Update Environment Variables**
   ```bash
   # Replace test keys with live keys
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...

   # Update price IDs to live prices
   VITE_STRIPE_PRICE_PLUS=price_live_plus
   VITE_STRIPE_PRICE_PREMIUM=price_live_premium
   ```

4. **Create Live Webhook**
   - Add new webhook endpoint with live keys
   - Get new live webhook secret
   - Update STRIPE_WEBHOOK_SECRET

5. **Test with Real Card**
   - Use your own card
   - Subscribe to cheapest plan
   - Verify everything works
   - **Immediately cancel and refund**

6. **Deploy to Production**
   - Deploy with live environment variables
   - Monitor closely for issues
   - Test all flows again

---

## 💰 Stripe Fees

- **Per Transaction**: 2.9% + $0.30
- **Examples**:
  - $9.00 Plus → Fee: $0.56 → You receive: $8.44
  - $29.00 Premium → Fee: $1.14 → You receive: $27.86

---

## 📞 Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Testing**: https://stripe.com/docs/testing
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Budgetura Support**: See STRIPE_INTEGRATION_PLAN.md for detailed technical docs

---

## ✅ Summary

You now have a **complete, working Stripe integration** with:
- ✅ Subscription billing (2 paid plans + free)
- ✅ Secure payment processing
- ✅ Automatic recurring billing
- ✅ Customer portal for self-service
- ✅ Invoice generation and history
- ✅ Webhook event handling
- ✅ Complete UI in Settings page

**Everything is in TEST MODE** - No real money will be charged!

Start testing with the test card `4242 4242 4242 4242` and explore all the features.

When ready for production, follow the "Going Live" section above.

🎉 **Happy Testing!**
