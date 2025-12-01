
import { CreditCard, Loan, Bill, Goal, DebtSummary } from './types';

// --- Dynamic Date Helpers for Realistic Demo Data ---
const today = new Date();

// Helper to get a date relative to today
const getRelativeDate = (dayOffset: number): Date => {
  const d = new Date(today);
  d.setDate(today.getDate() + dayOffset);
  return d;
};

// Helper to get a day of the month (1-31) relative to today.
const getRelativeDayOfMonth = (dayOffset: number): number => {
  const d = getRelativeDate(dayOffset);
  return d.getDate();
};

// Force a date to be in the current month for "Paid" logic
const getCurrentMonthDate = (day: number): string => {
  const d = new Date(today.getFullYear(), today.getMonth(), day);
  // Handle edge cases where day doesn't exist in current month (e.g. 31st) by rolling back
  if (d.getMonth() !== today.getMonth()) {
     d.setDate(0); 
  }
  return d.toISOString();
}

// Get previous month ISO for history
const getPrevMonthDate = (day: number): string => {
    const d = new Date(today.getFullYear(), today.getMonth() - 1, day);
    return d.toISOString();
}

export const DEBT_SUMMARY: DebtSummary[] = [
  { category: 'Credit Cards', amount: 9625.50, percentage: 3.2, color: '#EF4444' }, // Red
  { category: 'Loans', amount: 338100.00, percentage: 85.1, color: '#F59E0B' }, // Orange/Yellow
  { category: 'Other', amount: 0, percentage: 0, color: '#3B82F6' }, // Blue
];

export const CREDIT_CARDS: CreditCard[] = [
  {
    id: '1',
    name: 'Capital One Quicksilver',
    balance: 4500.00,
    limit: 8000.00,
    utilization: 56.3,
    apr: 23.0,
    payoffDate: 'March 2028',
    interest: 1380.00,
    status: 'Active',
    minimumPayment: 135.00,
    
    issuer: 'Capital One',
    lastFourDigits: '4242',
    cardType: 'Credit',
    network: 'Mastercard',
    annualFee: 0,
    minimumPaymentPercentage: 3,
    // Upcoming: Due in 5 days
    dueDate: getRelativeDayOfMonth(5), 
    statementDate: getRelativeDayOfMonth(-10),
    autoPay: true,
    rewardsProgram: 'Cash Back',
    cashbackRate: 1.5,
    pointsBalance: 45.20,
    openedDate: '2019-05-12',
    notes: 'Primary card for groceries.',

    history: [
      { date: '2023-12-01', balance: 4800.00, limit: 8000.00, apr: 22.5, minimumPayment: 140.00 },
      { date: '2023-11-01', balance: 5000.00, limit: 8000.00, apr: 22.5, minimumPayment: 150.00 }
    ]
  },
  {
    id: '2',
    name: 'Discover It Cash Back',
    balance: 1875.50,
    limit: 5000.00,
    utilization: 37.5,
    apr: 16.5,
    payoffDate: 'Jan 2027',
    interest: 312.00,
    status: 'Active',
    minimumPayment: 56.00,
    
    issuer: 'Discover',
    lastFourDigits: '1234',
    cardType: 'Credit',
    network: 'Discover',
    annualFee: 0,
    minimumPaymentPercentage: 2,
    // REAL OVERDUE ITEM: Due 2 days ago
    dueDate: getRelativeDayOfMonth(-2), 
    statementDate: getRelativeDayOfMonth(-15),
    autoPay: false,
    rewardsProgram: 'Cash Back Match',
    cashbackRate: 5,
    pointsBalance: 120.00,
    openedDate: '2021-08-01',

    history: [
      { date: '2023-12-01', balance: 2000.00, limit: 5000.00, apr: 16.5, minimumPayment: 60.00 }
    ]
  },
  {
    id: '3',
    name: 'Chase Freedom Unlimited',
    balance: 3250.00,
    limit: 10000.00,
    utilization: 32.5,
    apr: 19.0,
    payoffDate: 'Feb 2027',
    interest: 462.50,
    status: 'Active',
    minimumPayment: 97.00,
    
    issuer: 'Chase',
    lastFourDigits: '9876',
    cardType: 'Credit',
    network: 'Visa',
    annualFee: 0,
    minimumPaymentPercentage: 2.5,
    // Upcoming: Due in 15 days
    dueDate: getRelativeDayOfMonth(15), 
    statementDate: getRelativeDayOfMonth(2),
    autoPay: true,
    rewardsProgram: 'Ultimate Rewards',
    cashbackRate: 1.5,
    pointsBalance: 15400,
    openedDate: '2020-01-15',

    history: []
  }
];

