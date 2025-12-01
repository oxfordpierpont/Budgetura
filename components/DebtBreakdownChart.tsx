import React from 'react';
import { DEBT_SUMMARY } from '../constants';

const DebtBreakdownChart = () => {
  return (
    <div className="w-full">
      {/* Stacked Bar */}
      <div className="h-14 w-full flex rounded-xl overflow-hidden mb-6 shadow-sm">
        {DEBT_SUMMARY.map((item, index) => (
          <div 
            key={index}
            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
            className="h-full relative group transition-all duration-300 hover:opacity-90 cursor-help"
            title={`${item.category}: $${item.amount.toLocaleString()}`}
          >
             {item.percentage > 10 && (
                 <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow-md">
                     {item.percentage}%
                 </div>
             )}
          </div>
        ))}
      </div>

      {/* Legend / Stats */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
         {DEBT_SUMMARY.map((item, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl flex-1 border border-gray-100">
               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
               <div>
                  <p className="text-xs text-gray-500 font-medium">{item.category}</p>
                  <div className="flex items-baseline gap-2">
                     <p className="font-bold text-gray-900">${item.amount.toLocaleString()}</p>
                     <p className="text-xs text-gray-400">({item.percentage}%)</p>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default DebtBreakdownChart;