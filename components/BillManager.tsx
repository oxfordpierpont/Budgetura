
import React, { useState, useMemo } from 'react';
import { useDebt } from '../context/DebtContext';
import { 
  Plus, CheckCircle2, AlertCircle, Clock, Calendar, List, 
  ChevronDown, ChevronUp, Zap, CreditCard, 
  Home, DollarSign, Wallet, TrendingDown, History, X,
  ArrowRight, TrendingUp, ShoppingCart, Music, Tv,
  MoreVertical, CalendarDays, Filter, ArrowUp, ArrowDown, Minus,
  PieChart, Layers
} from 'lucide-react';
import { Bill, CreditCard as CreditCardType, Loan, BillPaymentHistory } from '../types';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// --- Types for Unified View ---
interface UnifiedExpense {
    id: string;
    sourceId: string;
    type: 'Bill' | 'Credit Card' | 'Loan';
    classification: 'Essential' | 'Subscription' | 'Credit Card' | 'Loan' | 'Other';
    name: string;
    amount: number;
    dueDate: number; // Day of month
    dateObj: Date; // Calculated next due date
    status: 'Paid' | 'Overdue' | 'Due Soon' | 'Upcoming';
    category: string;
    isEssential: boolean;
    autoPay: boolean;
    history: BillPaymentHistory[];
    lifetimePaid: number;
    trend: 'up' | 'down' | 'stable';
    trendDiff: number; // Exact amount difference
    originalRef: Bill | CreditCardType | Loan;
}

// --- Helpers ---
const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

