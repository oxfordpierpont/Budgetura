-- Plaid Integration Tables Migration
-- Run this in Supabase SQL Editor to create Plaid tables

-- Plaid Items (connection to financial institutions)
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
DROP POLICY IF EXISTS "Users can view own plaid items" ON public.plaid_items;
DROP POLICY IF EXISTS "Users can insert own plaid items" ON public.plaid_items;
DROP POLICY IF EXISTS "Users can update own plaid items" ON public.plaid_items;
DROP POLICY IF EXISTS "Users can delete own plaid items" ON public.plaid_items;

CREATE POLICY "Users can view own plaid items" ON public.plaid_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plaid items" ON public.plaid_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plaid items" ON public.plaid_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plaid items" ON public.plaid_items FOR DELETE USING (auth.uid() = user_id);

-- Plaid Accounts Policies
DROP POLICY IF EXISTS "Users can view own plaid accounts" ON public.plaid_accounts;
DROP POLICY IF EXISTS "Users can insert own plaid accounts" ON public.plaid_accounts;
DROP POLICY IF EXISTS "Users can update own plaid accounts" ON public.plaid_accounts;
DROP POLICY IF EXISTS "Users can delete own plaid accounts" ON public.plaid_accounts;

CREATE POLICY "Users can view own plaid accounts" ON public.plaid_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plaid accounts" ON public.plaid_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plaid accounts" ON public.plaid_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plaid accounts" ON public.plaid_accounts FOR DELETE USING (auth.uid() = user_id);

-- Plaid Transactions Policies
DROP POLICY IF EXISTS "Users can view own plaid transactions" ON public.plaid_transactions;
DROP POLICY IF EXISTS "Users can insert own plaid transactions" ON public.plaid_transactions;
DROP POLICY IF EXISTS "Users can update own plaid transactions" ON public.plaid_transactions;
DROP POLICY IF EXISTS "Users can delete own plaid transactions" ON public.plaid_transactions;

CREATE POLICY "Users can view own plaid transactions" ON public.plaid_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plaid transactions" ON public.plaid_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plaid transactions" ON public.plaid_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plaid transactions" ON public.plaid_transactions FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON public.plaid_items(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_user_id ON public.plaid_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_item_id ON public.plaid_accounts(item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_user_id ON public.plaid_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_account_id ON public.plaid_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_date ON public.plaid_transactions(date DESC);
