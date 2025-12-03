import React, { useState, useMemo, useEffect } from 'react';
import { useDebt } from '../context/DebtContext';
import { Plus, Trash2, ChevronDown, ChevronUp, TrendingUp, Home, ShieldCheck, DollarSign, ArrowRight, Wallet, Percent, Sparkles, ArrowUpDown, PiggyBank, Clock, Edit2, X, MessageCircle, CalendarCheck, Coins, Landmark, MapPin, Building2, TrendingDown } from 'lucide-react';
import { Mortgage, MortgageHistory } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Helper for property type styling
const getPropertyStyles = (propertyType?: string) => {
    const type = propertyType?.toLowerCase() || '';
    if (type.includes('single')) return {
        bg: 'bg-blue-50', text: 'text-blue-700', border: 'hover:border-blue-200',
        iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
        shadow: 'hover:shadow-blue-500/10', accent: 'bg-blue-500',
        gradient: 'from-blue-600 to-indigo-600'
    };
    if (type.includes('condo')) return {
        bg: 'bg-purple-50', text: 'text-purple-700', border: 'hover:border-purple-200',
        iconBg: 'bg-purple-100', iconColor: 'text-purple-600',
        shadow: 'hover:shadow-purple-500/10', accent: 'bg-purple-500',
        gradient: 'from-purple-600 to-pink-600'
    };
    if (type.includes('townhouse')) return {
        bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'hover:border-indigo-200',
        iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600',
        shadow: 'hover:shadow-indigo-500/10', accent: 'bg-indigo-500',
        gradient: 'from-indigo-600 to-violet-600'
    };
    if (type.includes('multi')) return {
        bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'hover:border-emerald-200',
        iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
        shadow: 'hover:shadow-emerald-500/10', accent: 'bg-emerald-500',
        gradient: 'from-emerald-600 to-teal-600'
    };
    return {
        bg: 'bg-gray-50', text: 'text-gray-600', border: 'hover:border-gray-200',
        iconBg: 'bg-gray-100', iconColor: 'text-gray-500',
        shadow: 'hover:shadow-gray-200/50', accent: 'bg-gray-500',
        gradient: 'from-gray-700 to-gray-900'
    };
};

type SortOption = 'balance' | 'equity' | 'rate' | 'property';

interface MortgageManagerProps {
  activeItemId?: string | null;
  onItemExpanded?: () => void;
}

