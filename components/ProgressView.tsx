
import React, { useState, useMemo } from 'react';
import { useDebt } from '../context/DebtContext';
import { 
  Calendar, TrendingDown, ArrowRight, TrendingUp, Sparkles, 
  Wallet, CreditCard, Home, Car, GraduationCap, Stethoscope, 
  Briefcase, ShoppingBag, Landmark, Activity, CheckCircle2,
  CalendarDays, ChevronDown, Filter, ArrowUp, ArrowDown, X, ExternalLink
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { Loan, LoanCategory } from '../types';

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

// --- Helper: Mock Data Generator for Demo Purposes ---
const generateTrendData = (currentDebt: number, range: TimeRange) => {
    const points = range === 'week' ? 7 : range === 'month' ? 30 : range === 'quarter' ? 12 : range === 'year' ? 12 : 6;
    const data = [];
    const now = new Date();
    
    // Simulate a downward trend (paying off debt)
    let runningBalance = currentDebt * (1 + (points * 0.01)); // Start higher

    for (let i = points; i >= 0; i--) {
        const date = new Date(now);
        if (range === 'week' || range === 'month') date.setDate(date.getDate() - i);
        else date.setMonth(date.getMonth() - i);
        
        // Random fluctuation but generally down
        const drop = (Math.random() * (currentDebt * 0.005)); 
        runningBalance -= drop;
        if (runningBalance < currentDebt) runningBalance = currentDebt; // converge

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: date,
            balance: Math.round(runningBalance),
            interestPaid: Math.round(runningBalance * 0.004), // Mock interest component
            principalPaid: Math.round(drop)
        });
    }
    // Force last point to match current
    data[data.length - 1].balance = currentDebt;
    
    return data;
};

interface Props {
    onNavigate?: (view: string) => void;
}

