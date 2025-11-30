import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Wallet, 
  Receipt, 
  Target, 
  TrendingUp, 
  CalendarCheck,
  LogOut,
  X,
  Settings,
  ShieldCheck,
  Brain,
  Calendar
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen, onNavigate, currentView }) => {
  
  const handleNav = (view: string) => {
      onNavigate(view);
      setMobileOpen(false);
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[9998] lg:hidden backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-[9999]
        flex flex-col w-72 lg:w-64 h-full bg-[#101010] text-gray-400 p-6 flex-shrink-0
        shadow-2xl lg:shadow-none border-r border-gray-900 lg:border-none
        transform transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:static'}
      `}>
        
        {/* Mobile Close Button */}
        <div className="flex justify-end lg:hidden mb-4">
            <button 
              onClick={() => setMobileOpen(false)} 
              className="p-2 bg-gray-900 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Branding */}
        <div className="flex flex-col items-start mb-10 pt-2 lg:pt-4">
          <div className="relative mb-3 flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
               <ShieldCheck size={28} />
            </div>
            <div>
               <h2 className="text-white text-xl font-bold tracking-wide leading-none">Budgetura</h2>
               <p className="text-xs text-gray-500 mt-1 font-medium tracking-wider uppercase">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="mb-6 space-y-2">
            
            <NavItem 
                active={currentView === 'dashboard'} 
                onClick={() => handleNav('dashboard')}
                icon={<LayoutDashboard size={20} />} 
                label="My Debt Dashboard"
                showDot 
            />

            <NavItem 
                active={currentView === 'credit-cards'}
                onClick={() => handleNav('credit-cards')}
                icon={<CreditCard size={20} />} 
                label="Credit Cards"
            />
            
            <NavItem 
                active={currentView === 'loans'}
                onClick={() => handleNav('loans')}
                icon={<Wallet size={20} />} 
                label="Loans"
            />
            
            <NavItem 
                active={currentView === 'bills'}
                onClick={() => handleNav('bills')}
                icon={<Receipt size={20} />} 
                label="Bills & Expenses"
            />
            
            <NavItem 
                active={currentView === 'goals'}
                onClick={() => handleNav('goals')}
                icon={<Target size={20} />} 
                label="Financial Goals"
            />
            
            <NavItem 
                active={currentView === 'action-plan'}
                onClick={() => handleNav('action-plan')}
                icon={<CalendarCheck size={20} />} 
                label="Debt Action Plan"
            />
            
            <NavItem 
                active={currentView === 'progress'}
                onClick={() => handleNav('progress')}
                icon={<TrendingUp size={20} />} 
                label="Progress Tracking"
            />
            
            {/* AI Chat Link */}
             <button 
                onClick={() => handleNav('ai-chat')}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 group text-left mt-2
                ${currentView === 'ai-chat' ? 'bg-purple-600/10 text-purple-400' : 'hover:bg-white/5 hover:text-purple-400 text-gray-500'}`}
            >
                <div className={`relative ${currentView === 'ai-chat' ? 'text-purple-400' : 'text-gray-500 group-hover:text-purple-400'}`}>
                    <Brain size={20} />
                    {currentView === 'ai-chat' && (
                       <span className="absolute -top-2 -right-1 w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_#A855F7]"></span>
                    )}
                </div>
                <span className={`text-base font-medium ${currentView === 'ai-chat' ? 'font-semibold' : ''}`}>Budgetura AI</span>
            </button>
          </div>
        </nav>

        {/* Live Debt Coaching */}
        <div className="mb-2">
           <a 
             href="#" 
             className="flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/5 hover:text-emerald-300 text-emerald-400 group"
           >
              <div className="relative">
                <Calendar size={20} />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <span className="text-base font-bold tracking-wide">Live Debt Coaching</span>
           </a>
        </div>

        {/* Settings & Logout */}
        <div className="pt-6 border-t border-gray-800">
           {/* Internal Settings Link */}
           <button 
              onClick={() => handleNav('settings')}
              className={`w-full flex items-center gap-3 p-3 cursor-pointer transition-colors duration-200 mb-2 rounded-xl text-left
              ${currentView === 'settings' ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white'}`}
           >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
           </button>
           
           <div className="flex items-center gap-3 p-3 hover:text-white cursor-pointer transition-colors duration-200 text-red-400 hover:text-red-300 rounded-xl">
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
           </div>
        </div>
      </aside>
    </>
  );
};

const NavItem = ({ icon, label, onClick, active, showDot }: { icon: React.ReactNode, label: string, onClick: () => void, active: boolean, showDot?: boolean }) => {
  return (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 group text-left
        ${active ? 'bg-white/5 text-white' : 'hover:bg-white/5 hover:text-white text-gray-500'}`}
    >
        <div className={`relative ${active ? 'text-white' : 'group-hover:text-white'}`}>
            {icon}
            {active && showDot && (
                <span className="absolute -top-2 -right-1 w-1.5 h-1.5 bg-[#FF69B4] rounded-full shadow-[0_0_8px_#FF69B4]"></span>
            )}
        </div>
        <span className={`text-base font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
        {active && (
            <div className="ml-auto w-1 h-5 bg-gradient-to-b from-[#FF69B4] to-purple-500 rounded-full opacity-0 lg:opacity-100" />
        )}
    </button>
  );
};

export default Sidebar;
