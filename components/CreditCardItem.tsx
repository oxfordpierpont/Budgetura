import React from 'react';
import { CreditCard as CardIcon, AlertCircle, CalendarClock, DollarSign } from 'lucide-react';
import { CreditCard } from '../types';
import AskAIButton from './AskAIButton';

interface Props {
  card: CreditCard;
  onAskAI?: () => void;
}

const CreditCardItem: React.FC<Props> = ({ card, onAskAI }) => {
  // Determine color based on utilization
  const getUtilizationColor = (util: number) => {
    if (util > 50) return 'bg-red-500';
    if (util > 30) return 'bg-[#F59E0B]'; // Orange/Yellow match
    return 'bg-emerald-400';
  };

  const colorClass = getUtilizationColor(card.utilization);
  
  // Icon bg based on brand
  const getIconBg = (name: string) => {
    if (name.includes('Chase')) return 'bg-blue-50 text-blue-600';
    if (name.includes('Discover')) return 'bg-orange-50 text-orange-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="flex flex-col p-5 bg-white border border-gray-100 hover:border-blue-100 hover:shadow-lg rounded-2xl transition-all duration-300 mb-4 group cursor-pointer relative overflow-hidden">
      
      {/* Left Accent Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

      {/* Top Row: Icon + Name + Balance */}
      <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${getIconBg(card.name)} shadow-sm`}>
                <CardIcon size={20} />
            </div>
            <div>
                <h4 className="font-bold text-gray-900 text-lg leading-tight">{card.name}</h4>
                <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium">APR: {card.apr}%</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">{card.status}</span>
                </div>
            </div>
          </div>
          <div className="text-right">
              <div className="font-bold text-xl text-gray-900">${card.balance.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Limit: ${card.limit.toLocaleString()}</div>
          </div>
      </div>

      {/* Middle Row: Progress Bar */}
      <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500 font-medium">Utilization</span>
                <span className={`font-bold ${card.utilization > 50 ? 'text-red-500' : 'text-gray-700'}`}>{card.utilization}%</span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`} 
                    style={{ width: `${card.utilization}%` }}
                ></div>
            </div>
      </div>

      {/* Bottom Row: Payoff Details & AI Action */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100 relative">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-lg text-blue-500 shadow-sm">
                    <CalendarClock size={14} />
                  </div>
                  <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Payoff Date</p>
                      <p className="text-xs font-semibold text-gray-700">{card.payoffDate}</p>
                  </div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-lg text-red-400 shadow-sm">
                    <DollarSign size={14} />
                  </div>
                  <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Est. Interest</p>
                      <p className="text-xs font-semibold text-gray-700">${card.interest.toLocaleString()}</p>
                  </div>
              </div>
          </div>
          
          {/* AI Action Button - Visible on Hover or mobile */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3">
             {onAskAI && <AskAIButton onClick={onAskAI} label="Help Me Pay" className="bg-white shadow-sm" />}
          </div>
      </div>
      
    </div>
  );
};

export default CreditCardItem;