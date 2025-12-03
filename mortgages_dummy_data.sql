-- Insert dummy mortgage data examples
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users

-- 1. Well-Managed Mortgage - Bellevue Family Home
INSERT INTO public.mortgages (
    user_id,
    property_address,
    property_city,
    property_state,
    property_zip,
    property_type,
    property_value,
    lender,
    account_number,
    loan_type,
    original_principal,
    current_balance,
    interest_rate,
    interest_type,
    term_months,
    monthly_payment,
    extra_payment,
    monthly_property_tax,
    monthly_insurance,
    monthly_hoa,
    pmi,
    pmi_removal_ltv,
    start_date,
    maturity_date,
    due_date,
    status,
    auto_pay,
    notes
) VALUES (
    'YOUR_USER_ID', -- Replace with actual user_id
    '456 Bellevue Way NE',
    'Bellevue',
    'WA',
    '98004',
    'single_family',
    650000.00,
    'Wells Fargo Home Mortgage',
    '8843',
    'conventional',
    400000.00,
    200000.00, -- 50% LTV - excellent equity
    3.25, -- Great refinanced rate
    'fixed',
    360,
    1740.00,
    500.00, -- Aggressively paying down principal
    520.00,
    185.00,
    0,
    0, -- No PMI due to low LTV
    80,
    '2015-06-01',
    '2045-06-01',
    1,
    'active',
    true,
    'Refinanced in 2020 from 4.5% to 3.25%. Making extra payments to pay off early. Home value has appreciated significantly.'
);

-- 2. Average Mortgage - Redmond Townhouse
INSERT INTO public.mortgages (
    user_id,
    property_address,
    property_city,
    property_state,
    property_zip,
    property_type,
    property_value,
    lender,
    account_number,
    loan_type,
    original_principal,
    current_balance,
    interest_rate,
    interest_type,
    term_months,
    monthly_payment,
    extra_payment,
    monthly_property_tax,
    monthly_insurance,
    monthly_hoa,
    pmi,
    pmi_removal_ltv,
    start_date,
    maturity_date,
    due_date,
    status,
    auto_pay,
    notes
) VALUES (
    'YOUR_USER_ID', -- Replace with actual user_id
    '789 Redmond Ridge Ln',
    'Redmond',
    'WA',
    '98052',
    'townhouse',
    425000.00,
    'Bank of America',
    '5521',
    'fha',
    340000.00,
    315000.00, -- 74% LTV - average equity
    4.5, -- Decent market rate
    'fixed',
    360,
    1595.00,
    0, -- No extra payments
    385.00,
    145.00,
    225.00,
    125.00, -- Still paying PMI
    80,
    '2022-03-15',
    '2052-03-15',
    15,
    'active',
    true,
    'First-time home buyer FHA loan. PMI should drop off in about 2 years at current pace.'
);

-- 3. Near-Foreclosure - Tacoma Condo
INSERT INTO public.mortgages (
    user_id,
    property_address,
    property_city,
    property_state,
    property_zip,
    property_type,
    property_value,
    lender,
    account_number,
    loan_type,
    original_principal,
    current_balance,
    interest_rate,
    interest_type,
    term_months,
    monthly_payment,
    extra_payment,
    monthly_property_tax,
    monthly_insurance,
    monthly_hoa,
    pmi,
    pmi_removal_ltv,
    start_date,
    maturity_date,
    due_date,
    status,
    auto_pay,
    notes
) VALUES (
    'YOUR_USER_ID', -- Replace with actual user_id
    '321 Pacific Ave Unit 203',
    'Tacoma',
    'WA',
    '98402',
    'condo',
    275000.00,
    'Quicken Loans',
    '9934',
    'conventional',
    265000.00,
    262000.00, -- 95% LTV - very little equity, underwater risk
    6.75, -- High rate, risky loan
    'variable',
    360,
    1700.00,
    0,
    295.00,
    115.00,
    385.00, -- High HOA fees
    245.00, -- High PMI
    78,
    '2023-08-01',
    '2053-08-01',
    28, -- Recently passed due date (if today is Dec 3)
    'in_forbearance',
    false, -- Disabled due to insufficient funds
    'Entered forbearance program after missing 2 payments. Job loss in Sept 2024. Working with lender on loan modification. Variable rate has increased twice since origination. Total housing cost $2,740/mo is unsustainable.'
);

-- To get your user_id, run:
-- SELECT id FROM auth.users WHERE email = 'your_email@example.com';
