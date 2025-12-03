-- Create mortgages table for Budgetura
CREATE TABLE IF NOT EXISTS public.mortgages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Property Information
    property_address TEXT,
    property_city TEXT,
    property_state TEXT,
    property_zip TEXT,
    property_type TEXT,
    property_value DECIMAL(12, 2) NOT NULL,

    -- Loan Details
    lender TEXT,
    account_number TEXT,
    loan_type TEXT,
    original_principal DECIMAL(12, 2) NOT NULL,
    current_balance DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 3) NOT NULL,
    interest_type TEXT DEFAULT 'fixed',
    term_months INTEGER NOT NULL,
    monthly_payment DECIMAL(10, 2) NOT NULL,
    extra_payment DECIMAL(10, 2) DEFAULT 0,

    -- Additional Monthly Costs
    monthly_property_tax DECIMAL(10, 2) DEFAULT 0,
    monthly_insurance DECIMAL(10, 2) DEFAULT 0,
    monthly_hoa DECIMAL(10, 2) DEFAULT 0,
    pmi DECIMAL(10, 2) DEFAULT 0,
    pmi_removal_ltv DECIMAL(5, 2) DEFAULT 80,
    total_monthly_housing_cost DECIMAL(10, 2),

    -- Dates
    start_date DATE,
    maturity_date DATE,
    due_date INTEGER CHECK (due_date >= 1 AND due_date <= 31),

    -- Status & Settings
    status TEXT DEFAULT 'active',
    auto_pay BOOLEAN DEFAULT false,
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_mortgages_user_id ON public.mortgages(user_id);

-- Enable Row Level Security
ALTER TABLE public.mortgages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own mortgages
CREATE POLICY "Users can view their own mortgages"
    ON public.mortgages
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own mortgages
CREATE POLICY "Users can insert their own mortgages"
    ON public.mortgages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own mortgages
CREATE POLICY "Users can update their own mortgages"
    ON public.mortgages
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own mortgages
CREATE POLICY "Users can delete their own mortgages"
    ON public.mortgages
    FOR DELETE
    USING (auth.uid() = user_id);
