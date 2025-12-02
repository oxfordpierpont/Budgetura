-- Budgetura Database Schema for Supabase (PostgreSQL)
-- This schema includes all tables, RLS policies, and functions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (Extended from Supabase Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  monthly_income DECIMAL(12, 2) DEFAULT 0,
  currency_code TEXT DEFAULT 'USD',
  default_payoff_strategy TEXT DEFAULT 'avalanche' CHECK (default_payoff_strategy IN ('avalanche', 'snowball', 'custom')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREDIT CARDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  card_name TEXT NOT NULL,
  issuer TEXT,
  last_four_digits TEXT,
  card_type TEXT CHECK (card_type IN ('credit', 'charge', 'secured')),
  network TEXT CHECK (network IN ('visa', 'mastercard', 'amex', 'discover', 'other')),
  
  -- Financial Details
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  credit_limit DECIMAL(12, 2) NOT NULL,
  apr DECIMAL(5, 2) NOT NULL,
  minimum_payment DECIMAL(12, 2) NOT NULL,
  extra_payment DECIMAL(12, 2) DEFAULT 0,
  
  -- Calculated Fields
  utilization_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN credit_limit > 0 THEN (balance / credit_limit * 100) ELSE 0 END
  ) STORED,
  available_credit DECIMAL(12, 2) GENERATED ALWAYS AS (
    GREATEST(0, credit_limit - balance)
  ) STORED,
  
  -- Dates
  due_date INTEGER CHECK (due_date BETWEEN 1 AND 31),
  statement_date INTEGER CHECK (statement_date BETWEEN 1 AND 31),
  opened_date DATE,
  
  -- Additional
  annual_fee DECIMAL(12, 2) DEFAULT 0,
  rewards_program TEXT,
  cashback_rate DECIMAL(5, 2),
  points_balance INTEGER DEFAULT 0,
  auto_pay BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'closed', 'frozen')),
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LOANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  loan_name TEXT NOT NULL,
  lender TEXT,
  account_number TEXT,
  loan_type TEXT NOT NULL CHECK (loan_type IN (
    'auto', 'student', 'personal', 'home_equity', 'business', 
    'medical', 'payday', 'bnpl', 'family', 'consolidation', 'other'
  )),
  
  -- Financial Details
  original_principal DECIMAL(12, 2) NOT NULL,
  current_balance DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  interest_type TEXT DEFAULT 'fixed' CHECK (interest_type IN ('fixed', 'variable')),
  term_months INTEGER NOT NULL,
  monthly_payment DECIMAL(12, 2) NOT NULL,
  extra_payment DECIMAL(12, 2) DEFAULT 0,
  
  -- Dates
  start_date DATE,
  maturity_date DATE,
  first_payment_date DATE,
  due_date INTEGER CHECK (due_date BETWEEN 1 AND 31),
  
  -- Fees & Penalties
  origination_fee DECIMAL(12, 2) DEFAULT 0,
  prepayment_penalty BOOLEAN DEFAULT FALSE,
  prepayment_penalty_amount DECIMAL(12, 2),
  
  -- Loan Type Specific Fields
  -- Auto Loan
  vehicle_year INTEGER,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_trim TEXT,
  vin TEXT,
  mileage INTEGER,
  
  -- Student Loan
  loan_program_type TEXT,
  servicer_name TEXT,
  school_name TEXT,
  graduation_date DATE,
  
  -- Status & Settings
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deferred', 'paid_off', 'defaulted', 'in_forbearance')),
  auto_pay BOOLEAN DEFAULT FALSE,
  payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'bi_weekly', 'monthly')),
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MORTGAGES TABLE (Separate from Loans per PRD)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mortgages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Property Information
  property_address TEXT,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  property_type TEXT CHECK (property_type IN ('single_family', 'condo', 'townhouse', 'multi_family', 'mobile_home')),
  property_value DECIMAL(12, 2) NOT NULL,
  
  -- Loan Details
  lender TEXT,
  account_number TEXT,
  loan_type TEXT CHECK (loan_type IN ('conventional', 'fha', 'va', 'usda', 'heloc', 'reverse')),
  original_principal DECIMAL(12, 2) NOT NULL,
  current_balance DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  interest_type TEXT DEFAULT 'fixed' CHECK (interest_type IN ('fixed', 'variable', 'adjustable')),
  term_months INTEGER NOT NULL,
  monthly_payment DECIMAL(12, 2) NOT NULL,
  extra_payment DECIMAL(12, 2) DEFAULT 0,
  
  -- Calculated Fields
  equity DECIMAL(12, 2) GENERATED ALWAYS AS (
    GREATEST(0, property_value - current_balance)
  ) STORED,
  equity_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN property_value > 0 THEN ((property_value - current_balance) / property_value * 100) ELSE 0 END
  ) STORED,
  loan_to_value DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN property_value > 0 THEN (current_balance / property_value * 100) ELSE 0 END
  ) STORED,
  
  -- Additional Monthly Costs
  monthly_property_tax DECIMAL(12, 2) DEFAULT 0,
  monthly_insurance DECIMAL(12, 2) DEFAULT 0,
  monthly_hoa DECIMAL(12, 2) DEFAULT 0,
  pmi DECIMAL(12, 2) DEFAULT 0,
  pmi_removal_ltv DECIMAL(5, 2) DEFAULT 80,
  
  total_monthly_housing_cost DECIMAL(12, 2) GENERATED ALWAYS AS (
    monthly_payment + monthly_property_tax + monthly_insurance + monthly_hoa + pmi
  ) STORED,
  
  -- Dates
  start_date DATE,
  maturity_date DATE,
  due_date INTEGER CHECK (due_date BETWEEN 1 AND 31),
  
  -- Status & Settings
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'foreclosed', 'in_forbearance')),
  auto_pay BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- BILLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  bill_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'housing', 'transportation', 'utilities', 'food', 'healthcare', 
    'insurance', 'entertainment', 'subscriptions', 'debt', 'other'
  )),
  
  -- Financial Details
  amount DECIMAL(12, 2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'bi_weekly', 'monthly', 'quarterly', 'annually')),
  average_amount DECIMAL(12, 2),
  
  -- Dates & Settings
  due_date INTEGER CHECK (due_date BETWEEN 1 AND 31),
  last_paid_date DATE,
  next_due_date DATE,
  
  -- Status
  is_essential BOOLEAN DEFAULT TRUE,
  auto_pay BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  
  -- Additional
  website TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- GOALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  goal_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'emergency_fund', 'savings', 'debt_payoff', 'investment', 
    'purchase', 'retirement', 'education', 'other'
  )),
  
  -- Financial Details
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  monthly_contribution DECIMAL(12, 2) DEFAULT 0,
  
  -- Calculated Fields
  remaining_amount DECIMAL(12, 2) GENERATED ALWAYS AS (
    GREATEST(0, target_amount - current_amount)
  ) STORED,
  progress_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN target_amount > 0 THEN (current_amount / target_amount * 100) ELSE 0 END
  ) STORED,
  
  -- Timeline
  target_date DATE,
  
  -- Status & Priority
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'on_hold', 'archived')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  achieved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- GOAL MILESTONES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goal_milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  
  milestone_name TEXT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SNAPSHOTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Debt Totals
  total_credit_card_debt DECIMAL(12, 2) DEFAULT 0,
  total_loan_debt DECIMAL(12, 2) DEFAULT 0,
  total_mortgage_debt DECIMAL(12, 2) DEFAULT 0,
  total_debt DECIMAL(12, 2) DEFAULT 0,
  
  -- Payment Totals
  total_monthly_debt_payments DECIMAL(12, 2) DEFAULT 0,
  total_monthly_bills DECIMAL(12, 2) DEFAULT 0,
  total_monthly_obligations DECIMAL(12, 2) DEFAULT 0,
  
  -- Ratios
  credit_utilization DECIMAL(5, 2) DEFAULT 0,
  dti_ratio DECIMAL(5, 2) DEFAULT 0,
  
  -- Assets & Net Worth
  total_assets DECIMAL(12, 2) DEFAULT 0,
  total_liabilities DECIMAL(12, 2) DEFAULT 0,
  net_worth DECIMAL(12, 2) GENERATED ALWAYS AS (total_assets - total_liabilities) STORED,
  
  -- Goals Progress
  total_goal_progress DECIMAL(12, 2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mortgages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Credit Cards Policies
CREATE POLICY "Users can view own credit cards" ON public.credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit cards" ON public.credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credit cards" ON public.credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own credit cards" ON public.credit_cards FOR DELETE USING (auth.uid() = user_id);

-- Loans Policies
CREATE POLICY "Users can view own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loans" ON public.loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own loans" ON public.loans FOR DELETE USING (auth.uid() = user_id);

-- Mortgages Policies
CREATE POLICY "Users can view own mortgages" ON public.mortgages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mortgages" ON public.mortgages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mortgages" ON public.mortgages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mortgages" ON public.mortgages FOR DELETE USING (auth.uid() = user_id);

-- Bills Policies
CREATE POLICY "Users can view own bills" ON public.bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bills" ON public.bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bills" ON public.bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bills" ON public.bills FOR DELETE USING (auth.uid() = user_id);

-- Goals Policies
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Goal Milestones Policies (check goal ownership)
CREATE POLICY "Users can view milestones for own goals" ON public.goal_milestones 
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can insert milestones for own goals" ON public.goal_milestones 
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can update milestones for own goals" ON public.goal_milestones 
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can delete milestones for own goals" ON public.goal_milestones 
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid()));

