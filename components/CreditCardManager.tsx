import React, { useState, useMemo } from 'react';
import { useDebt } from '../context/DebtContext';
import { calculateMonthsToPayoff, calculateTotalInterest } from '../utils/calculations';
import { Plus, Trash2, ChevronDown, ChevronUp, TrendingUp, CreditCard as CardIcon, ShieldCheck, Flame, ArrowRight, Wallet, Percent, Sparkles, ArrowUpDown, SlidersHorizontal, PiggyBank, Clock, Edit2, History, ArrowDown, ArrowUp, X, MessageCircle } from 'lucide-react';
import { CreditCard, CreditCardHistory } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Helper for dynamic brand styling
const getBrandStyles = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('chase')) return { 
        bg: 'bg-blue-50', text: 'text-blue-700', border: 'hover:border-blue-200', 
        iconBg: 'bg-blue-100', iconColor: 'text-blue-600', 
        shadow: 'hover:shadow-blue-500/10', accent: 'bg-blue-500' 
    };
    if (n.includes('discover')) return { 
        bg: 'bg-orange-50', text: 'text-orange-700', border: 'hover:border-orange-200', 
        iconBg: 'bg-orange-100', iconColor: 'text-orange-600', 
        shadow: 'hover:shadow-orange-500/10', accent: 'bg-orange-500' 
    };
    if (n.includes('capital') || n.includes('quicksilver') || n.includes('venture')) return { 
        bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'hover:border-indigo-200', 
        iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', 
        shadow: 'hover:shadow-indigo-500/10', accent: 'bg-indigo-500' 
    };
    if (n.includes('amex') || n.includes('american')) return { 
        bg: 'bg-sky-50', text: 'text-sky-700', border: 'hover:border-sky-200', 
        iconBg: 'bg-sky-100', iconColor: 'text-sky-600', 
        shadow: 'hover:shadow-sky-500/10', accent: 'bg-sky-500' 
    };
    if (n.includes('citi')) return { 
        bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'hover:border-cyan-200', 
        iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', 
        shadow: 'hover:shadow-cyan-500/10', accent: 'bg-cyan-500' 
    };
    return { 
        bg: 'bg-gray-50', text: 'text-gray-600', border: 'hover:border-gray-200', 
        iconBg: 'bg-gray-100', iconColor: 'text-gray-500', 
        shadow: 'hover:shadow-gray-200/50', accent: 'bg-gray-500' 
    };
};

type SortOption = 'balance' | 'apr' | 'utilization' | 'name';

