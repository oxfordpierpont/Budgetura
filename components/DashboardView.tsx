import React from 'react';
import { useDebt } from '../context/DebtContext';
import { Plus, Bell, Search, ArrowUpRight, GraduationCap, Car, Home } from 'lucide-react';
import DebtBreakdownChart from './DebtBreakdownChart';
import CreditCardItem from './CreditCardItem';
import { BillWidget, GoalWidget, SavingsPromo } from './Widgets';
import AskAIButton from './AskAIButton';
import BankingSummaryCard from './BankingSummaryCard';
import { usePlaid } from '../src/hooks/usePlaid';

interface Props {
    setMobileMenuOpen: (open: boolean) => void;
    onAskAI?: (prompt: string) => void;
    onNavigate: (view: string) => void;
}

const DashboardView: React.FC<Props> = ({ setMobileMenuOpen, onAskAI, onNavigate }) => {
  const { cards, loans, bills, goals, createSnapshot, settings } = useDebt();
  const { accounts: plaidAccounts } = usePlaid();

  const handleAsk = (prompt: string) => {
      if (onAskAI) onAskAI(prompt);
  };

  // Live Calculations
  const totalDebt = cards.reduce((s, c) => s + c.balance, 0) + loans.reduce((s, l) => s + l.currentBalance, 0);
  const monthlyPayments = cards.reduce((s, c) => s + c.minimumPayment, 0) + loans.reduce((s, l) => s + l.monthlyPayment, 0);
  const monthlyBillTotal = bills.reduce((s, b) => s + b.amount, 0);

  const dti = settings.monthlyIncome > 0 ? ((monthlyPayments + monthlyBillTotal) / settings.monthlyIncome) * 100 : 0;

  const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
  const totalCardBalance = cards.reduce((s, c) => s + c.balance, 0);
  const utilization = totalLimit > 0 ? (totalCardBalance / totalLimit) * 100 : 0;

  return (
      <div className="flex-1 flex flex-col md:flex-row h-full">

        {/* Left/Middle Column */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar scroll-smooth relative z-0">

          {/* Header */}
          <header className="px-5 py-4 md:px-8 md:pt-8 md:pb-6 bg-white sticky top-0 z-20 border-b border-gray-100">
            <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden focus:ring-2 focus:ring-blue-500"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Welcome back!</h1>
                        <p className="text-gray-500 text-xs md:text-sm mt-0.5">Here's your current financial overview</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <button className="p-2 md:p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors hidden sm:block">
                        <Search size={20} />
                    </button>
                    <button className="p-2 md:p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-bold uppercase">Total Debt</p>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mt-1">${totalDebt.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-bold uppercase">Monthly Output</p>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mt-1">${(monthlyPayments + monthlyBillTotal).toLocaleString()}</p>
                </div>
                <div className={`p-4 rounded-2xl border ${dti < 36 ? 'bg-emerald-50 border-emerald-100' : dti < 43 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-xs font-bold uppercase ${dti < 36 ? 'text-emerald-600' : dti < 43 ? 'text-yellow-600' : 'text-red-600'}`}>DTI Ratio</p>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mt-1">{dti.toFixed(1)}%</p>
                </div>
                 <div className={`p-4 rounded-2xl border ${utilization < 30 ? 'bg-emerald-50 border-emerald-100' : utilization < 50 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-xs font-bold uppercase ${utilization < 30 ? 'text-emerald-600' : utilization < 50 ? 'text-yellow-600' : 'text-red-600'}`}>Credit Util.</p>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mt-1">{utilization.toFixed(1)}%</p>
                </div>
            </div>
          </header>

          <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
            {/* Banking Summary Card */}
            <BankingSummaryCard accounts={plaidAccounts} onNavigate={onNavigate} />

            {/* Debt Chart Section */}
            <section className="bg-white p-4 md:p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 relative group/section">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 text-lg">Debt Breakdown</h3>
                    <div className="flex items-center gap-2">
                        <AskAIButton onClick={() => handleAsk("Analyze my current debt breakdown. Is my ratio of mortgage to consumer debt healthy?")} />
                    </div>
                </div>
                <DebtBreakdownChart />
            </section>

            {/* Two Column Grid for Lists */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">

                {/* Credit Cards Column */}
                <section>
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-bold text-gray-900 text-lg">Active Credit Cards</h3>
                        <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">{cards.length} Active</span>
                    </div>
                    <div>
                        {cards.map(card => (
                            <CreditCardItem
                                key={card.id}
                                card={card}
                                onAskAI={() => handleAsk(`Help me with a plan to pay off my ${card.name}. It has a balance of $${card.balance} and ${card.apr}% APR.`)}
                            />
                        ))}
                    </div>
                </section>

                {/* Loans Column */}
                <section>
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-bold text-gray-900 text-lg">Loans</h3>
                        <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">{loans.length} Active</span>
                    </div>
                    <div className="space-y-4">
                        {loans.map(loan => (
                            <div key={loan.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative group">
                                {/* AI Hover Button */}
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <AskAIButton onClick={() => handleAsk(`Should I refinance my ${loan.name}? Rate is ${loan.rate}%.`)} label="Analyze" />
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 sm:gap-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${loan.type === 'Student' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {loan.type === 'Student' ? <GraduationCap size={18} /> : loan.type === 'Mortgage' ? <Home size={18} /> : <Car size={18} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{loan.name}</h4>
                                            <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded mt-1 inline-block">Rate: {loan.rate}%</span>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900 text-xl sm:text-base pr-8 sm:pr-0">-${loan.currentBalance.toLocaleString()}</span >
                                </div>
                                <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-50">
                                    <div className="text-gray-500">
                                        Payment: <span className="font-bold text-gray-800">${loan.monthlyPayment}/mo</span>
                                    </div>
                                    <div className="text-gray-500">
                                        Term: <span className="font-bold text-gray-800">{loan.termMonths} mos</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar details) */}
        <div className="w-full md:w-80 lg:w-[380px] bg-white p-6 md:p-8 flex flex-col border-l border-gray-100 lg:overflow-y-auto z-10 custom-scrollbar border-t md:border-t-0 shrink-0">

           {/* Goals Section */}
           <div className="mb-10">
              <div className="flex justify-between items-end mb-6">
                  <h3 className="font-bold text-gray-900 text-lg">Goals Progress</h3>
                  <button className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1">
                      See All <ArrowUpRight size={12} />
                  </button>
              </div>
              <GoalWidget goals={goals} />
           </div>

            {/* Monthly Bills */}
           <div className="mb-8 flex-1">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-gray-900 text-lg">Upcoming Bills</h3>
                 <span className="text-xs text-gray-400">Monthly</span>
              </div>
              <BillWidget bills={bills} />
           </div>

           {/* Promo Card */}
           <div className="mt-8 lg:mt-auto">
              <SavingsPromo />
           </div>

        </div>

      </div>
  );
};

export default DashboardView;
