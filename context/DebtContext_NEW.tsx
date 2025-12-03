

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CreditCard, Loan, Bill, Goal, Snapshot, UserSettings, BankAccount, PlaidItem } from '../types';
import { CREDIT_CARDS, LOANS, BILLS, GOALS, BANK_ACCOUNTS, BANK_ITEMS } from '../constants'; // Fallback data

interface AIChatState {
  isOpen: boolean;
  initialMessage?: string;
  contextData?: any;
}

interface DebtContextType {
  cards: CreditCard[];
  loans: Loan[];
  bills: Bill[];
  goals: Goal[];
  snapshots: Snapshot[];
  settings: UserSettings;
  accounts: BankAccount[];
  bankItems: PlaidItem[];
  aiChatState: AIChatState;
  setAIChatState: (state: AIChatState) => void;
  addCard: (card: CreditCard) => void;
  updateCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCard: (id: string) => void;
  addLoan: (loan: Loan) => void;
  updateLoan: (id: string, loan: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  addBill: (bill: Bill) => void;
  updateBill: (id: string, bill: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  createSnapshot: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setAccounts: (accounts: BankAccount[]) => void;
  setBankItems: (items: PlaidItem[]) => void;
}

const DebtContext = createContext<DebtContextType | undefined>(undefined);

// Adapter to convert simple constants to full types for initial state
const initialCards: CreditCard[] = CREDIT_CARDS;
const initialLoans: Loan[] = LOANS;
const initialBills: Bill[] = BILLS;
const initialGoals: Goal[] = GOALS;
const initialAccounts: BankAccount[] = BANK_ACCOUNTS;
const initialBankItems: PlaidItem[] = BANK_ITEMS;

export const DebtProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load from local storage or use defaults
  const [cards, setCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem('dd_cards');
    return saved ? JSON.parse(saved) : initialCards;
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem('dd_loans');
    return saved ? JSON.parse(saved) : initialLoans;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('dd_bills');
    return saved ? JSON.parse(saved) : initialBills;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('dd_goals');
    return saved ? JSON.parse(saved) : initialGoals;
  });

  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    const saved = localStorage.getItem('dd_snapshots');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('dd_settings');
    return saved ? JSON.parse(saved) : { monthlyIncome: 4000, currencySymbol: '$', payoffStrategy: 'avalanche' };
  });

  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
      const saved = localStorage.getItem('dd_accounts');
      return saved ? JSON.parse(saved) : initialAccounts;
  });

  const [bankItems, setBankItems] = useState<PlaidItem[]>(() => {
      const saved = localStorage.getItem('dd_bank_items');
      return saved ? JSON.parse(saved) : initialBankItems;
  });

  const [aiChatState, setAIChatState] = useState<AIChatState>({ isOpen: false });

  // Persistence Effects
  useEffect(() => localStorage.setItem('dd_cards', JSON.stringify(cards)), [cards]);
  useEffect(() => localStorage.setItem('dd_loans', JSON.stringify(loans)), [loans]);
  useEffect(() => localStorage.setItem('dd_bills', JSON.stringify(bills)), [bills]);
  useEffect(() => localStorage.setItem('dd_goals', JSON.stringify(goals)), [goals]);
  useEffect(() => localStorage.setItem('dd_snapshots', JSON.stringify(snapshots)), [snapshots]);
  useEffect(() => localStorage.setItem('dd_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('dd_accounts', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('dd_bank_items', JSON.stringify(bankItems)), [bankItems]);


  // Actions
  const addCard = (card: CreditCard) => setCards([...cards, card]);
  const updateCard = (id: string, updates: Partial<CreditCard>) => 
    setCards(cards.map(c => c.id === id ? { ...c, ...updates } : c));
  const deleteCard = (id: string) => setCards(cards.filter(c => c.id !== id));

  const addLoan = (loan: Loan) => setLoans([...loans, loan]);
  const updateLoan = (id: string, updates: Partial<Loan>) => 
    setLoans(loans.map(l => l.id === id ? { ...l, ...updates } : l));
  const deleteLoan = (id: string) => setLoans(loans.filter(l => l.id !== id));

  const addBill = (bill: Bill) => setBills([...bills, bill]);
  const updateBill = (id: string, updates: Partial<Bill>) => 
    setBills(bills.map(b => b.id === id ? { ...b, ...updates } : b));
  const deleteBill = (id: string) => setBills(bills.filter(b => b.id !== id));

  const addGoal = (goal: Goal) => setGoals([...goals, goal]);
  const updateGoal = (id: string, updates: Partial<Goal>) => 
    setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  const deleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  const createSnapshot = () => {
    const totalDebt = cards.reduce((sum, c) => sum + c.balance, 0) + loans.reduce((sum, l) => sum + l.currentBalance, 0);
    const totalPayments = cards.reduce((sum, c) => sum + c.minimumPayment + (c.extraPayment || 0), 0) + 
                         loans.reduce((sum, l) => sum + l.monthlyPayment + (l.extraPayment || 0), 0);
    const totalBillsVal = bills.reduce((sum, b) => sum + b.amount, 0); // Simplified monthly
    
    const newSnapshot: Snapshot = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      totalDebt,
      totalMonthlyPayments: totalPayments,
      totalBills: totalBillsVal,
      dtiRatio: settings.monthlyIncome > 0 ? (totalPayments / settings.monthlyIncome) * 100 : 0,
      creditUtilization: 45 // mock for now
    };
    setSnapshots([newSnapshot, ...snapshots]);
  };

  const updateSettings = (updates: Partial<UserSettings>) => setSettings({ ...settings, ...updates });

  return (
    <DebtContext.Provider value={{
      cards, loans, bills, goals, snapshots, settings, aiChatState, accounts, bankItems, setAIChatState,
      addCard, updateCard, deleteCard,
      addLoan, updateLoan, deleteLoan,
      addBill, updateBill, deleteBill,
      addGoal, updateGoal, deleteGoal,
      createSnapshot, updateSettings,
      setAccounts, setBankItems
    }}>
      {children}
    </DebtContext.Provider>
  );
};

export const useDebt = () => {
  const context = useContext(DebtContext);
  if (context === undefined) {
    throw new Error('useDebt must be used within a DebtProvider');
  }
  return context;
};