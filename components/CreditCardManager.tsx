
import React, { useState, useMemo, useEffect } from 'react';
import { useDebt } from '../context/DebtContext';
import { calculateMonthsToPayoff, calculateTotalInterest } from '../utils/calculations';
import { Plus, Trash2, ChevronDown, ChevronUp, TrendingUp, CreditCard as CardIcon, ShieldCheck, Flame, ArrowRight, Wallet, Percent, Sparkles, ArrowUpDown, SlidersHorizontal, PiggyBank, Clock, Edit2, History, ArrowDown, ArrowUp, X, MessageCircle, CalendarCheck, Coins, Hash, Landmark, FileText, Gift, Zap } from 'lucide-react';
import { CreditCard, CreditCardHistory, CardType, CardNetwork, CardStatus } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Helper for dynamic brand styling
const getBrandStyles = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('chase')) return { 
        bg: 'bg-blue-50', text: 'text-blue-700', border: 'hover:border-blue-200', 
        iconBg: 'bg-blue-100', iconColor: 'text-blue-600', 
        shadow: 'hover:shadow-blue-500/10', accent: 'bg-blue-500',
        gradient: 'from-blue-600 to-indigo-600'
    };
    if (n.includes('discover')) return { 
        bg: 'bg-orange-50', text: 'text-orange-700', border: 'hover:border-orange-200', 
        iconBg: 'bg-orange-100', iconColor: 'text-orange-600', 
        shadow: 'hover:shadow-orange-500/10', accent: 'bg-orange-500',
        gradient: 'from-orange-500 to-red-500'
    };
    if (n.includes('capital') || n.includes('quicksilver') || n.includes('venture')) return { 
        bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'hover:border-indigo-200', 
        iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', 
        shadow: 'hover:shadow-indigo-500/10', accent: 'bg-indigo-500',
        gradient: 'from-indigo-600 to-violet-600'
    };
    if (n.includes('amex') || n.includes('american')) return { 
        bg: 'bg-sky-50', text: 'text-sky-700', border: 'hover:border-sky-200', 
        iconBg: 'bg-sky-100', iconColor: 'text-sky-600', 
        shadow: 'hover:shadow-sky-500/10', accent: 'bg-sky-500',
        gradient: 'from-sky-500 to-blue-600'
    };
    if (n.includes('citi')) return { 
        bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'hover:border-cyan-200', 
        iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', 
        shadow: 'hover:shadow-cyan-500/10', accent: 'bg-cyan-500',
        gradient: 'from-cyan-500 to-teal-500'
    };
    return { 
        bg: 'bg-gray-50', text: 'text-gray-600', border: 'hover:border-gray-200', 
        iconBg: 'bg-gray-100', iconColor: 'text-gray-500', 
        shadow: 'hover:shadow-gray-200/50', accent: 'bg-gray-500',
        gradient: 'from-gray-700 to-gray-900'
    };
};

type SortOption = 'balance' | 'apr' | 'utilization' | 'name';

interface CreditCardManagerProps {
  activeItemId?: string | null;
  onItemExpanded?: () => void;
}

