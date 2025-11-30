import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  onClick: () => void;
  className?: string;
  label?: string;
}

const AskAIButton: React.FC<Props> = ({ onClick, className = '', label = 'Ask Budgetura' }) => {
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors border border-purple-100 group ${className}`}
    >
      <Sparkles size={14} className="group-hover:animate-pulse" />
      {label}
    </button>
  );
};

export default AskAIButton;