const getComputedDate = (dayOfMonth: number): Date => {
    const today = new Date();
    // Start with current month
    let d = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    
    // Safety for days like 31st in Feb or if we want to handle month rollovers for paid items, 
    // but typically we just want to know the "day" in the current month context.
    if (d.getMonth() !== today.getMonth()) {
        d = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    return d;
};

// --- Main Component ---
export default function BillManager() {
    const { bills, cards, loans, updateBill, addBill } = useDebt();
    
    // -- State --
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [selectedDate, setSelectedDate] = useState<number | null>(null); // For Calendar filtering
    
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<UnifiedExpense | null>(null);

    // -- Unified Data Construction --
    const unifiedExpenses: UnifiedExpense[] = useMemo(() => {
        const today = new Date();
        const list: UnifiedExpense[] = [];

        // 1. Process Bills
        bills.forEach(b => {
            const dueDay = b.dueDate || 1;
            
            // Check if paid in current month/year
            const isPaidCurrentMonth = b.lastPaidDate && 
                new Date(b.lastPaidDate).getMonth() === today.getMonth() &&
                new Date(b.lastPaidDate).getFullYear() === today.getFullYear();

            // Calculate "Next Due Date" Logic
            let dueDateObj = getComputedDate(dueDay);
            
            // Determine Status
            let status: UnifiedExpense['status'] = 'Upcoming';
            if (isPaidCurrentMonth) {
                status = 'Paid';
            } else if (today.getDate() > dueDay) {
                status = 'Overdue';
            } else if (dueDay - today.getDate() <= 7) {
                status = 'Due Soon';
            }

            // Determine Classification (Requested: Essentials, Subscription, Credit Card, Loan, Other)
            let classification: UnifiedExpense['classification'] = 'Other';
            if (b.category === 'Subscriptions' || b.category === 'Entertainment') classification = 'Subscription';
            else if (['Utilities', 'Food', 'Housing', 'Healthcare', 'Insurance'].includes(b.category) || b.isEssential) classification = 'Essential';

            // Lifetime & Trend
            const history = b.history || [];
            const lifetimePaid = history.reduce((sum, h) => sum + h.amount, 0);
            
            // Trend Calculation
            let trend: 'up' | 'down' | 'stable' = 'stable';
            let trendDiff = 0;
            let prevAmount = 0;
            if (history.length > 0) {
                 // Sort history by date desc
                 const sortedHistory = [...history].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                 
                 // Compare current amount vs previous entry
                 if (isPaidCurrentMonth && sortedHistory.length > 1) {
                     prevAmount = sortedHistory[1].amount;
                 } else if (!isPaidCurrentMonth && sortedHistory.length > 0) {
                     prevAmount = sortedHistory[0].amount;
                 }
                 
                 if (prevAmount > 0) {
                     trendDiff = b.amount - prevAmount;
                     if (b.amount > prevAmount) trend = 'up';
                     else if (b.amount < prevAmount) trend = 'down';
                 }
            }

            list.push({
                id: `bill-${b.id}`,
                sourceId: b.id,
                type: 'Bill',
                classification,
                name: b.name,
                amount: b.amount,
                dueDate: dueDay,
                dateObj: dueDateObj,
                status,
                category: b.category,
                isEssential: b.isEssential,
                autoPay: b.autoPay,
                history,
                lifetimePaid,
                trend,
                trendDiff,
                originalRef: b
            });
        });

        // 2. Process Credit Cards
        cards.forEach(c => {
            const dueDay = c.dueDate || 1;
            const dueDateObj = getComputedDate(dueDay);
            let status: UnifiedExpense['status'] = 'Upcoming';
            if (today.getDate() > dueDay) status = 'Overdue';
            else if (dueDay - today.getDate() <= 7) status = 'Due Soon';

            list.push({
                id: `card-${c.id}`,
                sourceId: c.id,
                type: 'Credit Card',
                classification: 'Credit Card',
                name: c.name,
                amount: c.minimumPayment,
                dueDate: dueDay,
                dateObj: dueDateObj,
                status,
                category: 'Credit Cards',
                isEssential: true,
                autoPay: c.autoPay || false,
                history: [],
                lifetimePaid: 0, 
                trend: 'stable',
                trendDiff: 0,
                originalRef: c
            });
        });

        // 3. Process Loans
        loans.forEach(l => {
             const dueDay = l.dueDate || 1;
             const dueDateObj = getComputedDate(dueDay);
             let status: UnifiedExpense['status'] = 'Upcoming';
             if (today.getDate() > dueDay) status = 'Overdue';
             else if (dueDay - today.getDate() <= 7) status = 'Due Soon';

             list.push({
                id: `loan-${l.id}`,
                sourceId: l.id,
                type: 'Loan',
                classification: 'Loan',
                name: l.name,
                amount: l.monthlyPayment,
                dueDate: dueDay,
                dateObj: dueDateObj,
                status,
                category: 'Loans',
                isEssential: true,
                autoPay: l.autoPay || false,
                history: [],
                lifetimePaid: l.originalPrincipal - l.currentBalance, 
                trend: 'stable',
                trendDiff: 0,
                originalRef: l
             });
        });

        return list.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    }, [bills, cards, loans]);

    // -- Filtering Logic --
    const filteredExpenses = useMemo(() => {
        let result = unifiedExpenses;

        // 1. Calendar Selection Filter
        if (selectedDate !== null) {
            result = result.filter(e => e.dueDate === selectedDate);
        }

        // 2. Category Filter
        if (filterCategory !== 'All') {
            switch(filterCategory) {
                case 'Essentials': result = result.filter(e => e.classification === 'Essential'); break;
                case 'Subscriptions': result = result.filter(e => e.classification === 'Subscription'); break;
                case 'Credit Card': result = result.filter(e => e.classification === 'Credit Card'); break;
                case 'Loan': result = result.filter(e => e.classification === 'Loan'); break;
                case 'Other': result = result.filter(e => e.classification === 'Other'); break;
                case 'Overdue': result = result.filter(e => e.status === 'Overdue'); break;
            }
        }

        return result;
    }, [unifiedExpenses, filterCategory, selectedDate]);

    // -- Summary Calculations --
    const summary = useMemo(() => {
        const total = unifiedExpenses.reduce((sum, e) => sum + e.amount, 0);
        const paid = unifiedExpenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0);
        const overdue = unifiedExpenses.filter(e => e.status === 'Overdue').reduce((sum, e) => sum + e.amount, 0);
        const remaining = total - paid;
        
        return { total, paid, overdue, remaining };
    }, [unifiedExpenses]);

    // -- Actions --
    const handleMarkPaid = (expense: UnifiedExpense) => {
        if (expense.type !== 'Bill') return; 
        const bill = expense.originalRef as Bill;
        const todayStr = new Date().toISOString();
        
        const newHistory: BillPaymentHistory = {
            id: Date.now().toString(),
            date: todayStr,
            amount: bill.amount,
            status: 'On Time'
        };

        updateBill(bill.id, {
            lastPaidDate: todayStr,
            history: [newHistory, ...(bill.history || [])]
        });
    };

    const handleDateClick = (day: number) => {
        if (selectedDate === day) {
            setSelectedDate(null); // Toggle off
        } else {
            setSelectedDate(day);
        }
    };

    // Filter Buttons Config
    const filters = [
        { label: 'All', value: 'All' },
        { label: 'Essentials', value: 'Essentials' },
        { label: 'Subscriptions', value: 'Subscriptions' },
        { label: 'Credit Card', value: 'Credit Card' },
        { label: 'Loan', value: 'Loan' },
        { label: 'Other', value: 'Other' },
        { label: 'Overdue', value: 'Overdue' }
    ];

    return (
        <div className="p-4 md:p-8 space-y-6 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bill Manager</h1>
                    <p className="text-gray-500 mt-1 font-medium">Stay on top of due dates and track spending.</p>
                 </div>
                 <button 
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-gray-400/20 hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={16} /> Add Bill
                </button>
            </div>

            {/* Restored Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden">
                     <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Layers size={20} /></div>
                     </div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Bills</p>
                     <p className="text-2xl font-black text-gray-900 mt-0.5">${summary.total.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden">
                     <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={20} /></div>
                     </div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Paid So Far</p>
                     <p className="text-2xl font-black text-gray-900 mt-0.5">${summary.paid.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden">
                     <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Clock size={20} /></div>
                     </div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Remaining</p>
                     <p className="text-2xl font-black text-gray-900 mt-0.5">${summary.remaining.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden">
                     <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="p-2 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={20} /></div>
                     </div>
                     <p className="text-xs font-bold text-red-400 uppercase tracking-wide">Overdue</p>
                     <p className="text-2xl font-black text-red-600 mt-0.5">${summary.overdue.toLocaleString()}</p>
                </div>
            </div>

            {/* Calendar & Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* Left: Compact Calendar */}
                <div className="xl:col-span-1">
                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-4 sticky top-4">
                        <div className="flex justify-between items-center mb-3">
                             <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                                <CalendarDays size={16} className="text-blue-500" /> 
                                {new Date().toLocaleString('default', { month: 'long' })}
                             </h3>
                             {selectedDate && (
                                <button onClick={() => setSelectedDate(null)} className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-600 transition-colors">Clear</button>
                             )}
                        </div>
                        <CalendarGrid 
                            expenses={unifiedExpenses} 
                            selectedDate={selectedDate}
                            onSelectDate={handleDateClick} 
                        />
                        <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between text-[10px] font-bold text-gray-400">
                             <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Paid</div>
                             <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Upcoming</div>
                             <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Overdue</div>
                        </div>
                    </div>
                </div>

                {/* Right: Detailed List */}
                <div className="xl:col-span-3">
                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                        
                        {/* Filters Toolbar */}
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                                {filters.map(filter => (
                                    <button 
                                        key={filter.value}
                                        onClick={() => setFilterCategory(filter.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                                            filterCategory === filter.value
                                            ? 'bg-gray-900 text-white border-gray-900' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                            <span className="text-xs font-bold text-gray-400 whitespace-nowrap hidden sm:block">
                                {filteredExpenses.length} Found
                            </span>
                        </div>

                        {/* List Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                            <div className="col-span-4">Expense Name</div>
                            <div className="col-span-2">Classification</div>
                            <div className="col-span-2">Trend</div>
                            <div className="col-span-2 text-right">Lifetime Paid</div>
                            <div className="col-span-1 text-right">Amount</div>
                            <div className="col-span-1 text-center">Paid</div>
                        </div>

                        {/* List Body */}
                        <div className="divide-y divide-gray-50">
                            {filteredExpenses.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 size={24} className="text-gray-300" />
                                    </div>
                                    <p className="font-medium">No expenses found.</p>
                                    {selectedDate && <p className="text-xs mt-1">Clear the calendar filter to see more.</p>}
                                </div>
                            ) : (
                                filteredExpenses.map(expense => (
                                    <ExpenseRow 
                                        key={expense.id} 
                                        expense={expense} 
                                        onMarkPaid={handleMarkPaid} 
                                        onClick={() => setSelectedExpense(expense)} 
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {showAddForm && <AddBillForm onClose={() => setShowAddForm(false)} onSave={addBill} />}
            {selectedExpense && (
                <ExpenseDetailModal 
                    expense={selectedExpense} 
                    onClose={() => setSelectedExpense(null)} 
                    onMarkPaid={() => { handleMarkPaid(selectedExpense); setSelectedExpense(null); }} 
                />
            )}
        </div>
    );
}

// --- Sub-Components ---

const ExpenseRow = ({ expense, onMarkPaid, onClick }: { expense: UnifiedExpense, onMarkPaid: (e: UnifiedExpense) => void, onClick: () => void }) => {
    const isOverdue = expense.status === 'Overdue';
    const isPaid = expense.status === 'Paid';
    
    // Icon & Color Logic
    const getIcon = () => {
        switch(expense.classification) {
            case 'Credit Card': return <CreditCard size={18} />;
            case 'Loan': return <Wallet size={18} />;
            case 'Subscription': return <Tv size={18} />;
            case 'Essential': return <Zap size={18} />;
            default: return <DollarSign size={18} />;
        }
    }

    const getClassColor = () => {
         switch(expense.classification) {
            case 'Credit Card': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Loan': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'Subscription': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Essential': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
         }
    }

    // Trend Visuals
    const TrendIndicator = () => {
        if (expense.trend === 'stable' || expense.trendDiff === 0) return <div className="text-center text-gray-400 font-medium text-xs">—</div>;
        
        const isUp = expense.trend === 'up'; // Increase in expense (Bad)
        const colorClass = isUp ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50';
        const Icon = isUp ? ArrowUp : ArrowDown;
        const sign = isUp ? '+' : '-';
        
        return (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg w-fit ${colorClass}`}>
                <Icon size={12} strokeWidth={3} />
                {sign}${Math.abs(expense.trendDiff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
        );
    };

    return (
        <div 
            className={`group relative p-4 md:px-6 md:py-4 transition-all cursor-pointer grid grid-cols-12 gap-2 md:gap-4 items-center border-l-4 hover:shadow-lg hover:bg-gray-50 ${isOverdue && !isPaid ? 'border-red-500 bg-red-50/10' : 'border-transparent hover:border-blue-400'}`}
            onClick={onClick}
        >
            {/* 1. Name & Icon */}
            <div className="col-span-7 md:col-span-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getClassColor()} shadow-sm group-hover:scale-105 transition-transform`}>
                    {getIcon()}
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 text-sm md:text-base leading-tight truncate">{expense.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                         <span className={`md:hidden text-[10px] font-bold px-1.5 py-0.5 rounded border ${getClassColor()}`}>{expense.classification}</span>
                         <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                             {isPaid ? <CheckCircle2 size={10} className="text-emerald-500"/> : isOverdue ? <AlertCircle size={10} className="text-red-500"/> : <Clock size={10}/>}
                             {isPaid ? 'Paid' : `Due ${expense.dueDate}${getOrdinal(expense.dueDate)}`}
                         </span>
                    </div>
                </div>
            </div>

            {/* 2. Classification Badge */}
            <div className="hidden md:flex col-span-2">
                 <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border ${getClassColor()}`}>
                     {expense.classification}
                 </span>
            </div>

            {/* 3. Trend */}
            <div className="hidden md:flex col-span-2 items-center">
                <TrendIndicator />
            </div>

            {/* 4. Lifetime Spent */}
            <div className="hidden md:block col-span-2 text-right">
                <p className="font-bold text-gray-700 text-sm">${expense.lifetimePaid.toLocaleString()}</p>
            </div>

            {/* 5. Amount (Aligned with Header) */}
            <div className="col-span-3 md:col-span-1 text-right">
                <p className={`font-bold text-sm md:text-base ${isPaid ? 'text-emerald-600 line-through opacity-60' : isOverdue ? 'text-red-600' : 'text-gray-900'}`}>${expense.amount.toLocaleString()}</p>
            </div>
            
            {/* 6. Action (Aligned with Header) */}
            <div className="col-span-2 md:col-span-1 flex justify-center">
                {expense.type === 'Bill' && !isPaid ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onMarkPaid(expense); }}
                        className="h-8 w-8 rounded-full bg-white border-2 border-gray-200 text-gray-300 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center group/btn"
                        title="Mark as Paid"
                    >
                        <CheckCircle2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                ) : isPaid ? (
                    <div className="h-8 w-8 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={18} />
                    </div>
                ) : (
                    <div className="w-8"></div> // Spacer
                )}
            </div>
        </div>
    )
}

const CalendarGrid = ({ expenses, selectedDate, onSelectDate }: { expenses: UnifiedExpense[], selectedDate: number | null, onSelectDate: (d: number) => void }) => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const startDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
        <div>
            {/* Header Days */}
            <div className="grid grid-cols-7 mb-2">
                 {['S','M','T','W','T','F','S'].map(d => (
                     <div key={d} className="text-center text-[9px] font-bold text-gray-400">{d}</div>
                 ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                    // Empty spacer
                    if (!day) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                    
                    // Logic for this day
                    const dayExpenses = expenses.filter(e => e.dueDate === day);
                    const isToday = day === today.getDate();
                    const isSelected = day === selectedDate;
                    const hasOverdue = dayExpenses.some(e => e.status === 'Overdue');
                    const hasPaid = dayExpenses.some(e => e.status === 'Paid');
                    const hasUpcoming = dayExpenses.some(e => e.status === 'Upcoming' || e.status === 'Due Soon');
                    
                    // Determine dot color
                    let dotColor = null;
                    if (hasOverdue) dotColor = 'bg-red-500';
                    else if (hasUpcoming) dotColor = 'bg-blue-400';
                    else if (hasPaid) dotColor = 'bg-emerald-400';

                    return (
                        <div 
                            key={day} 
                            onClick={() => onSelectDate(day)}
                            className={`
                                aspect-square rounded-full flex flex-col items-center justify-center cursor-pointer transition-all relative text-[10px] font-medium
                                ${isSelected ? 'bg-gray-900 text-white shadow-md scale-105 z-10' : 'hover:bg-gray-100 text-gray-600'}
                                ${isToday && !isSelected ? 'bg-blue-50 text-blue-600 font-bold' : ''}
                            `}
                        >
                            <span>{day}</span>
                            
                            {/* Dot Indicator */}
                            {dotColor && (
                                <div className={`absolute bottom-1 w-1 h-1 rounded-full ${dotColor} ${isSelected ? 'ring-1 ring-white' : ''}`}></div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const ExpenseDetailModal = ({ expense, onClose, onMarkPaid }: { expense: UnifiedExpense, onClose: () => void, onMarkPaid: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header Graphic */}
                <div className={`h-24 w-full bg-gradient-to-r ${
                    expense.classification === 'Essential' ? 'from-emerald-400 to-teal-500' :
                    expense.classification === 'Credit Card' ? 'from-blue-500 to-indigo-600' : 
                    expense.classification === 'Loan' ? 'from-orange-400 to-red-500' : 
                    'from-purple-500 to-pink-500'
                }`}>
                    <div className="absolute top-4 right-4">
                        <button onClick={onClose} className="p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="px-6 pb-6 -mt-10 relative">
                    <div className="flex justify-between items-end">
                        <div className="p-3 bg-white rounded-2xl shadow-lg border border-gray-100 inline-flex items-center justify-center">
                            {expense.classification === 'Credit Card' ? <CreditCard size={28} className="text-blue-600" /> : 
                             expense.classification === 'Loan' ? <Wallet size={28} className="text-orange-600" /> : 
                             expense.classification === 'Subscription' ? <Tv size={28} className="text-purple-600" /> :
                             <Zap size={28} className="text-emerald-600" />}
                        </div>
                        <div className="text-right mb-0.5">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Due Amount</p>
                             <p className="text-2xl font-black text-gray-900">${expense.amount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{expense.name}</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                             <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{expense.category}</span>
                             <span className="text-gray-300">•</span>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${expense.isEssential ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{expense.isEssential ? 'Essential' : 'Discretionary'}</span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Due Date</p>
                                    <p className="font-bold text-gray-900 text-sm">{expense.dateObj.toLocaleDateString(undefined, {month: 'long', day: 'numeric'})}</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold ${expense.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                {expense.status}
                            </div>
                        </div>

                         <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <History size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Lifetime Paid</p>
                                    <p className="font-bold text-gray-900 text-sm">${expense.lifetimePaid.toLocaleString()}</p>
                                </div>
                            </div>
                            {expense.trend !== 'stable' && (
                                <div className={`text-[10px] font-bold flex items-center gap-1 ${expense.trend === 'up' ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {expense.trend === 'up' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                                    {expense.trend === 'up' ? 'Increased' : 'Decreased'}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {expense.type === 'Bill' && expense.status !== 'Paid' && (
                        <button 
                            onClick={onMarkPaid}
                            className="w-full mt-6 bg-black hover:bg-gray-800 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-black/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={16} /> Mark as Paid
                        </button>
                    )}
                     {expense.status === 'Paid' && (
                         <div className="w-full mt-6 bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold text-sm border border-emerald-100 flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} /> Expense Paid
                        </div>
                     )}
                </div>
            </div>
        </div>
    )
}

const AddBillForm = ({ onClose, onSave }: { onClose: () => void, onSave: (b: Bill) => void }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const newBill: Bill = {
            id: Date.now().toString(),
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            amount: parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value),
            category: (form.elements.namedItem('category') as HTMLSelectElement).value as any,
            frequency: 'monthly',
            dueDate: parseInt((form.elements.namedItem('dueDate') as HTMLInputElement).value) || 1,
            isEssential: (form.elements.namedItem('essential') as HTMLInputElement).checked,
            autoPay: false,
            history: []
        };
        onSave(newBill);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-gray-900">Add Quick Bill</h3>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Expense Name</label>
                        <input name="name" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Netflix" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Amount</label>
                            <input name="amount" type="number" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Due Day</label>
                            <input name="dueDate" type="number" min="1" max="31" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1-31" required />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Category</label>
                        <select name="category" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="Utilities">Utilities</option>
                            <option value="Subscriptions">Subscriptions</option>
                            <option value="Housing">Housing</option>
                            <option value="Food">Food</option>
                            <option value="Transportation">Transportation</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Debt">Debt</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" name="essential" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="text-sm font-bold text-gray-700">Mark as Essential Expense</span>
                    </label>
                </div>
                <button type="submit" className="w-full mt-6 bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95">Save Expense</button>
            </form>
        </div>
    )
}