-- Snapshots Policies
CREATE POLICY "Users can view own snapshots" ON public.snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON public.snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own snapshots" ON public.snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own snapshots" ON public.snapshots FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON public.credit_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mortgages_updated_at BEFORE UPDATE ON public.mortgages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PLAID INTEGRATION TABLES
-- ============================================================================

-- Plaid Items (connected financial institutions)
CREATE TABLE IF NOT EXISTS public.plaid_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  item_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  institution_id TEXT,
  institution_name TEXT,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plaid Accounts (bank accounts from Plaid)
CREATE TABLE IF NOT EXISTS public.plaid_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT REFERENCES public.plaid_items(item_id) ON DELETE CASCADE NOT NULL,

  account_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  official_name TEXT,
  type TEXT NOT NULL,
  subtype TEXT,
  mask TEXT,

  current_balance DECIMAL(12, 2),
  available_balance DECIMAL(12, 2),

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plaid Transactions (synced transactions)
CREATE TABLE IF NOT EXISTS public.plaid_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id TEXT REFERENCES public.plaid_accounts(account_id) ON DELETE CASCADE NOT NULL,

  transaction_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,

  category TEXT[],
  merchant_name TEXT,
  payment_channel TEXT,
  pending BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Plaid tables
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_transactions ENABLE ROW LEVEL SECURITY;

