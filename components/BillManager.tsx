import React, { useState } from 'react';
import { useDebt } from '../context/DebtContext';
import { Plus, Trash2, Receipt, CalendarClock, Zap } from 'lucide-react';
import { Bill } from '../types';

const BillManager = () => {
    const { bills, addBill, deleteBill } = useDebt();
    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <div className="p-4 md:p-8 space-y-8 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bills & Expenses</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage recurring monthly obligations.</p>
                </div>
                <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="group flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-gray-500/20 hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
                >
                <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
                    <Plus size={16} /> 
                </div>
                Add Bill
                </button>
            </div>

            {showAddForm && <AddBillForm onClose={() => setShowAddForm(false)} onSave={addBill} />}

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                            <tr>
                                <th className="p-5">Bill Name</th>
                                <th className="p-5">Category</th>
                                <th className="p-5">Amount</th>
                                <th className="p-5">Frequency</th>
                                <th className="p-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {bills.map(bill => (
                                <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="p-5 font-bold text-gray-900 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                            <Receipt size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {bill.name}
                                                {bill.isEssential && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Essential"></span>}
                                            </div>
                                            {bill.autoPay && <span className="text-[10px] text-green-600 font-medium flex items-center gap-1"><Zap size={10} fill="currentColor" /> Auto-Pay</span>}
                                        </div>
                                    </td>
                                    <td className="p-5 text-sm text-gray-500">
                                        <span className="bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold text-gray-600">{bill.category}</span>
                                    </td>
                                    <td className="p-5 font-bold text-gray-900">${bill.amount.toLocaleString()}</td>
                                    <td className="p-5 text-sm text-gray-500 capitalize">{bill.frequency}</td>
                                    <td className="p-5 text-right">
                                        <button onClick={() => deleteBill(bill.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const AddBillForm = ({ onClose, onSave }: { onClose: () => void, onSave: (b: Bill) => void }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const bill: Bill = {
            id: Date.now().toString(),
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            category: (form.elements.namedItem('category') as HTMLSelectElement).value as any,
            amount: parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value),
            frequency: (form.elements.namedItem('frequency') as HTMLSelectElement).value as any,
            isEssential: (form.elements.namedItem('essential') as HTMLInputElement).checked,
            autoPay: (form.elements.namedItem('autopay') as HTMLInputElement).checked,
            icon: 'receipt'
        };
        onSave(bill);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200">
                <h3 className="font-black text-2xl text-gray-900 mb-6">Add Bill</h3>
                
                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Bill Name</label>
                        <input name="name" required placeholder="e.g. Netflix" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Category</label>
                        <select name="category" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900">
                            <option value="Housing">Housing</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Food">Food</option>
                            <option value="Transportation">Transportation</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Subscriptions">Subscriptions</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Amount</label>
                        <input name="amount" type="number" step="any" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Frequency</label>
                        <select name="frequency" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900">
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="annually">Annually</option>
                        </select>
                    </div>
                    <div className="flex gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="essential" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-bold text-gray-700">Essential Expense?</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="autopay" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-bold text-gray-700">Auto-Pay Enabled?</span>
                        </label>
                    </div>
                </div>

                <div className="flex gap-4 justify-end">
                    <button type="button" onClick={onClose} className="px-6 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">Save Bill</button>
                </div>
            </form>
        </div>
    );
};

export default BillManager;