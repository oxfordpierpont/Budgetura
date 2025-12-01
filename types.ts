

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

export type CardType = 'Credit' | 'Charge' | 'Secured';
export type CardNetwork = 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Other';
export type CardStatus = 'Active' | 'Paid Off' | 'Closed' | 'Frozen';

export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  limit: number;
  apr: number;
  minimumPayment: number;
  extraPayment?: number;
  dueDate?: number; // Day of month (1-31)
  status: CardStatus;
  utilization: number;
  payoffDate?: string;
  interest?: number;
  history?: CreditCardHistory[];
  
  // Extended Fields
  issuer?: string;
  lastFourDigits?: string;
  cardType?: CardType;
  network?: CardNetwork;
  annualFee?: number;
  minimumPaymentPercentage?: number;
  statementDate?: number; // Day of month (1-31)
  autoPay?: boolean;
  rewardsProgram?: string;
  cashbackRate?: number;
  pointsBalance?: number;
  openedDate?: string;
  notes?: string;
}

export interface LoanHistory {
  date: string;
  balance: number;
  rate: number;
  monthlyPayment: number;
}

export type LoanStatus = 'Active' | 'Paid Off' | 'Closed' | 'Deferment' | 'Forbearance' | 'Default' | 'Charged Off';

export type LoanCategory = 
  | 'Auto' 
  | 'Student' 
  | 'Mortgage' 
  | 'Personal' 
  | 'Home Equity' 
  | 'Business' 
  | 'Medical' 
  | 'Payday' 
  | 'BNPL' 
  | 'Family' 
  | 'Consolidation' 
  | 'Other';

export interface Loan {
  id: string;
  name: string;
  type: LoanCategory;
  currentBalance: number;
  originalPrincipal: number;
  rate: number;
  termMonths: number;
  monthlyPayment: number;
  startDate?: string;
  extraPayment?: number;
  history?: LoanHistory[];

  // Core Extended Fields
  lender?: string;
  accountNumber?: string; // Last 4 digits
  status?: LoanStatus;
  dueDate?: number; // Day of month (1-31)
  autoPay?: boolean;
  interestType?: 'Fixed' | 'Variable';
  notes?: string;
  
  // Terms & Fees
  paymentFrequency?: 'Monthly' | 'Bi-Weekly' | 'Weekly';
  originationFee?: number;
  prepaymentPenalty?: boolean;

  // Auto Loan Specifics
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleTrim?: string;
  vin?: string;
  mileage?: number;

  // Student Loan Specifics
  loanProgramType?: string; // e.g. Federal Direct, Private
  servicerName?: string;
  schoolName?: string;
  graduationDate?: string;

  // Mortgage Specifics
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  propertyType?: string; // Single Family, Condo
  escrowMonthly?: number; // Taxes + Insurance
  pmiMonthly?: number;
  hoaMonthly?: number;

  // HELOC
  creditLimit?: number;
  drawPeriodEnd?: string;

  // Medical
  providerName?: string;
  serviceDate?: string;

  // Business
  businessName?: string;
  businessRevenue?: number;

  // BNPL
  merchantName?: string;
  purchaseDescription?: string;
  totalInstallments?: number;

  // Family
  relationshipType?: string; // Parent, Friend, etc.

  // Generic / Other
  collateral?: string;
}

export interface BillPaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: 'On Time' | 'Late' | 'Skipped';
}

export type BillCategory = 'Housing' | 'Transportation' | 'Utilities' | 'Food' | 'Healthcare' | 'Insurance' | 'Entertainment' | 'Subscriptions' | 'Debt' | 'Other';

export interface Bill {
  id: string;
  name: string;
  category: BillCategory;
  amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually';
  dueDate?: number; // Day of month for recurring
  isEssential: boolean;
  autoPay: boolean;
  icon?: string;
  
  // Extended fields
  website?: string;
  notes?: string;
  lastPaidDate?: string; // ISO String
  history?: BillPaymentHistory[];
  averageAmount?: number; // For variable bills like electric
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