const CreditCardManager = () => {
  const { cards, addCard, deleteCard, updateCard, setAIChatState } = useDebt();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [viewingHistory, setViewingHistory] = useState<CreditCard | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('balance');
  const [scenarioPayment, setScenarioPayment] = useState(100);

  // --- Aggregate Calculations ---
  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);
  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const utilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  
  const highestAprCard = cards.reduce((prev, current) => (prev.apr > current.apr) ? prev : current, cards[0] || { apr: 0, name: 'None' });
  const monthlyInterestBurn = cards.reduce((sum, c) => sum + (c.balance * (c.apr / 100 / 12)), 0);

  // Lifetime Cost Calculations (Global)
  const globalMetrics = useMemo(() => {
      return cards.reduce((acc, card) => {
          // Min only path
          const minMonths = calculateMonthsToPayoff(card.balance, card.apr, card.minimumPayment);
          const minInterest = calculateTotalInterest(card.balance, card.minimumPayment, minMonths);
          const minTotalCost = card.balance + minInterest;

          // Scenario path (+ extra payment per card)
          const extraMonths = calculateMonthsToPayoff(card.balance, card.apr, card.minimumPayment + scenarioPayment);
          const extraInterest = calculateTotalInterest(card.balance, card.minimumPayment + scenarioPayment, extraMonths);
          
          return {
              lifetimeCost: acc.lifetimeCost + minTotalCost,
              potentialSavings: acc.potentialSavings + (minInterest - extraInterest),
              totalInterest: acc.totalInterest + minInterest
          };
      }, { lifetimeCost: 0, potentialSavings: 0, totalInterest: 0 });
  }, [cards, scenarioPayment]);

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
      
      // Create snapshot of previous state
      const historyEntry: CreditCardHistory = {
          date: new Date().toISOString(),
          balance: editingCard.balance,
          limit: editingCard.limit,
          apr: editingCard.apr,
          minimumPayment: editingCard.minimumPayment
      };

      // Add to history if values changed
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
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Credit Manager</h1>
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
                      <span className="text-4xl font-black text-gray-900 tracking-tight">-${Math.round(monthlyInterestBurn).toLocaleString()}</p>
                      <span className="text-sm font-bold text-orange-600/70">/mo</span>
                  </div>
                  <p className="text-xs font-semibold text-red-900/60 leading-relaxed mb-4">
                      Total projected interest cost: <strong className="text-red-900">${Math.round(globalMetrics.totalInterest).toLocaleString()}</strong>
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

      {/* --- Controls Toolbar: Total, Scenario, Sort --- */}
      <div className="bg-white p-3 md:p-4 rounded-[20px] shadow-sm border border-gray-200 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
          
          {/* Metrics Group */}
          <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto justify-between lg:justify-start">
              {/* Current Debt */}
              <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shrink-0">
                      <Wallet size={18} />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Current Debt</p>
                      <p className="text-lg font-black text-gray-900 leading-none mt-0.5">${totalBalance.toLocaleString()}</p>
                  </div>
              </div>
              
              <div className="h-8 w-px bg-gray-100"></div>

              {/* Lifetime Cost */}
              <div className="flex items-center gap-3">
                  <div className="bg-red-50 p-2 rounded-xl text-red-500 shrink-0">
                      <PiggyBank size={18} />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Lifetime Cost</p>
                      <p className="text-lg font-bold text-red-600 leading-none mt-0.5">${Math.round(globalMetrics.lifetimeCost).toLocaleString()}</p>
                  </div>
              </div>
          </div>

          {/* Scenario Slider - Center */}
          <div className="flex-1 w-full px-0 border-t lg:border-t-0 lg:border-x lg:border-gray-100 pt-4 lg:pt-0 lg:px-6">
              <div className="flex justify-between items-end mb-1.5">
                  <div className="flex items-center gap-2">
                      <div className="p-1 bg-emerald-100 rounded text-emerald-600"><SlidersHorizontal size={12} /></div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Scenario: Extra Pay Per Card</label>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">+${scenarioPayment}</span>
              </div>
              
              <input 
                  type="range" 
                  min="0" 
                  max="1000" 
                  step="25" 
                  value={scenarioPayment}
                  onChange={(e) => setScenarioPayment(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
              />
              
              <div className="flex justify-between items-center mt-1">
                  <span className="text-[9px] font-bold text-gray-300 uppercase">Min Only</span>
                  {globalMetrics.potentialSavings > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                          <Sparkles size={10} /> Potential Savings: ${Math.round(globalMetrics.potentialSavings).toLocaleString()}
                      </span>
                  )}
                  <span className="text-[9px] font-bold text-gray-300 uppercase">+$1000</span>
              </div>
          </div>

          {/* Sorting - Right */}
          <div className="w-full lg:w-auto min-w-[180px]">
              <div className="relative group">
                  <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300 cursor-pointer"
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
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CardIcon size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Your wallet is empty</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto mt-2">Add your credit cards to visualize your debt, track utilization, and generate smart payoff strategies.</p>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                >
                    Add Your First Card
                </button>
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
                    scenarioPayment={scenarioPayment}
                    onAskAI={(msg) => setAIChatState({ isOpen: true, initialMessage: msg })}
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
  scenarioPayment: number;
  onAskAI: (msg: string) => void;
}