const ProgressView: React.FC<Props> = ({ onNavigate }) => {
  const { cards, loans, snapshots } = useDebt();
  const [timeRange, setTimeRange] = useState<TimeRange>('year');
  const [selectedCategory, setSelectedCategory] = useState<{ title: string, items: any[], type: 'Credit' | 'Loan' } | null>(null);

  // --- 1. Aggregation & Calculation ---
  const currentTotalDebt = cards.reduce((s, c) => s + c.balance, 0) + loans.reduce((s, l) => s + l.currentBalance, 0);
  
  // Generate Data based on selection
  const trendData = useMemo(() => generateTrendData(currentTotalDebt, timeRange), [currentTotalDebt, timeRange]);
  
  // Calculate Deltas based on the trend data
  const startBalance = trendData[0].balance;
  const totalPaidInPeriod = startBalance - currentTotalDebt;
  const totalInterestPaidInPeriod = trendData.reduce((acc, d) => acc + d.interestPaid, 0);
  const totalExtraPaymentsInPeriod = Math.round(totalPaidInPeriod * 0.3); // Mocking 30% was extra
  
  // Group Loans by Category
  const loanGroups = useMemo(() => {
      const groups: Record<string, Loan[]> = {};
      loans.forEach(loan => {
          const cat = loan.type;
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(loan);
      });
      return groups;
  }, [loans]);

  // AI Summary Logic
  const aiSummary = useMemo(() => {
      if (totalPaidInPeriod > 0) {
          return {
              sentiment: 'positive',
              title: 'Excellent Momentum',
              message: `You've reduced your total debt load by ${(100 - (currentTotalDebt/startBalance)*100).toFixed(1)}% this period. Your adherence to the payoff plan is 94%, which is exceptional.`,
              action: 'Consider applying the surplus cash flow to your highest APR card next month.'
          };
      } else {
          return {
              sentiment: 'neutral',
              title: 'Steady State',
              message: "Your total balance has remained relatively flat. High interest accrual might be offsetting your minimum payments.",
              action: 'Review your monthly budget to find an extra $50-$100 for debt reduction.'
          };
      }
  }, [totalPaidInPeriod, currentTotalDebt, startBalance]);

  const handleCardClick = (title: string, items: any[], type: 'Credit' | 'Loan') => {
      setSelectedCategory({ title, items, type });
  };

  const handleNavigateToItem = (item: any) => {
      if (!onNavigate) return;

      // Close modal first
      setSelectedCategory(null);

      // Determine destination based on type/props
      if ('balance' in item) { // It's a card
          onNavigate('credit-cards');
      } else { // It's a loan
          onNavigate('loans');
      }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">
       
       {/* Header & Date Filter */}
       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Progress Tracking</h1>
                <p className="text-gray-500 mt-1 font-medium">Visualize your journey to debt freedom.</p>
            </div>
            
            <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex items-center">
                {(['week', 'month', 'quarter', 'year', 'all'] as TimeRange[]).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                            timeRange === range 
                            ? 'bg-gray-900 text-white shadow-md' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        {range === 'all' ? 'All Time' : `This ${range}`}
                    </button>
                ))}
            </div>
       </div>

        {/* AI Insight Card */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-[32px] p-1 shadow-lg shadow-purple-900/10">
            <div className="bg-white/10 backdrop-blur-md rounded-[28px] p-6 md:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-purple-600">
                        <Sparkles size={24} className="animate-pulse" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">AI Assessment</span>
                             <span className="text-sm font-bold text-purple-200">{aiSummary.title}</span>
                        </div>
                        <p className="text-lg md:text-xl font-medium leading-relaxed text-white mb-4">
                            "{aiSummary.message}"
                        </p>
                         <div className="flex items-start gap-2 bg-black/20 rounded-xl p-4 border border-white/5">
                            <TrendingUp size={18} className="mt-0.5 text-emerald-300" />
                            <div>
                                <p className="text-xs font-bold text-purple-200 uppercase tracking-wide">Recommended Action</p>
                                <p className="text-sm text-white">{aiSummary.action}</p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>

       {/* Summary Toolbar */}
       <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
           <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 lg:gap-16">
               
               {/* Total Debt Metric */}
               <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Total Debt</p>
                   <div className="flex items-center gap-2">
                       <span className="text-2xl font-black text-gray-900">${currentTotalDebt.toLocaleString()}</span>
                   </div>
                   <p className="text-[10px] text-gray-400 mt-1">Outstanding Balance</p>
               </div>

               <div className="h-auto w-px bg-gray-100 hidden sm:block"></div>

               <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Total Paid (Period)</p>
                   <div className="flex items-center gap-2">
                       <span className="text-2xl font-black text-gray-900">${totalPaidInPeriod.toLocaleString()}</span>
                       <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                           <ArrowDown size={10} /> {(totalPaidInPeriod/startBalance * 100).toFixed(1)}%
                       </span>
                   </div>
               </div>
               
               <div className="h-auto w-px bg-gray-100 hidden sm:block"></div>

               <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Interest vs Principal</p>
                   <div className="flex items-baseline gap-1">
                       <span className="text-xl font-bold text-red-500">${totalInterestPaidInPeriod.toLocaleString()}</span>
                       <span className="text-xs text-gray-400 font-medium">Interest</span>
                       <span className="text-gray-300 mx-1">/</span>
                       <span className="text-xl font-bold text-blue-600">${(totalPaidInPeriod).toLocaleString()}</span>
                       <span className="text-xs text-gray-400 font-medium">Principal</span>
                   </div>
               </div>

                <div className="h-auto w-px bg-gray-100 hidden sm:block"></div>

               <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Plan Adherence</p>
                   <div className="flex items-center gap-2">
                       <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 w-[94%] rounded-full"></div>
                       </div>
                       <span className="text-sm font-bold text-indigo-700">94%</span>
                   </div>
                   <p className="text-[10px] text-gray-400 mt-1">Total Extra: <span className="text-emerald-600 font-bold">+${totalExtraPaymentsInPeriod.toLocaleString()}</span></p>
               </div>
           </div>
       </div>

       {/* Main Chart Section */}
       <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-8">
               <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                   <Activity size={20} className="text-blue-500" />
                   Total Debt Reduction
               </h3>
                <div className="flex gap-2">
                     <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                         <div className="w-2 h-2 rounded-full bg-blue-500"></div> Balance
                     </span>
                </div>
           </div>
           <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <defs>
                           <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                           </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                       <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            minTickGap={30}
                       />
                       <YAxis 
                            stroke="#9CA3AF" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(val) => `$${val/1000}k`}
                       />
                       <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '12px' }}
                            formatter={(val: number) => [`$${val.toLocaleString()}`, 'Total Debt']}
                       />
                       <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="#3B82F6" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorBalance)" 
                       />
                   </AreaChart>
               </ResponsiveContainer>
           </div>
       </div>

       {/* Category Breakdowns */}
       <div>
           <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
               <Landmark size={20} className="text-gray-400" />
               Category Breakdown
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               
               {/* 1. Credit Cards Aggregate Card */}
               <CategoryProgressCard 
                  title="Credit Cards"
                  icon={<CreditCard size={24} />}
                  items={cards}
                  type="Credit"
                  totalDebt={cards.reduce((s,c) => s + c.balance, 0)}
                  periodPaid={Math.round(totalPaidInPeriod * 0.4)} // Mock proportion
                  periodInterest={Math.round(totalInterestPaidInPeriod * 0.6)} // Cards usually higher interest
                  colorTheme="blue"
                  onClick={() => handleCardClick("Credit Cards", cards, "Credit")}
               />

               {/* 2. Individual Loan Category Cards */}
               {Object.entries(loanGroups).map(([category, categoryLoans]) => {
                   // Mock proportional logic for demo visuals
                   const catBalance = categoryLoans.reduce((s,l) => s + l.currentBalance, 0);
                   const balanceRatio = catBalance / (currentTotalDebt || 1); 

                   return (
                       <CategoryProgressCard
                          key={category}
                          title={`${category} Loans`}
                          icon={getCategoryIcon(category)}
                          items={categoryLoans}
                          type="Loan"
                          totalDebt={catBalance}
                          periodPaid={Math.round(totalPaidInPeriod * balanceRatio)}
                          periodInterest={Math.round(totalInterestPaidInPeriod * balanceRatio)}
                          colorTheme={getCategoryColor(category)}
                          onClick={() => handleCardClick(`${category} Loans`, categoryLoans, "Loan")}
                       />
                   )
               })}
           </div>
       </div>

       {/* Detail Modal */}
       {selectedCategory && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg relative overflow-hidden animate-in zoom-in-95 duration-200">
                   <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                       <h3 className="font-bold text-xl text-gray-900">{selectedCategory.title}</h3>
                       <button onClick={() => setSelectedCategory(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors">
                           <X size={18} className="text-gray-600" />
                       </button>
                   </div>
                   <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3">
                       {selectedCategory.items.map((item, idx) => {
                           const balance = 'balance' in item ? item.balance : item.currentBalance;
                           const rate = 'apr' in item ? item.apr : item.rate;
                           
                           return (
                               <div key={item.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                                   <div>
                                       <h4 className="font-bold text-gray-900">{item.name}</h4>
                                       <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                           <span>Balance: ${balance.toLocaleString()}</span>
                                           <span>•</span>
                                           <span>Rate: {rate}%</span>
                                       </div>
                                   </div>
                                   <button 
                                      onClick={() => handleNavigateToItem(item)}
                                      className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                   >
                                       Details <ExternalLink size={12} />
                                   </button>
                               </div>
                           );
                       })}
                   </div>
                   <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                       <button onClick={() => setSelectedCategory(null)} className="text-gray-500 font-bold text-sm hover:text-gray-700">Close</button>
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};

// --- Sub-Component: Category Progress Card ---
interface ProgressCardProps {
    title: string;
    icon: React.ReactNode;
    items: any[];
    type: 'Credit' | 'Loan';
    totalDebt: number;
    periodPaid: number;
    periodInterest: number;
    colorTheme: 'blue' | 'orange' | 'purple' | 'emerald' | 'rose' | 'indigo' | 'cyan';
    onClick?: () => void;
}

const CategoryProgressCard: React.FC<ProgressCardProps> = ({ 
    title, icon, items, type, totalDebt, periodPaid, periodInterest, colorTheme, onClick 
}) => {
    
    // Theme Maps
    const themes = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', bar: 'bg-blue-500', lightBar: 'bg-blue-100' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', bar: 'bg-orange-500', lightBar: 'bg-orange-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', bar: 'bg-purple-500', lightBar: 'bg-purple-100' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', bar: 'bg-emerald-500', lightBar: 'bg-emerald-100' },
        rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', bar: 'bg-rose-500', lightBar: 'bg-rose-100' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', bar: 'bg-indigo-500', lightBar: 'bg-indigo-100' },
        cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', bar: 'bg-cyan-500', lightBar: 'bg-cyan-100' },
    };
    
    const theme = themes[colorTheme] || themes.blue;
    const startBalance = totalDebt + periodPaid; // Reverse calculate start
    const progress = startBalance > 0 ? (periodPaid / startBalance) * 100 : 0;

    return (
        <div 
            onClick={onClick}
            className={`bg-white rounded-[24px] border ${theme.border} p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer`}
        >
             <div className={`absolute top-0 right-0 w-24 h-24 ${theme.bg} rounded-bl-[60px] -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110`}></div>
             
             <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.bg} ${theme.text} shadow-sm`}>
                         {icon}
                     </div>
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${theme.bg} ${theme.text}`}>
                         {items.length} {type === 'Credit' ? 'Cards' : 'Loans'}
                     </span>
                 </div>

                 <h4 className="text-lg font-bold text-gray-900 mb-1">{title}</h4>
                 <p className="text-gray-500 text-xs font-medium mb-5">Current Balance: <strong>${totalDebt.toLocaleString()}</strong></p>

                 <div className="space-y-4">
                     {/* Principal Progress */}
                     <div>
                         <div className="flex justify-between text-xs mb-1.5">
                             <span className="font-bold text-gray-400 uppercase tracking-wide">Principal Paid</span>
                             <span className={`font-bold ${theme.text}`}>${periodPaid.toLocaleString()}</span>
                         </div>
                         <div className={`h-2 w-full ${theme.lightBar} rounded-full overflow-hidden`}>
                             <div className={`h-full ${theme.bar} rounded-full`} style={{ width: `${Math.max(5, progress)}%` }}></div>
                         </div>
                     </div>

                     {/* Interest Stat */}
                     <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                         <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-red-100 text-red-500 rounded-lg">
                                 <TrendingDown size={14} />
                             </div>
                             <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Interest Paid</span>
                         </div>
                         <span className="font-bold text-gray-900 text-sm">${periodInterest.toLocaleString()}</span>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const getCategoryIcon = (cat: string) => {
    switch(cat) {
        case 'Mortgage': return <Home size={24} />;
        case 'Auto': return <Car size={24} />;
        case 'Student': return <GraduationCap size={24} />;
        case 'Medical': return <Stethoscope size={24} />;
        case 'Business': return <Briefcase size={24} />;
        case 'BNPL': return <ShoppingBag size={24} />;
        default: return <Wallet size={24} />;
    }
};

const getCategoryColor = (cat: string) => {
    switch(cat) {
        case 'Mortgage': return 'blue';
        case 'Auto': return 'orange';
        case 'Student': return 'indigo';
        case 'Medical': return 'rose';
        case 'Business': return 'emerald';
        case 'BNPL': return 'cyan';
        default: return 'purple';
    }
};

export default ProgressView;
