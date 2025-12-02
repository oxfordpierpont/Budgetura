import { supabase } from './client';
import { CreditCard, Loan, Bill, Goal } from '../../types';

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
      loan_type: loan.type.toLowerCase(),
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
  if (updates.type) dbUpdates.loan_type = updates.type.toLowerCase();
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
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      monthly_income: settings.monthlyIncome,
      default_payoff_strategy: settings.payoffStrategy,
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};