export const LOANS: Loan[] = [
  {
    id: '1',
    name: 'Highland Park Home',
    type: 'Mortgage',
    currentBalance: 238500.00,
    monthlyPayment: 1650.00,
    rate: 3.875,
    originalPrincipal: 250000.00,
    termMonths: 360,
    lender: 'Chase Home Lending',
    accountNumber: '9921',
    status: 'Active',
    // Due in 3 days (Upcoming)
    dueDate: getRelativeDayOfMonth(3), 
    autoPay: true,
    startDate: '2020-03-01',
    interestType: 'Fixed',
    paymentFrequency: 'Monthly',
    
    propertyAddress: '123 Highland Park Dr',
    propertyCity: 'Seattle',
    propertyState: 'WA',
    propertyZip: '98106',
    propertyType: 'Single Family',
    escrowMonthly: 450.00,
    hoaMonthly: 50.00,
    notes: 'Refinanced in 2020. Escrow includes tax and insurance.'
  },
  {
    id: '2',
    name: 'Federal Student Loan',
    type: 'Student',
    currentBalance: 32750.00,
    monthlyPayment: 380.00,
    rate: 5.5,
    originalPrincipal: 35000.00,
    termMonths: 120,
    lender: 'Navient',
    accountNumber: '8812',
    status: 'Active',
    // Due in 7 days (Upcoming)
    dueDate: getRelativeDayOfMonth(7), 
    autoPay: false, 
    startDate: '2018-09-01',
    interestType: 'Fixed',
    loanProgramType: 'Federal Direct',
    schoolName: 'University of Washington',
    graduationDate: '2018-05-15',
    notes: 'Consolidated federal loans.'
  },
  {
    id: '3',
    name: 'Honda Civic Auto Loan',
    type: 'Auto',
    currentBalance: 18500.00,
    monthlyPayment: 525.00,
    rate: 5.0,
    originalPrincipal: 22000.00,
    termMonths: 48,
    lender: 'Honda Financial Services',
    accountNumber: '5590',
    status: 'Active',
    // Due in 12 days (Upcoming)
    dueDate: getRelativeDayOfMonth(12), 
    autoPay: true,
    startDate: '2022-06-15',
    interestType: 'Fixed',
    vehicleYear: 2022,
    vehicleMake: 'Honda',
    vehicleModel: 'Civic EX',
    vin: '1HG99283849182394',
    mileage: 24500,
    notes: '0.9% promo rate ended.'
  },
  {
    id: '4',
    name: 'Upstart Consolidation',
    type: 'Personal',
    currentBalance: 12000.00,
    monthlyPayment: 385.00,
    rate: 11.5,
    originalPrincipal: 15000.00,
    termMonths: 60,
    lender: 'Upstart',
    accountNumber: '3341',
    status: 'Active',
    // Due in 20 days (Upcoming)
    dueDate: getRelativeDayOfMonth(20), 
    autoPay: true,
    startDate: '2023-01-10',
    interestType: 'Fixed',
    notes: 'Used to pay off old Discover card.'
  }
];