const CreditCardManager: React.FC<CreditCardManagerProps> = ({ activeItemId, onItemExpanded }) => {
  const { cards, addCard, deleteCard, updateCard, setAIChatState } = useDebt();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [viewingHistory, setViewingHistory] = useState<CreditCard | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('balance');

  // --- Aggregate Calculations ---
  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);
  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const utilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  
  const highestAprCard = cards.reduce((prev, current) => (prev.apr > current.apr) ? prev : current, cards[0] || { apr: 0, name: 'None' });
  const monthlyInterestBurn = cards.reduce((sum, c) => sum + (c.balance * (c.apr / 100 / 12)), 0);

  // Payments Logic
  const totalMinimumDue = cards.reduce((sum, c) => sum + c.minimumPayment, 0);
  const totalExtraCommitted = cards.reduce((sum, c) => sum + (c.extraPayment || 0), 0);
  const totalDue = totalMinimumDue + totalExtraCommitted;
  
  // Next Due Date Logic
  const nextDueCard = cards.length > 0 ? [...cards].sort((a, b) => (a.dueDate || 32) - (b.dueDate || 32))[0] : null;
  const formattedDueDate = cards.length > 0 && nextDueCard?.dueDate ? (() => {
    const today = new Date();
    const nextDueDate = new Date();
    if (nextDueCard.dueDate < today.getDate()) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }
    nextDueDate.setDate(nextDueCard.dueDate);
    return nextDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })() : '—';
  const nextDueLabel = nextDueCard ? `Due (${nextDueCard.name.split(' ')[0]})` : 'Next Bill Due';

  // Lifetime Cost Calculations (Standard Minimum Path Only)
  const totalLifetimeCost = useMemo(() => {
      return cards.reduce((acc, card) => {
          const minMonths = calculateMonthsToPayoff(card.balance, card.apr, card.minimumPayment);
          const minInterest = calculateTotalInterest(card.balance, card.minimumPayment, minMonths);
          return acc + card.balance + minInterest;
      }, 0);
  }, [cards]);

  // Projected Savings (Committed Extra vs Minimums)
  const projectedSavings = useMemo(() => {
    return cards.reduce((acc, card) => {
        const extra = card.extraPayment || 0;
        if (extra === 0) return acc;

        const minMonths = calculateMonthsToPayoff(card.balance, card.apr, card.minimumPayment);
        const minInterest = calculateTotalInterest(card.balance, card.minimumPayment, minMonths);
        
        const extraMonths = calculateMonthsToPayoff(card.balance, card.apr, card.minimumPayment + extra);
        const extraInterest = calculateTotalInterest(card.balance, card.minimumPayment + extra, extraMonths);
        
        return acc + (minInterest - extraInterest);
    }, 0);
  }, [cards]);

  // Sorting Logic
  const sortedCards = useMemo(() => {
      return [...cards].sort((a, b) => {
          switch(sortBy) {
              case 'balance': return b.balance - a.balance; 
              case 'apr': return b.apr - a.apr; 
              case 'utilization': return b.utilization - a.utilization; 
              case 'name': return a.name.localeCompare(b.name);
              default: return 0;
          }
      });
  }, [cards, sortBy]);

  // Health Styling
  const getHealthStyles = (u: number) => {
      if (u < 10) return { bg: 'bg-emerald-500', text: 'text-emerald-700', lightBg: 'bg-emerald-50', label: 'Excellent' };
      if (u < 30) return { bg: 'bg-blue-500', text: 'text-blue-700', lightBg: 'bg-blue-50', label: 'Healthy' };
      if (u < 50) return { bg: 'bg-yellow-500', text: 'text-yellow-700', lightBg: 'bg-yellow-50', label: 'Fair' };
      return { bg: 'bg-red-500', text: 'text-red-700', lightBg: 'bg-red-50', label: 'High Usage' };
  };
  const health = getHealthStyles(utilization);

  // Handle Saving Edited Card (with History)
  const handleUpdateCard = (updatedCard: CreditCard) => {
      if (!editingCard) return;
      
      const historyEntry: CreditCardHistory = {
          date: new Date().toISOString(),
          balance: editingCard.balance,
          limit: editingCard.limit,
          apr: editingCard.apr,
          minimumPayment: editingCard.minimumPayment
      };

      const hasChanged = editingCard.balance !== updatedCard.balance || 
                         editingCard.apr !== updatedCard.apr || 
                         editingCard.limit !== updatedCard.limit;
      
      const finalHistory = hasChanged 
          ? [historyEntry, ...(editingCard.history || [])] 
          : (editingCard.history || []);

      updateCard(updatedCard.id, {
          ...updatedCard,
          history: finalHistory
      });
      setEditingCard(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Credit Card Manager</h1>
            <p className="text-gray-500 mt-1 font-medium">Optimize your payoffs and lower your interest.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="group flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
             <Plus size={16} /> 
          </div>
          Add New Card
        </button>
      </div>

      {/* --- Vibrant Summary Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Card 1: Utilization Health */}
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
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Utilization</p>
                  <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-black text-gray-900 tracking-tight">{utilization.toFixed(1)}<span className="text-2xl">%</span></span>
                      <span className="text-sm font-semibold text-gray-400">of ${totalLimit.toLocaleString()}</span>
                  </div>
                  
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${health.bg}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      ></div>
                  </div>
              </div>
          </div>

          {/* Card 2: Interest Burn */}
          <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-100/50 relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-orange-500">
                      <Flame size={24} fill="currentColor" className="animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-sm">
                     <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">Money Lost</span>
                  </div>
              </div>

              <div className="relative z-10">
                  <p className="text-orange-800/80 text-xs font-bold uppercase tracking-widest mb-1">Monthly Interest</p>
                  <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-black text-gray-900 tracking-tight">-${Math.round(monthlyInterestBurn).toLocaleString()}</span>
                      <span className="text-sm font-bold text-orange-600/70">/mo</span>
                  </div>
                  <p className="text-xs font-semibold text-red-900/60 leading-relaxed mb-4">
                      Avg APR across all cards: <strong className="text-red-900">{(cards.length > 0 ? (cards.reduce((sum, c) => sum + c.apr, 0) / cards.length).toFixed(1) : 0)}%</strong>
                  </p>
              </div>
          </div>

          {/* Card 3: Strategy Focus (Highest APR) */}
          <div className="bg-rose-50 p-6 rounded-[24px] shadow-xl border border-rose-100 text-rose-900 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[200%] h-full bg-gradient-to-l from-rose-500/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out"></div>
              
              <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-white rounded-xl border border-rose-100 text-rose-500 shadow-sm">
                          <TrendingUp size={20} />
                      </div>
                      <span className="text-sm font-bold text-rose-700 tracking-wide">Smart Move</span>
                  </div>
                  
                  {highestAprCard.name !== 'None' ? (
                      <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-rose-600/70 text-[10px] font-bold uppercase tracking-widest mb-2">Highest APR Detected</p>
                            <h3 className="text-xl font-bold text-rose-900 mb-1 truncate">{highestAprCard.name}</h3>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-3xl font-black text-rose-500">{highestAprCard.apr}%</span>
                                <span className="text-sm font-medium text-rose-700">APR</span>
                            </div>
                          </div>
                      </div>
                  ) : (
                      <div className="flex-1 flex items-center justify-center text-rose-400 text-sm font-medium">
                          Add cards to see insights
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Forms & Modals */}
      {showAddForm && <AddCardForm onClose={() => setShowAddForm(false)} onSave={addCard} />}
      {editingCard && (
          <EditCardForm 
            card={editingCard} 
            onClose={() => setEditingCard(null)} 
            onSave={handleUpdateCard} 
          />
      )}
      {viewingHistory && (
          <HistoryModal 
            card={viewingHistory} 
            onBack={() => setViewingHistory(null)} 
            onClose={() => setViewingHistory(null)} 
          />
      )}

      {/* --- Controls Toolbar --- */}
      <div className="bg-white p-3 md:p-4 rounded-[20px] shadow-sm border border-gray-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 md:gap-8 w-full lg:w-auto flex-1 justify-start">
              <div className="flex items-center gap-4 md:gap-8 w-full lg:w-auto justify-between lg:justify-start">
                  <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shrink-0"><Wallet size={18} /></div>
                      <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Current Debt</p>
                          <p className="text-lg font-black text-gray-900 leading-none mt-0.5">${totalBalance.toLocaleString()}</p>
                      </div>
                  </div>
                  <div className="h-8 w-px bg-gray-100 hidden lg:block"></div>
                  <div className="flex items-center gap-3">
                      <div className="bg-red-50 p-2 rounded-xl text-red-500 shrink-0"><PiggyBank size={18} /></div>
                      <div>
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Lifetime Cost</p>
                          <p className="text-lg font-bold text-red-600 leading-none mt-0.5">${Math.round(totalLifetimeCost).toLocaleString()}</p>
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
                       <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 shrink-0"><Coins size={18} /></div>
                       <div>
                           <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Total Due</p>
                           <div className="flex items-baseline gap-1.5 mt-0.5">
                               <p className="text-lg font-black text-gray-900 leading-none">${totalDue.toLocaleString()}</p>
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
                      <option value="apr">Highest APR</option>
                      <option value="utilization">Highest Utilization</option>
                      <option value="name">Name (A-Z)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
          </div>
      </div>

      {/* --- Card List --- */}
      <div className="space-y-4">
        {cards.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"><CardIcon size={32} /></div>
                <h3 className="text-xl font-bold text-gray-900">Your wallet is empty</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto mt-2">Add your credit cards to visualize your debt, track utilization, and generate smart payoff strategies.</p>
                <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40">Add Your First Card</button>
            </div>
        ) : (
            <div className="grid gap-4">
                {sortedCards.map(card => (
                  <CardRow
                    key={card.id}
                    card={card}
                    onDelete={deleteCard}
                    onEdit={setEditingCard}
                    onViewHistory={setViewingHistory}
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

interface CardRowProps {
  card: CreditCard;
  onDelete: (id: string) => void;
  onEdit: (card: CreditCard) => void;
  onViewHistory: (card: CreditCard) => void;
  onAskAI: (msg: string) => void;
  activeItemId?: string | null;
  onItemExpanded?: () => void;
}

const CardRow: React.FC<CardRowProps> = ({ card, onDelete, onEdit, onViewHistory, onAskAI, activeItemId, onItemExpanded }) => {
  const [expanded, setExpanded] = useState(false);
  const [showInlineAI, setShowInlineAI] = useState(false);
  const [scenarioPayment, setScenarioPayment] = useState(100);
  const brand = getBrandStyles(card.name);

  // Auto-expand when this card is the active item
  useEffect(() => {
    console.log('CardRow useEffect:', { activeItemId, cardId: card.id, match: activeItemId === card.id });
    if (activeItemId === card.id) {
      console.log('Expanding card:', card.name, card.id);
      setExpanded(true);
      // Notify parent that expansion has occurred
      onItemExpanded?.();
      // Scroll into view smoothly
      setTimeout(() => {
        const element = document.getElementById(`card-${card.id}`);
        console.log('Scrolling to element:', element);
        element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [activeItemId, card.id, onItemExpanded]);

  // Basic Calculations
  const minOnlyMonths = calculateMonthsToPayoff(card.balance, card.apr, card.minimumPayment);
  const minOnlyInterest = calculateTotalInterest(card.balance, card.minimumPayment, minOnlyMonths);
  const lifetimeCostMin = card.balance + minOnlyInterest;
  
  const extraMonths = calculateMonthsToPayoff(card.balance, card.apr, card.minimumPayment + scenarioPayment);
  const extraInterest = calculateTotalInterest(card.balance, card.minimumPayment + scenarioPayment, extraMonths);
  const savings = lifetimeCostMin - (card.balance + extraInterest);
  const monthsSaved = (minOnlyMonths === Infinity ? 999 : minOnlyMonths) - (extraMonths === Infinity ? 999 : extraMonths);
  const interestPercent = (minOnlyInterest / lifetimeCostMin) * 100;

  // Chart Data Generation
  const generateChartData = () => {
    const data = [];
    let balMin = card.balance;
    let balFast = card.balance;
    const rate = (card.apr / 100) / 12;
    let month = 0;
    while ((balMin > 0 || balFast > 0) && month <= 60) {
        if (balMin > 0) {
            const interest = balMin * rate;
            const principal = Math.max(0, card.minimumPayment - interest);
            balMin -= principal;
            if (balMin < 0) balMin = 0;
        }
        if (balFast > 0) {
            const interest = balFast * rate;
            const principal = Math.max(0, (card.minimumPayment + scenarioPayment) - interest);
            balFast -= principal;
            if (balFast < 0) balFast = 0;
        }
        data.push({ month, Minimum: Math.round(balMin), Accelerated: Math.round(balFast) });
        month++;
    }
    return data;
  };
  const chartData = expanded ? generateChartData() : [];

  return (
    <div id={`card-${card.id}`} className={`bg-white rounded-[24px] border border-gray-100 overflow-hidden transition-all duration-300 group ${expanded ? 'ring-2 ring-blue-500/5 shadow-xl' : `hover:border-transparent ${brand.border} ${brand.shadow}`}`}>
      <div className="p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer relative" onClick={() => setExpanded(!expanded)}>
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${brand.accent} opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full`}></div>
        <div className="flex-1 flex items-center gap-5 w-full md:w-auto">
          <div className={`w-14 h-14 ${brand.iconBg} ${brand.iconColor} rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
             <CardIcon size={28} />
          </div>
          <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg md:text-xl leading-tight group-hover:text-blue-600 transition-colors truncate">{card.name}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1.5 font-medium flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${brand.bg} ${brand.text}`}>{card.apr}% APR</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="text-gray-400">{card.status}</span>
                  {card.network && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block"></span>
                      <span className="text-gray-400 hidden sm:block">{card.network}</span>
                    </>
                  )}
              </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-between w-full md:w-auto md:flex-1 md:justify-end gap-y-4 gap-x-8 items-center pl-2 md:pl-0 border-t border-gray-50 pt-4 md:border-none md:pt-0">
            <div className="text-left md:text-right">
                <p className="font-black text-xl md:text-2xl text-gray-900 tracking-tight">${card.balance.toLocaleString()}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Balance</p>
            </div>
            <div className="hidden xl:block w-32">
                <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                    <span className="text-gray-400">Lifetime Cost</span>
                    <span className="text-red-500">${Math.round(lifetimeCostMin).toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-400" style={{ width: `${100 - interestPercent}%` }}></div>
                    <div className="h-full bg-red-400" style={{ width: `${interestPercent}%` }}></div>
                </div>
                <div className="flex justify-between text-[9px] font-medium text-gray-400 mt-0.5"><span>Prin</span><span>Int</span></div>
            </div>
            <div className="text-right">
                <p className="font-bold text-gray-800 text-lg">${card.minimumPayment + (card.extraPayment || 0)}</p>
                <div className="flex justify-end gap-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Monthly</p>
                    {(card.extraPayment || 0) > 0 && <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1 rounded font-bold">Includes +${card.extraPayment}</span>}
                </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expanded ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-300 group-hover:text-gray-50'}`}>
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
                       <p className="text-gray-700 text-sm leading-relaxed mb-4">Based on your {card.apr}% APR, paying just the minimum of ${card.minimumPayment} will cost you <strong>${Math.round(minOnlyInterest).toLocaleString()} in interest</strong> alone.</p>
                       <button onClick={(e) => { e.stopPropagation(); onAskAI(`I need help paying off my ${card.name}. The APR is ${card.apr}% and balance is ${card.balance}.`); }} className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"><MessageCircle size={14} /> Ask A Follow Up</button>
                   </div>
               </div>
           )}

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
               <div className="lg:col-span-1 space-y-5">
                  <div className={`bg-gradient-to-br ${brand.gradient} text-white p-5 rounded-2xl shadow-lg relative overflow-hidden`}>
                     <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Interest Savings Simulator</p>
                            <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                        </div>
                        <div className="mb-4">
                            <p className="text-3xl font-black text-white tracking-tight">${Math.round(savings).toLocaleString()}</p>
                            <p className="text-sm font-medium text-white/90">Interest saved</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm mb-5"><Clock size={14} /> Debt Free {monthsSaved > 900 ? 'Years Sooner' : `${monthsSaved} Months Sooner`}</div>
                         <div className="pt-4 border-t border-white/20">
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Extra Principal/Mo</label>
                                <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded text-white">+${scenarioPayment}</span>
                            </div>
                            <input type="range" min="0" max="1000" step="25" value={scenarioPayment} onChange={(e) => setScenarioPayment(parseInt(e.target.value))} onClick={(e) => e.stopPropagation()} className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-100" />
                            <div className="flex justify-between mt-1 text-[9px] text-white/60 font-medium"><span>$0</span><span>$1,000</span></div>
                         </div>
                     </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                     <div className="flex justify-between items-center mb-3"><p className="text-xs font-bold text-gray-400 uppercase">Standard Path (Min Only)</p></div>
                     <div className="space-y-3">
                         <div className="flex justify-between text-sm"><span className="text-gray-500">Payoff Date</span><span className="font-bold text-gray-900">{minOnlyMonths === Infinity ? 'Never' : `${minOnlyMonths} mos`}</span></div>
                         <div className="flex justify-between text-sm"><span className="text-gray-500">Interest Paid</span><span className="font-bold text-red-500">+${Math.round(minOnlyInterest).toLocaleString()}</span></div>
                         <div className="pt-2 border-t border-gray-50 flex justify-between text-sm"><span className="text-gray-500 font-medium">Lifetime Total</span><span className="font-black text-gray-900">${Math.round(lifetimeCostMin).toLocaleString()}</span></div>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                       <div className="flex items-center gap-3"><h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider"><TrendingUp size={16} className="text-gray-400" /> Balance Projection</h4><button onClick={(e) => { e.stopPropagation(); setShowInlineAI(true); }} className="bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors"><Sparkles size={12} /> Ask Budgetura</button></div>
                       <div className="flex gap-4 justify-center text-xs font-bold text-gray-500"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-gray-400 rounded-full"></div> Min Only</div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> With +${scenarioPayment}</div></div>
                   </div>
                   <div className="h-48 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                               <defs>
                                   <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/><stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/></linearGradient>
                                   <linearGradient id="colorFast" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                               </defs>
                               <XAxis dataKey="month" hide /><YAxis hide /><Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '12px' }} formatter={(val: number) => [`$${val.toLocaleString()}`, '']} labelFormatter={(label) => `Month ${label}`} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                               <Area type="monotone" dataKey="Minimum" stroke="#94a3b8" strokeWidth={2} fill="url(#colorMin)" name="Minimum Payment" />
                               <Area type="monotone" dataKey="Accelerated" stroke="#3b82f6" strokeWidth={3} fill="url(#colorFast)" name={`With +$${scenarioPayment}`} />
                           </AreaChart>
                       </ResponsiveContainer>
                   </div>
               </div>
           </div>
           
           {/* Detailed Account Info Grid */}
           <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
               <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                   <FileText size={16} /> Account Details
               </h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Issuer</p>
                       <p className="font-semibold text-gray-900 mt-1">{card.issuer || 'N/A'}</p>
                   </div>
                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Network</p>
                       <p className="font-semibold text-gray-900 mt-1">{card.network || 'N/A'}</p>
                   </div>
                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Last 4 Digits</p>
                       <p className="font-semibold text-gray-900 mt-1 font-mono">{card.lastFourDigits ? `•••• ${card.lastFourDigits}` : 'N/A'}</p>
                   </div>
                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Card Type</p>
                       <p className="font-semibold text-gray-900 mt-1">{card.cardType || 'Credit'}</p>
                   </div>
                   
                   <div className="h-px bg-gray-200 col-span-1 sm:col-span-2 md:col-span-4 my-1"></div>

                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Statement Date</p>
                       <p className="font-semibold text-gray-900 mt-1">{card.statementDate ? `${card.statementDate}${getOrdinal(card.statementDate)} of month` : 'N/A'}</p>
                   </div>
                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Due Date</p>
                       <p className="font-semibold text-gray-900 mt-1">{card.dueDate ? `${card.dueDate}${getOrdinal(card.dueDate)} of month` : 'N/A'}</p>
                   </div>
                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Annual Fee</p>
                       <p className="font-semibold text-gray-900 mt-1">${card.annualFee || 0}</p>
                   </div>
                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Auto-Pay</p>
                       <p className={`font-bold mt-1 inline-flex items-center gap-1 ${card.autoPay ? 'text-emerald-600' : 'text-gray-500'}`}>
                           {card.autoPay ? <><Zap size={12} fill="currentColor"/> Enabled</> : 'Disabled'}
                       </p>
                   </div>

                    <div className="h-px bg-gray-200 col-span-1 sm:col-span-2 md:col-span-4 my-1"></div>

                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Rewards Program</p>
                       <p className="font-semibold text-gray-900 mt-1 flex items-center gap-1"><Gift size={12} /> {card.rewardsProgram || 'None'}</p>
                   </div>
                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Cashback Rate</p>
                       <p className="font-semibold text-gray-900 mt-1">{card.cashbackRate ? `${card.cashbackRate}%` : 'N/A'}</p>
                   </div>
                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Points Balance</p>
                       <p className="font-semibold text-gray-900 mt-1">{card.pointsBalance?.toLocaleString() || 0} pts</p>
                   </div>
                   <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Date Opened</p>
                       <p className="font-semibold text-gray-900 mt-1">{card.openedDate ? new Date(card.openedDate).toLocaleDateString() : 'N/A'}</p>
                   </div>
                   
                   {card.notes && (
                       <div className="col-span-1 sm:col-span-2 md:col-span-4 mt-2">
                           <p className="text-xs font-bold text-gray-400 uppercase mb-1">Notes</p>
                           <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">{card.notes}</p>
                       </div>
                   )}
               </div>
           </div>

           <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200/60">
              <button onClick={(e) => { e.stopPropagation(); onViewHistory(card); }} className="flex items-center justify-center gap-2 text-blue-600 hover:text-white hover:bg-blue-600 px-5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold bg-blue-50 border border-blue-100"><History size={16} /> History</button>
              <button onClick={(e) => { e.stopPropagation(); onEdit(card); }} className="flex items-center justify-center gap-2 text-gray-600 hover:text-white hover:bg-gray-800 px-5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold bg-gray-100"><Edit2 size={16} /> Edit Card</button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} className="flex items-center justify-center gap-2 text-red-500 hover:text-white hover:bg-red-500 px-5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold opacity-60 hover:opacity-100"><Trash2 size={16} /> Delete</button>
           </div>
        </div>
      )}
    </div>
  );
};

const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

const EditCardForm = ({ card, onClose, onSave }: { card: CreditCard, onClose: () => void, onSave: (c: CreditCard) => void }) => {
    const [showHistory, setShowHistory] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      
      const balance = parseFloat((form.elements.namedItem('balance') as HTMLInputElement).value);
      const limit = parseFloat((form.elements.namedItem('limit') as HTMLInputElement).value);

      const updatedCard: CreditCard = {
        ...card,
        name: (form.elements.namedItem('name') as HTMLInputElement).value,
        issuer: (form.elements.namedItem('issuer') as HTMLInputElement).value,
        lastFourDigits: (form.elements.namedItem('lastFour') as HTMLInputElement).value,
        cardType: (form.elements.namedItem('cardType') as HTMLSelectElement).value as CardType,
        network: (form.elements.namedItem('network') as HTMLSelectElement).value as CardNetwork,
        status: (form.elements.namedItem('status') as HTMLSelectElement).value as CardStatus,
        
        balance: balance,
        limit: limit,
        apr: parseFloat((form.elements.namedItem('apr') as HTMLInputElement).value),
        
        minimumPayment: parseFloat((form.elements.namedItem('min') as HTMLInputElement).value),
        minimumPaymentPercentage: parseFloat((form.elements.namedItem('minPercent') as HTMLInputElement).value),
        extraPayment: parseFloat((form.elements.namedItem('extra') as HTMLInputElement).value) || 0,
        
        dueDate: parseInt((form.elements.namedItem('dueDate') as HTMLInputElement).value) || undefined,
        statementDate: parseInt((form.elements.namedItem('statementDate') as HTMLInputElement).value) || undefined,
        autoPay: (form.elements.namedItem('autoPay') as HTMLInputElement).checked,
        annualFee: parseFloat((form.elements.namedItem('annualFee') as HTMLInputElement).value) || 0,
        
        rewardsProgram: (form.elements.namedItem('rewardsProgram') as HTMLInputElement).value,
        cashbackRate: parseFloat((form.elements.namedItem('cashbackRate') as HTMLInputElement).value) || undefined,
        pointsBalance: parseFloat((form.elements.namedItem('pointsBalance') as HTMLInputElement).value) || 0,
        
        openedDate: (form.elements.namedItem('openedDate') as HTMLInputElement).value,
        notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value,
        
        utilization: limit > 0 ? Math.round((balance / limit) * 100) : 0,
      };
      onSave(updatedCard);
    };
  
    if (showHistory) {
        return <HistoryModal card={card} onBack={() => setShowHistory(false)} onClose={onClose} />;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-3xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
             
             <div className="flex justify-between items-center mb-6">
                 <div>
                     <h3 className="font-black text-2xl text-gray-900">Edit Card</h3>
                     <p className="text-gray-500 text-sm mt-1">Update your card details.</p>
                 </div>
                 <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                     <X size={20} />
                 </button>
             </div>
             
             <div className="space-y-8">
                 {/* Section 1: Identity */}
                 <div>
                     <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Card Identity</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Card Name</label>
                             <input name="name" defaultValue={card.name} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Issuer</label>
                             <input name="issuer" defaultValue={card.issuer} placeholder="e.g. Chase" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last 4 Digits</label>
                             <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input name="lastFour" defaultValue={card.lastFourDigits} placeholder="XXXX" maxLength={4} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                             </div>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Network</label>
                             <select name="network" defaultValue={card.network} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                                 <option value="Visa">Visa</option>
                                 <option value="Mastercard">Mastercard</option>
                                 <option value="Amex">Amex</option>
                                 <option value="Discover">Discover</option>
                                 <option value="Other">Other</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Card Type</label>
                             <select name="cardType" defaultValue={card.cardType} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                                 <option value="Credit">Credit</option>
                                 <option value="Charge">Charge</option>
                                 <option value="Secured">Secured</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Opened Date</label>
                             <input name="openedDate" type="date" defaultValue={card.openedDate} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                             <select name="status" defaultValue={card.status} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                                 <option value="Active">Active</option>
                                 <option value="Paid Off">Paid Off</option>
                                 <option value="Closed">Closed</option>
                                 <option value="Frozen">Frozen</option>
                             </select>
                         </div>
                     </div>
                 </div>

                 {/* Section 2: Financials */}
                 <div>
                     <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Balances & Limits</h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Balance</label>
                             <input name="balance" type="number" step="any" defaultValue={card.balance} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Credit Limit</label>
                             <input name="limit" type="number" step="any" defaultValue={card.limit} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">APR (%)</label>
                             <input name="apr" type="number" step="any" defaultValue={card.apr} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                         </div>
                     </div>
                 </div>
                 
                 {/* Section 3: Payments */}
                 <div>
                     <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Payment Settings</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Payment ($)</label>
                             <input name="min" type="number" step="any" defaultValue={card.minimumPayment} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Pay %</label>
                             <input name="minPercent" type="number" step="any" defaultValue={card.minimumPaymentPercentage} placeholder="2.0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Statement Day</label>
                             <input name="statementDate" type="number" min="1" max="31" defaultValue={card.statementDate} placeholder="1-31" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Day</label>
                             <input name="dueDate" type="number" min="1" max="31" defaultValue={card.dueDate} placeholder="1-31" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                         </div>
                         <div className="col-span-2">
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recurring Extra Payment ($)</label>
                             <input name="extra" type="number" step="any" defaultValue={card.extraPayment} className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl outline-none font-bold text-emerald-900 placeholder-emerald-300" />
                         </div>
                         <div className="col-span-2 flex items-center gap-6">
                              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200 w-full">
                                  <input name="autoPay" type="checkbox" defaultChecked={card.autoPay} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                  <span className="text-sm font-bold text-gray-700">Auto-Pay Enabled</span>
                              </label>
                         </div>
                     </div>
                 </div>

                 {/* Section 4: Rewards & Notes */}
                 <div>
                     <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Rewards & Extras</h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-5">
                         <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rewards Program</label>
                             <input name="rewardsProgram" defaultValue={card.rewardsProgram} placeholder="e.g. Ultimate Rewards" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Annual Fee ($)</label>
                             <input name="annualFee" type="number" defaultValue={card.annualFee} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cashback %</label>
                             <input name="cashbackRate" type="number" step="0.1" defaultValue={card.cashbackRate} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Points Balance</label>
                             <input name="pointsBalance" type="number" defaultValue={card.pointsBalance} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                         </div>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                         <textarea name="notes" defaultValue={card.notes} rows={3} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 resize-none" placeholder="Add notes about this card..." />
                     </div>
                 </div>
             </div>
             
             <div className="flex gap-4 justify-between pt-6 border-t border-gray-100 mt-8 flex-col-reverse sm:flex-row">
                {card.history && card.history.length > 0 ? (
                    <button type="button" onClick={() => setShowHistory(true)} className="px-4 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                        <History size={18} /> View Historical Info
                    </button>
                ) : (
                    <div className="hidden sm:block"></div>
                )}
                <div className="flex gap-4 flex-col sm:flex-row w-full sm:w-auto">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors w-full sm:w-auto">Cancel</button>
                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto">
                        <Edit2 size={18} /> Update Card
                    </button>
                </div>
             </div>
          </form>
      </div>
    );
}

const HistoryModal = ({ card, onBack, onClose }: { card: CreditCard, onBack: () => void, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowRight className="rotate-180" size={20} />
                            </button>
                        )}
                        <h3 className="font-black text-xl text-gray-900">Historical Data</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-gray-500 mb-6 text-sm">Track changes to your {card.name} over time.</p>

                <div className="overflow-hidden border border-gray-200 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Balance</th>
                                <th className="p-4 hidden sm:table-cell">Limit</th>
                                <th className="p-4">APR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="bg-blue-50/50">
                                <td className="p-4 font-bold text-blue-900 text-sm">Current</td>
                                <td className="p-4 font-bold text-gray-900">${card.balance.toLocaleString()}</td>
                                <td className="p-4 text-sm text-gray-600 hidden sm:table-cell">${card.limit.toLocaleString()}</td>
                                <td className="p-4 text-sm text-gray-600">{card.apr}%</td>
                            </tr>
                            {card.history?.map((entry, index) => {
                                const balDiff = card.balance - entry.balance;
                                const isBalLower = card.balance < entry.balance;
                                const aprDiff = card.apr - entry.apr;
                                const isAprLower = card.apr < entry.apr;
                                
                                return (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-500">{new Date(entry.date).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <div className="text-sm font-bold text-gray-700">${entry.balance.toLocaleString()}</div>
                                            {balDiff !== 0 && (
                                                <div className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${isBalLower ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {isBalLower ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                                                    {Math.abs(balDiff)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 hidden sm:table-cell">${entry.limit.toLocaleString()}</td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-600">{entry.apr}%</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const AddCardForm = ({ onClose, onSave }: { onClose: () => void, onSave: (c: CreditCard) => void }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const balance = parseFloat((form.elements.namedItem('balance') as HTMLInputElement).value);
    const limit = parseFloat((form.elements.namedItem('limit') as HTMLInputElement).value);
    
    const newCard: CreditCard = {
      id: Date.now().toString(),
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      issuer: (form.elements.namedItem('issuer') as HTMLInputElement).value,
      lastFourDigits: (form.elements.namedItem('lastFour') as HTMLInputElement).value,
      cardType: (form.elements.namedItem('cardType') as HTMLSelectElement).value as CardType,
      network: (form.elements.namedItem('network') as HTMLSelectElement).value as CardNetwork,
      
      balance: balance,
      limit: limit,
      apr: parseFloat((form.elements.namedItem('apr') as HTMLInputElement).value),
      minimumPayment: parseFloat((form.elements.namedItem('min') as HTMLInputElement).value),
      minimumPaymentPercentage: parseFloat((form.elements.namedItem('minPercent') as HTMLInputElement).value),
      extraPayment: parseFloat((form.elements.namedItem('extra') as HTMLInputElement).value) || 0,
      
      dueDate: parseInt((form.elements.namedItem('dueDate') as HTMLInputElement).value) || undefined,
      statementDate: parseInt((form.elements.namedItem('statementDate') as HTMLInputElement).value) || undefined,
      autoPay: (form.elements.namedItem('autoPay') as HTMLInputElement).checked,
      annualFee: parseFloat((form.elements.namedItem('annualFee') as HTMLInputElement).value) || 0,
      
      rewardsProgram: (form.elements.namedItem('rewardsProgram') as HTMLInputElement).value,
      cashbackRate: parseFloat((form.elements.namedItem('cashbackRate') as HTMLInputElement).value) || undefined,
      pointsBalance: parseFloat((form.elements.namedItem('pointsBalance') as HTMLInputElement).value) || 0,
      
      openedDate: (form.elements.namedItem('openedDate') as HTMLInputElement).value,
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value,
      
      status: 'Active',
      utilization: limit > 0 ? Math.round((balance / limit) * 100) : 0,
      payoffDate: 'Calculating...', 
      interest: 0,
      history: []
    };
    onSave(newCard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-3xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
           
           <div className="flex justify-between items-center mb-6">
               <div>
                   <h3 className="font-black text-2xl text-gray-900">Add New Card</h3>
                   <p className="text-gray-500 text-sm mt-1">Enter your card details for tracking.</p>
               </div>
               <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                   <X size={20} />
               </button>
           </div>
           
           <div className="space-y-8">
               {/* Section 1: Identity */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Card Identity</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="md:col-span-2">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Card Name</label>
                           <input name="name" required placeholder="e.g. Chase Sapphire Reserve" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Issuer</label>
                           <input name="issuer" placeholder="e.g. Chase" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last 4 Digits</label>
                           <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                              <input name="lastFour" placeholder="XXXX" maxLength={4} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Network</label>
                           <select name="network" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                               <option value="Visa">Visa</option>
                               <option value="Mastercard">Mastercard</option>
                               <option value="Amex">Amex</option>
                               <option value="Discover">Discover</option>
                               <option value="Other">Other</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Card Type</label>
                           <select name="cardType" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900">
                               <option value="Credit">Credit</option>
                               <option value="Charge">Charge</option>
                               <option value="Secured">Secured</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Opened Date</label>
                           <input name="openedDate" type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                   </div>
               </div>

               {/* Section 2: Financials */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Balances & Limits</h4>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Balance</label>
                           <input name="balance" type="number" step="any" placeholder="0.00" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Credit Limit</label>
                           <input name="limit" type="number" step="any" placeholder="0.00" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">APR (%)</label>
                           <input name="apr" type="number" step="any" placeholder="0.0" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                   </div>
               </div>
               
               {/* Section 3: Payments */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Payment Settings</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Payment ($)</label>
                           <input name="min" type="number" step="any" placeholder="0.00" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Pay %</label>
                           <input name="minPercent" type="number" step="any" placeholder="2.0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Statement Day</label>
                           <input name="statementDate" type="number" min="1" max="31" placeholder="1-31" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Day</label>
                           <input name="dueDate" type="number" min="1" max="31" placeholder="1-31" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div className="col-span-2">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recurring Extra Payment ($)</label>
                           <input name="extra" type="number" step="any" placeholder="0.00" className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl outline-none font-bold text-emerald-900 placeholder-emerald-300" />
                       </div>
                       <div className="col-span-2 flex items-center gap-6">
                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200 w-full">
                                <input name="autoPay" type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                <span className="text-sm font-bold text-gray-700">Auto-Pay Enabled</span>
                            </label>
                       </div>
                   </div>
               </div>

               {/* Section 4: Rewards & Notes */}
               <div>
                   <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Rewards & Extras</h4>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-5">
                       <div className="md:col-span-2">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rewards Program</label>
                           <input name="rewardsProgram" placeholder="e.g. Ultimate Rewards" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Annual Fee ($)</label>
                           <input name="annualFee" type="number" placeholder="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cashback %</label>
                           <input name="cashbackRate" type="number" step="0.1" placeholder="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Points Balance</label>
                           <input name="pointsBalance" type="number" placeholder="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900" />
                       </div>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                       <textarea name="notes" rows={3} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 resize-none" placeholder="Add notes about this card..." />
                   </div>
               </div>
           </div>
           
           <div className="flex gap-4 justify-end pt-6 border-t border-gray-100 mt-8 flex-col-reverse sm:flex-row">
              <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors w-full sm:w-auto">Cancel</button>
              <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto">
                  <Plus size={18} /> Save Card
              </button>
           </div>
        </form>
    </div>
  );
}

export default CreditCardManager;
