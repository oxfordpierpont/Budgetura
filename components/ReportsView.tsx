
import React, { useState, useMemo } from 'react';
import { useDebt } from '../context/DebtContext';
import { 
  BarChart2, PieChart, TrendingUp, DollarSign, Download, 
  ArrowLeft, Calendar, FileText, ArrowUpRight, ArrowDownRight,
  Landmark, CreditCard, Wallet, Activity, ChevronRight, Sparkles,
  Target, Layers, Zap, AlertCircle, TrendingDown, MessageCircle, X,
  Maximize2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, CartesianGrid, Legend,
  ComposedChart, Line, RadialBarChart, RadialBar, PolarAngleAxis, ReferenceLine
} from 'recharts';
import { simulatePayoffPlan } from '../utils/calculations';

type ReportType = 'overview' | 'income-expense' | 'net-worth' | 'debt-projection' | 'cash-flow';
type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

// --- Constants & Styles ---
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-white/20 text-sm ring-1 ring-black/5">
        <p className="font-bold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
            <span className="text-gray-500 font-medium">{entry.name}:</span>
            <span className="font-bold text-gray-900 font-mono">
                {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Component ---
export default function ReportsView() {
  const [currentReport, setCurrentReport] = useState<ReportType>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('year');
  const { settings, cards, loans, bills, accounts, setAIChatState } = useDebt();

  // --- Dynamic Data Generators ---
  
  // 1. Net Worth History (Updated to include Implied Assets)
  const netWorthData = useMemo(() => {
      let points = 12;
      let isDaily = false;
      
      switch(timeRange) {
          case 'week': points = 7; isDaily = true; break;
          case 'month': points = 30; isDaily = true; break;
          case 'quarter': points = 3; isDaily = false; break; // 3 months
          case 'year': points = 12; isDaily = false; break;
          case 'all': points = 24; isDaily = false; break;
      }

      const data = [];
      const now = new Date();
      
      // Calculate Real Assets (Cash)
      const cashAssets = accounts.reduce((s, a) => s + (a.available_balance || a.current_balance), 0);
      
      // Calculate Implied Assets (Property/Vehicle Value Proxy using Original Principal of secured loans)
      const impliedAssets = loans.reduce((sum, loan) => {
          if (['Mortgage', 'Auto', 'Home Equity'].includes(loan.type)) {
              return sum + loan.originalPrincipal;
          }
          return sum;
      }, 0);

      const currentTotalAssets = cashAssets + impliedAssets;
      const currentLiabilities = cards.reduce((s,c) => s + c.balance, 0) + loans.reduce((s,l) => s + l.currentBalance, 0);
      
      for(let i = points - 1; i >= 0; i--) {
          const date = new Date(now);
          if (isDaily) {
              date.setDate(date.getDate() - i);
          } else {
              date.setMonth(date.getMonth() - i);
              date.setDate(1); // First of month for consistency
          }

          // Simulate fluctuations
          // Assets tend to grow slowly (appreciation + savings)
          const multiplierAsset = isDaily ? (i * 0.0005) : (i * 0.005); 
          // Liabilities decrease as we go back in time (meaning they were higher in the past)
          const multiplierLiab = isDaily ? (i * 0.001) : (i * 0.01);

          // We are looking back 'i' periods ago. 
          // Past Assets = Current * (1 - growth)
          const mockAsset = currentTotalAssets * (1 - multiplierAsset); 
          // Past Liabilities = Current * (1 + paydown)
          const mockLiab = currentLiabilities * (1 + multiplierLiab); 
          
          data.push({
              month: date.toLocaleDateString('en-US', { month: 'short', day: isDaily ? 'numeric' : undefined }),
              Assets: Math.round(mockAsset),
              Liabilities: Math.round(mockLiab),
              NetWorth: Math.round(mockAsset - mockLiab)
          });
      }
      return data;
  }, [accounts, cards, loans, timeRange]);

  // 2. Income vs Expenses
  const incomeExpenseData = useMemo(() => {
      let points = 6; // Default
      let isDaily = false;

      switch(timeRange) {
          case 'week': points = 7; isDaily = true; break;
          case 'month': points = 30; isDaily = true; break;
          case 'quarter': points = 3; isDaily = false; break;
          case 'year': points = 12; isDaily = false; break;
          case 'all': points = 24; isDaily = false; break;
      }

      const data = [];
      const now = new Date();
      // Adjust base amounts for daily vs monthly view
      const baseIncome = isDaily ? settings.monthlyIncome / 30 : settings.monthlyIncome;
      const baseExpense = isDaily 
        ? (bills.reduce((s,b) => s + b.amount, 0) + cards.reduce((s,c) => s + c.minimumPayment, 0) + loans.reduce((s,l) => s + l.monthlyPayment, 0)) / 30 
        : (bills.reduce((s,b) => s + b.amount, 0) + cards.reduce((s,c) => s + c.minimumPayment, 0) + loans.reduce((s,l) => s + l.monthlyPayment, 0));

      for(let i = points - 1; i >= 0; i--) {
          const date = new Date(now);
          if (isDaily) {
              date.setDate(date.getDate() - i);
          } else {
              date.setMonth(date.getMonth() - i);
          }

          const variance = isDaily ? 0.5 : 0.1; // Higher variance daily
          const income = baseIncome + (Math.random() * (baseIncome * variance * 2) - (baseIncome * variance)); 
          const expense = baseExpense + (Math.random() * (baseExpense * variance * 2) - (baseExpense * variance)); 
          const savings = income - expense;
          const rate = income > 0 ? (savings / income) * 100 : 0;
          
          data.push({
              month: date.toLocaleDateString('en-US', { month: 'short', day: isDaily ? 'numeric' : undefined }),
              Income: Math.round(income),
              Expenses: Math.round(expense),
              Savings: Math.round(savings),
              SavingsRate: Math.round(rate)
          });
      }
      return data;
  }, [settings, bills, cards, loans, timeRange]);

  // 3. Category Breakdown (Pie)
  const categoryData = useMemo(() => {
      const cats: Record<string, number> = {};
      bills.forEach(b => cats[b.category] = (cats[b.category] || 0) + b.amount);
      const debtPayments = cards.reduce((s,c) => s + c.minimumPayment, 0) + loans.reduce((s,l) => s + l.monthlyPayment, 0);
      cats['Debt Repayment'] = debtPayments;
      
      return Object.entries(cats)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);
  }, [bills, cards, loans]);

  // --- Handlers ---
  const handleAskAI = (prompt: string) => {
      setAIChatState({ isOpen: true, initialMessage: prompt });
  };

  const renderContent = () => {
      switch(currentReport) {
          case 'overview': return <OverviewDashboard onSelect={setCurrentReport} netWorthData={netWorthData} incomeData={incomeExpenseData} onAskAI={handleAskAI} timeRange={timeRange} />;
          case 'income-expense': return <IncomeExpenseReport data={incomeExpenseData} categories={categoryData} onClose={() => setCurrentReport('overview')} onAskAI={handleAskAI} />;
          case 'net-worth': return <NetWorthReport data={netWorthData} onClose={() => setCurrentReport('overview')} onAskAI={handleAskAI} />;
          case 'debt-projection': return <DebtProjectionReport onClose={() => setCurrentReport('overview')} onAskAI={handleAskAI} />;
          case 'cash-flow': return <CashFlowReport data={incomeExpenseData} onClose={() => setCurrentReport('overview')} onAskAI={handleAskAI} />;
          default: return <OverviewDashboard onSelect={setCurrentReport} netWorthData={netWorthData} incomeData={incomeExpenseData} onAskAI={handleAskAI} timeRange={timeRange} />;
      }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-300 flex flex-col">
       {/* Global Header & Filters (Persistent) */}
       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0">
           <div>
               <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                   Reports & Analytics
               </h1>
               <p className="text-gray-500 mt-1 font-medium ml-1">
                   {currentReport === 'overview' 
                    ? 'Deep dive into your financial health with AI-driven insights.' 
                    : 'Detailed breakdown and historical trends.'}
               </p>
           </div>
           
           <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex items-center overflow-x-auto max-w-full no-scrollbar">
                    {(['week', 'month', 'quarter', 'year', 'all'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-2 md:px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                timeRange === range 
                                ? 'bg-gray-900 text-white shadow-md' 
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {range === 'all' ? 'All Time' : `This ${range}`}
                        </button>
                    ))}
                </div>
                {currentReport === 'overview' && (
                    <button onClick={() => alert("Report downloaded!")} className="hidden sm:flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-black/20 hover:bg-gray-800 transition-all active:scale-95 whitespace-nowrap">
                        <Download size={16} /> Export
                    </button>
                )}
           </div>
       </div>

       <div className="flex-1 min-h-0">
          {renderContent()}
       </div>
    </div>
  );
}

