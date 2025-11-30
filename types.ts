export interface DebtSummary {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface CreditCardHistory {
  date: string;
  balance: number;
  limit: number;
  apr: number;
  minimumPayment: number;
}

export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  limit: number;
  apr: number;
  minimumPayment: number;
  extraPayment?: number;
  dueDate?: number;
  status: 'Active' | 'Paid Off' | 'Closed';
  utilization: number;
  payoffDate?: string;
  interest?: number;
  history?: CreditCardHistory[];
}

export interface Loan {
  id: string;
  name: string;
  type: 'Personal' | 'Auto' | 'Student' | 'Mortgage' | 'Other';
  currentBalance: number;
  originalPrincipal: number;
  rate: number;
  termMonths: number;
  monthlyPayment: number;
  startDate?: string;
  extraPayment?: number;
}

export interface Bill {
  id: string;
  name: string;
  category: 'Housing' | 'Transportation' | 'Utilities' | 'Food' | 'Healthcare' | 'Insurance' | 'Entertainment' | 'Subscriptions' | 'Other';
  amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually';
  dueDate?: number;
  isEssential: boolean;
  autoPay: boolean;
  icon?: string;
}

export interface Goal {
  id: string;
  name: string;
  type: 'Savings' | 'Emergency Fund' | 'Debt Payoff' | 'Investment' | 'Purchase' | 'Other';
  current: number;
  target: number;
  monthlyContribution: number;
  targetDate?: string;
  priority: 'Low' | 'Medium' | 'High';
  remainingMonths: number;
}

export interface Snapshot {
  id: string;
  date: string;
  totalDebt: number;
  totalMonthlyPayments: number;
  totalBills: number;
  dtiRatio: number;
  creditUtilization: number;
}

export interface UserSettings {
  monthlyIncome: number;
  currencySymbol: string;
  payoffStrategy: 'avalanche' | 'snowball' | 'custom';
}