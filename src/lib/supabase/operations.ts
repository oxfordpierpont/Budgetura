import { supabase } from './client';
import { CreditCard, Loan, Mortgage, Bill, Goal, PlaidAccount, PlaidItem, PlaidTransaction } from '../../types';

// ============================================================================
// CREDIT CARDS
// ============================================================================

export const addCreditCard = async (userId: string, card: CreditCard) => {
  const { data, error } = await supabase
    .from('credit_cards')
    .insert({
      user_id: userId,
      card_name: card.name,
      issuer: card.issuer,
      last_four_digits: card.lastFourDigits,
      card_type: card.cardType?.toLowerCase(),
      network: card.network?.toLowerCase(),
      balance: card.balance,
      credit_limit: card.limit,
      apr: card.apr,
      minimum_payment: card.minimumPayment,
      extra_payment: card.extraPayment || 0,
      due_date: card.dueDate,
      statement_date: card.statementDate,
      opened_date: card.openedDate,
      annual_fee: card.annualFee || 0,
      rewards_program: card.rewardsProgram,
      cashback_rate: card.cashbackRate,
      points_balance: card.pointsBalance,
      auto_pay: card.autoPay,
      status: card.status.toLowerCase().replace(' ', '_'),
      notes: card.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCreditCard = async (id: string, updates: Partial<CreditCard>) => {
  const dbUpdates: any = {};

  if (updates.name) dbUpdates.card_name = updates.name;
  if (updates.issuer) dbUpdates.issuer = updates.issuer;
  if (updates.lastFourDigits) dbUpdates.last_four_digits = updates.lastFourDigits;
  if (updates.cardType) dbUpdates.card_type = updates.cardType.toLowerCase();
  if (updates.network) dbUpdates.network = updates.network.toLowerCase();
  if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
  if (updates.limit !== undefined) dbUpdates.credit_limit = updates.limit;
  if (updates.apr !== undefined) dbUpdates.apr = updates.apr;
  if (updates.minimumPayment !== undefined) dbUpdates.minimum_payment = updates.minimumPayment;
  if (updates.extraPayment !== undefined) dbUpdates.extra_payment = updates.extraPayment;
  if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
  if (updates.statementDate) dbUpdates.statement_date = updates.statementDate;
  if (updates.openedDate) dbUpdates.opened_date = updates.openedDate;
  if (updates.annualFee !== undefined) dbUpdates.annual_fee = updates.annualFee;
  if (updates.rewardsProgram) dbUpdates.rewards_program = updates.rewardsProgram;
  if (updates.cashbackRate !== undefined) dbUpdates.cashback_rate = updates.cashbackRate;
  if (updates.pointsBalance !== undefined) dbUpdates.points_balance = updates.pointsBalance;
  if (updates.autoPay !== undefined) dbUpdates.auto_pay = updates.autoPay;
  if (updates.status) dbUpdates.status = updates.status.toLowerCase().replace(' ', '_');
  if (updates.notes) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase
    .from('credit_cards')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCreditCard = async (id: string) => {
  const { error } = await supabase
    .from('credit_cards')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============================================================================
// LOANS
// ============================================================================

export const addLoan = async (userId: string, loan: Loan) => {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      user_id: userId,
      loan_name: loan.name,
      lender: loan.lender,
      account_number: loan.accountNumber,
      loan_type: loan.type.toLowerCase().replace(/\s+/g, '_'),
      original_principal: loan.originalPrincipal,
      current_balance: loan.currentBalance,
      interest_rate: loan.rate,
      interest_type: loan.interestType?.toLowerCase() || 'fixed',
      term_months: loan.termMonths,
      monthly_payment: loan.monthlyPayment,
      extra_payment: loan.extraPayment || 0,
      start_date: loan.startDate,
      due_date: loan.dueDate,
      auto_pay: loan.autoPay,
      status: loan.status?.toLowerCase() || 'active',
      notes: loan.notes,
      // Auto loan
      vehicle_year: loan.vehicleYear,
      vehicle_make: loan.vehicleMake,
      vehicle_model: loan.vehicleModel,
      vin: loan.vin,
      mileage: loan.mileage,
      // Student loan
      loan_program_type: loan.loanProgramType,
      school_name: loan.schoolName,
      graduation_date: loan.graduationDate,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateLoan = async (id: string, updates: Partial<Loan>) => {
  const dbUpdates: any = {};

  if (updates.name) dbUpdates.loan_name = updates.name;
  if (updates.lender) dbUpdates.lender = updates.lender;
  if (updates.accountNumber) dbUpdates.account_number = updates.accountNumber;
  if (updates.type) dbUpdates.loan_type = updates.type.toLowerCase().replace(/\s+/g, '_');
  if (updates.originalPrincipal !== undefined) dbUpdates.original_principal = updates.originalPrincipal;
  if (updates.currentBalance !== undefined) dbUpdates.current_balance = updates.currentBalance;
  if (updates.rate !== undefined) dbUpdates.interest_rate = updates.rate;
  if (updates.interestType) dbUpdates.interest_type = updates.interestType.toLowerCase();
  if (updates.termMonths !== undefined) dbUpdates.term_months = updates.termMonths;
  if (updates.monthlyPayment !== undefined) dbUpdates.monthly_payment = updates.monthlyPayment;
  if (updates.extraPayment !== undefined) dbUpdates.extra_payment = updates.extraPayment;
  if (updates.startDate) dbUpdates.start_date = updates.startDate;
  if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
  if (updates.autoPay !== undefined) dbUpdates.auto_pay = updates.autoPay;
  if (updates.status) dbUpdates.status = updates.status.toLowerCase();
  if (updates.notes) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase
    .from('loans')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteLoan = async (id: string) => {
  const { error } = await supabase
    .from('loans')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============================================================================
// MORTGAGES
// ============================================================================

export const addMortgage = async (userId: string, mortgage: Mortgage) => {
  const { data, error } = await supabase
    .from('mortgages')
    .insert({
      user_id: userId,
      property_address: mortgage.propertyAddress,
      property_city: mortgage.propertyCity,
      property_state: mortgage.propertyState,
      property_zip: mortgage.propertyZip,
      property_type: mortgage.propertyType?.toLowerCase().replace(' ', '_'),
      property_value: mortgage.propertyValue,
      lender: mortgage.lender,
      account_number: mortgage.accountNumber,
      loan_type: mortgage.loanType?.toLowerCase(),
      original_principal: mortgage.originalPrincipal,
      current_balance: mortgage.currentBalance,
      interest_rate: mortgage.interestRate,
      interest_type: mortgage.interestType?.toLowerCase(),
      term_months: mortgage.termMonths,
      monthly_payment: mortgage.monthlyPayment,
      extra_payment: mortgage.extraPayment || 0,
      monthly_property_tax: mortgage.monthlyPropertyTax || 0,
      monthly_insurance: mortgage.monthlyInsurance || 0,
      monthly_hoa: mortgage.monthlyHOA || 0,
      pmi: mortgage.pmi || 0,
      pmi_removal_ltv: mortgage.pmiRemovalLTV || 80,
      start_date: mortgage.startDate,
      maturity_date: mortgage.maturityDate,
      due_date: mortgage.dueDate,
      status: mortgage.status?.toLowerCase().replace(' ', '_') || 'active',
      auto_pay: mortgage.autoPay || false,
      notes: mortgage.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMortgage = async (id: string, updates: Partial<Mortgage>) => {
  const dbUpdates: any = {};

  if (updates.propertyAddress) dbUpdates.property_address = updates.propertyAddress;
  if (updates.propertyCity) dbUpdates.property_city = updates.propertyCity;
  if (updates.propertyState) dbUpdates.property_state = updates.propertyState;
  if (updates.propertyZip) dbUpdates.property_zip = updates.propertyZip;
  if (updates.propertyType) dbUpdates.property_type = updates.propertyType.toLowerCase().replace(' ', '_');
  if (updates.propertyValue !== undefined) dbUpdates.property_value = updates.propertyValue;
  if (updates.lender) dbUpdates.lender = updates.lender;
  if (updates.accountNumber) dbUpdates.account_number = updates.accountNumber;
  if (updates.loanType) dbUpdates.loan_type = updates.loanType.toLowerCase();
  if (updates.originalPrincipal !== undefined) dbUpdates.original_principal = updates.originalPrincipal;
  if (updates.currentBalance !== undefined) dbUpdates.current_balance = updates.currentBalance;
  if (updates.interestRate !== undefined) dbUpdates.interest_rate = updates.interestRate;
  if (updates.interestType) dbUpdates.interest_type = updates.interestType.toLowerCase();
  if (updates.termMonths !== undefined) dbUpdates.term_months = updates.termMonths;
  if (updates.monthlyPayment !== undefined) dbUpdates.monthly_payment = updates.monthlyPayment;
  if (updates.extraPayment !== undefined) dbUpdates.extra_payment = updates.extraPayment;
  if (updates.monthlyPropertyTax !== undefined) dbUpdates.monthly_property_tax = updates.monthlyPropertyTax;
  if (updates.monthlyInsurance !== undefined) dbUpdates.monthly_insurance = updates.monthlyInsurance;
  if (updates.monthlyHOA !== undefined) dbUpdates.monthly_hoa = updates.monthlyHOA;
  if (updates.pmi !== undefined) dbUpdates.pmi = updates.pmi;
  if (updates.pmiRemovalLTV !== undefined) dbUpdates.pmi_removal_ltv = updates.pmiRemovalLTV;
  if (updates.startDate) dbUpdates.start_date = updates.startDate;
  if (updates.maturityDate) dbUpdates.maturity_date = updates.maturityDate;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.status) dbUpdates.status = updates.status.toLowerCase().replace(' ', '_');
  if (updates.autoPay !== undefined) dbUpdates.auto_pay = updates.autoPay;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('mortgages')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMortgage = async (id: string) => {
  const { error } = await supabase
    .from('mortgages')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============================================================================
// BILLS
// ============================================================================

export const addBill = async (userId: string, bill: Bill) => {
  const { data, error } = await supabase
    .from('bills')
    .insert({
      user_id: userId,
      bill_name: bill.name,
      category: bill.category.toLowerCase(),
      amount: bill.amount,
      average_amount: bill.averageAmount,
      frequency: bill.frequency,
      due_date: bill.dueDate,
      last_paid_date: bill.lastPaidDate,
      is_essential: bill.isEssential,
      auto_pay: bill.autoPay,
      status: 'active',
      website: bill.website,
      notes: bill.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBill = async (id: string, updates: Partial<Bill>) => {
  const dbUpdates: any = {};

  if (updates.name) dbUpdates.bill_name = updates.name;
  if (updates.category) dbUpdates.category = updates.category.toLowerCase();
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.averageAmount !== undefined) dbUpdates.average_amount = updates.averageAmount;
  if (updates.frequency) dbUpdates.frequency = updates.frequency;
  if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
  if (updates.lastPaidDate) dbUpdates.last_paid_date = updates.lastPaidDate;
  if (updates.isEssential !== undefined) dbUpdates.is_essential = updates.isEssential;
  if (updates.autoPay !== undefined) dbUpdates.auto_pay = updates.autoPay;
  if (updates.website) dbUpdates.website = updates.website;
  if (updates.notes) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase
    .from('bills')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBill = async (id: string) => {
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============================================================================
// GOALS
// ============================================================================

export const addGoal = async (userId: string, goal: Goal) => {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      goal_name: goal.name,
      category: goal.type.toLowerCase().replace(' ', '_'),
      target_amount: goal.target,
      current_amount: goal.current,
      monthly_contribution: goal.monthlyContribution,
      priority: goal.priority.toLowerCase(),
      status: 'in_progress',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateGoal = async (id: string, updates: Partial<Goal>) => {
  const dbUpdates: any = {};

  if (updates.name) dbUpdates.goal_name = updates.name;
  if (updates.type) dbUpdates.category = updates.type.toLowerCase().replace(' ', '_');
  if (updates.target !== undefined) dbUpdates.target_amount = updates.target;
  if (updates.current !== undefined) dbUpdates.current_amount = updates.current;
  if (updates.monthlyContribution !== undefined) dbUpdates.monthly_contribution = updates.monthlyContribution;
  if (updates.priority) dbUpdates.priority = updates.priority.toLowerCase();

  const { data, error } = await supabase
    .from('goals')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteGoal = async (id: string) => {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============================================================================
// SNAPSHOTS
// ============================================================================

export const createSnapshot = async (userId: string, snapshot: Partial<any>) => {
  const { data, error } = await supabase
    .from('snapshots')
    .insert({
      user_id: userId,
      total_debt: snapshot.totalDebt || 0,
      total_monthly_debt_payments: snapshot.totalMonthlyPayments || 0,
      total_monthly_bills: snapshot.totalBills || 0,
      dti_ratio: snapshot.dtiRatio || 0,
      credit_utilization: snapshot.creditUtilization || 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================================================
// USER SETTINGS
// ============================================================================

export const updateUserSettings = async (userId: string, settings: Partial<any>) => {
  const updateData: any = { id: userId };

  // Map frontend field names to database column names
  if (settings.monthlyIncome !== undefined) updateData.monthly_income = settings.monthlyIncome;
  if (settings.payoffStrategy !== undefined) updateData.payoff_strategy = settings.payoffStrategy;
  if (settings.currencySymbol !== undefined) updateData.currency_symbol = settings.currencySymbol;
  if (settings.defaultInterestRate !== undefined) updateData.default_interest_rate = settings.defaultInterestRate;
  if (settings.snapshotFrequency !== undefined) updateData.snapshot_frequency = settings.snapshotFrequency;
  if (settings.emailNotifications !== undefined) updateData.email_notifications = settings.emailNotifications;

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(updateData, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================================================
// AI SETTINGS
// ============================================================================

export const getAISettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // If no settings exist, return null (not an error)
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Return settings without the encrypted API key
  return {
    id: data.id,
    provider: data.provider,
    model: data.model,
    customModelId: data.custom_model_id,
    temperature: parseFloat(data.temperature),
    maxTokens: data.max_tokens,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const saveAISettings = async (userId: string, settings: any) => {
  // Call the database function that handles encryption
  const { data, error } = await supabase.rpc('save_ai_settings_encrypted', {
    p_user_id: userId,
    p_provider: settings.provider,
    p_api_key: settings.apiKey,
    p_model: settings.model,
    p_custom_model_id: settings.customModelId || null,
    p_temperature: settings.temperature,
    p_max_tokens: settings.maxTokens,
  });

  if (error) throw error;
  return data;
};

export const testAPIKey = async (provider: string, apiKey: string): Promise<boolean> => {
  // This is a placeholder function
  // In production, this should call an Edge Function to securely test the key
  // without exposing it to the client

  try {
    // For now, just validate the key format
    if (!apiKey || apiKey.length < 20) {
      return false;
    }

    // Basic format validation based on provider
    if (provider === 'openai' && !apiKey.startsWith('sk-')) {
      return false;
    }
    if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
      return false;
    }

    // TODO: Implement actual API key validation via Edge Function
    // For now, return true if format is correct
    return true;
  } catch (error) {
    console.error('API key test error:', error);
    return false;
  }
};

// ============================================================================
// PLAID CONFIGURATION (Admin Only)
// ============================================================================

export const getPlaidConfig = async () => {
  // This uses service_role permissions
  const { data, error } = await supabase
    .from('plaid_config')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // If no config exists, return null (not an error)
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Return config without encrypted values (they're encrypted in DB)
  return {
    id: data.id,
    environment: data.environment,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const savePlaidConfig = async (config: any, userId: string) => {
  // Call the database function that handles encryption
  const { data, error } = await supabase.rpc('save_plaid_config_encrypted', {
    p_client_id: config.clientId,
    p_secret: config.secret,
    p_environment: config.environment,
    p_created_by: userId,
  });

  if (error) throw error;
  return data;
};

// ============================================================================
// DATA MANAGEMENT
// ============================================================================

export const clearAllUserData = async (userId: string) => {
  // Delete all credit cards
  const { error: cardsError } = await supabase
    .from('credit_cards')
    .delete()
    .eq('user_id', userId);

  if (cardsError) throw cardsError;

  // Delete all loans
  const { error: loansError } = await supabase
    .from('loans')
    .delete()
    .eq('user_id', userId);

  if (loansError) throw loansError;

  // Delete all mortgages
  const { error: mortgagesError } = await supabase
    .from('mortgages')
    .delete()
    .eq('user_id', userId);

  if (mortgagesError) throw mortgagesError;

  // Delete all bills
  const { error: billsError } = await supabase
    .from('bills')
    .delete()
    .eq('user_id', userId);

  if (billsError) throw billsError;

  // Delete all goals
  const { error: goalsError } = await supabase
    .from('goals')
    .delete()
    .eq('user_id', userId);

  if (goalsError) throw goalsError;

  // Delete all snapshots
  const { error: snapshotsError } = await supabase
    .from('snapshots')
    .delete()
    .eq('user_id', userId);

  if (snapshotsError) throw snapshotsError;

  return { success: true };
};

// ============================================================================
// PLAID INTEGRATION
// ============================================================================

/**
 * Create a Plaid Link token for initiating bank connection
 */
export const createPlaidLinkToken = async (userId: string): Promise<string> => {
  // Use backend API instead of Edge Functions (which aren't available in self-hosted Supabase)
  const PLAID_BACKEND_URL = import.meta.env.VITE_PLAID_BACKEND_URL || 'http://localhost:3001';

  const response = await fetch(`${PLAID_BACKEND_URL}/api/plaid/create-link-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create link token');
  }

  const data = await response.json();
  if (!data?.link_token) throw new Error('Failed to create link token');

  return data.link_token;
};

/**
 * Exchange public token for access token and store connection
 */
export const exchangePlaidToken = async (userId: string, publicToken: string) => {
  // Use backend API instead of Edge Functions
  const PLAID_BACKEND_URL = import.meta.env.VITE_PLAID_BACKEND_URL || 'http://localhost:3001';

  const response = await fetch(`${PLAID_BACKEND_URL}/api/plaid/exchange-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, publicToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to exchange token');
  }

  return await response.json();
};

/**
 * Get all Plaid-connected bank accounts for a user
 * Only returns accounts from active Plaid items (connected banks)
 */
export const getPlaidAccounts = async (userId: string): Promise<PlaidAccount[]> => {
  const { data, error } = await supabase
    .from('plaid_accounts')
    .select(`
      *,
      plaid_items!inner (
        status
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('plaid_items.status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get all Plaid items (bank connections) for a user
 */
export const getPlaidItems = async (userId: string): Promise<PlaidItem[]> => {
  const { data, error } = await supabase
    .from('plaid_items')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Disconnect a Plaid item (remove bank connection)
 * Also deactivates all associated accounts
 */
export const disconnectPlaidItem = async (itemId: string) => {
  // First, deactivate the item
  const { error: itemError } = await supabase
    .from('plaid_items')
    .update({ status: 'inactive' })
    .eq('item_id', itemId);

  if (itemError) throw itemError;

  // Then, deactivate all associated accounts
  const { error: accountsError } = await supabase
    .from('plaid_accounts')
    .update({ is_active: false })
    .eq('item_id', itemId);

  if (accountsError) throw accountsError;
};

/**
 * Delete a Plaid item completely
 */
export const deletePlaidItem = async (itemId: string) => {
  const { error } = await supabase
    .from('plaid_items')
    .delete()
    .eq('item_id', itemId);

  if (error) throw error;
};

/**
 * Sync Plaid transactions from backend
 */
export const syncPlaidTransactions = async (userId: string) => {
  const plaidBackendUrl = import.meta.env.VITE_PLAID_BACKEND_URL || 'http://localhost:3001';

  const response = await fetch(`${plaidBackendUrl}/api/plaid/sync-transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sync transactions');
  }

  return await response.json();
};

/**
 * Get Plaid transactions for a user
 */
export const getPlaidTransactions = async (
  userId: string,
  options?: { startDate?: string; endDate?: string; limit?: number }
): Promise<PlaidTransaction[]> => {
  const plaidBackendUrl = import.meta.env.VITE_PLAID_BACKEND_URL || 'http://localhost:3001';

  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.limit) params.append('limit', options.limit.toString());

  const queryString = params.toString();
  const url = `${plaidBackendUrl}/api/plaid/transactions/${userId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transactions');
  }

  const result = await response.json();
  return result.transactions || [];
};