-- Plaid Items Policies
CREATE POLICY "Users can view own plaid items" ON public.plaid_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plaid items" ON public.plaid_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plaid items" ON public.plaid_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plaid items" ON public.plaid_items FOR DELETE USING (auth.uid() = user_id);

-- Plaid Accounts Policies
CREATE POLICY "Users can view own plaid accounts" ON public.plaid_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plaid accounts" ON public.plaid_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plaid accounts" ON public.plaid_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plaid accounts" ON public.plaid_accounts FOR DELETE USING (auth.uid() = user_id);

-- Plaid Transactions Policies
CREATE POLICY "Users can view own plaid transactions" ON public.plaid_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plaid transactions" ON public.plaid_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plaid transactions" ON public.plaid_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plaid transactions" ON public.plaid_transactions FOR DELETE USING (auth.uid() = user_id);

-- Plaid triggers for updated_at
CREATE TRIGGER update_plaid_items_updated_at BEFORE UPDATE ON public.plaid_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plaid_accounts_updated_at BEFORE UPDATE ON public.plaid_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_mortgages_user_id ON public.mortgages(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON public.snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON public.snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON public.plaid_items(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_user_id ON public.plaid_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_user_id ON public.plaid_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_date ON public.plaid_transactions(date DESC);