const CardRow: React.FC<CardRowProps> = ({ card, onDelete, onEdit, onViewHistory, scenarioPayment, onAskAI }) => {
  const [expanded, setExpanded] = useState(false);
  const [showInlineAI, setShowInlineAI] = useState(false);
  const brand = getBrandStyles(card.name);

  // Basic Calculations
  const minOnlyMonths = calculateMonthsToPayoff(card.balance, card.apr, card.minimumPayment);
  const minOnlyInterest = calculateTotalInterest(card.balance, card.minimumPayment, minOnlyMonths);
  const lifetimeCostMin = card.balance + minOnlyInterest;
  
  // Scenario Calculations
  const extraMonths = calculateMonthsToPayoff(card.balance, card.apr, card.minimumPayment + scenarioPayment);
  const extraInterest = calculateTotalInterest(card.balance, card.minimumPayment + scenarioPayment, extraMonths);
  const lifetimeCostScenario = card.balance + extraInterest;
  
  const savings = lifetimeCostMin - lifetimeCostScenario;
  const monthsSaved = (minOnlyMonths === Infinity ? 999 : minOnlyMonths) - (extraMonths === Infinity ? 999 : extraMonths);

  // Principal vs Interest Ratio for Bar
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
        data.push({
            month,
            Minimum: Math.round(balMin),
            Accelerated: Math.round(balFast)
        });
        month++;
    }
    return data;
  };

  const chartData = expanded ? generateChartData() : [];

  return (
    <div className={`bg-white rounded-[24px] border border-gray-100 overflow-hidden transition-all duration-300 group ${expanded ? 'ring-2 ring-blue-500/5 shadow-xl' : `hover:border-transparent ${brand.border} ${brand.shadow}`}`}>
      <div className="p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer relative" onClick={() => setExpanded(!expanded)}>
        
        {/* Hover Highlight Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${brand.accent} opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full`}></div>

        {/* Icon & Name */}
        <div className="flex-1 flex items-center gap-5 w-full md:w-auto">
          <div className={`w-14 h-14 ${brand.iconBg} ${brand.iconColor} rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
             <CardIcon size={28} />
          </div>
          <div>
              <h3 className="font-bold text-gray-900 text-lg md:text-xl leading-tight group-hover:text-blue-600 transition-colors">{card.name}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1.5 font-medium">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${brand.bg} ${brand.text}`}>{card.apr}% APR</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="text-gray-400">{card.status}</span>
              </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap justify-between w-full md:w-auto md:flex-1 md:justify-end gap-y-4 gap-x-8 items-center pl-2 md:pl-0">
            <div className="text-right">
                <p className="font-black text-xl md:text-2xl text-gray-900 tracking-tight">${card.balance.toLocaleString()}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Balance</p>
            </div>

            <div className="hidden xl:block w-32">
                <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                    <span className="text-gray-400">Lifetime Cost</span>
                    <span className="text-red-500">${Math.round(lifetimeCostMin).toLocaleString()}</p>
                </div>
                <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-400" style={{ width: `${100 - interestPercent}%` }}></div>
                    <div className="h-full bg-red-400" style={{ width: `${interestPercent}%` }}></div>
                </div>
                <div className="flex justify-between text-[9px] font-medium text-gray-400 mt-0.5">
                    <span>Prin</span>
                    <span>Int</span>
                </div>
            </div>
            
            <div className="hidden md:block text-right">
                <p className="font-bold text-gray-800 text-lg">${card.minimumPayment}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Min Pay</p>
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
                           <div className="flex items-center gap-2 text-purple-600">
                               <Sparkles size={18} />
                               <span className="font-bold text-sm">Budgetura Insight</span>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); setShowInlineAI(false); }} className="text-gray-400 hover:text-gray-600">
                               <X size={16} />
                           </button>
                       </div>
                       <p className="text-gray-700 text-sm leading-relaxed mb-4">
                           Based on your {card.apr}% APR, paying just the minimum of ${card.minimumPayment} will cost you <strong>${Math.round(minOnlyInterest).toLocaleString()} in interest</strong> alone. By adding just $50/mo more, you could cut your payoff time in half.
                       </p>
                       <button 
                           onClick={(e) => { e.stopPropagation(); onAskAI(`I need help paying off my ${card.name}. The APR is ${card.apr}% and balance is ${card.balance}.`); }}
                           className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                       >
                           <MessageCircle size={14} /> Ask A Follow Up
                       </button>
                   </div>
               </div>
           )}

           <div className="grid lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1 space-y-5">
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-5 rounded-2xl shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Savings Opportunity</p>
                            <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                        </div>
                        <div className="mb-4">
                            <p className="text-3xl font-black text-white tracking-tight">${Math.round(savings).toLocaleString()}</p>
                            <p className="text-sm font-medium text-emerald-100">Saved by paying +${scenarioPayment}/mo</p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                            <Clock size={14} />
                            Debt Free {monthsSaved > 900 ? 'Years Sooner' : `${monthsSaved} Months Sooner`}
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                     <div className="flex justify-between items-center mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase">Standard Path (Min Only)</p>
                     </div>
                     <div className="space-y-3">
                         <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Payoff Date</span>
                             <span className="font-bold text-gray-900">{minOnlyMonths === Infinity ? 'Never' : `${minOnlyMonths} mos`}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Interest Paid</span>
                             <span className="font-bold text-red-500">+${Math.round(minOnlyInterest).toLocaleString()}</p>
                         </div>
                         <div className="pt-2 border-t border-gray-50 flex justify-between text-sm">
                             <span className="text-gray-500 font-medium">Lifetime Total</span>
                             <span className="font-black text-gray-900">${Math.round(lifetimeCostMin).toLocaleString()}</span>
                         </div>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                       <div className="flex items-center gap-3">
                           <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider"><TrendingUp size={16} className="text-gray-400" /> Balance Projection</h4>
                           <button 
                                onClick={(e) => { e.stopPropagation(); setShowInlineAI(true); }}
                                className="bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                           >
                               <Sparkles size={12} /> Ask Budgetura
                           </button>
                       </div>
                       <div className="flex gap-4 justify-center text-xs font-bold text-gray-500">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-gray-400 rounded-full"></div> Min Only</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> With +${scenarioPayment}</div>
                        </div>
                   </div>
                   
                   <div className="h-48 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                               <defs>
                                   <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                                       <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                                   </linearGradient>
                                   <linearGradient id="colorFast" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                   </linearGradient>
                               </defs>
                               <XAxis dataKey="month" hide />
                               <YAxis hide />
                               <Tooltip 
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '12px' }}
                                  formatter={(val: number) => [`$${val.toLocaleString()}`, '']}
                                  labelFormatter={(label) => `Month ${label}`}
                                  cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                               />
                               <Area type="monotone" dataKey="Minimum" stroke="#94a3b8" strokeWidth={2} fill="url(#colorMin)" name="Minimum Payment" />
                               <Area type="monotone" dataKey="Accelerated" stroke="#3b82f6" strokeWidth={3} fill="url(#colorFast)" name={`With +$${scenarioPayment}`} />
                           </AreaChart>
                       </ResponsiveContainer>
                   </div>
               </div>
           </div>
           
           <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200/60">
              <button 
                onClick={(e) => { e.stopPropagation(); onViewHistory(card); }}
                className="flex items-center gap-2 text-blue-600 hover:text-white hover:bg-blue-600 px-5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold bg-blue-50 border border-blue-100"
              >
                <History size={16} /> History
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(card); }}
                className="flex items-center gap-2 text-gray-600 hover:text-white hover:bg-gray-800 px-5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold bg-gray-100"
              >
                <Edit2 size={16} /> Edit Card
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                className="flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-500 px-5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold opacity-60 hover:opacity-100"
              >
                <Trash2 size={16} /> Delete
              </button>
           </div>
        </div>
      )}
    </div>
  );
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
        balance: balance,
        limit: limit,
        apr: parseFloat((form.elements.namedItem('apr') as HTMLInputElement).value),
        minimumPayment: parseFloat((form.elements.namedItem('min') as HTMLInputElement).value),
        utilization: limit > 0 ? Math.round((balance / limit) * 100) : 0,
      };
      onSave(updatedCard);
    };
  
    if (showHistory) {
        return <HistoryModal card={card} onBack={() => setShowHistory(false)} onClose={onClose} />;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
             
             <div className="flex justify-between items-center mb-8">
                 <div>
                     <h3 className="font-black text-2xl text-gray-900">Edit Card</h3>
                     <p className="text-gray-500 text-sm mt-1">Update your card details.</p>
                 </div>
                 <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                     <X size={20} />
                 </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Card Name</label>
                  <div className="relative group">
                      <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input name="name" defaultValue={card.name} required className="w-full pl-11 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-gray-900 placeholder-gray-400" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Current Balance</label>
                  <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 font-bold">$</span>
                      <input name="balance" type="number" step="any" defaultValue={card.balance} required className="w-full pl-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-900" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Credit Limit</label>
                  <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 font-bold">$</span>
                      <input name="limit" type="number" step="any" defaultValue={card.limit} required className="w-full pl-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-900" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">APR (%)</label>
                  <div className="relative group">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={16} />
                      <input name="apr" type="number" step="any" defaultValue={card.apr} required className="w-full pl-11 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-900" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Min Payment</label>
                   <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 font-bold">$</span>
                      <input name="min" type="number" step="any" defaultValue={card.minimumPayment} required className="w-full pl-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-900" />
                  </div>
                </div>
             </div>
             
             <div className="flex gap-4 justify-between pt-6 border-t border-gray-100">
                {card.history && card.history.length > 0 ? (
                    <button type="button" onClick={() => setShowHistory(true)} className="px-4 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl font-bold transition-colors flex items-center gap-2">
                        <History size={18} /> View Historical Info
                    </button>
                ) : (
                    <div></div>
                )}
                <div className="flex gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
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
                        {/* Show back button only if passed (it might be null if opened directly) */}
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
                                <th className="p-4">Limit</th>
                                <th className="p-4">APR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Current State Row (Top) */}
                            <tr className="bg-blue-50/50">
                                <td className="p-4 font-bold text-blue-900 text-sm">Current</td>
                                <td className="p-4 font-bold text-gray-900">${card.balance.toLocaleString()}</td>
                                <td className="p-4 text-sm text-gray-600">${card.limit.toLocaleString()}</td>
                                <td className="p-4 text-sm text-gray-600">{card.apr}%</td>
                            </tr>
                            
                            {/* History Rows */}
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
                                                    Current is {isBalLower ? 'lower' : 'higher'} (${Math.abs(balDiff)})
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">${entry.limit.toLocaleString()}</td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-600">{entry.apr}%</div>
                                            {aprDiff !== 0 && (
                                                <div className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${isAprLower ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {isAprLower ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                                                    {isAprLower ? 'Lower' : 'Higher'} ({Math.abs(aprDiff)}%)
                                                </div>
                                            )}
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
      balance: balance,
      limit: limit,
      apr: parseFloat((form.elements.namedItem('apr') as HTMLInputElement).value),
      minimumPayment: parseFloat((form.elements.namedItem('min') as HTMLInputElement).value),
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
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
           
           <div className="flex justify-between items-center mb-8">
               <div>
                   <h3 className="font-black text-2xl text-gray-900">Add New Card</h3>
                   <p className="text-gray-500 text-sm mt-1">Enter your card details for tracking.</p>
               </div>
               <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                   <X size={20} />
               </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Card Name</label>
                <div className="relative group">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input name="name" placeholder="e.g. Chase Sapphire Reserve" required className="w-full pl-11 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-gray-900 placeholder-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Current Balance</label>
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 font-bold">$</span>
                    <input name="balance" type="number" step="any" placeholder="0.00" required className="w-full pl-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-900" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Credit Limit</label>
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 font-bold">$</span>
                    <input name="limit" type="number" step="any" placeholder="0.00" required className="w-full pl-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-900" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">APR (%)</label>
                <div className="relative group">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={16} />
                    <input name="apr" type="number" step="any" placeholder="0.0" required className="w-full pl-11 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-900" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Min Payment</label>
                 <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 font-bold">$</span>
                    <input name="min" type="number" step="any" placeholder="0.00" required className="w-full pl-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-900" />
                </div>
              </div>
           </div>
           
           <div className="flex gap-4 justify-end pt-6 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">Cancel</button>
              <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  <Plus size={18} /> Save Card
              </button>
           </div>
        </form>
    </div>
  );
}

export default CreditCardManager;