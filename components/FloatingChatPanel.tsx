import React, { useState, useEffect, useRef } from 'react';
import { useDebt } from '../context/DebtContext';
import { X, Send, Bot, User, Maximize2, Minimize2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const FloatingChatPanel = () => {
  const { aiChatState, setAIChatState } = useDebt();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiChatState.isOpen && aiChatState.initialMessage) {
      // Add initial context message if provided
      if (messages.length === 0 || messages[messages.length - 1].content !== aiChatState.initialMessage) {
         handleSystemMessage(aiChatState.initialMessage);
      }
    }
  }, [aiChatState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, aiChatState.isOpen]);

  const handleSystemMessage = (text: string) => {
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: text
      }]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock Response
    setTimeout(() => {
        const response: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            content: "I can help you with that. Based on your current debt profile, focusing on your highest APR card while maintaining minimums elsewhere is optimal. Would you like to simulate a specific extra payment amount?" 
        };
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
    }, 1500);
  };

  if (!aiChatState.isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-[10000] w-full max-w-md bg-white rounded-2xl shadow-2xl border border-purple-100 flex flex-col transition-all duration-300 ${minimized ? 'h-16' : 'h-[600px] max-h-[80vh]'}`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-purple-600 text-white rounded-t-2xl cursor-pointer" onClick={() => setMinimized(!minimized)}>
         <div className="flex items-center gap-3">
             <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                 <Bot size={18} className="text-white" />
             </div>
             <div>
                 <h3 className="font-bold text-sm">DeDebtify Coach</h3>
                 {!minimized && <p className="text-[10px] text-purple-100 opacity-90">Online • Financial Assistant</p>}
             </div>
         </div>
         <div className="flex items-center gap-2">
             <button onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                 {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
             </button>
             <button onClick={(e) => { e.stopPropagation(); setAIChatState({ isOpen: false }); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                 <X size={14} />
             </button>
         </div>
      </div>

      {!minimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center p-6">
                        <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mb-3">
                            <Sparkles size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-600">How can I help you optimize your finances today?</p>
                    </div>
                )}
                
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-purple-600 text-white'}`}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 shadow-sm text-gray-800 rounded-tl-sm'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0"><Bot size={14} /></div>
                        <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100">
                <div className="relative">
                    <input 
                        className="w-full pl-4 pr-10 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                        placeholder="Type your question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
          </>
      )}
    </div>
  );
};

export default FloatingChatPanel;