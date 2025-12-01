import React from 'react';
import { Bill, Goal } from '../types';
import { Smartphone, Tv, Dumbbell, Car, Wifi, Zap, Plane, CreditCard, ShieldAlert } from 'lucide-react';

export const BillWidget = ({ bills }: { bills: Bill[] }) => {
  const getIcon = (name: string) => {
    switch(name) {
      case 'smartphone': return <Smartphone size={18} />;
      case 'tv': return <Tv size={18} />;
      case 'dumbbell': return <Dumbbell size={18} />;
      case 'car': return <Car size={18} />;
      case 'wifi': return <Wifi size={18} />;
      case 'zap': return <Zap size={18} />;
      default: return <Smartphone size={18} />;
    }
  };

  return (
    <div className="space-y-4">
      {bills.map((bill) => (
        <div key={bill.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-default border border-transparent hover:border-gray-100">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500">
                {getIcon(bill.icon)}
             </div>
             <div>
                <p className="text-sm font-bold text-gray-800">{bill.name}</p>
                <div className="flex items-center gap-2">
                     <span className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-600 font-medium">{bill.category}</span>
                     <p className="text-xs text-gray-400">{bill.frequency}</p>
                </div>
             </div>
          </div>
          <span className="text-sm font-bold text-gray-900">-${bill.amount}</span>
        </div>
      ))}
    </div>
  );
};

export const GoalWidget = ({ goals }: { goals: Goal[] }) => {
    
    const getIcon = (name: string) => {
        if (name.includes('Hawaii')) return <Plane size={16} className="text-sky-500" />;
        if (name.includes('Credit')) return <CreditCard size={16} className="text-emerald-500" />;
        return <ShieldAlert size={16} className="text-orange-500" />;
    };

    const getColor = (name: string) => {
        if (name.includes('Hawaii')) return 'bg-sky-500';
        if (name.includes('Credit')) return 'bg-emerald-500';
        return 'bg-orange-500';
    }

    return (
        <div className="space-y-6">
            {goals.map(goal => {
                const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
                return (
                    <div key={goal.id} className="group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-white shadow-sm border border-gray-100">
                                    {getIcon(goal.name)}
                                </div>
                                <div>
                                    <span className="block text-sm font-bold text-gray-800">{goal.name}</span>
                                    {goal.remainingMonths > 0 && (
                                        <span className="text-[10px] text-gray-400">{goal.remainingMonths} months left</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-bold text-gray-900">{percent}%</span>
                                <span className="text-[10px] text-gray-400">${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${getColor(goal.name)} rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: `${percent}%` }}
                            ></div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export const SavingsPromo = () => {
    return (
        <div className="bg-[#101010] p-6 rounded-[24px] relative overflow-hidden text-white shadow-xl">
            <div className="relative z-10">
                <div className="w-10 h-10 mb-4 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/10">
                   <Zap size={20} fill="currentColor" />
                </div>
                <h3 className="font-bold text-lg mb-2">Optimize Savings</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    AI analysis suggests you could save $240/mo by refinancing your auto loan.
                </p>
                <button className="w-full bg-white text-black text-xs font-bold py-3 rounded-xl uppercase tracking-wider hover:bg-gray-100 transition-colors">
                    View Insights
                </button>
            </div>
            
            {/* Decoration */}
            <div className="absolute top-0 right-0 -mt-6 -mr-6 opacity-20">
               <div className="w-32 h-32 rounded-full border-[12px] border-white/30 blur-sm"></div>
            </div>
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 opacity-10">
               <div className="w-24 h-24 rounded-full bg-blue-500 blur-xl"></div>
            </div>
        </div>
    )
}