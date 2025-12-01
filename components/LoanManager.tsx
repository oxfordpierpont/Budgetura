
import React, { useState, useMemo } from 'react';
import { useDebt } from '../context/DebtContext';
import { 
  Plus, Trash2, Wallet, Car, GraduationCap, Home, Percent, Calendar, 
  TrendingUp, ShieldCheck, Flame, ChevronDown, ChevronUp, Sparkles, 
  Clock, ArrowRight, Edit2, History, X, SlidersHorizontal, DollarSign,
  Landmark, ArrowUpDown, MessageCircle, ArrowDown, ArrowUp, PiggyBank,
  CalendarCheck, Coins, Hash, FileText, Zap, Building2, MapPin, Briefcase, HeartPulse,
  ShoppingBag, Stethoscope, Users
} from 'lucide-react';
import { Loan, LoanHistory, LoanStatus, LoanCategory } from '../types';
import { generateAmortizationSchedule } from '../utils/calculations';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Styling Helpers ---
const getLoanStyles = (type: string) => {
    switch(type) {
        case 'Auto': return { 
            bg: 'bg-orange-50', text: 'text-orange-700', border: 'hover:border-orange-200', 
            iconBg: 'bg-orange-100', iconColor: 'text-orange-600', 
            shadow: 'hover:shadow-orange-500/10', accent: 'bg-orange-500',
            gradient: 'from-orange-500 to-red-500'
        };
        case 'Student': return { 
            bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'hover:border-indigo-200', 
            iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', 
            shadow: 'hover:shadow-indigo-500/10', accent: 'bg-indigo-500',
            gradient: 'from-indigo-500 to-purple-500'
        };
        case 'Mortgage': return { 
            bg: 'bg-blue-50', text: 'text-blue-700', border: 'hover:border-blue-200', 
            iconBg: 'bg-blue-100', iconColor: 'text-blue-600', 
            shadow: 'hover:shadow-blue-500/10', accent: 'bg-blue-500',
            gradient: 'from-blue-500 to-cyan-500'
        };
        case 'Medical': return { 
            bg: 'bg-rose-50', text: 'text-rose-700', border: 'hover:border-rose-200', 
            iconBg: 'bg-rose-100', iconColor: 'text-rose-600', 
            shadow: 'hover:shadow-rose-500/10', accent: 'bg-rose-500',
            gradient: 'from-rose-500 to-pink-500'
        };
        case 'Business': return { 
            bg: 'bg-slate-50', text: 'text-slate-700', border: 'hover:border-slate-200', 
            iconBg: 'bg-slate-100', iconColor: 'text-slate-600', 
            shadow: 'hover:shadow-slate-500/10', accent: 'bg-slate-500',
            gradient: 'from-slate-500 to-gray-500'
        };
        case 'Family': return { 
            bg: 'bg-purple-50', text: 'text-purple-700', border: 'hover:border-purple-200', 
            iconBg: 'bg-purple-100', iconColor: 'text-purple-600', 
            shadow: 'hover:shadow-purple-500/10', accent: 'bg-purple-500',
            gradient: 'from-purple-500 to-fuchsia-500'
        };
        default: return { 
            bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'hover:border-emerald-200', 
            iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', 
            shadow: 'hover:shadow-emerald-500/10', accent: 'bg-emerald-500',
            gradient: 'from-emerald-500 to-teal-500'
        };
    }
};

const getIcon = (type: string) => {
    switch(type) {
        case 'Auto': return <Car size={24} />;
        case 'Student': return <GraduationCap size={24} />;
        case 'Mortgage': return <Home size={24} />;
        case 'Home Equity': return <Home size={24} />;
        case 'Medical': return <Stethoscope size={24} />;
        case 'Business': return <Briefcase size={24} />;
        case 'Family': return <Users size={24} />;
        case 'BNPL': return <ShoppingBag size={24} />;
        default: return <Landmark size={24} />;
    }
};

const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

type SortOption = 'balance' | 'rate' | 'payment' | 'name';

