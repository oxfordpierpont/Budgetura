import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CreditCard, Loan, Bill, Goal, Snapshot, UserSettings } from '../types';
import { useSupabaseData } from '../src/hooks/useSupabaseData';
import { useAuth } from '../src/hooks/useAuth';
import * as ops from '../src/lib/supabase/operations';

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
  aiChatState: AIChatState;
  loading: boolean;
  setAIChatState: (state: AIChatState) => void;
  addCard: (card: CreditCard) => Promise<void>;
  updateCard: (id: string, card: Partial<CreditCard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  addLoan: (loan: Loan) => Promise<void>;
  updateLoan: (id: string, loan: Partial<Loan>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  addBill: (bill: Bill) => Promise<void>;
  updateBill: (id: string, bill: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  createSnapshot: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

const DebtContext = createContext<DebtContextType | undefined>(undefined);

export const DebtProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { cards, loans, bills, goals, snapshots, settings, loading, refetch } = useSupabaseData();
  const [aiChatState, setAIChatState] = useState<AIChatState>({ isOpen: false });

  // Credit Cards
  const addCard = async (card: CreditCard) => {
    if (!user) return;
    await ops.addCreditCard(user.id, card);
    await refetch();
  };

  const updateCard = async (id: string, updates: Partial<CreditCard>) => {
    await ops.updateCreditCard(id, updates);
    await refetch();
  };

  const deleteCard = async (id: string) => {
    await ops.deleteCreditCard(id);
    await refetch();
  };

  // Loans
  const addLoan = async (loan: Loan) => {
    if (!user) return;
    await ops.addLoan(user.id, loan);
    await refetch();
  };

  const updateLoan = async (id: string, updates: Partial<Loan>) => {
    await ops.updateLoan(id, updates);
    await refetch();
  };

  const deleteLoan = async (id: string) => {
    await ops.deleteLoan(id);
    await refetch();
  };

  // Bills
  const addBill = async (bill: Bill) => {
    if (!user) return;
    await ops.addBill(user.id, bill);
    await refetch();
  };

  const updateBill = async (id: string, updates: Partial<Bill>) => {
    await ops.updateBill(id, updates);
    await refetch();
  };

  const deleteBill = async (id: string) => {
    await ops.deleteBill(id);
    await refetch();
  };

  // Goals
  const addGoal = async (goal: Goal) => {
    if (!user) return;
    await ops.addGoal(user.id, goal);
    await refetch();
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    await ops.updateGoal(id, updates);
    await refetch();
  };

  const deleteGoal = async (id: string) => {
    await ops.deleteGoal(id);
    await refetch();
  };

  // Snapshots
  const createSnapshot = async () => {
    if (!user) return;

    const totalDebt = cards.reduce((sum, c) => sum + c.balance, 0) + loans.reduce((sum, l) => sum + l.currentBalance, 0);
    const totalPayments = cards.reduce((sum, c) => sum + c.minimumPayment + (c.extraPayment || 0), 0) +
                         loans.reduce((sum, l) => sum + l.monthlyPayment + (l.extraPayment || 0), 0);
    const totalBillsVal = bills.reduce((sum, b) => sum + b.amount, 0);

    const snapshot = {
      totalDebt,
      totalMonthlyPayments: totalPayments,
      totalBills: totalBillsVal,
      dtiRatio: settings.monthlyIncome > 0 ? (totalPayments / settings.monthlyIncome) * 100 : 0,
      creditUtilization: cards.length > 0 ? cards.reduce((sum, c) => sum + c.utilization, 0) / cards.length : 0,
    };

    await ops.createSnapshot(user.id, snapshot);
    await refetch();
  };

  // Settings
  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return;
    await ops.updateUserSettings(user.id, updates);
    await refetch();
  };

  return (
    <DebtContext.Provider value={{
      cards,
      loans,
      bills,
      goals,
      snapshots,
      settings,
      aiChatState,
      loading,
      setAIChatState,
      addCard,
      updateCard,
      deleteCard,
      addLoan,
      updateLoan,
      deleteLoan,
      addBill,
      updateBill,
      deleteBill,
      addGoal,
      updateGoal,
      deleteGoal,
      createSnapshot,
      updateSettings
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
