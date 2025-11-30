import React, { useState } from 'react';
import { useDebt } from '../context/DebtContext';
import { Plus, Trash2, Wallet, Car, GraduationCap, Home, Percent, Calendar } from 'lucide-react';
import { Loan } from '../types';

const LoanManager = () => {
  const { loans, addLoan, deleteLoan } = useDebt();
  const [showAddForm, setShowAddForm] = useState(false);

  const getIcon = (type: string) => {
      switch(type) {
          case 'Auto': return <Car size={24} />;
          case 'Student': return <GraduationCap size={24} />;
          case 'Mortgage': return <Home size={24} />;
          default: return <Wallet size={24} />;
      }
  };

  const getColor = (type: string) => {
      switch(type) {
          case 'Auto': return 'bg-orange-100 text-orange-600';
          case 'Student': return 'bg-indigo-100 text-indigo-600';
          case 'Mortgage': return 'bg-blue-100 text-blue-600';
          default: return 'bg-gray-100 text-gray-600';
      }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Loan Manager</h1>
            <p className="text-gray-500 mt-1 font-medium">Track your installment loans and mortgages.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="group flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-gray-500/20 hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
             <Plus size={16} /> 
          </div>
          Add New Loan
        </button>
      </div>

      {showAddForm && <AddLoanForm onClose={() => setShowAddForm(false)} onSave={addLoan} />}

      {loans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
             <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Wallet size={32} />
             </div>
             <h3 className="text-xl font-bold text-gray-900">No loans tracked</h3>
             <p className="text-gray-500 mb-8 max-w-md mx-auto mt-2">Add your student loans, auto loans, or mortgages.</p>
          </div>
      ) : (
        <div className="grid gap-4">
            {loans.map(loan => (
                <div key={loan.id} className="bg-white p-6 rounded-[24px] border border-gray-100 hover:shadow-lg transition-all group relative">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getColor(loan.type)}`}>
                                {getIcon(loan.type)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{loan.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">{loan.type}</span>
                                    <span>•</span>
                                    <span>{loan.rate}% Interest</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto pl-[72px] sm:pl-0">
                            <p className="font-black text-2xl text-gray-900">${loan.currentBalance.toLocaleString()}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Principal</p>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400 mb-1 font-bold uppercase">Monthly Pay</p>
                            <p className="font-bold text-gray-800">${loan.monthlyPayment.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400 mb-1 font-bold uppercase">Original</p>
                            <p className="font-bold text-gray-800">${loan.originalPrincipal.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400 mb-1 font-bold uppercase">Term</p>
                            <p className="font-bold text-gray-800">{loan.termMonths} Months</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400 mb-1 font-bold uppercase">Progress</p>
                            <p className="font-bold text-gray-800">{Math.round((1 - (loan.currentBalance / loan.originalPrincipal)) * 100)}% Paid</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => deleteLoan(loan.id)}
                        className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

const AddLoanForm = ({ onClose, onSave }: { onClose: () => void, onSave: (l: Loan) => void }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const loan: Loan = {
            id: Date.now().toString(),
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            type: (form.elements.namedItem('type') as HTMLSelectElement).value as any,
            currentBalance: parseFloat((form.elements.namedItem('balance') as HTMLInputElement).value),
            originalPrincipal: parseFloat((form.elements.namedItem('principal') as HTMLInputElement).value),
            rate: parseFloat((form.elements.namedItem('rate') as HTMLInputElement).value),
            termMonths: parseInt((form.elements.namedItem('term') as HTMLInputElement).value),
            monthlyPayment: parseFloat((form.elements.namedItem('payment') as HTMLInputElement).value),
        };
        onSave(loan);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <h3 className="font-black text-2xl text-gray-900 mb-6">Add New Loan</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Loan Name</label>
                        <input name="name" required placeholder="e.g. Student Loan" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-900" />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Type</label>
                         <select name="type" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-gray-900 appearance-none">
                             <option value="Personal">Personal Loan</option>
                             <option value="Auto">Auto Loan</option>
                             <option value="Student">Student Loan</option>
                             <option value="Mortgage">Mortgage</option>
                             <option value="Other">Other</option>
                         </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Current Balance</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span><input name="balance" type="number" step="any" required className="w-full pl-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-gray-900" /></div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Original Principal</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span><input name="principal" type="number" step="any" required className="w-full pl-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-gray-900" /></div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Interest Rate (%)</label>
                        <div className="relative"><Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input name="rate" type="number" step="any" required className="w-full pl-11 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-gray-900" /></div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Monthly Payment</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span><input name="payment" type="number" step="any" required className="w-full pl-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-gray-900" /></div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Term (Months)</label>
                        <div className="relative"><Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input name="term" type="number" required className="w-full pl-11 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-gray-900" /></div>
                    </div>
                </div>

                <div className="flex gap-4 justify-end">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95">Save Loan</button>
                </div>
            </form>
        </div>
    );
};

export default LoanManager;