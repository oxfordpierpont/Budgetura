import React from 'react';
import { useDebt } from '../context/DebtContext';
import { Calendar, TrendingDown, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ProgressView = () => {
  const { snapshots } = useDebt();

  // Sort by date ascending for chart
  const chartData = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(s => ({
      date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      debt: s.totalDebt
  }));

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">
       
       <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-xl text-gray-900 mb-6">Total Debt Reduction</h2>
          <div className="h-64 w-full">
             {chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(val: number) => [`$${val.toLocaleString()}`, 'Total Debt']}
                        />
                        <Line type="monotone" dataKey="debt" stroke="#3B82F6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                 </ResponsiveContainer>
             ) : (
                 <div className="h-full flex items-center justify-center text-gray-400">
                    No snapshot data yet. Create your first snapshot on the Dashboard.
                 </div>
             )}
          </div>
       </div>

       <div className="space-y-4">
          <h2 className="font-bold text-xl text-gray-900">Snapshot History</h2>
          {snapshots.map(snap => (
              <div key={snap.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 rounded-xl text-gray-500">
                          <Calendar size={20} />
                      </div>
                      <div>
                          <p className="font-bold text-gray-900">{new Date(snap.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                          <div className="flex gap-3 text-xs text-gray-500 mt-1">
                             <span>DTI: {snap.dtiRatio.toFixed(1)}%</span>
                             <span>•</span>
                             <span>Util: {snap.creditUtilization}%</span>
                          </div>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="font-bold text-gray-900 text-lg">${snap.totalDebt.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">Total Debt</p>
                  </div>
              </div>
          ))}
       </div>

    </div>
  );
};

export default ProgressView;
