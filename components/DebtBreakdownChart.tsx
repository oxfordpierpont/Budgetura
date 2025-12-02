import React, { useMemo } from 'react';
import { useDebt } from '../context/DebtContext';

const DebtBreakdownChart = () => {
  const { cards, loans } = useDebt();

  const debtSummary = useMemo(() => {
    const creditCardDebt = cards.reduce((sum, card) => sum + card.balance, 0);
    const loanDebt = loans.reduce((sum, loan) => sum + loan.currentBalance, 0);
    const totalDebt = creditCardDebt + loanDebt;

    if (totalDebt === 0) {
      return [];
    }

    return [
      {
        category: 'Credit Cards',
        amount: creditCardDebt,
        percentage: (creditCardDebt / totalDebt) * 100,
        color: '#EF4444' // Red
      },
      {
        category: 'Loans',
        amount: loanDebt,
        percentage: (loanDebt / totalDebt) * 100,
        color: '#F59E0B' // Orange/Yellow
      }
    ].filter(item => item.amount > 0);
  }, [cards, loans]);

  if (debtSummary.length === 0) {
    return (
      <div className="w-full text-center py-8 text-gray-500">
        <p>No debt data to display</p>
        <p className="text-sm mt-2">Add credit cards or loans to see your debt breakdown</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Stacked Bar */}
      <div className="h-14 w-full flex rounded-xl overflow-hidden mb-6 shadow-sm">
        {debtSummary.map((item, index) => (
          <div
            key={index}
            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
            className="h-full relative group transition-all duration-300 hover:opacity-90 cursor-help"
            title={`${item.category}: $${item.amount.toLocaleString()}`}
          >
             {item.percentage > 10 && (
                 <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow-md">
                     {item.percentage.toFixed(1)}%
                 </div>
             )}
          </div>
        ))}
      </div>

      {/* Legend / Stats */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
         {debtSummary.map((item, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl flex-1 border border-gray-100">
               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
               <div>
                  <p className="text-xs text-gray-500 font-medium">{item.category}</p>
                  <div className="flex items-baseline gap-2">
                     <p className="font-bold text-gray-900">${item.amount.toLocaleString()}</p>
                     <p className="text-xs text-gray-400">({item.percentage.toFixed(1)}%)</p>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default DebtBreakdownChart;
