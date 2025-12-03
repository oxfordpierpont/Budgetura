
import React, { useState, useMemo } from 'react';
import { useDebt } from '../context/DebtContext';
import { 
  Plus, Trash2, Target, Trophy, ArrowRight, TrendingUp, 
  Wallet, PiggyBank, Clock, Calendar, CheckCircle2, 
  AlertCircle, CreditCard, Landmark, Sparkles, X, Edit2,
  Rocket, ShieldCheck, Plane, Car, Home
} from 'lucide-react';
import { Goal, CreditCard as CreditCardType, Loan } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Helpers ---
const getGoalIcon = (type: string) => {
    switch(type) {
        case 'Savings': return <Wallet size={24} />;
        case 'Emergency Fund': return <ShieldCheck size={24} />;
        case 'Debt Payoff': return <CreditCard size={24} />;
        case 'Purchase': return <Car size={24} />;
        case 'Investment': return <TrendingUp size={24} />;
        default: return <Target size={24} />;
    }
};

const getGoalColor = (type: string) => {
    switch(type) {
        case 'Savings': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'Emergency Fund': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'Debt Payoff': return 'bg-red-50 text-red-600 border-red-100';
        case 'Purchase': return 'bg-purple-50 text-purple-600 border-purple-100';
        case 'Investment': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
};

const GoalManager = () => {
    const { goals, cards, loans, addGoal, deleteGoal, updateGoal } = useDebt();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    // --- Data Aggregation ---
    
    // 1. Debt Commitments (Extra Payments)
    const cardCommitments = cards.filter(c => (c.extraPayment || 0) > 0);
    const loanCommitments = loans.filter(l => (l.extraPayment || 0) > 0);
    const totalDebtCommitment = 
        cardCommitments.reduce((sum, c) => sum + (c.extraPayment || 0), 0) + 
        loanCommitments.reduce((sum, l) => sum + (l.extraPayment || 0), 0);

    // 2. Goal Commitments
    const totalGoalContribution = goals.reduce((sum, g) => sum + g.monthlyContribution, 0);
    const totalCurrentSavings = goals.reduce((sum, g) => sum + g.current, 0);
    const totalTargetSavings = goals.reduce((sum, g) => sum + g.target, 0);
    
    // 3. Combined Velocity
    const totalMonthlyVelocity = totalGoalContribution + totalDebtCommitment;

    // 4. Projection Data (Next 12 Months)
    const projectionData = useMemo(() => {
        const data = [];
        let runningTotal = totalCurrentSavings;
        for(let i = 0; i <= 12; i++) {
            data.push({
                month: i,
                savings: runningTotal
            });
            runningTotal += totalGoalContribution;
        }
        return data;
    }, [totalCurrentSavings, totalGoalContribution]);

    return (
        <div className="p-4 md:p-8 space-y-8 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">
             
             {/* Header */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Goals</h1>
                    <p className="text-gray-500 mt-1 font-medium">Track your savings targets and debt payoff commitments.</p>
                </div>
                <button 
                    onClick={() => setShowAddForm(true)}
                    className="group flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-purple-500/20 hover:bg-purple-700 transition-all hover:scale-105 active:scale-95"
                >
                    <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
                        <Plus size={16} /> 
                    </div>
                    New Goal
                </button>
            </div>
            
            {/* Forms */}
            {showAddForm && <AddGoalForm onClose={() => setShowAddForm(false)} onSave={addGoal} />}
            {editingGoal && <EditGoalForm goal={editingGoal} onClose={() => setEditingGoal(null)} onSave={(g) => { updateGoal(g.id, g); setEditingGoal(null); }} />}

            {/* --- Summary Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Monthly Velocity */}
                <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-50 to-purple-100 opacity-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                            <Rocket size={24} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase bg-purple-50 text-purple-600">
                            Velocity
                        </span>
                    </div>
                    
                    <div className="relative z-10">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Monthly Commitment</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-black text-gray-900 tracking-tight">${totalMonthlyVelocity.toLocaleString()}</span>
                            <span className="text-sm font-bold text-gray-400">/mo</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                             <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"><Wallet size={10} /> ${totalGoalContribution} Savings</span>
                             <span className="text-gray-300">+</span>
                             <span className="flex items-center gap-1 text-red-500 bg-red-50 px-1.5 py-0.5 rounded"><CreditCard size={10} /> ${totalDebtCommitment} Debt</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Total Saved */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100/50 relative overflow-hidden">
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-500">
                            <PiggyBank size={24} />
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-sm">
                           <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Liquidity</span>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <p className="text-emerald-800/80 text-xs font-bold uppercase tracking-widest mb-1">Total Saved</p>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-4xl font-black text-gray-900 tracking-tight">${totalCurrentSavings.toLocaleString()}</span>
                        </div>
                         <div className="h-2 w-full bg-emerald-200/50 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 shadow-sm" style={{ width: `${totalTargetSavings > 0 ? (totalCurrentSavings/totalTargetSavings)*100 : 0}%` }}></div>
                        </div>
                        <p className="text-[10px] text-emerald-700 font-bold mt-2 text-right">
                            {totalTargetSavings > 0 ? Math.round((totalCurrentSavings/totalTargetSavings)*100) : 0}% of ${totalTargetSavings.toLocaleString()} Target
                        </p>
                    </div>
                </div>

                {/* Card 3: Projection Chart */}
                <div className="bg-white p-6 rounded-[24px] shadow-xl border border-gray-100 relative overflow-hidden flex flex-col justify-between">
                     <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-500" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">1 Year Projection</span>
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            +${(totalGoalContribution * 12).toLocaleString()}
                        </span>
                     </div>
                     <div className="h-24 w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={projectionData}>
                                <defs>
                                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '8px', fontSize: '12px' }}
                                    formatter={(val: number) => [`$${val.toLocaleString()}`, 'Projected Savings']}
                                    labelFormatter={() => ''}
                                />
                                <Area type="monotone" dataKey="savings" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorSavings)" />
                            </AreaChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            </div>

            {/* --- Debt Commitments Section --- */}
            {(cardCommitments.length > 0 || loanCommitments.length > 0) && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="bg-red-100 p-1.5 rounded-lg text-red-600"><CreditCard size={16} /></div>
                        Debt Payoff Commitments
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-md ml-2">Derived from Debt Managers</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cardCommitments.map(card => (
                            <DebtCommitmentCard 
                                key={`c-${card.id}`} 
                                name={card.name} 
                                type="Credit Card" 
                                extraAmount={card.extraPayment || 0} 
                            />
                        ))}
                        {loanCommitments.map(loan => (
                            <DebtCommitmentCard 
                                key={`l-${loan.id}`} 
                                name={loan.name} 
                                type="Loan" 
                                extraAmount={loan.extraPayment || 0} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* --- Active Goals Section --- */}
            <div>
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Target size={16} /></div>
                        Active Goals
                    </h3>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{goals.length} Goals</span>
                 </div>
                 
                 {goals.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                        <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">No active goals</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto mt-2">Start saving for a vacation, emergency fund, or major purchase.</p>
                        <button onClick={() => setShowAddForm(true)} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/30">Create First Goal</button>
                    </div>
                 ) : (
                    <div className="space-y-4">
                        {goals.map(goal => (
                            <GoalRow 
                                key={goal.id} 
                                goal={goal} 
                                onDelete={deleteGoal} 
                                onEdit={setEditingGoal} 
                            />
                        ))}
                    </div>
                 )}
            </div>
        </div>
    );
};

// --- Sub-Components ---

const DebtCommitmentCard = ({ name, type, extraAmount }: { name: string, type: string, extraAmount: number }) => {
    return (
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-[40px] -mr-2 -mt-2 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                        {type === 'Credit Card' ? <CreditCard size={20} /> : <Landmark size={20} />}
                    </div>
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded uppercase tracking-wide">Auto-Pay</span>
                </div>
                <h4 className="font-bold text-gray-900 truncate pr-4">{name}</h4>
                <p className="text-xs text-gray-500 mb-4">Extra Principal Payment</p>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-gray-900">${extraAmount}</span>
                    <span className="text-xs font-bold text-gray-400">/mo</span>
                </div>
            </div>
        </div>
    )
}

const GoalRow = ({ goal, onDelete, onEdit }: { goal: Goal, onDelete: (id: string) => void, onEdit: (g: Goal) => void }) => {
    const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
    const styleClass = getGoalColor(goal.type);
    
    // Calculate months left dynamically if contribution exists
    const monthsLeft = goal.monthlyContribution > 0 
        ? Math.ceil((goal.target - goal.current) / goal.monthlyContribution) 
        : Infinity;
    
    const formattedDate = monthsLeft !== Infinity 
        ? new Date(new Date().setMonth(new Date().getMonth() + monthsLeft)).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) 
        : 'N/A';

    return (
        <div className="bg-white rounded-[24px] p-5 md:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex flex-col md:flex-row items-center gap-6">
                
                {/* Icon & Info */}
                <div className="flex items-center gap-5 w-full md:w-1/3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${styleClass}`}>
                        {getGoalIcon(goal.type)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{goal.name}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styleClass}`}>{goal.type}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${goal.priority === 'High' ? 'bg-red-50 text-red-600' : goal.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                                {goal.priority} Priority
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress Stats */}
                <div className="flex-1 w-full md:w-auto">
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Current Balance</span>
                            <span className="text-xl font-bold text-gray-900">${goal.current.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                             <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Target</span>
                             <div className="text-sm font-bold text-gray-900">${goal.target.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden relative">
                         <div className={`h-full rounded-full transition-all duration-1000 ease-out ${goal.type === 'Emergency Fund' ? 'bg-blue-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-xs font-bold text-emerald-600">{progress}% Complete</span>
                        {goal.monthlyContribution > 0 ? (
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                <Clock size={10} /> Est. Completion: {formattedDate}
                            </span>
                        ) : (
                             <span className="text-[10px] font-bold text-orange-400 flex items-center gap-1">
                                <AlertCircle size={10} /> No Contribution
                            </span>
                        )}
                    </div>
                </div>
                
                {/* Contribution & Actions */}
                <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-6 pl-0 md:pl-6 md:border-l border-gray-100 min-w-[180px]">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Monthly Input</p>
                        <div className="flex items-center gap-1">
                             <span className="text-xl font-black text-gray-900">+${goal.monthlyContribution}</span>
                             <span className="text-xs font-bold text-gray-400">/mo</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => onEdit(goal)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"><Edit2 size={16} /></button>
                         <button onClick={() => onDelete(goal.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const AddGoalForm = ({ onClose, onSave }: { onClose: () => void, onSave: (g: Goal) => void }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const target = parseFloat((form.elements.namedItem('target') as HTMLInputElement).value);
        const current = parseFloat((form.elements.namedItem('current') as HTMLInputElement).value);
        const monthly = parseFloat((form.elements.namedItem('monthly') as HTMLInputElement).value);
        
        const goal: Goal = {
            id: Date.now().toString(),
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            type: (form.elements.namedItem('type') as HTMLSelectElement).value as any,
            target,
            current,
            monthlyContribution: monthly,
            remainingMonths: monthly > 0 ? Math.ceil((target - current) / monthly) : 0,
            priority: (form.elements.namedItem('priority') as HTMLSelectElement).value as any
        };
        onSave(goal);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-black text-2xl text-gray-900">Create Goal</h3>
                        <p className="text-gray-500 text-sm mt-1">Set a new savings target.</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Goal Name</label>
                        <input name="name" required placeholder="e.g. Hawaii Vacation" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all" />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Goal Type</label>
                        <select name="type" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900">
                            <option value="Savings">General Savings</option>
                            <option value="Emergency Fund">Emergency Fund</option>
                            <option value="Purchase">Major Purchase (Home, Car)</option>
                            <option value="Investment">Investment</option>
                            <option value="Debt Payoff">Debt Payoff Target</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Amount ($)</label>
                            <input name="target" type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Currently Saved ($)</label>
                            <input name="current" type="number" defaultValue={0} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly Contribution ($)</label>
                            <input name="monthly" type="number" defaultValue={100} required className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl outline-none font-bold text-emerald-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
                            <select name="priority" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 justify-end mt-8">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-xl shadow-purple-500/30 transition-all active:scale-95 flex items-center gap-2">
                        <Plus size={18} /> Create Goal
                    </button>
                </div>
            </form>
        </div>
    );
};

const EditGoalForm = ({ goal, onClose, onSave }: { goal: Goal, onClose: () => void, onSave: (g: Goal) => void }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const target = parseFloat((form.elements.namedItem('target') as HTMLInputElement).value);
        const current = parseFloat((form.elements.namedItem('current') as HTMLInputElement).value);
        const monthly = parseFloat((form.elements.namedItem('monthly') as HTMLInputElement).value);
        
        const updatedGoal: Goal = {
            ...goal,
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            type: (form.elements.namedItem('type') as HTMLSelectElement).value as any,
            target,
            current,
            monthlyContribution: monthly,
            remainingMonths: monthly > 0 ? Math.ceil((target - current) / monthly) : 0,
            priority: (form.elements.namedItem('priority') as HTMLSelectElement).value as any
        };
        onSave(updatedGoal);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-black text-2xl text-gray-900">Edit Goal</h3>
                        <p className="text-gray-500 text-sm mt-1">Update your savings target.</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Goal Name</label>
                        <input name="name" defaultValue={goal.name} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Goal Type</label>
                        <select name="type" defaultValue={goal.type} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900">
                            <option value="Savings">General Savings</option>
                            <option value="Emergency Fund">Emergency Fund</option>
                            <option value="Purchase">Major Purchase</option>
                            <option value="Investment">Investment</option>
                            <option value="Debt Payoff">Debt Payoff Target</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Amount ($)</label>
                            <input name="target" type="number" defaultValue={goal.target} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Currently Saved ($)</label>
                            <input name="current" type="number" defaultValue={goal.current} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly Contribution ($)</label>
                            <input name="monthly" type="number" defaultValue={goal.monthlyContribution} required className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl outline-none font-bold text-emerald-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
                            <select name="priority" defaultValue={goal.priority} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 justify-end mt-8">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2">
                        <Edit2 size={18} /> Update Goal
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GoalManager;
