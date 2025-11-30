import React, { useState } from 'react';
import { DebtProvider } from './context/DebtContext';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import SettingsView from './components/SettingsView';
import AIChatView from './components/AIChatView';
import CreditCardManager from './components/CreditCardManager';
import LoanManager from './components/LoanManager';
import BillManager from './components/BillManager';
import GoalManager from './components/GoalManager';
import ActionPlanView from './components/ActionPlanView';
import ProgressView from './components/ProgressView';
import FloatingChatPanel from './components/FloatingChatPanel';

const App: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [initialAiPrompt, setInitialAiPrompt] = useState('');

  const handleAskAI = (prompt: string) => {
    setInitialAiPrompt(prompt);
    setCurrentView('ai-chat');
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
        case 'dashboard': return <DashboardView setMobileMenuOpen={setMobileMenuOpen} onAskAI={handleAskAI} />;
        case 'credit-cards': return <CreditCardManager />;
        case 'loans': return <LoanManager />;
        case 'bills': return <BillManager />;
        case 'goals': return <GoalManager />;
        case 'action-plan': return <ActionPlanView />;
        case 'progress': return <ProgressView />;
        case 'ai-chat': return <AIChatView initialPrompt={initialAiPrompt} onClose={() => setCurrentView('dashboard')} />;
        case 'settings': return <SettingsView />;
        default: return <DashboardView setMobileMenuOpen={setMobileMenuOpen} onAskAI={handleAskAI} />;
    }
  };

  return (
    <DebtProvider>
        <div className="flex flex-col lg:flex-row w-full min-h-screen lg:h-[calc(100vh-32px)] bg-[#101010] font-sans isolate relative">
            <Sidebar 
                mobileOpen={mobileMenuOpen} 
                setMobileOpen={setMobileMenuOpen} 
                onNavigate={setCurrentView}
                currentView={currentView}
            />

            <div className="flex-1 flex flex-col lg:my-3 lg:mr-3 bg-[#F3F4F6] lg:rounded-[32px] lg:overflow-hidden shadow-2xl relative z-0">
                {/* Mobile Header for Views other than Dashboard */}
                {currentView !== 'dashboard' && currentView !== 'ai-chat' && (
                    <div className="lg:hidden p-4 bg-white border-b border-gray-100 flex items-center sticky top-0 z-20">
                        <button 
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <span className="ml-3 font-bold text-gray-900 capitalize">{currentView.replace('-', ' ')}</span>
                    </div>
                )}
                
                {renderContent()}
            </div>
            
            {/* Global Floating Chat */}
            <FloatingChatPanel />
        </div>
    </DebtProvider>
  );
};

export default App;