const LoanManager = () => {
  const { loans, addLoan, deleteLoan, updateLoan, setAIChatState } = useDebt();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Loan | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('balance');

  // --- Aggregate Metrics ---
  const totalBalance = loans.reduce((sum, l) => sum + l.currentBalance, 0);
  const totalOriginal = loans.reduce((sum, l) => sum + l.originalPrincipal, 0);
  
  const weightedRate = totalBalance > 0 
    ? loans.reduce((sum, l) => sum + (l.rate * l.currentBalance), 0) / totalBalance 
    : 0;

  const totalPaidOff = totalOriginal - totalBalance;
  const progressPercent = totalOriginal > 0 ? (totalPaidOff / totalOriginal) * 100 : 0;

  const totalMinimumDue = loans.reduce((sum, l) => sum + l.monthlyPayment, 0);
  const totalExtraCommitted = loans.reduce((sum, l) => sum + (l.extraPayment || 0), 0);
  const totalDue = totalMinimumDue + totalExtraCommitted;

  const nextDueLoan = loans.length > 0 ? [...loans].sort((a, b) => (a.dueDate || 32) - (b.dueDate || 32))[0] : null;
  const today = new Date();
  const nextDueDate = new Date();
  if (nextDueLoan && nextDueLoan.dueDate) {
     if (nextDueLoan.dueDate < today.getDate()) {
         nextDueDate.setMonth(nextDueDate.getMonth() + 1);
     }
     nextDueDate.setDate(nextDueLoan.dueDate);
  } else {
     nextDueDate.setDate(nextDueDate.getDate() + 7); 
  }
  const formattedDueDate = nextDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const nextDueLabel = nextDueLoan ? `Due (${nextDueLoan.name.split(' ')[0]})` : 'Next Payment';

  const totalLifetimeCost = useMemo(() => {
    return loans.reduce((acc, loan) => {
        const stdSchedule = generateAmortizationSchedule(loan.currentBalance, loan.rate, loan.termMonths, loan.monthlyPayment);
        const stdInterest = stdSchedule.reduce((s, r) => s + r.interest, 0);
        return acc + loan.currentBalance + stdInterest;
    }, 0);
  }, [loans]);
  
  const estimatedTotalInterest = totalLifetimeCost - totalBalance;

  const sortedLoans = useMemo(() => {
      return [...loans].sort((a, b) => {
          switch(sortBy) {
              case 'balance': return b.currentBalance - a.currentBalance;
              case 'rate': return b.rate - a.rate;
              case 'payment': return b.monthlyPayment - a.monthlyPayment;
              case 'name': return a.name.localeCompare(b.name);
              default: return 0;
          }
      });
  }, [loans, sortBy]);

  const handleUpdateLoan = (updated: Loan) => {
      if(editingLoan) {
          const historyEntry: LoanHistory = {
              date: new Date().toISOString(),
              balance: editingLoan.currentBalance,
              rate: editingLoan.rate,
              monthlyPayment: editingLoan.monthlyPayment
          };

          const hasChanged = editingLoan.currentBalance !== updated.currentBalance ||
                             editingLoan.rate !== updated.rate ||
                             editingLoan.monthlyPayment !== updated.monthlyPayment;
          
          const finalHistory = hasChanged
            ? [historyEntry, ...(editingLoan.history || [])]
            : (editingLoan.history || []);

          updateLoan(updated.id, { ...updated, history: finalHistory });
          setEditingLoan(null);
      }
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Loan Manager</h1>
            <p className="text-gray-500 mt-1 font-medium">Track mortgages, auto loans, student debt, and more.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="group flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
             <Plus size={16} /> 
          </div>
          Add New Loan
        </button>
      </div>

      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Principal */}
          <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-blue-100 opacity-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                      <Wallet size={24} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase bg-blue-50 text-blue-600">Principal</span>
              </div>
              <div className="relative z-10">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Outstanding</p>
                  <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-black text-gray-900 tracking-tight">${totalBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                      <span>Progress</span>
                      <span>{progressPercent.toFixed(1)}% Paid</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden p-0.5">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm bg-blue-500" style={{ width: `${Math.min(progressPercent, 100)}%` }}></div>
                  </div>
              </div>
          </div>
          
          {/* Card 2: Monthly Commitments */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100/50 relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-500"><Calendar size={24} /></div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-sm"><span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Monthly Fix</span></div>
              </div>
              <div className="relative z-10">
                  <p className="text-indigo-800/80 text-xs font-bold uppercase tracking-widest mb-1">Total Obligations</p>
                  <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-black text-gray-900 tracking-tight">${totalMinimumDue.toLocaleString()}</span>
                      <span className="text-sm font-bold text-indigo-600/70">/mo</span>
                  </div>
                  <p className="text-xs font-semibold text-indigo-900/60 leading-relaxed mb-4">Est. Remaining Interest: <strong className="text-indigo-900">${Math.round(estimatedTotalInterest).toLocaleString()}</strong></p>
              </div>
          </div>

          {/* Card 3: Avg Rate */}
          <div className="bg-emerald-50 p-6 rounded-[24px] shadow-xl border border-emerald-100 text-emerald-900 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[200%] h-full bg-gradient-to-l from-emerald-500/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out"></div>
              <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-100 text-emerald-500 shadow-sm"><Percent size={20} /></div>
                      <span className="text-sm font-bold text-emerald-700 tracking-wide">Avg Interest Rate</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-4xl font-black text-emerald-900 mb-1">{weightedRate.toFixed(2)}%</h3>
                        <p className="text-emerald-600/70 text-xs font-bold uppercase tracking-widest">Weighted Avg</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- Forms --- */}
      {showAddForm && <AddLoanForm onClose={() => setShowAddForm(false)} onSave={addLoan} />}
      {editingLoan && <EditLoanForm loan={editingLoan} onClose={() => setEditingLoan(null)} onSave={handleUpdateLoan} />}
      {viewingHistory && <HistoryModal loan={viewingHistory} onClose={() => setViewingHistory(null)} onBack={() => setViewingHistory(null)} />}

      {/* --- Toolbar --- */}
      <div className="bg-white p-3 md:p-4 rounded-[20px] shadow-sm border border-gray-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 md:gap-8 w-full lg:w-auto flex-1 justify-start">
             <div className="flex items-center gap-4 md:gap-8 w-full lg:w-auto justify-between lg:justify-start">
                 <div className="flex items-center gap-3">
                     <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shrink-0"><Wallet size={18} /></div>
                     <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Principal</p><p className="text-lg font-black text-gray-900 leading-none mt-0.5">${totalBalance.toLocaleString()}</p></div>
                 </div>
                 <div className="h-8 w-px bg-gray-100 hidden lg:block"></div>
                 <div className="flex items-center gap-3">
                     <div className="bg-red-50 p-2 rounded-xl text-red-500 shrink-0"><PiggyBank size={18} /></div>
                     <div><p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Lifetime Cost</p><p className="text-lg font-bold text-red-600 leading-none mt-0.5">${Math.round(totalLifetimeCost).toLocaleString()}</p></div>
                 </div>
             </div>
             <div className="hidden lg:block h-8 w-px bg-gray-200"></div>
             <div className="flex items-center gap-4 md:gap-8 w-full lg:w-auto justify-between lg:justify-start">
                 <div className="flex items-center gap-3">
                       <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 shrink-0"><CalendarCheck size={18} /></div>
                       <div><p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">{nextDueLabel}</p><p className="text-lg font-bold text-indigo-900 leading-none mt-0.5">{formattedDueDate}</p></div>
                   </div>
                   <div className="h-8 w-px bg-gray-100 hidden lg:block"></div>
                   <div className="flex items-center gap-3">
                       <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 shrink-0"><Coins size={18} /></div>
                       <div>
                           <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Total Monthly</p>
                           <div className="flex items-baseline gap-1.5 mt-0.5">
                               <p className="text-lg font-black text-gray-900 leading-none">${totalDue.toLocaleString()}</p>
                               {totalExtraCommitted > 0 && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">+${totalExtraCommitted} Extra</span>}
                           </div>
                       </div>
                   </div>
             </div>
          </div>
          <div className="w-full lg:w-auto min-w-[200px]">
              <div className="relative group">
                  <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 appearance-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300 cursor-pointer">
                      <option value="balance">Highest Balance</option>
                      <option value="rate">Highest Rate</option>
                      <option value="payment">Highest Payment</option>
                      <option value="name">Name (A-Z)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
          </div>
      </div>

      {/* --- Loan List --- */}
      <div className="space-y-4">
          {loans.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4"><Wallet size={32} /></div>
                  <h3 className="text-xl font-bold text-gray-900">No loans tracked</h3>
                  <button onClick={() => setShowAddForm(true)} className="mt-4 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30">Add Your First Loan</button>
              </div>
          ) : (
              <div className="grid gap-4">
                  {sortedLoans.map(loan => (
                      <LoanRow 
                          key={loan.id} 
                          loan={loan} 
                          onDelete={deleteLoan}
                          onEdit={setEditingLoan}
                          onViewHistory={setViewingHistory}
                          onAskAI={(msg) => setAIChatState({ isOpen: true, initialMessage: msg })}
                      />
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

interface LoanRowProps {
    loan: Loan;
    onDelete: (id: string) => void;
    onEdit: (l: Loan) => void;
    onViewHistory: (l: Loan) => void;
    onAskAI: (msg: string) => void;
}

const LoanRow: React.FC<LoanRowProps> = ({ loan, onDelete, onEdit, onViewHistory, onAskAI }) => {
    const [expanded, setExpanded] = useState(false);
    const [showInlineAI, setShowInlineAI] = useState(false);
    const [scenarioExtra, setScenarioExtra] = useState(100);
    const style = getLoanStyles(loan.type);
    
    // Projections
    const stdSchedule = useMemo(() => generateAmortizationSchedule(loan.currentBalance, loan.rate, loan.termMonths, loan.monthlyPayment), [loan]);
    const accSchedule = useMemo(() => generateAmortizationSchedule(loan.currentBalance, loan.rate, loan.termMonths, loan.monthlyPayment + scenarioExtra), [loan, scenarioExtra]);
    
    const stdInterest = stdSchedule.reduce((s, r) => s + r.interest, 0);
    const accInterest = accSchedule.reduce((s, r) => s + r.interest, 0);
    const interestSaved = stdInterest - accInterest;
    
    const stdMonths = stdSchedule.length;
    const accMonths = accSchedule.length;
    const timeSaved = stdMonths - accMonths;

    const lifetimeTotalStd = loan.currentBalance + stdInterest;
    const chartData = useMemo(() => {
        const maxLen = Math.max(stdSchedule.length, accSchedule.length);
        const data = [];
        for(let i = 0; i < maxLen; i += 2) { 
            data.push({ month: i, Standard: stdSchedule[i]?.balance || 0, Accelerated: accSchedule[i]?.balance || 0 });
        }
        return data;
    }, [stdSchedule, accSchedule]);

    const interestPercent = (stdInterest / lifetimeTotalStd) * 100;
    
    // Determine detailed label based on type
    let collateralLabel = 'Collateral';
    let collateralValue = loan.collateral;

    if (loan.type === 'Auto') { collateralLabel = 'Vehicle'; collateralValue = `${loan.vehicleYear || ''} ${loan.vehicleMake || ''} ${loan.vehicleModel || ''}`; }
    else if (loan.type === 'Mortgage') { collateralLabel = 'Property'; collateralValue = loan.propertyAddress; }
    else if (loan.type === 'Student') { collateralLabel = 'School'; collateralValue = loan.schoolName; }
    else if (loan.type === 'Medical') { collateralLabel = 'Provider'; collateralValue = loan.providerName; }
    else if (loan.type === 'Business') { collateralLabel = 'Business'; collateralValue = loan.businessName; }
    else if (loan.type === 'BNPL') { collateralLabel = 'Merchant'; collateralValue = loan.merchantName; }
    else if (loan.type === 'Family') { collateralLabel = 'Relationship'; collateralValue = loan.relationshipType; }

    return (
        <div className={`bg-white rounded-[24px] border border-gray-100 overflow-hidden transition-all duration-300 group ${expanded ? 'ring-2 ring-blue-500/5 shadow-xl' : `hover:border-transparent ${style.border} ${style.shadow}`}`}>
            <div className="p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer relative" onClick={() => setExpanded(!expanded)}>
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.accent} opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full`}></div>
                <div className="flex-1 flex items-center gap-5 w-full md:w-auto">
                    <div className={`w-14 h-14 ${style.iconBg} ${style.iconColor} rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
                         {getIcon(loan.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg md:text-xl leading-tight group-hover:text-blue-600 transition-colors truncate">{loan.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1.5 font-medium flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${style.bg} ${style.text}`}>{loan.type}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="text-gray-400">{loan.status || 'Active'}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block"></span>
                            <span className="text-gray-400 hidden sm:block">{loan.rate}% Interest</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap justify-between w-full md:w-auto md:flex-1 md:justify-end gap-y-4 gap-x-8 items-center pl-2 md:pl-0 border-t border-gray-50 pt-4 md:border-none md:pt-0">
                    <div className="text-left md:text-right">
                        <p className="font-black text-xl md:text-2xl text-gray-900 tracking-tight">${loan.currentBalance.toLocaleString()}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Balance</p>
                    </div>
                    
                    <div className="hidden xl:block w-32">
                         <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                            <span className="text-gray-400">Lifetime Cost</span>
                            <span className="text-red-500">${Math.round(lifetimeTotalStd).toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                             <div className={`h-full ${style.accent}`} style={{ width: `${100 - interestPercent}%` }}></div>
                             <div className="h-full bg-red-400" style={{ width: `${interestPercent}%` }}></div>
                        </div>
                         <div className="flex justify-between text-9px font-medium text-gray-400 mt-0.5"><span>Prin</span><span>Int</span></div>
                    </div>

                    <div className="text-right">
                        <p className="font-bold text-gray-800 text-lg">${(loan.monthlyPayment + (loan.extraPayment || 0)).toLocaleString()}</p>
                         <div className="flex justify-end gap-1">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Monthly</p>
                            {(loan.extraPayment || 0) > 0 && <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1 rounded font-bold">Includes +${loan.extraPayment}</span>}
                        </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expanded ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-300 group-hover:text-gray-50'}`}>
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>
            </div>

            {expanded && (
                 <div className="bg-gray-50/50 p-4 md:p-8 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-300">
                    {/* Inline AI */}
                    {showInlineAI && (
                        <div className="mb-6 animate-in zoom-in-95 duration-200">
                            <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2 text-purple-600"><Sparkles size={18} /><span className="font-bold text-sm">Budgetura Insight</span></div>
                                    <button onClick={(e) => { e.stopPropagation(); setShowInlineAI(false); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed mb-4">Your {loan.type} loan has a {loan.rate}% interest rate. While this is {loan.rate < 6 ? 'relatively low' : 'moderate'}, paying an extra ${scenarioExtra || 100} monthly could save you thousands in interest over the life of the loan.</p>
                                <button onClick={(e) => { e.stopPropagation(); onAskAI(`I need advice on my ${loan.name} loan. It has a ${loan.rate}% rate. Should I refinance or pay extra?`); }} className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"><MessageCircle size={14} /> Ask A Follow Up</button>
                            </div>
                        </div>
                    )}

                     <div className="grid lg:grid-cols-3 gap-8 mb-8">
                         <div className="lg:col-span-1 space-y-5">
                             <div className={`bg-gradient-to-br ${style.gradient} text-white p-5 rounded-2xl shadow-lg relative overflow-hidden`}>
                                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                                 <div className="relative z-10">
                                     <div className="flex justify-between items-start mb-4"><p className="text-xs font-bold text-white/80 uppercase tracking-wider">Interest Savings Simulator</p><Sparkles size={16} className="text-yellow-300 animate-pulse" /></div>
                                     <div className="mb-4"><p className="text-3xl font-black text-white tracking-tight">${Math.round(interestSaved).toLocaleString()}</p><p className="text-sm font-medium text-white/90">Interest saved</p></div>
                                     <div className="flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm mb-5 flex-wrap"><Clock size={14} /> Debt Free {timeSaved} Months Sooner</div>
                                     <div className="pt-4 border-t border-white/20">
                                        <div className="flex justify-between items-end mb-2"><label className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Extra Principal/Mo</label><span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded text-white">+${scenarioExtra}</span></div>
                                        <input type="range" min="0" max="2000" step="50" value={scenarioExtra} onChange={(e) => setScenarioExtra(parseInt(e.target.value))} onClick={(e) => e.stopPropagation()} className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-100" />
                                        <div className="flex justify-between mt-1 text-[9px] text-white/60 font-medium"><span>$0</span><span>$2,000</span></div>
                                     </div>
                                 </div>
                             </div>
                             <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                 <div className="flex justify-between items-center mb-3"><p className="text-xs font-bold text-gray-400 uppercase">Standard Path (Min Only)</p></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Payoff Date</span><span className="font-bold text-gray-900">{new Date(Date.now() + (stdMonths * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span></div>
                                 <div className="flex justify-between text-sm"><span className="text-gray-500">Interest Rem.</span><span className="font-bold text-red-500">+${Math.round(stdInterest).toLocaleString()}</span></div>
                                 <div className="pt-2 border-t border-gray-50 flex justify-between text-sm"><span className="text-gray-500 font-medium">Lifetime Total</span><span className="font-black text-gray-900">${Math.round(lifetimeTotalStd).toLocaleString()}</span></div>
                             </div>
                         </div>
                         <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                             <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0 mb-6">
                                <div className="flex items-center gap-3"><h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider"><TrendingUp size={16} className="text-gray-400" /> Amortization Curve</h4><button onClick={(e) => { e.stopPropagation(); setShowInlineAI(true); }} className="bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors"><Sparkles size={12} /> Ask Budgetura</button></div>
                                 <div className="flex gap-4 text-xs font-bold text-gray-500"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-gray-400 rounded-full"></div> Standard</div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> Accelerated</div></div>
                             </div>
                             <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorStd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/><stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/></linearGradient><linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="month" hide /><YAxis hide /><Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '12px' }} formatter={(val: number) => [`$${Math.round(val).toLocaleString()}`, '']} labelFormatter={(label) => `Month ${label}`} /><Area type="monotone" dataKey="Standard" stroke="#94a3b8" strokeWidth={2} fill="url(#colorStd)" name="Standard" /><Area type="monotone" dataKey="Accelerated" stroke="#3b82f6" strokeWidth={3} fill="url(#colorAcc)" name={`+ $${scenarioExtra}/mo`} /></AreaChart></ResponsiveContainer>
                             </div>
                         </div>
                     </div>
                     
                     {/* Detailed Account Info Grid */}
                     <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 mb-8">
                         <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={16} /> Account Details</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                             <div><p className="text-xs font-bold text-gray-400 uppercase">Lender</p><p className="font-semibold text-gray-900 mt-1 flex items-center gap-1"><Building2 size={12} className="text-gray-400"/> {loan.lender || 'N/A'}</p></div>
                             <div><p className="text-xs font-bold text-gray-400 uppercase">Account #</p><p className="font-semibold text-gray-900 mt-1 font-mono">{loan.accountNumber ? `•••• ${loan.accountNumber}` : 'N/A'}</p></div>
                             <div><p className="text-xs font-bold text-gray-400 uppercase">Interest Type</p><p className="font-semibold text-gray-900 mt-1">{loan.interestType || 'Fixed'}</p></div>
                             <div><p className="text-xs font-bold text-gray-400 uppercase">Status</p><p className={`font-bold mt-1 inline-flex items-center gap-1 ${loan.status === 'Active' ? 'text-emerald-600' : 'text-gray-500'}`}>{loan.status || 'Active'}</p></div>

                             <div className="h-px bg-gray-200 col-span-1 sm:col-span-2 md:col-span-4 my-1"></div>

                             <div><p className="text-xs font-bold text-gray-400 uppercase">Origination Date</p><p className="font-semibold text-gray-900 mt-1">{loan.startDate ? new Date(loan.startDate).toLocaleDateString() : 'N/A'}</p></div>
                             <div><p className="text-xs font-bold text-gray-400 uppercase">Due Date</p><p className="font-semibold text-gray-900 mt-1">{loan.dueDate ? `${loan.dueDate}${getOrdinal(loan.dueDate)} of month` : 'N/A'}</p></div>
                             <div><p className="text-xs font-bold text-gray-400 uppercase">Auto-Pay</p><p className={`font-bold mt-1 inline-flex items-center gap-1 ${loan.autoPay ? 'text-emerald-600' : 'text-gray-500'}`}>{loan.autoPay ? <><Zap size={12} fill="currentColor"/> Enabled</> : 'Disabled'}</p></div>
                             
                             {/* Dynamic fields based on type */}
                             <div>
                                 <p className="text-xs font-bold text-gray-400 uppercase">{collateralLabel}</p>
                                 <p className="font-semibold text-gray-900 mt-1 flex items-center gap-1 truncate" title={collateralValue}>
                                     {collateralValue ? <><MapPin size={12} className="text-gray-400"/> {collateralValue}</> : 'N/A'}
                                 </p>
                             </div>

                             {/* Specifics Rendering */}
                             {loan.type === 'Auto' && (
                                 <>
                                     <div><p className="text-xs font-bold text-gray-400 uppercase">VIN</p><p className="font-semibold text-gray-900 mt-1 font-mono text-xs">{loan.vin || 'N/A'}</p></div>
                                     <div><p className="text-xs font-bold text-gray-400 uppercase">Mileage</p><p className="font-semibold text-gray-900 mt-1">{loan.mileage ? loan.mileage.toLocaleString() : 'N/A'}</p></div>
                                 </>
                             )}

                             {loan.type === 'Student' && (
                                 <>
                                     <div><p className="text-xs font-bold text-gray-400 uppercase">Program</p><p className="font-semibold text-gray-900 mt-1">{loan.loanProgramType || 'N/A'}</p></div>
                                     <div><p className="text-xs font-bold text-gray-400 uppercase">Servicer</p><p className="font-semibold text-gray-900 mt-1">{loan.servicerName || 'N/A'}</p></div>
                                 </>
                             )}

                             {loan.type === 'Mortgage' && (
                                 <>
                                     <div><p className="text-xs font-bold text-gray-400 uppercase">Escrow (Mo)</p><p className="font-semibold text-gray-900 mt-1">${loan.escrowMonthly || 0}</p></div>
                                     <div><p className="text-xs font-bold text-gray-400 uppercase">Property Type</p><p className="font-semibold text-gray-900 mt-1">{loan.propertyType || 'N/A'}</p></div>
                                     <div className="col-span-1 sm:col-span-2"><p className="text-xs font-bold text-gray-400 uppercase">Full Address</p><p className="font-semibold text-gray-900 mt-1 text-xs">{loan.propertyAddress ? `${loan.propertyAddress}, ${loan.propertyCity}, ${loan.propertyState} ${loan.propertyZip}` : 'N/A'}</p></div>
                                 </>
                             )}

                             {loan.type === 'Home Equity' && (
                                 <>
                                     <div><p className="text-xs font-bold text-gray-400 uppercase">Credit Limit</p><p className="font-semibold text-gray-900 mt-1">${loan.creditLimit?.toLocaleString() || 'N/A'}</p></div>
                                     <div><p className="text-xs font-bold text-gray-400 uppercase">Draw Ends</p><p className="font-semibold text-gray-900 mt-1">{loan.drawPeriodEnd ? new Date(loan.drawPeriodEnd).toLocaleDateString() : 'N/A'}</p></div>
                                 </>
                             )}

                             {loan.type === 'Medical' && (
                                 <div><p className="text-xs font-bold text-gray-400 uppercase">Service Date</p><p className="font-semibold text-gray-900 mt-1">{loan.serviceDate ? new Date(loan.serviceDate).toLocaleDateString() : 'N/A'}</p></div>
                             )}

                             {loan.type === 'Business' && (
                                 <div><p className="text-xs font-bold text-gray-400 uppercase">Annual Revenue</p><p className="font-semibold text-gray-900 mt-1">${loan.businessRevenue?.toLocaleString() || 'N/A'}</p></div>
                             )}

                             {loan.type === 'BNPL' && (
                                 <>
                                     <div><p className="text-xs font-bold text-gray-400 uppercase">Purchase</p><p className="font-semibold text-gray-900 mt-1">{loan.purchaseDescription || 'N/A'}</p></div>
                                     <div><p className="text-xs font-bold text-gray-400 uppercase">Installments</p><p className="font-semibold text-gray-900 mt-1">{loan.totalInstallments || 'N/A'}</p></div>
                                 </>
                             )}

                             {loan.notes && (
                                 <div className="col-span-1 sm:col-span-2 md:col-span-4 mt-2">
                                     <p className="text-xs font-bold text-gray-400 uppercase mb-1">Notes</p>
                                     <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">{loan.notes}</p>
                                 </div>
                             )}
                         </div>
                     </div>

                     <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200/60">
                        <button onClick={() => onViewHistory(loan)} className="flex items-center justify-center gap-2 text-blue-600 hover:text-white hover:bg-blue-600 px-5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold bg-blue-50 border border-blue-100 w-full sm:w-auto"><History size={16} /> History</button>
                        <button onClick={() => onEdit(loan)} className="flex items-center justify-center gap-2 text-gray-600 hover:text-white hover:bg-gray-800 px-5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold bg-gray-100 w-full sm:w-auto"><Edit2 size={16} /> Edit Details</button>
                        <button onClick={() => onDelete(loan.id)} className="flex items-center justify-center gap-2 text-red-500 hover:text-white hover:bg-red-500 px-5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold opacity-60 hover:opacity-100 w-full sm:w-auto"><Trash2 size={16} /> Delete</button>
                     </div>
                 </div>
            )}
        </div>
    );
};

// ... HistoryModal ... 
const HistoryModal = ({ loan, onBack, onClose }: { loan: Loan, onBack: () => void, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white p-5 md:p-8 rounded-[32px] shadow-2xl w-full max-w-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        {onBack && <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowRight className="rotate-180" size={20} /></button>}
                        <h3 className="font-black text-xl text-gray-900">Historical Data</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><X size={20} /></button>
                </div>
                <p className="text-gray-500 mb-6 text-sm">Track changes to your {loan.name} over time.</p>
                <div className="overflow-hidden border border-gray-200 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr><th className="p-4">Date</th><th className="p-4">Balance</th><th className="p-4">Rate</th><th className="p-4 hidden sm:table-cell">Payment</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="bg-blue-50/50">
                                <td className="p-4 font-bold text-blue-900 text-sm">Current</td><td className="p-4 font-bold text-gray-900">${loan.currentBalance.toLocaleString()}</td><td className="p-4 text-sm text-gray-600">{loan.rate}%</td><td className="p-4 text-sm text-gray-600 hidden sm:table-cell">${loan.monthlyPayment.toLocaleString()}</td>
                            </tr>
                            {loan.history?.map((entry, index) => {
                                const balDiff = loan.currentBalance - entry.balance;
                                const isBalLower = loan.currentBalance < entry.balance;
                                const rateDiff = loan.rate - entry.rate;
                                const isRateLower = loan.rate < entry.rate;
                                const payDiff = loan.monthlyPayment - entry.monthlyPayment;
                                const isPayLower = loan.monthlyPayment < entry.monthlyPayment;

                                return (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-500">{new Date(entry.date).toLocaleDateString()}</td>
                                        <td className="p-4"><div className="text-sm font-bold text-gray-700">${entry.balance.toLocaleString()}</div>{balDiff !== 0 && (<div className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${isBalLower ? 'text-emerald-600' : 'text-red-500'}`}>{isBalLower ? <ArrowDown size={10} /> : <ArrowUp size={10} />} {Math.abs(balDiff).toLocaleString()}</div>)}</td>
                                        <td className="p-4"><div className="text-sm text-gray-600">{entry.rate}%</div>{rateDiff !== 0 && (<div className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${isRateLower ? 'text-emerald-600' : 'text-red-500'}`}>{isRateLower ? <ArrowDown size={10} /> : <ArrowUp size={10} />} {Math.abs(rateDiff).toFixed(2)}%</div>)}</td>
                                        <td className="p-4 hidden sm:table-cell"><div className="text-sm text-gray-600">${entry.monthlyPayment.toLocaleString()}</div>{payDiff !== 0 && (<div className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${isPayLower ? 'text-emerald-600' : 'text-red-500'}`}>{isPayLower ? <ArrowDown size={10} /> : <ArrowUp size={10} />} {Math.abs(payDiff)}</div>)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- Shared Form Component Logic ---
const LoanFormFields = ({ formType, category }: { formType: string, category: LoanCategory }) => {
    return (
        <>
            {/* Category Specific Fields */}
            {category === 'Mortgage' && (
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <h5 className="col-span-1 sm:col-span-2 text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Mortgage Specifics</h5>
                    <div className="col-span-1 sm:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property Address</label><input name="propertyAddress" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" placeholder="123 Main St" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City</label><input name="propertyCity" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label><input name="propertyState" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zip</label><input name="propertyZip" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property Type</label><select name="propertyType" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm"><option value="Single Family">Single Family</option><option value="Condo">Condo</option><option value="Multi Family">Multi Family</option></select></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly Escrow ($)</label><input name="escrowMonthly" type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">HOA ($)</label><input name="hoaMonthly" type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                </div>
            )}
            
            {category === 'Auto' && (
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                    <h5 className="col-span-1 sm:col-span-2 text-xs font-bold text-orange-800 uppercase tracking-wider mb-1">Vehicle Details</h5>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Year</label><input name="vehicleYear" type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" placeholder="2024" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Make</label><input name="vehicleMake" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" placeholder="Toyota" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Model</label><input name="vehicleModel" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" placeholder="Camry" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mileage</label><input name="mileage" type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                    <div className="col-span-1 sm:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">VIN</label><input name="vin" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm font-mono" /></div>
                </div>
            )}

             {category === 'Student' && (
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <h5 className="col-span-1 sm:col-span-2 text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Student Loan Details</h5>
                    <div className="col-span-1 sm:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">School Name</label><input name="schoolName" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Program Type</label><select name="loanProgramType" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm"><option value="Federal Direct">Federal Direct</option><option value="Private">Private</option><option value="Refinance">Refinance</option></select></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Servicer</label><input name="servicerName" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                </div>
            )}

             {category === 'Home Equity' && (
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-cyan-50/50 rounded-xl border border-cyan-100">
                     <h5 className="col-span-1 sm:col-span-2 text-xs font-bold text-cyan-800 uppercase tracking-wider mb-1">HELOC / Equity Details</h5>
                     <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Credit Limit</label><input name="creditLimit" type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                     <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Draw Period Ends</label><input name="drawPeriodEnd" type="date" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                </div>
             )}

             {category === 'Medical' && (
                 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                     <h5 className="col-span-1 sm:col-span-2 text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">Medical Provider Info</h5>
                     <div className="col-span-1 sm:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Provider Name</label><input name="providerName" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                     <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Service Date</label><input name="serviceDate" type="date" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                 </div>
             )}

             {category === 'Business' && (
                 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                     <h5 className="col-span-1 sm:col-span-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Business Details</h5>
                     <div className="col-span-1 sm:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Business Name</label><input name="businessName" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                     <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Annual Revenue</label><input name="businessRevenue" type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                 </div>
             )}

             {category === 'BNPL' && (
                 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                     <h5 className="col-span-1 sm:col-span-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Installment Details</h5>
                     <div className="col-span-1 sm:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Merchant Name</label><input name="merchantName" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                     <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Purchase Item</label><input name="purchaseDescription" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                     <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Installments</label><input name="totalInstallments" type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                 </div>
             )}
             
             {category === 'Family' && (
                 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                     <h5 className="col-span-1 sm:col-span-2 text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">Family Loan Details</h5>
                     <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Relationship</label><input name="relationshipType" placeholder="Parent, Sibling, Friend" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" /></div>
                 </div>
             )}
        </>
    )
}

const AddLoanForm = ({ onClose, onSave }: { onClose: () => void, onSave: (l: Loan) => void }) => {
    const [selectedCategory, setSelectedCategory] = useState<LoanCategory>('Personal');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        
        // Helper to safely get value
        const getVal = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value;
        const getNum = (name: string) => parseFloat(getVal(name)) || 0;
        const getInt = (name: string) => parseInt(getVal(name)) || 0;
        const getCheck = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.checked;

        const loan: Loan = {
            id: Date.now().toString(),
            name: getVal('name'),
            type: selectedCategory,
            currentBalance: getNum('balance'),
            originalPrincipal: getNum('principal'),
            rate: getNum('rate'),
            termMonths: getInt('term'),
            monthlyPayment: getNum('payment'),
            extraPayment: getNum('extra'),
            lender: getVal('lender'),
            accountNumber: getVal('accountNumber'),
            status: getVal('status') as LoanStatus,
            dueDate: getInt('dueDate'),
            autoPay: getCheck('autoPay'),
            startDate: getVal('startDate'),
            collateral: getVal('collateral'),
            interestType: getVal('interestType') as any,
            notes: getVal('notes'),
            
            // Category Specifics
            propertyAddress: getVal('propertyAddress'),
            propertyCity: getVal('propertyCity'),
            propertyState: getVal('propertyState'),
            propertyZip: getVal('propertyZip'),
            propertyType: getVal('propertyType'),
            escrowMonthly: getNum('escrowMonthly'),
            hoaMonthly: getNum('hoaMonthly'),
            
            vehicleYear: getInt('vehicleYear'),
            vehicleMake: getVal('vehicleMake'),
            vehicleModel: getVal('vehicleModel'),
            vin: getVal('vin'),
            mileage: getInt('mileage'),

            schoolName: getVal('schoolName'),
            loanProgramType: getVal('loanProgramType'),
            servicerName: getVal('servicerName'),
            
            creditLimit: getNum('creditLimit'),
            drawPeriodEnd: getVal('drawPeriodEnd'),
            
            providerName: getVal('providerName'),
            serviceDate: getVal('serviceDate'),
            
            businessName: getVal('businessName'),
            businessRevenue: getNum('businessRevenue'),
            
            merchantName: getVal('merchantName'),
            purchaseDescription: getVal('purchaseDescription'),
            totalInstallments: getInt('totalInstallments'),
            
            relationshipType: getVal('relationshipType'),

            history: []
        };
        onSave(loan);
        onClose();
    };

    return (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <form onSubmit={handleSubmit} className="bg-white p-5 md:p-8 rounded-[32px] shadow-2xl w-full max-w-3xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <div className="flex justify-between items-center mb-6">
                    <div><h3 className="font-black text-2xl text-gray-900">Add Loan</h3><p className="text-gray-500 text-sm mt-1">Select category and enter details.</p></div>
                    <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><X size={20} /></button>
                </div>

                <div className="space-y-8">
                     {/* Section 1: Identity */}
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Loan Identity</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Loan Name</label>
                                <input name="name" required placeholder="e.g. Navient Student Loan" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                <select name="type" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as LoanCategory)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 appearance-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 max-w-full">
                                    <option value="Personal">Personal Loan</option>
                                    <option value="Auto">Auto / Vehicle</option>
                                    <option value="Student">Student Loan</option>
                                    <option value="Mortgage">Mortgage / Home</option>
                                    <option value="Home Equity">HELOC / Home Equity</option>
                                    <option value="Medical">Medical Debt</option>
                                    <option value="Business">Business Loan</option>
                                    <option value="Payday">Payday / Cash Advance</option>
                                    <option value="BNPL">Buy Now Pay Later</option>
                                    <option value="Consolidation">Debt Consolidation</option>
                                    <option value="Family">Family / Friend</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lender</label>
                                <input name="lender" placeholder="e.g. Wells Fargo" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account # (Last 4)</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input name="accountNumber" maxLength={4} placeholder="XXXX" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                                <select name="status" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full">
                                    <option value="Active">Active</option>
                                    <option value="Paid Off">Paid Off</option>
                                    <option value="Deferment">Deferment</option>
                                    <option value="Forbearance">Forbearance</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <LoanFormFields formType="add" category={selectedCategory} />

                    {/* Section 2: Financials */}
                    <div>
                         <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Financial Specifics</h4>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Balance</label><input name="balance" type="number" step="any" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Original Principal</label><input name="principal" type="number" step="any" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interest Rate (%)</label><input name="rate" type="number" step="any" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interest Type</label><select name="interestType" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full"><option value="Fixed">Fixed Rate</option><option value="Variable">Variable Rate</option></select></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Term (Months)</label><input name="term" type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Origination Date</label><input name="startDate" type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full" /></div>
                         </div>
                    </div>
                    
                    {/* Section 3: Payment Settings */}
                    <div>
                         <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Payment Settings</h4>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly Payment</label><input name="payment" type="number" step="any" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Day</label><input name="dueDate" type="number" min="1" max="31" placeholder="1-31" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full" /></div>
                             <div className="flex items-center pt-6"><label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200 w-full"><input name="autoPay" type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" /><span className="text-sm font-bold text-gray-700">Auto-Pay</span></label></div>
                            <div className="col-span-2"><label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Recurring Extra Principal ($)</label><input name="extra" type="number" step="any" placeholder="0.00" className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-emerald-900 placeholder-emerald-300 max-w-full" /></div>
                         </div>
                    </div>

                    {/* Section 4: Details */}
                    <div>
                         <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Additional Details</h4>
                         <div className="space-y-4">
                             {selectedCategory !== 'Mortgage' && selectedCategory !== 'Auto' && selectedCategory !== 'Student' && selectedCategory !== 'Business' && selectedCategory !== 'Medical' && selectedCategory !== 'BNPL' && selectedCategory !== 'Home Equity' && selectedCategory !== 'Family' && (
                                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Collateral / Details</label><input name="collateral" placeholder="e.g. Asset description" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full" /></div>
                             )}
                             <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label><textarea name="notes" rows={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 resize-none max-w-full" placeholder="Add notes about this loan..." /></div>
                         </div>
                    </div>
                </div>

                <div className="flex gap-4 justify-end pt-6 border-t border-gray-100 mt-4 flex-col-reverse sm:flex-row">
                     <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors w-full sm:w-auto">Cancel</button>
                     <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"><Plus size={18} /> Save Loan</button>
                </div>
            </form>
         </div>
    );
};

const EditLoanForm = ({ loan, onClose, onSave }: { loan: Loan, onClose: () => void, onSave: (l: Loan) => void }) => {
    const [showHistory, setShowHistory] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<LoanCategory>(loan.type);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        
        const getVal = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value;
        const getNum = (name: string) => parseFloat(getVal(name)) || 0;
        const getInt = (name: string) => parseInt(getVal(name)) || 0;
        const getCheck = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.checked;

        const updated: Loan = {
            ...loan,
            name: getVal('name'),
            type: selectedCategory,
            currentBalance: getNum('balance'),
            originalPrincipal: getNum('principal'),
            rate: getNum('rate'),
            termMonths: getInt('term'),
            monthlyPayment: getNum('payment'),
            extraPayment: getNum('extra'),
            lender: getVal('lender'),
            accountNumber: getVal('accountNumber'),
            status: getVal('status') as LoanStatus,
            dueDate: getInt('dueDate'),
            autoPay: getCheck('autoPay'),
            startDate: getVal('startDate'),
            collateral: getVal('collateral'),
            interestType: getVal('interestType') as any,
            notes: getVal('notes'),

            // Category Specifics (Merging existing optional fields with potentially new form values)
            propertyAddress: getVal('propertyAddress'),
            propertyCity: getVal('propertyCity'),
            propertyState: getVal('propertyState'),
            propertyZip: getVal('propertyZip'),
            propertyType: getVal('propertyType'),
            escrowMonthly: getNum('escrowMonthly'),
            hoaMonthly: getNum('hoaMonthly'),
            
            vehicleYear: getInt('vehicleYear'),
            vehicleMake: getVal('vehicleMake'),
            vehicleModel: getVal('vehicleModel'),
            vin: getVal('vin'),
            mileage: getInt('mileage'),

            schoolName: getVal('schoolName'),
            loanProgramType: getVal('loanProgramType'),
            servicerName: getVal('servicerName'),
            
            creditLimit: getNum('creditLimit'),
            drawPeriodEnd: getVal('drawPeriodEnd'),
            
            providerName: getVal('providerName'),
            serviceDate: getVal('serviceDate'),
            
            businessName: getVal('businessName'),
            businessRevenue: getNum('businessRevenue'),
            
            merchantName: getVal('merchantName'),
            purchaseDescription: getVal('purchaseDescription'),
            totalInstallments: getInt('totalInstallments'),
            
            relationshipType: getVal('relationshipType'),
        };
        onSave(updated);
    };

    if (showHistory) return <HistoryModal loan={loan} onBack={() => setShowHistory(false)} onClose={onClose} />;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
           <form onSubmit={handleSubmit} className="bg-white p-5 md:p-8 rounded-[32px] shadow-2xl w-full max-w-3xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
               <div className="flex justify-between items-center mb-6">
                   <div><h3 className="font-black text-2xl text-gray-900">Edit Loan</h3><p className="text-gray-500 text-sm mt-1">Update loan details.</p></div>
                   <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><X size={20} /></button>
               </div>
               
               <div className="space-y-8">
                    {/* Section 1: Identity */}
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Loan Identity</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Loan Name</label>
                                <input name="name" defaultValue={loan.name} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                <select name="type" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as LoanCategory)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 appearance-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 max-w-full">
                                    <option value="Personal">Personal Loan</option>
                                    <option value="Auto">Auto / Vehicle</option>
                                    <option value="Student">Student Loan</option>
                                    <option value="Mortgage">Mortgage / Home</option>
                                    <option value="Home Equity">HELOC / Home Equity</option>
                                    <option value="Medical">Medical Debt</option>
                                    <option value="Business">Business Loan</option>
                                    <option value="Payday">Payday / Cash Advance</option>
                                    <option value="BNPL">Buy Now Pay Later</option>
                                    <option value="Consolidation">Debt Consolidation</option>
                                    <option value="Family">Family / Friend</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lender</label>
                                <input name="lender" defaultValue={loan.lender} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account # (Last 4)</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input name="accountNumber" defaultValue={loan.accountNumber} maxLength={4} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                                <select name="status" defaultValue={loan.status} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full">
                                    <option value="Active">Active</option>
                                    <option value="Paid Off">Paid Off</option>
                                    <option value="Deferment">Deferment</option>
                                    <option value="Forbearance">Forbearance</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <LoanFormFields formType="edit" category={selectedCategory} />

                    {/* Section 2: Financials */}
                    <div>
                         <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Financial Specifics</h4>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Balance</label><input name="balance" defaultValue={loan.currentBalance} type="number" step="any" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Original Principal</label><input name="principal" defaultValue={loan.originalPrincipal} type="number" step="any" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interest Rate (%)</label><input name="rate" defaultValue={loan.rate} type="number" step="any" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interest Type</label><select name="interestType" defaultValue={loan.interestType} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full"><option value="Fixed">Fixed Rate</option><option value="Variable">Variable Rate</option></select></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Term (Months)</label><input name="term" defaultValue={loan.termMonths} type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Origination Date</label><input name="startDate" defaultValue={loan.startDate} type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full" /></div>
                         </div>
                    </div>
                    
                    {/* Section 3: Payment Settings */}
                    <div>
                         <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Payment Settings</h4>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly Payment</label><input name="payment" defaultValue={loan.monthlyPayment} type="number" step="any" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all max-w-full" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Day</label><input name="dueDate" defaultValue={loan.dueDate} type="number" min="1" max="31" placeholder="1-31" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full" /></div>
                             <div className="flex items-center pt-6"><label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200 w-full"><input name="autoPay" defaultChecked={loan.autoPay} type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" /><span className="text-sm font-bold text-gray-700">Auto-Pay</span></label></div>
                            <div className="col-span-2"><label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Recurring Extra Principal ($)</label><input name="extra" defaultValue={loan.extraPayment} type="number" step="any" placeholder="0.00" className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-emerald-900 placeholder-emerald-300 max-w-full" /></div>
                         </div>
                    </div>

                    {/* Section 4: Details */}
                    <div>
                         <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Additional Details</h4>
                         <div className="space-y-4">
                             {selectedCategory !== 'Mortgage' && selectedCategory !== 'Auto' && selectedCategory !== 'Student' && selectedCategory !== 'Business' && selectedCategory !== 'Medical' && selectedCategory !== 'BNPL' && selectedCategory !== 'Home Equity' && selectedCategory !== 'Family' && (
                                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Collateral / Details</label><input name="collateral" defaultValue={loan.collateral} placeholder="e.g. Asset description" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 max-w-full" /></div>
                             )}
                             <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label><textarea name="notes" defaultValue={loan.notes} rows={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 resize-none max-w-full" placeholder="Add notes about this loan..." /></div>
                         </div>
                    </div>
               </div>

               <div className="flex gap-4 justify-between pt-6 border-t border-gray-100 mt-4 flex-col-reverse sm:flex-row">
                    {loan.history && loan.history.length > 0 ? (
                        <button type="button" onClick={() => setShowHistory(true)} className="px-4 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"><History size={18} /> View History</button>
                    ) : (<div></div>)}
                    <div className="flex gap-4 flex-col sm:flex-row w-full sm:w-auto">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors w-full sm:w-auto">Cancel</button>
                        <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"><Edit2 size={18} /> Update Loan</button>
                    </div>
               </div>
           </form>
        </div>
    );
}

export default LoanManager;
