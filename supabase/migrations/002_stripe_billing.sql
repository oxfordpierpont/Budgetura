-- ============================================================================
-- Budgetura - Stripe Billing Tables Migration
-- Version: 002
-- Created: 2025-12-04
-- Description: Creates tables and policies for Stripe subscription billing
-- ============================================================================

-- ============================================================================
-- 1. SUBSCRIPTIONS TABLE
-- ============================================================================
-- Stores user subscription information synced from Stripe

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'basic', 'plus', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add helpful comment
COMMENT ON TABLE subscriptions IS 'Stores user subscription data synced from Stripe';
COMMENT ON COLUMN subscriptions.plan_id IS 'Internal plan identifier: free, basic, plus, premium';
COMMENT ON COLUMN subscriptions.status IS 'Stripe subscription status';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID (cus_...)';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID (sub_...)';

-- ============================================================================
-- 2. INVOICES TABLE
-- ============================================================================
-- Stores invoice records from Stripe for billing history

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount_paid INTEGER NOT NULL, -- in cents
  amount_due INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  invoice_pdf TEXT, -- URL to Stripe-hosted PDF
  hosted_invoice_url TEXT, -- URL to Stripe-hosted invoice page
  billing_reason TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
);

-- Add helpful comment
COMMENT ON TABLE invoices IS 'Stores invoice records from Stripe for billing history';
COMMENT ON COLUMN invoices.amount_paid IS 'Amount paid in cents (e.g., 1999 = $19.99)';
COMMENT ON COLUMN invoices.amount_due IS 'Amount due in cents';
COMMENT ON COLUMN invoices.invoice_pdf IS 'URL to downloadable PDF invoice';
COMMENT ON COLUMN invoices.hosted_invoice_url IS 'URL to view invoice on Stripe';

-- ============================================================================
-- 3. INDEXES
-- ============================================================================
-- Optimize common queries

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_customer ON invoices(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on both tables

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS POLICIES - SUBSCRIPTIONS
-- ============================================================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription (for initial free tier setup)
CREATE POLICY "Users can insert own subscription"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for webhook updates)
CREATE POLICY "Service role has full access to subscriptions"
  ON subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 6. RLS POLICIES - INVOICES
-- ============================================================================

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices"
  ON invoices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for webhook inserts)
CREATE POLICY "Service role has full access to invoices"
  ON invoices
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. UPDATED_AT TRIGGER
-- ============================================================================
-- Automatically update updated_at timestamp on subscriptions

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  status TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.plan_id,
    s.status,
    s.current_period_end,
    s.cancel_at_period_end
  FROM subscriptions s
  WHERE s.user_id = p_user_id
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_status TEXT;
BEGIN
  SELECT status INTO subscription_status
  FROM subscriptions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN subscription_status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. SEED DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to create a free tier subscription for existing users

-- INSERT INTO subscriptions (user_id, stripe_customer_id, plan_id, status)
-- SELECT
--   id,
--   'cus_test_' || substr(md5(random()::text), 1, 14),
--   'free',
--   'active'
-- FROM auth.users
-- WHERE NOT EXISTS (
--   SELECT 1 FROM subscriptions WHERE subscriptions.user_id = auth.users.id
-- );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created: subscriptions, invoices
-- Indexes created: 11 total
-- RLS enabled and policies configured
-- Helper functions created
-- ============================================================================
