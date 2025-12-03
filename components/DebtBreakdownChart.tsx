import React, { useMemo } from 'react';
import { useDebt } from '../context/DebtContext';

const DebtBreakdownChart = () => {
  const { cards, loans } = useDebt();

  const data = useMemo(() => {
    // 1. Calculate Credit Card Total
    const totalCardBalance = cards.reduce((sum, card) => sum + card.balance, 0);

    // 2. Group Loans by Type
    const loanBreakdowns: Record<string, number> = {};
    loans.forEach(loan => {
      const type = loan.type || 'Other';
      loanBreakdowns[type] = (loanBreakdowns[type] || 0) + loan.currentBalance;
    });

    // 3. Total Debt Calculation
    const totalDebt = totalCardBalance + loans.reduce((sum, loan) => sum + loan.currentBalance, 0);

    if (totalDebt === 0) return [];

    const items = [];

    // Add Credit Cards Entry
    if (totalCardBalance > 0) {
      items.push({
        category: 'Credit Cards',
        amount: totalCardBalance,
        percentage: (totalCardBalance / totalDebt) * 100,
        color: '#EF4444' // Red-500
      });
    }

    // Color Palette for Loan Types
    const loanColors: Record<string, string> = {
      'Mortgage': '#3B82F6',      // Blue-500
      'Auto': '#F59E0B',          // Amber-500
      'Student': '#8B5CF6',       // Violet-500
      'Personal': '#10B981',      // Emerald-500
      'Home Equity': '#06B6D4',   // Cyan-500
      'Medical': '#F43F5E',       // Rose-500
      'Business': '#64748B',      // Slate-500
      'Family': '#EC4899',        // Pink-500
      'BNPL': '#84CC16',          // Lime-500
      'Payday': '#14B8A6',        // Teal-500
      'Consolidation': '#6366F1', // Indigo-500
      'Other': '#9CA3AF'          // Gray-400
    };

    // Add Loan Entries
    Object.entries(loanBreakdowns).forEach(([type, amount]) => {
      if (amount > 0) {
        items.push({
          category: type,
          amount,
          percentage: (amount / totalDebt) * 100,
          color: loanColors[type] || loanColors['Other']
        });
      }
    });

    // Sort by amount descending
    return items.sort((a, b) => b.amount - a.amount);
  }, [cards, loans]);

  if (data.length === 0) {
    return (
        <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No active debts to visualize.</p>
        </div>
    );
  }

  return (
    <div className="w-full">
      {/* Stacked Bar Visual */}
      <div className="h-16 w-full flex rounded-2xl overflow-hidden mb-8 shadow-sm ring-1 ring-gray-100">
        {data.map((item, index) => (
          <div
            key={index}
            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
            className="h-full relative group transition-all duration-300 hover:opacity-90 cursor-help first:rounded-l-2xl last:rounded-r-2xl"
            title={`${item.category}: $${item.amount.toLocaleString()}`}
          >
             {/* Show label inside bar if wide enough */}
             {item.percentage > 8 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-white drop-shadow-md px-1 overflow-hidden">
                     <span className="font-bold text-sm leading-none">{Math.round(item.percentage)}%</span>
                 </div>
             )}
          </div>
        ))}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
         {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }}></div>
               <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide truncate">{item.category}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{item.percentage.toFixed(1)}%</p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">${item.amount.toLocaleString()}</p>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default DebtBreakdownChart;
