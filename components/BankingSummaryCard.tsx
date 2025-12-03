import React from 'react';
import { BankAccount } from '../types';
import { Wallet, ArrowRight, Landmark } from 'lucide-react';

interface Props {
    accounts?: BankAccount[];
    onNavigate: (view: string) => void;
}

const BankingSummaryCard: React.FC<Props> = ({ accounts = [], onNavigate }) => {
    // Safety check for array
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    
    // Filter for depository (cash) accounts
    const cashAccounts = safeAccounts.filter(a => a.type === 'depository');
    const totalCash = cashAccounts.reduce((sum, a) => sum + (a.available_balance || a.current_balance), 0);

    return (
        <div className="bg-[#1e293b] rounded-[32px] p-6 md:p-8 text-white relative overflow-hidden shadow-xl w-full">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

            <div className="relative z-10">
                {/* Header Row */}
                <div className="flex justify-between items-center mb-8">
                     <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white/10 rounded-2xl backdrop-blur-md shadow-inner border border-white/10 flex items-center justify-center">
                            <Wallet size={24} className="text-blue-300" />
                         </div>
                         <div>
                             <h2 className="text-lg font-bold text-white leading-tight">Banking & Cash</h2>
                             <p className="text-blue-200/60 text-xs font-medium uppercase tracking-wider">Overview</p>
                         </div>
                     </div>
                     <button 
                        onClick={() => onNavigate('bank-accounts')}
                        className="group text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 border border-white/10 hover:border-white/20 shadow-sm"
                     >
                        Manage <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform text-blue-300" />
                     </button>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    
                    {/* Left: Total Cash */}
                    <div>
                        <div className="mb-1">
                            <p className="text-blue-200/80 text-xs font-bold uppercase tracking-widest">Total Available Cash</p>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">${totalCash.toLocaleString()}</h3>
                        <p className="text-sm text-blue-200/50 font-medium">Across {cashAccounts.length} active accounts</p>
                    </div>

                    {/* Right: Account List */}
                    <div className="flex flex-col gap-3">
                        {cashAccounts.length > 0 ? (
                            <>
                                {cashAccounts.slice(0, 2).map(acc => (
                                    <div 
                                        key={acc.id} 
                                        className="flex items-center justify-between p-4 bg-black/20 hover:bg-black/30 rounded-2xl transition-colors border border-white/5 group cursor-pointer backdrop-blur-sm" 
                                        onClick={() => onNavigate('bank-accounts')}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-200 group-hover:bg-white/10 transition-colors border border-white/5">
                                                <Landmark size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold leading-none text-gray-100">{acc.name}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[10px] bg-white/10 text-blue-200 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{acc.subtype}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono">•••• {acc.mask}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="font-bold text-base text-white tracking-tight">${acc.current_balance.toLocaleString()}</span>
                                    </div>
                                ))}
                                {cashAccounts.length > 2 && (
                                    <button onClick={() => onNavigate('bank-accounts')} className="w-full text-center text-xs font-bold text-blue-300/80 hover:text-white mt-1 transition-colors py-2">
                                        + {cashAccounts.length - 2} more accounts
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-6 text-sm text-gray-400 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                No cash accounts connected.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankingSummaryCard;