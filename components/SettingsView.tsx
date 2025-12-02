import React, { useState } from 'react';
import { Save, Bot, Database, Trash2, Layout, Shield, Wand2, User, Mail, Lock, Phone, CreditCard, Sliders, ChevronDown } from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { useDebt } from '../context/DebtContext';
import { generateDummyDataForUser } from '../src/lib/generateDummyData';

const SettingsView = () => {
  const { user } = useAuth();
  const { refetch } = useDebt() as any;
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Load user data when component mounts
  React.useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.user_metadata?.full_name || '');
      setPhone(user.user_metadata?.phone || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user]);

  const handleAvatarClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setAvatarUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleGenerateDummyData = async () => {
    if (!user) {
      setMessage('Please log in to generate dummy data');
      return;
    }

    try {
      setGenerating(true);
      setMessage('Generating dummy data...');

      const result = await generateDummyDataForUser(user.id);

      if (result.success) {
        setMessage('✓ Dummy data generated successfully!');
        await refetch();
      } else {
        setMessage('✗ Failed to generate dummy data. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('✗ An error occurred while generating data.');
    } finally {
      setGenerating(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full lg:overflow-y-auto custom-scrollbar bg-[#F3F4F6] p-4 md:p-8 space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2">Manage your account preferences and application configuration.</p>
      </div>

      <div className="space-y-8 pb-10">
        
        {/* Profile & Security Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <User size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Profile & Security</h3>
                    <p className="text-sm text-gray-500">Update your personal information and login credentials</p>
                </div>
            </div>
            <div className="p-6 md:p-8 space-y-8">
                {/* Photo & Basic Info */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex flex-col items-center gap-3">
                        <div
                          onClick={handleAvatarClick}
                          className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md flex items-center justify-center text-gray-300 relative overflow-hidden group cursor-pointer"
                        >
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <User size={40} />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">Change</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  value={fullName}
                                  onChange={(e) => setFullName(e.target.value)}
                                  placeholder="Enter your full name"
                                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="email"
                                  value={email}
                                  readOnly
                                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm cursor-not-allowed outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="tel"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="Enter phone number"
                                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="password"
                                  placeholder="••••••••"
                                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-sm cursor-not-allowed outline-none"
                                  readOnly
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Password changes coming soon</p>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                     <button className="flex items-center gap-2 text-gray-600 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all">
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                        Sign in with Google
                     </button>
                     <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
                        Save Profile
                     </button>
                </div>
            </div>
        </section>

        {/* General Configuration */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Layout size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">General Configuration</h3>
              <p className="text-sm text-gray-500">Basic display and calculation settings</p>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Currency Symbol</label>
                <input type="text" defaultValue="$" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Default Interest Rate (%)</label>
                <input type="number" defaultValue="18.0" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payoff Strategy</label>
                <div className="relative">
                    <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all">
                    <option value="avalanche">Avalanche (Highest Interest First)</option>
                    <option value="snowball">Snowball (Lowest Balance First)</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Snapshot Frequency</label>
                <div className="relative">
                    <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all">
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="quarterly">Quarterly</option>
                    </select>
                     <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                 <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-indigo-500 right-0"/>
                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-indigo-500 cursor-pointer"></label>
                </div>
                 <label htmlFor="toggle" className="text-sm text-gray-700 font-medium">Enable Email Notifications</label>
              </div>
              <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95">
                 <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </section>

        {/* AI Settings */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Financial Coach</h3>
              <p className="text-sm text-gray-500">Configure your AI model and provider settings</p>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">AI Provider</label>
                   <div className="relative">
                      <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none transition-all">
                        <option value="openrouter">OpenRouter (Recommended)</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                   </div>
               </div>
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">API Key</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" placeholder="sk-..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" />
                  </div>
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Model Selection</label>
                  <div className="relative">
                      <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none transition-all">
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="claude-3-sonnet">Claude 3.5 Sonnet</option>
                        <option value="minimax">Minimax M2</option>
                        <option value="custom">Custom Model ID</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
               </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Custom Model ID</label>
                  <input type="text" placeholder="e.g. anthropic/claude-2" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" />
               </div>

               <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex justify-between">
                       <span>Temperature</span>
                       <span className="text-purple-600">0.7</span>
                   </label>
                   <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                   <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                       <span>Precise</span>
                       <span>Balanced</span>
                       <span>Creative</span>
                   </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max Tokens</label>
                  <input type="number" defaultValue="2000" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" />
               </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl flex items-start gap-3 border border-purple-100">
                <Wand2 size={18} className="text-purple-600 mt-0.5 shrink-0" />
                <p className="text-xs text-purple-900 leading-relaxed">
                   <strong>Privacy Note:</strong> Financial data attached to conversations is sent to the selected AI provider for analysis. Ensure your privacy policy reflects this.
                </p>
            </div>

            <div className="flex justify-end pt-2">
              <button className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all active:scale-95">
                 <Save size={16} /> Save AI Settings
              </button>
            </div>
          </div>
        </section>

        {/* Dummy Data */}
        <section className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 overflow-hidden">
          <div className="p-6 flex flex-col gap-4">
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-xl flex items-center justify-center">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Dummy Data</h3>
                    <p className="text-xs text-gray-500">Generate sample data for testing</p>
                  </div>
               </div>
               <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={handleGenerateDummyData}
                    disabled={generating}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                     {generating ? 'Generating...' : 'Generate Data'}
                  </button>
               </div>
             </div>
             {message && (
               <div className={`p-3 rounded-lg text-sm ${message.includes('✓') ? 'bg-green-50 text-green-800 border border-green-200' : message.includes('✗') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                 {message}
               </div>
             )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsView;