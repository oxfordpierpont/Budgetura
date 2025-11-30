import React, { useState } from 'react';
import { useDebt } from '../context/DebtContext';
import { Plus, Trash2, Target, Trophy, ArrowRight } from 'lucide-react';
import { Goal } from '../types';

const GoalManager = () => {
    const { goals, addGoal, deleteGoal } = useDebt();
    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <div className="p-4 md:p-8 space-y-8 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Goals</h1>
                    <p className="text-gray-500 mt-1 font-medium">Set targets and track your progress.</p>
                </div>
                <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="group flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-gray-500/20 hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
                >
                <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
                    <Plus size={16} /> 
                </div>
                New Goal
                </button>
            </div>
            
            {showAddForm && <AddGoalForm onClose={() => setShowAddForm(false)} onSave={addGoal} />}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
                    return (
                        <div key={goal.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-lg transition-all relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl">
                                    <Target size={24} />
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${goal.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {goal.priority} Priority
                                </span>
                            </div>
                            
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{goal.name}</h3>
                            <p className="text-sm text-gray-500 mb-6">{goal.type}</p>
                            
                            <div className="mb-2 flex justify-between items-end">
                                <span className="text-3xl font-black text-gray-900">{progress}%</span>
                                <span className="text-sm font-bold text-gray-400">${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}</span>
                            </div>
                            
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs font-bold text-gray-400 border-t border-gray-50 pt-4">
                                <span>Contrib: ${goal.monthlyContribution}/mo</span>
                                <span>{goal.remainingMonths} mos left</span>
                            </div>

                            <button 
                                onClick={() => deleteGoal(goal.id)}
                                className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

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
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200">
                <h3 className="font-black text-2xl text-gray-900 mb-6">Create Goal</h3>
                
                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Goal Name</label>
                        <input name="name" required placeholder="e.g. Hawaii Vacation" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Type</label>
                        <select name="type" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900">
                            <option value="Savings">Savings</option>
                            <option value="Debt Payoff">Debt Payoff</option>
                            <option value="Emergency Fund">Emergency Fund</option>
                            <option value="Purchase">Major Purchase</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Target Amount</label>
                            <input name="target" type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Current Saved</label>
                            <input name="current" type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Monthly Contribution</label>
                        <input name="monthly" type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Priority</label>
                        <select name="priority" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900">
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 justify-end">
                    <button type="button" onClick={onClose} className="px-6 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-2 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition-all">Create Goal</button>
                </div>
            </form>
        </div>
    );
};

export default GoalManager;