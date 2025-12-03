import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { CreditCard, Loan, Mortgage, Bill, Goal, Snapshot, UserSettings } from '../types';
import { useAuth } from './useAuth';

export interface SupabaseData {
  cards: CreditCard[];
  loans: Loan[];
  mortgages: Mortgage[];
  bills: Bill[];
  goals: Goal[];
  snapshots: Snapshot[];
  settings: UserSettings;
  loading: boolean;
  error: string | null;
}

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<SupabaseData>({
    cards: [],
    loans: [],
    mortgages: [],
    bills: [],
    goals: [],
    snapshots: [],
    settings: { monthlyIncome: 0, currencySymbol: '$', payoffStrategy: 'avalanche' },
    loading: true,
    error: null,
  });

  // Fetch all user data
  const fetchAllData = async () => {
    if (!user) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch user profile/settings
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      // Fetch credit cards
      const { data: creditCards, error: cardsError } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cardsError) throw cardsError;

      // Fetch loans
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;

      // Fetch mortgages
      const { data: mortgages, error: mortgagesError } = await supabase
        .from('mortgages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (mortgagesError) throw mortgagesError;

      // Fetch bills
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (billsError) throw billsError;

      // Fetch goals
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      // Fetch snapshots
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: false })
        .limit(30);

      if (snapshotsError) throw snapshotsError;

      // Map database fields to app types
      const mappedCards: CreditCard[] = (creditCards || []).map(card => ({
        id: card.id,
        name: card.card_name,
        balance: parseFloat(card.balance) || 0,
        limit: parseFloat(card.credit_limit) || 0,
        apr: parseFloat(card.apr) || 0,
        minimumPayment: parseFloat(card.minimum_payment) || 0,
        extraPayment: card.extra_payment ? parseFloat(card.extra_payment) : 0,
        dueDate: card.due_date,
        status: card.status === 'active' ? 'Active' : card.status === 'paid_off' ? 'Paid Off' : card.status === 'closed' ? 'Closed' : 'Frozen',
        utilization: parseFloat(card.utilization_percentage || '0'),
        issuer: card.issuer,
        lastFourDigits: card.last_four_digits,
        cardType: card.card_type === 'credit' ? 'Credit' : card.card_type === 'charge' ? 'Charge' : 'Secured',
        network: card.network,
        annualFee: card.annual_fee ? parseFloat(card.annual_fee) : 0,
        minimumPaymentPercentage: 2,
        statementDate: card.statement_date,
        autoPay: card.auto_pay,
        rewardsProgram: card.rewards_program,
        cashbackRate: card.cashback_rate ? parseFloat(card.cashback_rate) : 0,
        pointsBalance: card.points_balance || 0,
        openedDate: card.opened_date,
        notes: card.notes,
        payoffDate: 'N/A',
        interest: 0,
      }));

      const mappedLoans: Loan[] = (loans || []).map(loan => ({
        id: loan.id,
        name: loan.loan_name,
        type: capitalizeFirstLetter(loan.loan_type) as any,
        currentBalance: parseFloat(loan.current_balance) || 0,
        originalPrincipal: parseFloat(loan.original_principal) || 0,
        rate: parseFloat(loan.interest_rate) || 0,
        termMonths: loan.term_months || 0,
        monthlyPayment: parseFloat(loan.monthly_payment) || 0,
        extraPayment: loan.extra_payment ? parseFloat(loan.extra_payment) : 0,
        startDate: loan.start_date,
        lender: loan.lender,
        accountNumber: loan.account_number,
        status: loan.status === 'active' ? 'Active' : 'Paid Off',
        dueDate: loan.due_date,
        autoPay: loan.auto_pay,
        interestType: loan.interest_type === 'fixed' ? 'Fixed' : 'Variable',
        notes: loan.notes,
        // Auto loan specific
        vehicleYear: loan.vehicle_year,
        vehicleMake: loan.vehicle_make,
        vehicleModel: loan.vehicle_model,
        vin: loan.vin,
        mileage: loan.mileage,
        // Student loan specific
        loanProgramType: loan.loan_program_type,
        schoolName: loan.school_name,
        graduationDate: loan.graduation_date,
      }));

      const mappedMortgages: Mortgage[] = (mortgages || []).map(mortgage => {
        const currentBalance = parseFloat(mortgage.current_balance) || 0;
        const propertyValue = parseFloat(mortgage.property_value) || 0;
        const equity = Math.max(0, propertyValue - currentBalance);
        const equityPercentage = propertyValue > 0 ? (equity / propertyValue) * 100 : 0;
        const loanToValue = propertyValue > 0 ? (currentBalance / propertyValue) * 100 : 0;

        return {
          id: mortgage.id,
          propertyAddress: mortgage.property_address,
          propertyCity: mortgage.property_city,
          propertyState: mortgage.property_state,
          propertyZip: mortgage.property_zip,
          propertyType: capitalizeWords(mortgage.property_type?.replace('_', ' ') || ''),
          propertyValue,
          lender: mortgage.lender,
          accountNumber: mortgage.account_number,
          loanType: capitalizeFirstLetter(mortgage.loan_type || ''),
          originalPrincipal: parseFloat(mortgage.original_principal) || 0,
          currentBalance,
          interestRate: parseFloat(mortgage.interest_rate) || 0,
          interestType: capitalizeFirstLetter(mortgage.interest_type || 'Fixed'),
          termMonths: mortgage.term_months || 0,
          monthlyPayment: parseFloat(mortgage.monthly_payment) || 0,
          extraPayment: mortgage.extra_payment ? parseFloat(mortgage.extra_payment) : 0,
          equity,
          equityPercentage,
          loanToValue,
          monthlyPropertyTax: mortgage.monthly_property_tax ? parseFloat(mortgage.monthly_property_tax) : 0,
          monthlyInsurance: mortgage.monthly_insurance ? parseFloat(mortgage.monthly_insurance) : 0,
          monthlyHOA: mortgage.monthly_hoa ? parseFloat(mortgage.monthly_hoa) : 0,
          pmi: mortgage.pmi ? parseFloat(mortgage.pmi) : 0,
          pmiRemovalLTV: mortgage.pmi_removal_ltv || 80,
          totalMonthlyHousingCost: mortgage.total_monthly_housing_cost ? parseFloat(mortgage.total_monthly_housing_cost) : 0,
          startDate: mortgage.start_date,
          maturityDate: mortgage.maturity_date,
          dueDate: mortgage.due_date,
          status: mortgage.status === 'active' ? 'Active' : mortgage.status === 'paid_off' ? 'Paid Off' : capitalizeWords(mortgage.status?.replace('_', ' ') || ''),
          autoPay: mortgage.auto_pay,
          notes: mortgage.notes,
          createdAt: mortgage.created_at,
          updatedAt: mortgage.updated_at,
        };
      });

      const mappedBills: Bill[] = (bills || []).map(bill => ({
        id: bill.id,
        name: bill.bill_name,
        category: capitalizeFirstLetter(bill.category),
        amount: parseFloat(bill.amount) || 0,
        averageAmount: bill.average_amount ? parseFloat(bill.average_amount) : undefined,
        frequency: bill.frequency,
        dueDate: bill.due_date,
        isEssential: bill.is_essential,
        autoPay: bill.auto_pay,
        website: bill.website,
        notes: bill.notes,
        lastPaidDate: bill.last_paid_date,
      }));

      const mappedGoals: Goal[] = (goals || []).map(goal => ({
        id: goal.id,
        name: goal.goal_name,
        type: capitalizeWords(goal.category.replace('_', ' ')),
        current: parseFloat(goal.current_amount) || 0,
        target: parseFloat(goal.target_amount) || 0,
        monthlyContribution: parseFloat(goal.monthly_contribution || '0') || 0,
        priority: capitalizeFirstLetter(goal.priority) as any,
      }));

      const mappedSnapshots: Snapshot[] = (snapshots || []).map(snap => ({
        id: snap.id,
        date: snap.snapshot_date,
        totalDebt: parseFloat(snap.total_debt || '0'),
        totalMonthlyPayments: parseFloat(snap.total_monthly_debt_payments || '0'),
        totalBills: parseFloat(snap.total_monthly_bills || '0'),
        dtiRatio: parseFloat(snap.dti_ratio || '0'),
        creditUtilization: parseFloat(snap.credit_utilization || '0'),
      }));

      setData({
        cards: mappedCards,
        loans: mappedLoans,
        mortgages: mappedMortgages,
        bills: mappedBills,
        goals: mappedGoals,
        snapshots: mappedSnapshots,
        settings: {
          monthlyIncome: profile?.monthly_income ? parseFloat(profile.monthly_income) : 0,
          currencySymbol: '$',
          payoffStrategy: profile?.default_payoff_strategy || 'avalanche',
        },
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching Supabase data:', error);
      setData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user?.id]);

  return { ...data, refetch: fetchAllData };
};

// Helper functions
function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function capitalizeWords(str: string): string {
  if (!str) return '';
  return str.split(' ').map(word => capitalizeFirstLetter(word)).join(' ');
}