export const BILLS: Bill[] = [
  { 
    id: '1', 
    name: 'T-Mobile Wireless', 
    category: 'Utilities', 
    amount: 85.00, 
    averageAmount: 85.00,
    frequency: 'monthly', 
    // Due 5 days ago, PAID
    dueDate: getRelativeDayOfMonth(-5), 
    isEssential: true, 
    autoPay: true, 
    website: 'https://www.t-mobile.com', 
    notes: 'Includes protection plan.',
    lastPaidDate: getCurrentMonthDate(getRelativeDayOfMonth(-5)), // Paid on due date this month
    history: [
      { id: 'h1', date: getCurrentMonthDate(getRelativeDayOfMonth(-5)), amount: 85.00, status: 'On Time' }, // Current Month Paid
      { id: 'h2', date: getPrevMonthDate(getRelativeDayOfMonth(-5)), amount: 85.00, status: 'On Time' },
      { id: 'h3', date: getRelativeDate(-65).toISOString(), amount: 85.00, status: 'On Time' }
    ]
  },
  { 
    id: '2', 
    name: 'Netflix Premium', 
    category: 'Subscriptions', 
    amount: 22.99, 
    frequency: 'monthly', 
    // Due in 2 days, UPCOMING
    dueDate: getRelativeDayOfMonth(2), 
    icon: 'tv', 
    isEssential: false, 
    autoPay: true, 
    website: 'https://netflix.com',
    lastPaidDate: getPrevMonthDate(getRelativeDayOfMonth(2)), 
    history: [
      { id: 'h1', date: getPrevMonthDate(getRelativeDayOfMonth(2)), amount: 15.99, status: 'On Time' }, // Price increased this month!
      { id: 'h2', date: getRelativeDate(-58).toISOString(), amount: 15.99, status: 'On Time' }
    ]
  },
  { 
    id: '3', 
    name: 'Planet Fitness', 
    category: 'Entertainment', 
    amount: 24.99, 
    frequency: 'monthly', 
    // Due in 12 days, UPCOMING
    dueDate: getRelativeDayOfMonth(12), 
    icon: 'dumbbell', 
    isEssential: false, 
    autoPay: true,
    notes: 'Black Card membership',
    lastPaidDate: getPrevMonthDate(getRelativeDayOfMonth(12)),
    history: [
        { id: 'h1', date: getPrevMonthDate(getRelativeDayOfMonth(12)), amount: 24.99, status: 'On Time' },
        { id: 'h2', date: getRelativeDate(-48).toISOString(), amount: 24.99, status: 'On Time' }
    ]
  },
  { 
    id: '4', 
    name: 'Geico Auto Insurance', 
    category: 'Insurance', 
    amount: 145.00, 
    frequency: 'monthly', 
    // Due 2 days ago, NO Payment -> OVERDUE
    dueDate: getRelativeDayOfMonth(-2), 
    icon: 'car', 
    isEssential: true, 
    autoPay: true,
    lastPaidDate: getPrevMonthDate(getRelativeDayOfMonth(-2)), // Paid last month
    history: [
        { id: 'h1', date: getPrevMonthDate(getRelativeDayOfMonth(-2)), amount: 148.00, status: 'On Time' }, // Price decreased slightly
        { id: 'h2', date: getRelativeDate(-62).toISOString(), amount: 148.00, status: 'On Time' }
    ]
  },
  { 
    id: '5', 
    name: 'Xfinity Internet', 
    category: 'Utilities', 
    amount: 79.99, 
    frequency: 'monthly', 
    // Due 10 days ago, PAID
    dueDate: getRelativeDayOfMonth(-10), 
    icon: 'wifi', 
    isEssential: true, 
    autoPay: true,
    notes: 'Promo rate expires Aug 2024',
    lastPaidDate: getCurrentMonthDate(getRelativeDayOfMonth(-10)),
    history: [
        { id: 'h1', date: getCurrentMonthDate(getRelativeDayOfMonth(-10)), amount: 79.99, status: 'On Time' }, // Current Month Paid
        { id: 'h2', date: getPrevMonthDate(getRelativeDayOfMonth(-10)), amount: 79.99, status: 'On Time' },
        { id: 'h3', date: getRelativeDate(-70).toISOString(), amount: 79.99, status: 'On Time' }
    ]
  },
  { 
    id: '6', 
    name: 'City Light & Power', 
    category: 'Utilities', 
    amount: 125.00, 
    averageAmount: 110.00,
    frequency: 'monthly', 
    // Due in 5 days, UPCOMING
    dueDate: getRelativeDayOfMonth(5), 
    icon: 'zap', 
    isEssential: true, 
    autoPay: false,
    notes: 'Variable amount based on usage',
    lastPaidDate: getPrevMonthDate(getRelativeDayOfMonth(5)),
    history: [
        { id: 'h1', date: getPrevMonthDate(getRelativeDayOfMonth(5)), amount: 110.00, status: 'On Time' }, // Last month was less
        { id: 'h2', date: getRelativeDate(-55).toISOString(), amount: 95.00, status: 'On Time' },
        { id: 'h3', date: getRelativeDate(-85).toISOString(), amount: 105.00, status: 'On Time' }
    ]
  },
  {
      id: '7',
      name: 'Spotify Family',
      category: 'Subscriptions',
      amount: 16.99,
      frequency: 'monthly',
      // Due in 15 days, UPCOMING
      dueDate: getRelativeDayOfMonth(15), 
      icon: 'music',
      isEssential: false,
      autoPay: true,
      lastPaidDate: getPrevMonthDate(getRelativeDayOfMonth(15)),
      history: [
          { id: 'h1', date: getPrevMonthDate(getRelativeDayOfMonth(15)), amount: 16.99, status: 'On Time' }
      ]
  },
  {
      id: '8',
      name: 'Whole Foods Market',
      category: 'Food',
      amount: 600.00,
      frequency: 'monthly',
      // Today, UPCOMING
      dueDate: getRelativeDayOfMonth(0), 
      icon: 'shopping-cart',
      isEssential: true,
      autoPay: false,
      notes: 'Monthly grocery budget target',
      history: []
  }
];

export const GOALS: Goal[] = [
  {
    id: '1',
    name: 'Pay Off Credit Cards',
    type: 'Debt Payoff',
    current: 9625.50,
    target: 9625.50, // 100%
    monthlyContribution: 0,
    remainingMonths: 0,
    priority: 'High'
  },
  {
    id: '2',
    name: 'Vacation to Hawaii',
    type: 'Savings',
    current: 1200.00,
    target: 5000.00, // 24%
    monthlyContribution: 200,
    remainingMonths: 19,
    priority: 'Medium'
  },
  {
    id: '3',
    name: 'Emergency Fund',
    type: 'Emergency Fund',
    current: 3500.00,
    target: 10000.00, // 35%
    monthlyContribution: 250,
    remainingMonths: 26,
    priority: 'High'
  }
];
