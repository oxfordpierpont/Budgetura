import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, ArrowLeft } from 'lucide-react';

interface Props {
  initialPrompt?: string;
  onClose?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIChatView: React.FC<Props> = ({ initialPrompt, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your DeDebtify AI coach. I can help analyze your spending, suggest payoff strategies, or answer questions about your financial health. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(text),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const generateMockResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('capital one') || q.includes('card')) {
      return "Based on your current utilization of 56.3% on your Capital One card, I recommend prioritizing this debt. It has the highest APR (23%). Paying an extra $200/month could save you over $800 in interest.";
    }
    if (q.includes('save') || q.includes('savings')) {
      return "I've analyzed your recurring bills. You might be able to lower your car insurance premium of $145/mo by shopping around. Also, your Netflix subscription is $15.99/mo - have you considered rotating your streaming services?";
    }
    if (q.includes('loan')) {
      return "Your Federal Student Loan has a favorable rate of 5.5%. While it's a large balance, your Auto Loan (5.0%) is also low interest. Mathematically, focusing on your high-interest credit cards (16.5% - 23%) first is the best strategy.";
    }
    return "That's a great question. Looking at your dashboard, you're making steady progress. Your debt-to-income ratio has improved by 2% this month. Would you like me to create a specific payoff plan for next month?";
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F3F4F6] relative z-0">
      {/* Mobile Header */}
      <div className="lg:hidden p-4 bg-white border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        {onClose && (
           <button onClick={onClose} className="p-2 -ml-2 text-gray-600">
             <ArrowLeft size={20} />
           </button>
        )}
        <Bot size={24} className="text-purple-600" />
        <span className="font-bold text-gray-900">DeDebtify AI Coach</span>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between p-6 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                  <Sparkles size={20} />
              </div>
              <div>
                  <h2 className="text-xl font-bold text-gray-900">Financial Coach</h2>
                  <p className="text-sm text-gray-500">Powered by DeDebtify AI</p>
              </div>
          </div>
          <div className="text-xs font-medium bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100">
              GPT-4o Model
          </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'assistant' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'assistant'
                ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                : 'bg-blue-600 text-white rounded-tr-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start gap-4">
             <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot size={16} />
             </div>
             <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1 items-center h-10">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white border-t border-gray-200">
        <div className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Ask a question about your finances..."
            className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none text-gray-900 placeholder-gray-400"
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
            className="absolute right-2 top-2 p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-3">
          AI can make mistakes. Please verify important financial information.
        </p>
      </div>
    </div>
  );
};

export default AIChatView;