// --- Overview Dashboard ---

const OverviewDashboard = ({ onSelect, netWorthData, incomeData, onAskAI, timeRange }: { onSelect: (r: ReportType) => void, netWorthData: any[], incomeData: any[], onAskAI: (msg: string) => void, timeRange: TimeRange }) => {
    
    // Derived Metrics for Summary
    const latestIncome = incomeData[incomeData.length - 1];
    const savingsRate = latestIncome?.SavingsRate || 0;
    const netWorthCurrent = netWorthData[netWorthData.length - 1]?.NetWorth || 0;
    const netWorthTrend = netWorthCurrent > (netWorthData[0]?.NetWorth || 0) ? 'up' : 'down';
    const averageSurplus = Math.round(incomeData.reduce((s,d)=>s+d.Savings,0)/incomeData.length);

    // AI Brief Generation
    const briefTitle = savingsRate > 10 ? "Solid accumulation phase." : savingsRate < 0 ? "Spending exceeds income." : "Cash flow is tight.";
    const briefText = `Your net worth is trending ${netWorthTrend === 'up' ? 'upward' : 'downward'} over the selected period. You maintained an average savings rate of ${savingsRate}% recently. ${savingsRate < 5 && savingsRate >= 0 ? "Focusing on reducing top discretionary categories could boost your liquidity." : ""}${netWorthTrend === 'up' ? " Your debt pay-down strategy is effectively increasing your equity." : ""}`;

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
            {/* AI Executive Brief */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-[32px] p-1 shadow-2xl shadow-indigo-500/20">
                <div className="bg-white/10 backdrop-blur-xl rounded-[28px] p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                        <div className="p-3.5 bg-white rounded-2xl text-indigo-600 shadow-lg shrink-0">
                            <Sparkles size={28} className="animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-white font-bold text-lg tracking-wide uppercase opacity-80 text-[10px] md:text-xs">Executive Brief</h3>
                                <button onClick={() => onAskAI("Analyze my financial reports and give me a summary.")} className="text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                                    <MessageCircle size={14} /> Ask Budgetura
                                </button>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                                {briefTitle}
                            </h2>
                            <p className="text-indigo-100 text-sm md:text-base leading-relaxed max-w-2xl">
                                {briefText}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid of Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Income vs Expenses */}
                <div onClick={() => onSelect('income-expense')} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <BarChart2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 leading-none">Income & Expenses</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">{timeRange === 'week' || timeRange === 'month' ? 'Daily' : 'Monthly'} Savings Rate: <span className={`font-bold ${savingsRate < 0 ? 'text-red-500' : 'text-blue-600'}`}>{savingsRate}%</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-xs font-bold group-hover:bg-blue-100 transition-colors">
                            Expand <Maximize2 size={12} className="ml-1" />
                        </div>
                    </div>
                    <div className="relative z-10 mt-auto">
                        <div className="bg-blue-50/50 rounded-xl p-2 mb-3">
                            <p className="text-xs text-blue-700 font-medium text-center">
                                You saved <span className="font-bold">{savingsRate}%</span> of income this period.
                            </p>
                        </div>
                        <div className="h-24 w-full">
                            <ResponsiveContainer>
                                <BarChart data={incomeData.slice(-10)}>
                                    <Bar dataKey="Income" fill="#3B82F6" radius={[2,2,0,0]} />
                                    <Bar dataKey="Expenses" fill="#E5E7EB" radius={[2,2,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 2. Net Worth */}
                <div onClick={() => onSelect('net-worth')} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Landmark size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 leading-none">Net Worth</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Trend: <span className={netWorthTrend === 'up' ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>{netWorthTrend === 'up' ? 'Upward' : 'Downward'}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold group-hover:bg-emerald-100 transition-colors">
                            Expand <Maximize2 size={12} className="ml-1" />
                        </div>
                    </div>
                    <div className="relative z-10 mt-auto">
                        <div className="bg-emerald-50/50 rounded-xl p-2 mb-3">
                            <p className="text-xs text-emerald-700 font-medium text-center">
                                {netWorthTrend === 'up' ? 'Assets grew vs previous period.' : 'Liabilities increased slightly.'}
                            </p>
                        </div>
                        <div className="h-24 w-full">
                            <ResponsiveContainer>
                                <AreaChart data={netWorthData.slice(-10)}>
                                    <Area type="monotone" dataKey="NetWorth" stroke="#10B981" fill="#D1FAE5" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 3. Debt Projection */}
                <div onClick={() => onSelect('debt-projection')} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Target size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 leading-none">Debt Projection</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Status: <span className="text-purple-600 font-bold">On Track</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-lg text-xs font-bold group-hover:bg-purple-100 transition-colors">
                            Expand <Maximize2 size={12} className="ml-1" />
                        </div>
                    </div>
                    <div className="relative z-10 mt-auto">
                        <div className="bg-purple-50/50 rounded-xl p-2 mb-3">
                            <p className="text-xs text-purple-700 font-medium text-center">
                                Payoff estimated for <span className="font-bold">March 2026</span>.
                            </p>
                        </div>
                        <div className="h-24 w-full flex items-end justify-between px-2 pb-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                             <div className="w-2 bg-purple-200 h-4 rounded-t"></div>
                             <div className="w-2 bg-purple-300 h-6 rounded-t"></div>
                             <div className="w-2 bg-purple-400 h-8 rounded-t"></div>
                             <div className="w-2 bg-purple-500 h-12 rounded-t"></div>
                             <div className="w-2 bg-purple-600 h-10 rounded-t"></div>
                             <div className="w-2 bg-purple-300 h-6 rounded-t"></div>
                        </div>
                    </div>
                </div>

                {/* 4. Cash Flow */}
                <div onClick={() => onSelect('cash-flow')} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 leading-none">Cash Flow</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Surplus: <span className="text-orange-600 font-bold">${averageSurplus}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg text-xs font-bold group-hover:bg-orange-100 transition-colors">
                            Expand <Maximize2 size={12} className="ml-1" />
                        </div>
                    </div>
                    <div className="relative z-10 mt-auto">
                        <div className="bg-orange-50/50 rounded-xl p-2 mb-3">
                            <p className="text-xs text-orange-700 font-medium text-center">
                                Monthly surplus averages <span className="font-bold">${averageSurplus}</span>.
                            </p>
                        </div>
                        <div className="h-24 w-full">
                            <ResponsiveContainer>
                                <BarChart data={incomeData.slice(-10)}>
                                    <Bar dataKey="Savings" fill="#F97316" radius={[2,2,2,2]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Reusable Detail Header ---
const DetailHeader = ({ title, summary, onClose }: { title: string, summary: string, onClose: () => void }) => (
    <div className="mb-6 border-b border-gray-100 pb-6">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            <button 
                onClick={onClose} 
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors hover:rotate-90 duration-200"
                title="Collapse to Dashboard"
            >
                <X size={24} />
            </button>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded-lg text-blue-600 mt-0.5 shrink-0">
                <FileText size={16} />
            </div>
            <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Key Insight</p>
                <p className="text-sm text-blue-900 leading-relaxed font-medium">{summary}</p>
            </div>
        </div>
    </div>
);

// --- Income vs Expense Deep Dive ---

const IncomeExpenseReport = ({ data, categories, onClose, onAskAI }: { data: any[], categories: any[], onClose: () => void, onAskAI: (m: string) => void }) => {
    const avgSavingsRate = Math.round(data.reduce((s,d)=>s+d.SavingsRate,0)/data.length);
    const summaryText = `Over the selected period, you've saved an average of ${avgSavingsRate}% of your income. Your largest spending category is ${categories[0]?.name}, accounting for a significant portion of outflows.`;

    const rateColorBg = avgSavingsRate >= 0 ? 'bg-emerald-50' : 'bg-red-50';
    const rateColorBorder = avgSavingsRate >= 0 ? 'border-emerald-100' : 'border-red-100';
    const rateColorTextLabel = avgSavingsRate >= 0 ? 'text-emerald-600' : 'text-red-600';
    const rateColorTextValue = avgSavingsRate >= 0 ? 'text-emerald-700' : 'text-red-700';

    return (
        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 animate-in zoom-in-95 duration-200">
            <DetailHeader title="Income vs Expenses" summary={summaryText} onClose={onClose} />

            <div className="space-y-8">
                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Monthly Income</p>
                        <p className="text-2xl font-black text-gray-900 mt-2">${Math.round(data.reduce((s,d)=>s+d.Income,0)/data.length).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Monthly Expense</p>
                        <p className="text-2xl font-black text-gray-900 mt-2">${Math.round(data.reduce((s,d)=>s+d.Expenses,0)/data.length).toLocaleString()}</p>
                    </div>
                    <div className={`${rateColorBg} p-6 rounded-[24px] border ${rateColorBorder}`}>
                        <p className={`text-xs font-bold ${rateColorTextLabel} uppercase tracking-wider`}>Avg Savings Rate</p>
                        <p className={`text-2xl font-black ${rateColorTextValue} mt-2`}>{avgSavingsRate}%</p>
                    </div>
                </div>

                {/* Main Composed Chart */}
                <div className="bg-white rounded-[24px] border border-gray-100 p-6 relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900">Flow Analysis</h3>
                        <button onClick={() => onAskAI("Analyze my income vs expenses chart. Am I overspending?")} className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-xl hover:bg-purple-100 transition-colors">
                            <Sparkles size={14} /> AI Analysis
                        </button>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer>
                            <ComposedChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                <Tooltip content={<CustomTooltip formatter={(val: any) => val > 100 ? `$${val.toLocaleString()}` : `${val}%`} />} cursor={{fill: '#F9FAFB'}} />
                                <Legend wrapperStyle={{paddingTop: '20px'}} />
                                <Bar yAxisId="left" dataKey="Income" fill="#3B82F6" name="Income ($)" radius={[4,4,0,0]} barSize={20} />
                                <Bar yAxisId="left" dataKey="Expenses" fill="#E5E7EB" name="Expenses ($)" radius={[4,4,0,0]} barSize={20} />
                                <Line yAxisId="right" type="monotone" dataKey="SavingsRate" stroke="#10B981" strokeWidth={3} name="Savings Rate (%)" dot={{r: 4, fill: '#10B981'}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-64 w-full relative">
                        <h4 className="font-bold text-gray-900 mb-4 text-center">Expense Composition</h4>
                        <ResponsiveContainer>
                            <RePieChart>
                                <Pie data={categories} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {categories.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />} />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 top-8 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-gray-400 font-bold uppercase">Top Category</span>
                            <span className="text-sm font-black text-gray-900 truncate max-w-[100px]">{categories[0]?.name}</span>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 overflow-y-auto max-h-64 custom-scrollbar">
                        <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide px-2">Top Spends</h4>
                        <div className="space-y-2">
                            {categories.map((cat, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                        <span className="font-bold text-gray-700 text-sm">{cat.name}</span>
                                    </div>
                                    <span className="font-mono font-medium text-gray-900 text-sm">${cat.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Net Worth Report ---

const NetWorthReport = ({ data, onClose, onAskAI }: { data: any[], onClose: () => void, onAskAI: (m: string) => void }) => {
    const current = data[data.length - 1];
    const start = data[0];
    const assets = current?.Assets || 0;
    const liabilities = current?.Liabilities || 0;
    const netWorthValue = assets - liabilities; // Calculated explicit value
    const ratio = assets > 0 ? (liabilities / assets) * 100 : 0;
    const growth = current.NetWorth - start.NetWorth;
    const summaryText = `Your net worth has ${growth >= 0 ? 'grown' : 'declined'} by $${Math.abs(growth).toLocaleString()} over the selected period. Your debt-to-asset ratio is currently ${ratio.toFixed(1)}%.`;

    // Configuration for Gauge
    const gaugeValue = Math.min(ratio, 100);
    const gaugeColor = ratio > 60 ? '#EF4444' : ratio > 30 ? '#F59E0B' : '#10B981';
    
    const gaugeData = [
        { name: 'Ratio', value: gaugeValue, fill: gaugeColor },
        { name: 'Max', value: 100 - gaugeValue, fill: '#E5E7EB' }
    ];

    return (
        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 animate-in zoom-in-95 duration-200">
            <DetailHeader title="Net Worth Analysis" summary={summaryText} onClose={onClose} />

            <div className="space-y-8">
                {/* 1. Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Total Assets (Est.)</p>
                            <p className="text-3xl font-black text-blue-900 mt-2">${assets.toLocaleString()}</p>
                            <p className="text-[10px] text-blue-400 mt-1 font-medium">Includes Cash & Property</p>
                        </div>
                    </div>
                    <div className="bg-red-50 p-6 rounded-[24px] border border-red-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-wide">Total Liabilities</p>
                            <p className="text-3xl font-black text-red-900 mt-2">${liabilities.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className={`${netWorthValue >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} p-6 rounded-[24px] border relative overflow-hidden`}>
                        <div className="relative z-10">
                            <p className={`text-xs font-bold ${netWorthValue >= 0 ? 'text-emerald-600' : 'text-red-500'} uppercase tracking-wide`}>Net Worth</p>
                            <p className={`text-3xl font-black ${netWorthValue >= 0 ? 'text-emerald-900' : 'text-red-900'} mt-2`}>${netWorthValue.toLocaleString()}</p>
                            <div className="flex items-center gap-1 mt-1">
                                {growth >= 0 ? <TrendingUp size={12} className={netWorthValue >= 0 ? "text-emerald-600" : "text-emerald-700"}/> : <TrendingDown size={12} className="text-red-500"/>}
                                <span className={`text-[10px] font-bold ${growth >= 0 ? (netWorthValue >= 0 ? 'text-emerald-600' : 'text-emerald-700') : 'text-red-500'}`}>
                                    {growth >= 0 ? '+' : ''}{growth.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Side-by-Side Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Trend Chart (Takes up 2 cols) */}
                    <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[24px] p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-900">Wealth Trend</h3>
                            <button onClick={() => onAskAI("How can I improve my Debt-to-Asset ratio?")} className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-xl hover:bg-purple-100 transition-colors">
                                <Sparkles size={14} /> Strategy
                            </button>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer>
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorNW" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                                    <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />} />
                                    <Area type="monotone" dataKey="NetWorth" stroke="#10B981" strokeWidth={3} fill="url(#colorNW)" name="Net Worth" />
                                    <Area type="monotone" dataKey="Liabilities" stroke="#EF4444" strokeWidth={2} fill="transparent" strokeDasharray="5 5" name="Total Debt" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right: Leverage Health (Gauge) */}
                    <div className="bg-gray-50 border border-gray-100 rounded-[24px] p-6 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="w-full flex justify-between items-start mb-2 relative z-10">
                            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Leverage Health</h3>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ratio > 60 ? 'bg-red-100 text-red-600' : ratio > 30 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {ratio > 60 ? 'High Risk' : ratio > 30 ? 'Moderate' : 'Healthy'}
                            </span>
                        </div>
                        
                        <div className="relative w-full aspect-square max-w-[220px] max-h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart 
                                    innerRadius="70%" 
                                    outerRadius="100%" 
                                    barSize={20} 
                                    data={gaugeData} 
                                    startAngle={90} 
                                    endAngle={-270}
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                    <RadialBar
                                        background
                                        dataKey="value"
                                        cornerRadius={10}
                                        fill={gaugeColor}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Debt / Asset</span>
                                <span className="text-4xl font-black text-gray-900">{ratio.toFixed(1)}%</span>
                            </div>
                        </div>
                        
                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                                Keep this ratio below 30% for optimal financial health.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- Debt Projection Report ---

const DebtProjectionReport = ({ onClose, onAskAI }: { onClose: () => void, onAskAI: (m: string) => void }) => {
    const { cards, loans } = useDebt();
    const [extraPayment, setExtraPayment] = useState(500);

    const data = useMemo(() => {
        const allDebts = [...cards, ...loans];
        const baseline = simulatePayoffPlan(allDebts, 0, 'avalanche');
        const accelerated = simulatePayoffPlan(allDebts, extraPayment, 'avalanche');
        
        const maxLen = Math.max(baseline.timeline.length, accelerated.timeline.length);
        const chartData = [];
        for(let i=0; i<maxLen; i+=2) { 
            const b = baseline.timeline.find(t => t.month === i);
            const a = accelerated.timeline.find(t => t.month === i);
            if (b || a) {
                chartData.push({
                    month: i,
                    Baseline: b ? Math.round(b.totalBalance) : 0,
                    Accelerated: a ? Math.round(a.totalBalance) : 0
                });
            }
        }
        return { 
            chart: chartData, 
            baselineInterest: baseline.totalInterest, 
            accInterest: accelerated.totalInterest,
            timeSaved: Math.max(0, baseline.timeline.length - accelerated.timeline.length)
        };
    }, [cards, loans, extraPayment]);

    const summaryText = `By adding $${extraPayment} to your monthly payments, you could save $${Math.round(data.baselineInterest - data.accInterest).toLocaleString()} in interest and be debt-free ${data.timeSaved} months sooner.`;

    return (
        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 animate-in zoom-in-95 duration-200">
            <DetailHeader title="Debt Projection Lab" summary={summaryText} onClose={onClose} />

            <div className="space-y-6">
                {/* Interactive Simulation Header */}
                <div className="bg-indigo-900 text-white p-8 rounded-[24px] shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8 items-center">
                        <div className="w-full lg:w-1/2">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Target className="text-indigo-300" /> Simulation Controls</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-bold">
                                    <span>Monthly Extra Payment</span>
                                    <span className="bg-indigo-700 px-2 py-1 rounded text-white">+${extraPayment}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="2000" 
                                    step="50" 
                                    value={extraPayment} 
                                    onChange={(e) => setExtraPayment(parseInt(e.target.value))} 
                                    className="w-full h-2 bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-white"
                                />
                                <div className="flex justify-between text-xs text-indigo-400 font-medium"><span>$0</span><span>$2,000</span></div>
                            </div>
                        </div>

                        <div className="w-full lg:w-auto grid grid-cols-2 gap-6 lg:gap-12 text-center lg:text-left">
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                                <p className="text-indigo-300 text-xs font-bold uppercase tracking-wide">Interest Saved</p>
                                <p className="text-2xl font-black text-emerald-300 mt-1">${Math.round(data.baselineInterest - data.accInterest).toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                                <p className="text-indigo-300 text-xs font-bold uppercase tracking-wide">Time Saved</p>
                                <p className="text-2xl font-black text-white mt-1">{data.timeSaved} <span className="text-sm font-bold text-indigo-300">Mos</span></p>
                            </div>
                        </div>
                    </div>
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
                </div>

                <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-lg text-gray-900">Projected Balance Decline</h3>
                        <div className="flex gap-4 text-xs font-bold">
                            <span className="flex items-center gap-2 text-gray-500"><div className="w-2 h-2 rounded-full bg-gray-300"></div> Min Payments</span>
                            <span className="flex items-center gap-2 text-indigo-600"><div className="w-2 h-2 rounded-full bg-indigo-600"></div> Accelerated</span>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer>
                            <AreaChart data={data.chart}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(m) => `Mo ${m}`} />
                                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                                <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />} />
                                <Area type="monotone" dataKey="Baseline" stroke="#9CA3AF" strokeWidth={2} fill="#E5E7EB" name="Baseline" />
                                <Area type="monotone" dataKey="Accelerated" stroke="#4F46E5" strokeWidth={3} fill="rgba(79, 70, 229, 0.1)" name="With Extra" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Cash Flow Report ---

const CashFlowReport = ({ data, onClose, onAskAI }: { data: any[], onClose: () => void, onAskAI: (m: string) => void }) => {
    // Calculations
    const avgSurplus = Math.round(data.reduce((s, d) => s + d.Savings, 0) / data.length);
    const totalAccumulated = data.reduce((s, d) => s + d.Savings, 0);
    const bestMonth = [...data].sort((a, b) => b.Savings - a.Savings)[0];
    const positiveMonths = data.filter(d => d.Savings > 0).length;
    
    const summaryText = `You have an average monthly surplus of $${avgSurplus.toLocaleString()}. This positive cash flow indicates capacity to accelerate debt repayment or increase investments.`;

    return (
        <div className="bg-white p-4 md:p-8 rounded-[32px] shadow-sm border border-gray-100 animate-in zoom-in-95 duration-200">
            <DetailHeader title="Cash Flow Monitor" summary={summaryText} onClose={onClose} />

            <div className="space-y-6 md:space-y-8">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className={`p-6 rounded-[24px] border ${avgSurplus >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider ${avgSurplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Avg Monthly Net</p>
                        <p className={`text-2xl md:text-3xl font-black mt-2 ${avgSurplus >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                            {avgSurplus >= 0 ? '+' : ''}${avgSurplus.toLocaleString()}
                        </p>
                        <p className={`text-[10px] font-bold mt-1 ${avgSurplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {positiveMonths} / {data.length} Positive Months
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden">
                         <div className="relative z-10">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Accumulation</p>
                            <p className="text-2xl md:text-3xl font-black text-gray-900 mt-2">
                                {totalAccumulated >= 0 ? '+' : ''}${totalAccumulated.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">Net change over period</p>
                         </div>
                         <div className="absolute top-0 right-0 p-4 opacity-10">
                             <Wallet size={64} className="text-blue-500" />
                         </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Best Performance</p>
                        <div className="mt-2">
                            <p className="text-xl md:text-2xl font-black text-blue-900">+${bestMonth?.Savings.toLocaleString()}</p>
                            <p className="text-xs font-bold text-blue-500 uppercase mt-0.5">{bestMonth?.month}</p>
                        </div>
                    </div>
                </div>

                {/* Main Chart */}
                <div className="bg-gray-50 p-4 md:p-6 rounded-[24px] border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">Monthly Surplus / Deficit</h3>
                            <p className="text-sm text-gray-500">Green indicates positive liquidity.</p>
                        </div>
                        <button onClick={() => onAskAI("Analyze my cash flow volatility and suggest a buffer amount.")} className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-xl hover:bg-orange-100 transition-colors w-full sm:w-auto justify-center">
                            <Sparkles size={14} /> Analyze Volatility
                        </button>
                    </div>
                    <div className="h-64 md:h-80 w-full">
                        <ResponsiveContainer>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />} cursor={{fill: '#F9FAFB'}} />
                                <ReferenceLine y={0} stroke="#9CA3AF" />
                                <Bar dataKey="Savings" name="Net Cash Flow" radius={[4,4,4,4]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.Savings >= 0 ? '#10B981' : '#EF4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Breakdown List */}
                <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-4 px-2">Flow History</h3>
                    <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-sm">
                        <div className="hidden md:grid grid-cols-4 bg-gray-50/80 p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <div>Month</div>
                            <div className="text-right">Income</div>
                            <div className="text-right">Expenses</div>
                            <div className="text-right">Net Flow</div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {[...data].reverse().map((item, idx) => (
                                <div key={idx} className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-center hover:bg-gray-50 transition-colors">
                                    <div className="font-bold text-gray-900 text-sm">{item.month}</div>
                                    
                                    {/* Mobile Layout Adjustment: Labels inline */}
                                    <div className="text-right md:text-right">
                                        <span className="md:hidden text-[10px] text-gray-400 font-bold uppercase mr-2">In</span>
                                        <span className="text-sm text-gray-600 font-medium">${item.Income.toLocaleString()}</span>
                                    </div>
                                    <div className="text-right md:text-right">
                                        <span className="md:hidden text-[10px] text-gray-400 font-bold uppercase mr-2">Out</span>
                                        <span className="text-sm text-gray-600 font-medium">${item.Expenses.toLocaleString()}</span>
                                    </div>
                                    <div className="text-right md:text-right col-span-2 md:col-span-1 border-t md:border-none pt-2 md:pt-0 mt-2 md:mt-0">
                                        <span className="md:hidden text-[10px] text-gray-400 font-bold uppercase mr-2">Net</span>
                                        <span className={`text-sm font-bold px-2 py-1 rounded ${item.Savings >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {item.Savings >= 0 ? '+' : ''}${item.Savings.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