const MortgageManager: React.FC<MortgageManagerProps> = ({ activeItemId, onItemExpanded }) => {
  const { mortgages, addMortgage, deleteMortgage, updateMortgage, setAIChatState } = useDebt();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMortgage, setEditingMortgage] = useState<Mortgage | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('balance');

  // --- Aggregate Calculations ---
  const totalBalance = mortgages.reduce((sum, m) => sum + m.currentBalance, 0);
  const totalEquity = mortgages.reduce((sum, m) => sum + (m.equity || 0), 0);
  const totalPropertyValue = mortgages.reduce((sum, m) => sum + m.propertyValue, 0);
  const avgLTV = totalPropertyValue > 0 ? (totalBalance / totalPropertyValue) * 100 : 0;

  const totalMonthlyPayment = mortgages.reduce((sum, m) => sum + m.monthlyPayment, 0);
  const totalExtraCommitted = mortgages.reduce((sum, m) => sum + (m.extraPayment || 0), 0);
  const totalHousingCost = mortgages.reduce((sum, m) => {
    const baseCost = m.monthlyPayment + (m.extraPayment || 0);
    const additionalCosts = (m.monthlyPropertyTax || 0) + (m.monthlyInsurance || 0) + (m.monthlyHOA || 0) + (m.pmi || 0);
    return sum + baseCost + additionalCosts;
  }, 0);

  // Next Due Date Logic
  const nextDueMortgage = mortgages.length > 0 ? [...mortgages].sort((a, b) => (a.dueDate || 32) - (b.dueDate || 32))[0] : null;
  const formattedDueDate = mortgages.length > 0 && nextDueMortgage?.dueDate ? (() => {
    const today = new Date();
    const nextDueDate = new Date();
    if (nextDueMortgage.dueDate < today.getDate()) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }
    nextDueDate.setDate(nextDueMortgage.dueDate);
    return nextDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })() : '—';
  const nextDueLabel = nextDueMortgage?.propertyAddress ? `Due (${nextDueMortgage.propertyAddress.split(' ')[0]})` : 'Next Payment Due';

  // Sorting Logic
  const sortedMortgages = useMemo(() => {
      return [...mortgages].sort((a, b) => {
          switch(sortBy) {
              case 'balance': return b.currentBalance - a.currentBalance;
              case 'equity': return (b.equity || 0) - (a.equity || 0);
              case 'rate': return b.interestRate - a.interestRate;
              case 'property': return (a.propertyAddress || '').localeCompare(b.propertyAddress || '');
              default: return 0;
          }
      });
  }, [mortgages, sortBy]);

  // Health Styling for LTV
  const getHealthStyles = (ltv: number) => {
      if (ltv < 60) return { bg: 'bg-emerald-500', text: 'text-emerald-700', lightBg: 'bg-emerald-50', label: 'Excellent Equity' };
      if (ltv < 80) return { bg: 'bg-blue-500', text: 'text-blue-700', lightBg: 'bg-blue-50', label: 'Healthy' };
      if (ltv < 95) return { bg: 'bg-yellow-500', text: 'text-yellow-700', lightBg: 'bg-yellow-50', label: 'Moderate Risk' };
      return { bg: 'bg-red-500', text: 'text-red-700', lightBg: 'bg-red-50', label: 'High LTV' };
  };
  const health = getHealthStyles(avgLTV);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mortgage Manager</h1>
            <p className="text-gray-500 mt-1 font-medium">Track your properties and build equity over time.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="group flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
             <Plus size={16} />
          </div>
          Add New Mortgage
        </button>
      </div>

      {/* --- Vibrant Summary Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Card 1: LTV Health */}
           <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${health.lightBg} opacity-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className={`p-3 ${health.lightBg} rounded-2xl`}>
                      <ShieldCheck size={24} className={health.text.replace('text-', 'stroke-')} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${health.lightBg} ${health.text}`}>
                      {health.label}
                  </span>
              </div>

              <div className="relative z-10">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Avg Loan-to-Value</p>
                  <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-black text-gray-900 tracking-tight">{avgLTV.toFixed(1)}<span className="text-2xl">%</span></span>
                      <span className="text-sm font-semibold text-gray-400">LTV</span>
                  </div>

                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${health.bg}`}
                        style={{ width: `${Math.min(avgLTV, 100)}%` }}
                      ></div>
                  </div>
              </div>
          </div>

          {/* Card 2: Total Equity */}
          <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100/50 relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                      <TrendingUp size={24} />
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-sm">
                     <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Net Worth</span>
                  </div>
              </div>

              <div className="relative z-10">
                  <p className="text-emerald-800/80 text-xs font-bold uppercase tracking-widest mb-1">Total Equity</p>
                  <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-black text-gray-900 tracking-tight">${Math.round(totalEquity).toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-900/60 leading-relaxed">
                      Total Property Value: <strong className="text-emerald-900">${totalPropertyValue.toLocaleString()}</strong>
                  </p>
              </div>
          </div>

          {/* Card 3: Monthly Housing Cost */}
          <div className="bg-indigo-50 p-6 rounded-[24px] shadow-xl border border-indigo-100 text-indigo-900 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[200%] h-full bg-gradient-to-l from-indigo-500/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out"></div>

              <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-white rounded-xl border border-indigo-100 text-indigo-500 shadow-sm">
                          <Home size={20} />
                      </div>
                      <span className="text-sm font-bold text-indigo-700 tracking-wide">Monthly Cost</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-indigo-600/70 text-[10px] font-bold uppercase tracking-widest mb-2">Total Housing Payments</p>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-3xl font-black text-indigo-900">${Math.round(totalHousingCost).toLocaleString()}</span>
                            <span className="text-sm font-medium text-indigo-700">/mo</span>
                        </div>
                        <p className="text-xs font-medium text-indigo-600/70">
                          Includes principal, interest, taxes, insurance, HOA & PMI
                        </p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Forms & Modals */}
      {showAddForm && <AddMortgageForm onClose={() => setShowAddForm(false)} onSave={addMortgage} />}
      {editingMortgage && (
          <EditMortgageForm
            mortgage={editingMortgage}
            onClose={() => setEditingMortgage(null)}
            onSave={(updated) => {
              updateMortgage(updated.id, updated);
              setEditingMortgage(null);
            }}
          />
      )}

      {/* --- Controls Toolbar --- */}
      <div className="bg-white p-3 md:p-4 rounded-[20px] shadow-sm border border-gray-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 md:gap-8 w-full lg:w-auto flex-1 justify-start">
              <div className="flex items-center gap-4 md:gap-8 w-full lg:w-auto justify-between lg:justify-start">
                  <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shrink-0"><Wallet size={18} /></div>
                      <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Balance</p>
                          <p className="text-lg font-black text-gray-900 leading-none mt-0.5">${totalBalance.toLocaleString()}</p>
                      </div>
                  </div>
                  <div className="h-8 w-px bg-gray-100 hidden lg:block"></div>
                  <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 shrink-0"><PiggyBank size={18} /></div>
                      <div>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Total Equity</p>
                          <p className="text-lg font-bold text-emerald-600 leading-none mt-0.5">${Math.round(totalEquity).toLocaleString()}</p>
                      </div>
                  </div>
              </div>
              <div className="hidden lg:block h-8 w-px bg-gray-200"></div>
              <div className="flex items-center gap-4 md:gap-8 w-full lg:w-auto justify-between lg:justify-start">
                  <div className="flex items-center gap-3">
                       <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 shrink-0"><CalendarCheck size={18} /></div>
                       <div>
                           <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">{nextDueLabel}</p>
                           <p className="text-lg font-bold text-indigo-900 leading-none mt-0.5">{formattedDueDate}</p>
                       </div>
                   </div>
                   <div className="h-8 w-px bg-gray-100 hidden lg:block"></div>
                   <div className="flex items-center gap-3">
                       <div className="bg-purple-50 p-2 rounded-xl text-purple-600 shrink-0"><Coins size={18} /></div>
                       <div>
                           <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wide">Monthly Due</p>
                           <div className="flex items-baseline gap-1.5 mt-0.5">
                               <p className="text-lg font-black text-gray-900 leading-none">${Math.round(totalMonthlyPayment + totalExtraCommitted).toLocaleString()}</p>
                               {totalExtraCommitted > 0 && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">+${totalExtraCommitted} Extra</span>}
                           </div>
                       </div>
                   </div>
              </div>
          </div>

          <div className="w-full lg:w-auto min-w-[180px]">
              <div className="relative group">
                  <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 appearance-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300 cursor-pointer"
                  >
                      <option value="balance">Highest Balance</option>
                      <option value="equity">Highest Equity</option>
                      <option value="rate">Highest Rate</option>
                      <option value="property">Property Address (A-Z)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
          </div>
      </div>

      {/* --- Mortgage List --- */}
      <div className="space-y-4">
        {mortgages.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"><Home size={32} /></div>
                <h3 className="text-xl font-bold text-gray-900">No mortgages yet</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto mt-2">Add your mortgages to track equity growth, monitor LTV ratios, and optimize your housing costs.</p>
                <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40">Add Your First Mortgage</button>
            </div>
        ) : (
            <div className="grid gap-4">
                {sortedMortgages.map(mortgage => (
                  <MortgageRow
                    key={mortgage.id}
                    mortgage={mortgage}
                    onDelete={deleteMortgage}
                    onEdit={setEditingMortgage}
                    onAskAI={(msg) => setAIChatState({ isOpen: true, initialMessage: msg })}
                    activeItemId={activeItemId}
                    onItemExpanded={onItemExpanded}
                  />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

interface MortgageRowProps {
  mortgage: Mortgage;
  onDelete: (id: string) => void;
  onEdit: (mortgage: Mortgage) => void;
  onAskAI: (msg: string) => void;
  activeItemId?: string | null;
  onItemExpanded?: () => void;
}

const MortgageRow: React.FC<MortgageRowProps> = ({ mortgage, onDelete, onEdit, onAskAI, activeItemId, onItemExpanded }) => {
  const [expanded, setExpanded] = useState(false);
  const [showInlineAI, setShowInlineAI] = useState(false);
  const [scenarioPayment, setScenarioPayment] = useState(100);
  const propertyStyle = getPropertyStyles(mortgage.propertyType);

  // Auto-expand when this mortgage is the active item
  useEffect(() => {
    if (activeItemId === mortgage.id) {
      setExpanded(true);
      onItemExpanded?.();
      setTimeout(() => {
        document.getElementById(`mortgage-${mortgage.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [activeItemId, mortgage.id, onItemExpanded]);

  // Calculate equity metrics
  const equity = mortgage.equity || 0;
  const equityPercentage = mortgage.equityPercentage || 0;
  const loanToValue = mortgage.loanToValue || 0;

  // Calculate total monthly housing cost
  const totalMonthlyCost = mortgage.monthlyPayment +
    (mortgage.monthlyPropertyTax || 0) +
    (mortgage.monthlyInsurance || 0) +
    (mortgage.monthlyHOA || 0) +
    (mortgage.pmi || 0) +
    (mortgage.extraPayment || 0);

  // Calculate payoff timeline (simplified)
  const monthlyRate = (mortgage.interestRate / 100) / 12;
  const remainingMonths = mortgage.termMonths ? (() => {
    const startDate = mortgage.startDate ? new Date(mortgage.startDate) : new Date();
    const now = new Date();
    const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    return Math.max(0, mortgage.termMonths - monthsElapsed);
  })() : 0;

  // Property address display
  const displayAddress = mortgage.propertyAddress || 'Property Address Not Set';
  const displayLocation = mortgage.propertyCity && mortgage.propertyState
    ? `${mortgage.propertyCity}, ${mortgage.propertyState}`
    : '';

  return (
    <div id={`mortgage-${mortgage.id}`} className={`bg-white rounded-[24px] border border-gray-100 overflow-hidden transition-all duration-300 group ${expanded ? 'ring-2 ring-blue-500/5 shadow-xl' : `hover:border-transparent ${propertyStyle.border} ${propertyStyle.shadow}`}`}>
      <div className="p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer relative" onClick={() => setExpanded(!expanded)}>
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${propertyStyle.accent} opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full`}></div>
        <div className="flex-1 flex items-center gap-5 w-full md:w-auto">
          <div className={`w-14 h-14 ${propertyStyle.iconBg} ${propertyStyle.iconColor} rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
             <Home size={28} />
          </div>
          <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg md:text-xl leading-tight group-hover:text-blue-600 transition-colors truncate">{displayAddress}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1.5 font-medium flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${propertyStyle.bg} ${propertyStyle.text}`}>{mortgage.interestRate}% APR</span>
                  {displayLocation && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="text-gray-400">{displayLocation}</span>
                    </>
                  )}
                  {mortgage.propertyType && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block"></span>
                      <span className="text-gray-400 hidden sm:block">{mortgage.propertyType}</span>
                    </>
                  )}
              </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-between w-full md:w-auto md:flex-1 md:justify-end gap-y-4 gap-x-8 items-center pl-2 md:pl-0 border-t border-gray-50 pt-4 md:border-none md:pt-0">
            <div className="text-left md:text-right">
                <p className="font-black text-xl md:text-2xl text-gray-900 tracking-tight">${mortgage.currentBalance.toLocaleString()}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Balance</p>
            </div>
            <div className="hidden xl:block w-32">
                <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                    <span className="text-gray-400">Equity</span>
                    <span className="text-emerald-600">{equityPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(equityPercentage, 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-[9px] font-medium text-gray-400 mt-0.5"><span>Loan</span><span>Paid</span></div>
            </div>
            <div className="text-right">
                <p className="font-bold text-gray-800 text-lg">${Math.round(totalMonthlyCost).toLocaleString()}</p>
                <div className="flex justify-end gap-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Monthly</p>
                    {(mortgage.extraPayment || 0) > 0 && <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1 rounded font-bold">+${mortgage.extraPayment} Extra</span>}
                </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expanded ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-300 group-hover:text-gray-500'}`}>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
        </div>
      </div>

      {expanded && (
        <div className="bg-gray-50/50 p-6 md:p-8 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-300">
           {/* Inline AI Card */}
           {showInlineAI && (
               <div className="mb-6 animate-in zoom-in-95 duration-200">
                   <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-lg relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                       <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-2 text-purple-600"><Sparkles size={18} /><span className="font-bold text-sm">Budgetura Insight</span></div>
                           <button onClick={(e) => { e.stopPropagation(); setShowInlineAI(false); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                       </div>
                       <p className="text-gray-700 text-sm leading-relaxed mb-4">Your property at {displayAddress} has built ${Math.round(equity).toLocaleString()} in equity ({equityPercentage.toFixed(1)}% of property value). Great progress!</p>
                       <button onClick={(e) => { e.stopPropagation(); onAskAI(`Help me optimize my mortgage at ${displayAddress}. Current balance is ${mortgage.currentBalance} at ${mortgage.interestRate}% interest.`); }} className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"><MessageCircle size={14} /> Ask For Advice</button>
                   </div>
               </div>
           )}

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
               {/* Left Column: Property Details */}
               <div className="lg:col-span-1 space-y-5">
                  <div className={`bg-gradient-to-br ${propertyStyle.gradient} text-white p-5 rounded-2xl shadow-lg relative overflow-hidden`}>
                     <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Property Value</p>
                            <Building2 size={16} className="text-white/60" />
                        </div>
                        <div className="mb-4">
                            <p className="text-3xl font-black text-white tracking-tight">${mortgage.propertyValue.toLocaleString()}</p>
                            <p className="text-sm font-medium text-white/90">Current Market Value</p>
                        </div>
                        <div className="pt-4 border-t border-white/20 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">Equity Built</span>
                            <span className="font-bold text-white">${Math.round(equity).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">Equity %</span>
                            <span className="font-bold text-white">{equityPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">Loan-to-Value</span>
                            <span className="font-bold text-white">{loanToValue.toFixed(1)}%</span>
                          </div>
                        </div>
                     </div>
                  </div>

                  {/* Monthly Breakdown */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                     <div className="flex justify-between items-center mb-3">
                       <p className="text-xs font-bold text-gray-400 uppercase">Monthly Breakdown</p>
                     </div>
                     <div className="space-y-3">
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-500">P&I Payment</span>
                           <span className="font-bold text-gray-900">${mortgage.monthlyPayment.toLocaleString()}</span>
                         </div>
                         {(mortgage.monthlyPropertyTax || 0) > 0 && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Property Tax</span>
                             <span className="font-bold text-gray-900">${mortgage.monthlyPropertyTax?.toLocaleString()}</span>
                           </div>
                         )}
                         {(mortgage.monthlyInsurance || 0) > 0 && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Insurance</span>
                             <span className="font-bold text-gray-900">${mortgage.monthlyInsurance?.toLocaleString()}</span>
                           </div>
                         )}
                         {(mortgage.monthlyHOA || 0) > 0 && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-500">HOA Fees</span>
                             <span className="font-bold text-gray-900">${mortgage.monthlyHOA?.toLocaleString()}</span>
                           </div>
                         )}
                         {(mortgage.pmi || 0) > 0 && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-500">PMI</span>
                             <span className="font-bold text-gray-900">${mortgage.pmi?.toLocaleString()}</span>
                           </div>
                         )}
                         {(mortgage.extraPayment || 0) > 0 && (
                           <div className="flex justify-between text-sm">
                             <span className="text-emerald-600">Extra Principal</span>
                             <span className="font-bold text-emerald-600">+${mortgage.extraPayment?.toLocaleString()}</span>
                           </div>
                         )}
                         <div className="pt-2 border-t border-gray-50 flex justify-between text-sm">
                           <span className="text-gray-500 font-medium">Total Monthly</span>
                           <span className="font-black text-gray-900">${Math.round(totalMonthlyCost).toLocaleString()}</span>
                         </div>
                     </div>
                  </div>
               </div>

               {/* Right Column: Details Grid */}
               <div className="lg:col-span-2">
                   <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                       <div className="flex justify-between items-start mb-6">
                           <h4 className="text-lg font-bold text-gray-900">Mortgage Details</h4>
                           <div className="flex gap-2">
                               <button onClick={(e) => { e.stopPropagation(); setShowInlineAI(!showInlineAI); }} className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600"><Sparkles size={18} /></button>
                               <button onClick={(e) => { e.stopPropagation(); onEdit(mortgage); }} className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"><Edit2 size={18} /></button>
                               <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this mortgage?')) onDelete(mortgage.id); }} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"><Trash2 size={18} /></button>
                           </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {/* Loan Information */}
                           <div className="space-y-4">
                               <div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Loan Type</p>
                                   <p className="text-base font-semibold text-gray-900">{mortgage.loanType || 'Not specified'}</p>
                               </div>
                               <div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Lender</p>
                                   <p className="text-base font-semibold text-gray-900">{mortgage.lender || 'Not specified'}</p>
                               </div>
                               <div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Original Principal</p>
                                   <p className="text-base font-semibold text-gray-900">${mortgage.originalPrincipal.toLocaleString()}</p>
                               </div>
                               <div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Interest Type</p>
                                   <p className="text-base font-semibold text-gray-900">{mortgage.interestType || 'Fixed'}</p>
                               </div>
                               <div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Term</p>
                                   <p className="text-base font-semibold text-gray-900">{mortgage.termMonths} months ({(mortgage.termMonths / 12).toFixed(0)} years)</p>
                               </div>
                           </div>

                           {/* Property Information */}
                           <div className="space-y-4">
                               {mortgage.startDate && (
                                 <div>
                                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Start Date</p>
                                     <p className="text-base font-semibold text-gray-900">{new Date(mortgage.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                 </div>
                               )}
                               {mortgage.maturityDate && (
                                 <div>
                                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Maturity Date</p>
                                     <p className="text-base font-semibold text-gray-900">{new Date(mortgage.maturityDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                 </div>
                               )}
                               <div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</p>
                                   <p className="text-base font-semibold text-gray-900">{mortgage.status || 'Active'}</p>
                               </div>
                               <div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Auto Pay</p>
                                   <p className="text-base font-semibold text-gray-900">{mortgage.autoPay ? 'Enabled' : 'Disabled'}</p>
                               </div>
                               {mortgage.accountNumber && (
                                 <div>
                                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Account Number</p>
                                     <p className="text-base font-semibold text-gray-900">****{mortgage.accountNumber}</p>
                                 </div>
                               )}
                           </div>
                       </div>

                       {mortgage.notes && (
                         <div className="mt-6 pt-6 border-t border-gray-100">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Notes</p>
                           <p className="text-sm text-gray-700 leading-relaxed">{mortgage.notes}</p>
                         </div>
                       )}
                   </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

const AddMortgageForm: React.FC<{ onClose: () => void; onSave: (mortgage: Mortgage) => void }> = ({ onClose, onSave }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const propertyValue = parseFloat((form.elements.namedItem('propertyValue') as HTMLInputElement).value);
    const currentBalance = parseFloat((form.elements.namedItem('currentBalance') as HTMLInputElement).value);
    const equity = Math.max(0, propertyValue - currentBalance);
    const equityPercentage = propertyValue > 0 ? (equity / propertyValue) * 100 : 0;
    const loanToValue = propertyValue > 0 ? (currentBalance / propertyValue) * 100 : 0;

    const monthlyPayment = parseFloat((form.elements.namedItem('monthlyPayment') as HTMLInputElement).value);
    const monthlyPropertyTax = parseFloat((form.elements.namedItem('monthlyPropertyTax') as HTMLInputElement).value) || 0;
    const monthlyInsurance = parseFloat((form.elements.namedItem('monthlyInsurance') as HTMLInputElement).value) || 0;
    const monthlyHOA = parseFloat((form.elements.namedItem('monthlyHOA') as HTMLInputElement).value) || 0;
    const pmi = parseFloat((form.elements.namedItem('pmi') as HTMLInputElement).value) || 0;

    const newMortgage: Mortgage = {
      id: Date.now().toString(),
      propertyAddress: (form.elements.namedItem('propertyAddress') as HTMLInputElement).value,
      propertyCity: (form.elements.namedItem('propertyCity') as HTMLInputElement).value,
      propertyState: (form.elements.namedItem('propertyState') as HTMLInputElement).value,
      propertyZip: (form.elements.namedItem('propertyZip') as HTMLInputElement).value,
      propertyType: (form.elements.namedItem('propertyType') as HTMLSelectElement).value as any,
      propertyValue,

      lender: (form.elements.namedItem('lender') as HTMLInputElement).value,
      accountNumber: (form.elements.namedItem('accountNumber') as HTMLInputElement).value,
      loanType: (form.elements.namedItem('loanType') as HTMLSelectElement).value as any,
      originalPrincipal: parseFloat((form.elements.namedItem('originalPrincipal') as HTMLInputElement).value),
      currentBalance,
      interestRate: parseFloat((form.elements.namedItem('interestRate') as HTMLInputElement).value),
      interestType: (form.elements.namedItem('interestType') as HTMLSelectElement).value as any,
      termMonths: parseInt((form.elements.namedItem('termMonths') as HTMLInputElement).value),
      monthlyPayment,
      extraPayment: parseFloat((form.elements.namedItem('extraPayment') as HTMLInputElement).value) || 0,

      equity,
      equityPercentage,
      loanToValue,

      monthlyPropertyTax,
      monthlyInsurance,
      monthlyHOA,
      pmi,
      pmiRemovalLTV: parseFloat((form.elements.namedItem('pmiRemovalLTV') as HTMLInputElement).value) || 80,
      totalMonthlyHousingCost: monthlyPayment + monthlyPropertyTax + monthlyInsurance + monthlyHOA + pmi,

      startDate: (form.elements.namedItem('startDate') as HTMLInputElement).value,
      maturityDate: (form.elements.namedItem('maturityDate') as HTMLInputElement).value,
      dueDate: parseInt((form.elements.namedItem('dueDate') as HTMLInputElement).value) || undefined,

      status: 'Active',
      autoPay: (form.elements.namedItem('autoPay') as HTMLInputElement).checked,
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value,
    };

    onSave(newMortgage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-4xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

           <div className="flex justify-between items-center mb-6">
               <div>
                   <h3 className="font-black text-2xl text-gray-900">Add New Mortgage</h3>
                   <p className="text-gray-500 text-sm mt-1">Enter your mortgage and property details.</p>
               </div>
               <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                   <X size={20} />
               </button>
           </div>

           <div className="space-y-8">
               {/* Section 1: Property Information */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Property Information</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="md:col-span-2">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property Address</label>
                           <input name="propertyAddress" required placeholder="123 Main Street" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City</label>
                           <input name="propertyCity" placeholder="San Francisco" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label>
                           <input name="propertyState" placeholder="CA" maxLength={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ZIP Code</label>
                           <input name="propertyZip" placeholder="94102" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property Type</label>
                           <select name="propertyType" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                               <option value="Single Family">Single Family</option>
                               <option value="Condo">Condo</option>
                               <option value="Townhouse">Townhouse</option>
                               <option value="Multi Family">Multi Family</option>
                               <option value="Mobile Home">Mobile Home</option>
                           </select>
                       </div>
                       <div className="md:col-span-2">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property Value</label>
                           <input name="propertyValue" type="number" step="any" placeholder="500000" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                   </div>
               </div>

               {/* Section 2: Loan Details */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Loan Details</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lender</label>
                           <input name="lender" placeholder="Wells Fargo" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Number (Last 4)</label>
                           <input name="accountNumber" placeholder="1234" maxLength={4} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Loan Type</label>
                           <select name="loanType" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                               <option value="Conventional">Conventional</option>
                               <option value="FHA">FHA</option>
                               <option value="VA">VA</option>
                               <option value="USDA">USDA</option>
                               <option value="HELOC">HELOC</option>
                               <option value="Reverse">Reverse</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interest Type</label>
                           <select name="interestType" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                               <option value="Fixed">Fixed</option>
                               <option value="Variable">Variable</option>
                               <option value="Adjustable">Adjustable</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Original Principal</label>
                           <input name="originalPrincipal" type="number" step="any" placeholder="400000" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Balance</label>
                           <input name="currentBalance" type="number" step="any" placeholder="380000" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interest Rate (%)</label>
                           <input name="interestRate" type="number" step="0.01" placeholder="3.5" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Term (Months)</label>
                           <input name="termMonths" type="number" placeholder="360" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly P&I Payment</label>
                           <input name="monthlyPayment" type="number" step="any" placeholder="1800" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Extra Principal Payment</label>
                           <input name="extraPayment" type="number" step="any" placeholder="0" className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl outline-none font-bold text-emerald-900 placeholder-emerald-300" />
                       </div>
                   </div>
               </div>

               {/* Section 3: Monthly Costs */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Additional Monthly Costs</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property Tax</label>
                           <input name="monthlyPropertyTax" type="number" step="any" placeholder="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Insurance</label>
                           <input name="monthlyInsurance" type="number" step="any" placeholder="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">HOA Fees</label>
                           <input name="monthlyHOA" type="number" step="any" placeholder="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PMI</label>
                           <input name="pmi" type="number" step="any" placeholder="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div className="col-span-2">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PMI Removal LTV (%)</label>
                           <input name="pmiRemovalLTV" type="number" step="any" placeholder="80" defaultValue={80} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                   </div>
               </div>

               {/* Section 4: Dates & Settings */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Dates & Settings</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
                           <input name="startDate" type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Maturity Date</label>
                           <input name="maturityDate" type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Day (1-31)</label>
                           <input name="dueDate" type="number" min="1" max="31" placeholder="1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div className="flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200 w-full">
                                <input name="autoPay" type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                <span className="text-sm font-bold text-gray-700">Auto-Pay Enabled</span>
                            </label>
                       </div>
                       <div className="md:col-span-2">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                           <textarea name="notes" rows={3} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 resize-none" placeholder="Add notes about this mortgage..." />
                       </div>
                   </div>
               </div>
           </div>

           <div className="flex gap-4 justify-end pt-6 border-t border-gray-100 mt-8">
               <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">Cancel</button>
               <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                   <Plus size={18} /> Add Mortgage
               </button>
           </div>
        </form>
    </div>
  );
};

const EditMortgageForm: React.FC<{ mortgage: Mortgage; onClose: () => void; onSave: (mortgage: Mortgage) => void }> = ({ mortgage, onClose, onSave }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const propertyValue = parseFloat((form.elements.namedItem('propertyValue') as HTMLInputElement).value);
    const currentBalance = parseFloat((form.elements.namedItem('currentBalance') as HTMLInputElement).value);
    const equity = Math.max(0, propertyValue - currentBalance);
    const equityPercentage = propertyValue > 0 ? (equity / propertyValue) * 100 : 0;
    const loanToValue = propertyValue > 0 ? (currentBalance / propertyValue) * 100 : 0;

    const monthlyPayment = parseFloat((form.elements.namedItem('monthlyPayment') as HTMLInputElement).value);
    const monthlyPropertyTax = parseFloat((form.elements.namedItem('monthlyPropertyTax') as HTMLInputElement).value) || 0;
    const monthlyInsurance = parseFloat((form.elements.namedItem('monthlyInsurance') as HTMLInputElement).value) || 0;
    const monthlyHOA = parseFloat((form.elements.namedItem('monthlyHOA') as HTMLInputElement).value) || 0;
    const pmi = parseFloat((form.elements.namedItem('pmi') as HTMLInputElement).value) || 0;

    const updatedMortgage: Mortgage = {
      ...mortgage,
      propertyAddress: (form.elements.namedItem('propertyAddress') as HTMLInputElement).value,
      propertyCity: (form.elements.namedItem('propertyCity') as HTMLInputElement).value,
      propertyState: (form.elements.namedItem('propertyState') as HTMLInputElement).value,
      propertyZip: (form.elements.namedItem('propertyZip') as HTMLInputElement).value,
      propertyType: (form.elements.namedItem('propertyType') as HTMLSelectElement).value as any,
      propertyValue,

      lender: (form.elements.namedItem('lender') as HTMLInputElement).value,
      accountNumber: (form.elements.namedItem('accountNumber') as HTMLInputElement).value,
      loanType: (form.elements.namedItem('loanType') as HTMLSelectElement).value as any,
      originalPrincipal: parseFloat((form.elements.namedItem('originalPrincipal') as HTMLInputElement).value),
      currentBalance,
      interestRate: parseFloat((form.elements.namedItem('interestRate') as HTMLInputElement).value),
      interestType: (form.elements.namedItem('interestType') as HTMLSelectElement).value as any,
      termMonths: parseInt((form.elements.namedItem('termMonths') as HTMLInputElement).value),
      monthlyPayment,
      extraPayment: parseFloat((form.elements.namedItem('extraPayment') as HTMLInputElement).value) || 0,

      equity,
      equityPercentage,
      loanToValue,

      monthlyPropertyTax,
      monthlyInsurance,
      monthlyHOA,
      pmi,
      pmiRemovalLTV: parseFloat((form.elements.namedItem('pmiRemovalLTV') as HTMLInputElement).value) || 80,
      totalMonthlyHousingCost: monthlyPayment + monthlyPropertyTax + monthlyInsurance + monthlyHOA + pmi,

      startDate: (form.elements.namedItem('startDate') as HTMLInputElement).value,
      maturityDate: (form.elements.namedItem('maturityDate') as HTMLInputElement).value,
      dueDate: parseInt((form.elements.namedItem('dueDate') as HTMLInputElement).value) || undefined,

      status: (form.elements.namedItem('status') as HTMLSelectElement).value as any,
      autoPay: (form.elements.namedItem('autoPay') as HTMLInputElement).checked,
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value,
    };

    onSave(updatedMortgage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-4xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

           <div className="flex justify-between items-center mb-6">
               <div>
                   <h3 className="font-black text-2xl text-gray-900">Edit Mortgage</h3>
                   <p className="text-gray-500 text-sm mt-1">Update your mortgage details.</p>
               </div>
               <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                   <X size={20} />
               </button>
           </div>

           <div className="space-y-8">
               {/* Section 1: Property Information */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Property Information</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="md:col-span-2">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property Address</label>
                           <input name="propertyAddress" defaultValue={mortgage.propertyAddress} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City</label>
                           <input name="propertyCity" defaultValue={mortgage.propertyCity} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label>
                           <input name="propertyState" defaultValue={mortgage.propertyState} maxLength={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ZIP Code</label>
                           <input name="propertyZip" defaultValue={mortgage.propertyZip} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property Type</label>
                           <select name="propertyType" defaultValue={mortgage.propertyType} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                               <option value="Single Family">Single Family</option>
                               <option value="Condo">Condo</option>
                               <option value="Townhouse">Townhouse</option>
                               <option value="Multi Family">Multi Family</option>
                               <option value="Mobile Home">Mobile Home</option>
                           </select>
                       </div>
                       <div className="md:col-span-2">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property Value</label>
                           <input name="propertyValue" type="number" step="any" defaultValue={mortgage.propertyValue} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                   </div>
               </div>

               {/* Section 2: Loan Details */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Loan Details</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lender</label>
                           <input name="lender" defaultValue={mortgage.lender} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Number (Last 4)</label>
                           <input name="accountNumber" defaultValue={mortgage.accountNumber} maxLength={4} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Loan Type</label>
                           <select name="loanType" defaultValue={mortgage.loanType} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                               <option value="Conventional">Conventional</option>
                               <option value="FHA">FHA</option>
                               <option value="VA">VA</option>
                               <option value="USDA">USDA</option>
                               <option value="HELOC">HELOC</option>
                               <option value="Reverse">Reverse</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interest Type</label>
                           <select name="interestType" defaultValue={mortgage.interestType} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                               <option value="Fixed">Fixed</option>
                               <option value="Variable">Variable</option>
                               <option value="Adjustable">Adjustable</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Original Principal</label>
                           <input name="originalPrincipal" type="number" step="any" defaultValue={mortgage.originalPrincipal} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Balance</label>
                           <input name="currentBalance" type="number" step="any" defaultValue={mortgage.currentBalance} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interest Rate (%)</label>
                           <input name="interestRate" type="number" step="0.01" defaultValue={mortgage.interestRate} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Term (Months)</label>
                           <input name="termMonths" type="number" defaultValue={mortgage.termMonths} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly P&I Payment</label>
                           <input name="monthlyPayment" type="number" step="any" defaultValue={mortgage.monthlyPayment} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Extra Principal Payment</label>
                           <input name="extraPayment" type="number" step="any" defaultValue={mortgage.extraPayment} className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl outline-none font-bold text-emerald-900" />
                       </div>
                   </div>
               </div>

               {/* Section 3: Monthly Costs */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Additional Monthly Costs</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property Tax</label>
                           <input name="monthlyPropertyTax" type="number" step="any" defaultValue={mortgage.monthlyPropertyTax} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Insurance</label>
                           <input name="monthlyInsurance" type="number" step="any" defaultValue={mortgage.monthlyInsurance} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">HOA Fees</label>
                           <input name="monthlyHOA" type="number" step="any" defaultValue={mortgage.monthlyHOA} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PMI</label>
                           <input name="pmi" type="number" step="any" defaultValue={mortgage.pmi} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div className="col-span-2">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PMI Removal LTV (%)</label>
                           <input name="pmiRemovalLTV" type="number" step="any" defaultValue={mortgage.pmiRemovalLTV || 80} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                   </div>
               </div>

               {/* Section 4: Dates & Settings */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Dates & Settings</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
                           <input name="startDate" type="date" defaultValue={mortgage.startDate} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Maturity Date</label>
                           <input name="maturityDate" type="date" defaultValue={mortgage.maturityDate} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Day (1-31)</label>
                           <input name="dueDate" type="number" min="1" max="31" defaultValue={mortgage.dueDate} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                           <select name="status" defaultValue={mortgage.status} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                               <option value="Active">Active</option>
                               <option value="Paid Off">Paid Off</option>
                               <option value="Foreclosed">Foreclosed</option>
                               <option value="In Forbearance">In Forbearance</option>
                           </select>
                       </div>
                       <div className="flex items-end md:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200 w-full">
                                <input name="autoPay" type="checkbox" defaultChecked={mortgage.autoPay} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                <span className="text-sm font-bold text-gray-700">Auto-Pay Enabled</span>
                            </label>
                       </div>
                       <div className="md:col-span-2">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                           <textarea name="notes" defaultValue={mortgage.notes} rows={3} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 resize-none" placeholder="Add notes about this mortgage..." />
                       </div>
                   </div>
               </div>
           </div>

           <div className="flex gap-4 justify-end pt-6 border-t border-gray-100 mt-8">
               <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">Cancel</button>
               <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                   <Edit2 size={18} /> Update Mortgage
               </button>
           </div>
        </form>
    </div>
  );
};

export default MortgageManager;
