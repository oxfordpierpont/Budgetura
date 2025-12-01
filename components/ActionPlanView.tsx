import React, { useState, useMemo } from 'react';
import { useDebt } from '../context/DebtContext';
import { sortDebts, simulatePayoffPlan } from '../utils/calculations';
import { Printer, CheckCircle2, Circle, TrendingDown, ArrowRight, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ActionPlanView = () => {
  const { cards, loans } = useDebt();
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [extraPayment, setExtraPayment] = useState(200);
  
  const allDebts = useMemo(() => [...cards, ...loans], [cards, loans]);
  
  // Run Simulation
  const simulation = useMemo(() => 
    simulatePayoffPlan(allDebts, extraPayment, strategy), 
  [allDebts, extraPayment, strategy]);

  // Baseline Simulation (Min payments only)
  const baseline = useMemo(() => 
    simulatePayoffPlan(allDebts, 0, strategy), 
  [allDebts, strategy]);

  const totalDebt = allDebts.reduce((sum, d) => sum + ('balance' in d ? d.balance : d.currentBalance), 0);
  const interestSaved = baseline.totalInterest - simulation.totalInterest;
  const timeSaved = baseline.timeline.length - simulation.timeline.length;

  const sortedDebts = sortDebts(allDebts, strategy);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Debt Action Plan</h1>
            <p className="text-gray-500 mt-1">Your personalized path to debt freedom.</p>
         </div>
         <button className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50">
             <Printer size={16} /> Print Plan
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Controls & Summary */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Strategy Selector */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Payoff Strategy</h3>
                <div className="space-y-3">
                    <button 
                        onClick={() => setStrategy('avalanche')}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${strategy === 'avalanche' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-gray-900">Avalanche</span>
                            {strategy === 'avalanche' && <CheckCircle2 size={18} className="text-blue-600" />}
                        </div>
                        <p className="text-xs text-gray-500">Highest Interest First. Saves most money.</p>
                    </button>

                    <button 
                        onClick={() => setStrategy('snowball')}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${strategy === 'snowball' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-gray-900">Snowball</span>
                            {strategy === 'snowball' && <CheckCircle2 size={18} className="text-blue-600" />}
                        </div>
                        <p className="text-xs text-gray-500">Lowest Balance First. Builds momentum.</p>
                    </button>
                </div>
            </div>

            {/* Extra Payment Slider */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Monthly Extra Payment</h3>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <span className="text-2xl font-bold text-gray-900">${extraPayment}</span>
                        <p className="text-xs text-gray-500">added to monthly budget</p>
                    </div>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="2000" 
                    step="50" 
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>$0</span>
                    <span>$1,000</span>
                    <span>$2,000+</span>
                </div>
            </div>

            {/* Impact Summary */}
            <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-6">Projected Impact</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <p className="text-indigo-200 text-xs uppercase tracking-wider font-bold">Debt Free Date</p>
                            <p className="text-2xl font-bold text-white">{simulation.payoffDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                            {timeSaved > 0 && <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white inline-block mt-1">{timeSaved} months sooner</span>}
                        </div>
                        
                        <div>
                            <p className="text-indigo-200 text-xs uppercase tracking-wider font-bold">Interest Saved</p>
                            <p className="text-2xl font-bold text-emerald-300">${Math.round(interestSaved).toLocaleString()}</p>
                            <p className="text-xs text-indigo-300 mt-1">vs paying minimums only</p>
                        </div>
                    </div>
                </div>
                {/* Decor */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-indigo-500/50 blur-xl"></div>
            </div>

        </div>

        {/* Right Col: Timeline & Priority */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Payoff Chart */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-6">Payoff Timeline</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={simulation.timeline}>
                            <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis 
                                dataKey="month" 
                                stroke="#9CA3AF" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(m) => m % 12 === 0 ? `${m/12}yr` : ''} 
                            />
                            <YAxis 
                                stroke="#9CA3AF" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(val) => `$${val/1000}k`} 
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(val: number) => [`$${Math.round(val).toLocaleString()}`, 'Remaining Balance']}
                                labelFormatter={(label) => `Month ${label}`}
                            />
                            <Area type="monotone" dataKey="totalBalance" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Priority Queue */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                <h2 className="font-bold text-xl mb-6">Payoff Priority Queue</h2>
                <div className="relative">
                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-100 z-0"></div>
                    {sortedDebts.map((debt, index) => {
                        const isCard = 'balance' in debt;
                        const balance = isCard ? debt.balance : debt.currentBalance;
                        const rate = isCard ? debt.apr : debt.rate;
                        
                        return (
                            <div key={debt.id} className="relative z-10 pl-16 pb-8 last:pb-0">
                                <div className={`absolute left-0 top-0 w-12 h-12 rounded-full border-4 border-white flex items-center justify-center font-bold shadow-sm ${index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {index + 1}
                                </div>
                                <div className={`p-5 rounded-2xl border ${index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{debt.name}</h3>
                                            <p className="text-sm text-gray-500">Balance: <strong>${balance.toLocaleString()}</strong> • Rate: <strong>{rate}%</strong></p>
                                        </div>
                                        {index === 0 && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Focus Debt</span>}
                                    </div>
                                    {index === 0 && (
                                        <div className="mt-3 p-3 bg-white/60 rounded-xl text-sm text-blue-800 border border-blue-100">
                                            💡 <strong>Action:</strong> Pay minimums on everything else. Put <strong>all ${extraPayment + (isCard ? debt.minimumPayment : debt.monthlyPayment)}</strong> toward this debt!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ActionPlanView;