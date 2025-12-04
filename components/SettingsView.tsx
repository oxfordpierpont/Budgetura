import React, { useState } from 'react';
import { Save, Bot, Database, Trash2, Layout, Shield, Wand2, User, Mail, Lock, Phone, CreditCard, Sliders, ChevronDown, AlertTriangle, X, Eye, EyeOff, Check, Download } from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { useDebt } from '../context/DebtContext';
import { useStripe, formatPrice, getPlanDetails } from '../src/context/StripeContext';
import { generateDummyDataForUser } from '../src/lib/generateDummyData';
import { clearAllUserData } from '../src/lib/supabase/operations';
import { supabase } from '../src/lib/supabase/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const SettingsView = () => {
  const { user, updatePassword } = useAuth();
  const { settings, updateSettings, aiSettings, saveAISettings, refetchAISettings, refetch } = useDebt();
  const { subscription, invoices, loading: stripeLoading, createCheckoutSession, openCustomerPortal } = useStripe();
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Email change modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // Avatar file state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // General Configuration state
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [defaultInterestRate, setDefaultInterestRate] = useState(18.0);
  const [payoffStrategy, setPayoffStrategy] = useState<'avalanche' | 'snowball' | 'custom'>('avalanche');
  const [snapshotFrequency, setSnapshotFrequency] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [emailNotifications, setEmailNotifications] = useState(true);

  // AI Settings state
  const [aiProvider, setAIProvider] = useState<'openrouter' | 'openai' | 'anthropic'>('openrouter');
  const [aiApiKey, setAIApiKey] = useState('');
  const [aiModel, setAIModel] = useState('gpt-4o');
  const [aiTemperature, setAITemperature] = useState(0.7);
  const [aiMaxTokens, setAIMaxTokens] = useState(2000);
  const [savingSettings, setSavingSettings] = useState(false);

  // Plaid Configuration state (Admin only)
  const [plaidEnvironment, setPlaidEnvironment] = useState<'sandbox' | 'development' | 'production'>('sandbox');
  const [plaidClientId, setPlaidClientId] = useState('');
  const [plaidSecret, setPlaidSecret] = useState('');
  const [savingPlaid, setSavingPlaid] = useState(false);

  // Load user data when component mounts
  React.useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.user_metadata?.full_name || '');
      setPhone(user.user_metadata?.phone || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user]);

  // Load settings from context
  React.useEffect(() => {
    if (settings) {
      setCurrencySymbol(settings.currencySymbol || '$');
      setDefaultInterestRate(settings.defaultInterestRate || 18.0);
      setPayoffStrategy(settings.payoffStrategy || 'avalanche');
      setSnapshotFrequency(settings.snapshotFrequency || 'monthly');
      setEmailNotifications(settings.emailNotifications ?? true);
    }
  }, [settings]);

  // Load AI settings from context
  React.useEffect(() => {
    if (aiSettings) {
      setAIProvider(aiSettings.provider);
      setAIModel(aiSettings.model);
      setAITemperature(aiSettings.temperature);
      setAIMaxTokens(aiSettings.maxTokens);
      // Don't load API key - it's encrypted in backend
      setAIApiKey('');
    }
  }, [aiSettings]);

  const handleAvatarClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Image must be less than 10MB');
          return;
        }

        // Store the file for upload
        setAvatarFile(file);

        // Create preview URL (this won't be saved to storage)
        const reader = new FileReader();
        reader.onload = (event) => {
          setAvatarUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error('You must be logged in to save profile');
      return;
    }

    try {
      setSaving(true);
      let uploadedAvatarUrl = avatarUrl;

      // Upload avatar to Supabase Storage if a new file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload image');
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(filePath);

        uploadedAvatarUrl = urlData.publicUrl;

        // Clear the file state
        setAvatarFile(null);
      }

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
          avatar_url: uploadedAvatarUrl,
        }
      });

      if (error) throw error;

      // Also update user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
        }, { onConflict: 'id' });

      if (profileError) console.error('Profile update error:', profileError);

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      // Verify current password by attempting to sign in
      if (user?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          toast.error('Current password is incorrect');
          return;
        }
      }

      // Update password
      await updatePassword(newPassword);

      toast.success('Password updated successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmail || newEmail === email) {
      toast.error('Please enter a new email address');
      return;
    }

    try {
      // Update email - Supabase will send confirmation emails automatically
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast.success('Confirmation emails sent! Please check both your old and new email addresses.');
      setShowEmailModal(false);
      setNewEmail('');
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast.error(error.message || 'Failed to update email');
    }
  };

  const handleSaveGeneralSettings = async () => {
    try {
      setSavingSettings(true);
      await updateSettings({
        currencySymbol,
        defaultInterestRate,
        payoffStrategy,
        snapshotFrequency,
        emailNotifications,
      });
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveAISettings = async () => {
    try {
      // Validate API key if provided
      if (!aiApiKey && !aiSettings) {
        toast.error('Please enter an API key');
        return;
      }

      setSavingSettings(true);

      await saveAISettings({
        provider: aiProvider,
        apiKey: aiApiKey, // Only send if user entered a new one
        model: aiModel,
        temperature: aiTemperature,
        maxTokens: aiMaxTokens,
      });

      toast.success('AI settings saved successfully!');
      setAIApiKey(''); // Clear the input after save
      await refetchAISettings(); // Reload settings
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast.error('Failed to save AI settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSavePlaidConfig = async () => {
    if (!user) return;

    try {
      if (!plaidClientId || !plaidSecret) {
        toast.error('Please enter both Client ID and Secret');
        return;
      }

      setSavingPlaid(true);

      // Import the savePlaidConfig operation
      const { savePlaidConfig } = await import('../src/lib/supabase/operations');

      await savePlaidConfig({
        clientId: plaidClientId,
        secret: plaidSecret,
        environment: plaidEnvironment,
      }, user.id);

      toast.success('Plaid configuration saved successfully!');
      setPlaidClientId('');
      setPlaidSecret('');
    } catch (error) {
      console.error('Error saving Plaid config:', error);
      toast.error('Failed to save Plaid configuration');
    } finally {
      setSavingPlaid(false);
    }
  };

  const handleGoogleOAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/settings`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }

      // The redirect will happen automatically if successful
    } catch (error: any) {
      console.error('Error with Google OAuth:', error);
      toast.error(error.message || 'Failed to connect Google account');
    }
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

  const handleClearAllData = async () => {
    if (!user) {
      setMessage('Please log in to clear data');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete ALL your financial data? This action cannot be undone.\n\nThis will permanently delete:\n• All credit cards\n• All loans\n• All mortgages\n• All bills\n• All goals\n• All snapshots'
    );

    if (!confirmed) return;

    try {
      setClearing(true);
      setMessage('Clearing all data...');

      await clearAllUserData(user.id);

      setMessage('✓ All data cleared successfully!');
      await refetch();
    } catch (error) {
      console.error('Error:', error);
      setMessage('✗ An error occurred while clearing data.');
    } finally {
      setClearing(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // Stripe handlers
  const handlePlanChange = async (planId: 'free' | 'plus' | 'premium') => {
    if (planId === 'free') {
      // Open customer portal to cancel subscription
      await openCustomerPortal();
    } else {
      // Create checkout session for paid plan
      await createCheckoutSession(planId);
    }
  };

  const handleDownloadInvoice = (invoiceUrl: string | null) => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    } else {
      toast.error('Invoice not available');
    }
  };

  // Get current plan from subscription or default to free
  const currentPlan = subscription?.plan_id || 'free';
  const currentPlanDetails = getPlanDetails(currentPlan);

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
                                  className="w-full pl-10 pr-20 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm cursor-not-allowed outline-none"
                                />
                                <button
                                  onClick={() => setShowEmailModal(true)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1"
                                >
                                  Change
                                </button>
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
                                  value="••••••••"
                                  className="w-full pl-10 pr-20 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-sm cursor-not-allowed outline-none"
                                  readOnly
                                />
                                <button
                                  onClick={() => setShowPasswordModal(true)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1"
                                >
                                  Change
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                     <button
                       onClick={handleGoogleOAuth}
                       className="flex items-center gap-2 text-gray-600 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all"
                     >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                        {user?.app_metadata?.provider === 'google' ? 'Google Account Connected' : 'Connect Google Account'}
                     </button>
                     <button
                       onClick={handleSaveProfile}
                       disabled={saving}
                       className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {saving ? 'Saving...' : 'Save Profile'}
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
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Default Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={defaultInterestRate}
                  onChange={(e) => setDefaultInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payoff Strategy</label>
                <div className="relative">
                    <select
                      value={payoffStrategy}
                      onChange={(e) => setPayoffStrategy(e.target.value as 'avalanche' | 'snowball' | 'custom')}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all"
                    >
                      <option value="avalanche">Avalanche (Highest Interest First)</option>
                      <option value="snowball">Snowball (Lowest Balance First)</option>
                      <option value="custom">Custom</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Snapshot Frequency</label>
                <div className="relative">
                    <select
                      value={snapshotFrequency}
                      onChange={(e) => setSnapshotFrequency(e.target.value as 'weekly' | 'monthly' | 'quarterly')}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                     <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                 <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      name="emailToggle"
                      id="emailToggle"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-indigo-500 right-0"
                    />
                    <label htmlFor="emailToggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-indigo-500 cursor-pointer"></label>
                </div>
                 <label htmlFor="emailToggle" className="text-sm text-gray-700 font-medium">Enable Email Notifications</label>
              </div>
              <button
                onClick={handleSaveGeneralSettings}
                disabled={savingSettings}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <Save size={16} /> {savingSettings ? 'Saving...' : 'Save Changes'}
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
                      <select
                        value={aiProvider}
                        onChange={(e) => setAIProvider(e.target.value as 'openrouter' | 'openai' | 'anthropic')}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none transition-all"
                      >
                        <option value="openrouter">OpenRouter (Recommended)</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                   </div>
               </div>
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    API Key {aiSettings && <span className="text-green-600 text-xs ml-2">(Configured)</span>}
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={aiApiKey}
                      onChange={(e) => setAIApiKey(e.target.value)}
                      placeholder={aiSettings ? "Enter new key to update" : "sk-..."}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave blank to keep existing key</p>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Model Selection</label>
                  <div className="relative">
                      <select
                        value={aiModel}
                        onChange={(e) => setAIModel(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none transition-all"
                      >
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
                  <input
                    type="text"
                    value={aiSettings?.customModelId || ''}
                    onChange={(e) => setAIModel(e.target.value)}
                    placeholder="e.g. anthropic/claude-2"
                    disabled={aiModel !== 'custom'}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                  />
               </div>

               <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex justify-between">
                       <span>Temperature</span>
                       <span className="text-purple-600">{aiTemperature.toFixed(1)}</span>
                   </label>
                   <input
                     type="range"
                     min="0"
                     max="1"
                     step="0.1"
                     value={aiTemperature}
                     onChange={(e) => setAITemperature(parseFloat(e.target.value))}
                     className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                   />
                   <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                       <span>Precise</span>
                       <span>Balanced</span>
                       <span>Creative</span>
                   </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={aiMaxTokens}
                    onChange={(e) => setAIMaxTokens(parseInt(e.target.value) || 2000)}
                    min="100"
                    max="128000"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
               </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl flex items-start gap-3 border border-purple-100">
                <Wand2 size={18} className="text-purple-600 mt-0.5 shrink-0" />
                <p className="text-xs text-purple-900 leading-relaxed">
                   <strong>Privacy Note:</strong> Financial data attached to conversations is sent to the selected AI provider for analysis. Ensure your privacy policy reflects this.
                </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveAISettings}
                disabled={savingSettings}
                className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <Save size={16} /> {savingSettings ? 'Saving...' : 'Save AI Settings'}
              </button>
            </div>
          </div>
        </section>

        {/* Plaid Integration (Admin Only) */}
        {user?.user_metadata?.role === 'admin' || user?.raw_app_meta_data?.role === 'admin' ? (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Plaid Integration</h3>
                <p className="text-sm text-gray-500">Configure Plaid API credentials (Admin Only)</p>
              </div>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div className="bg-amber-50 p-4 rounded-xl flex items-start gap-3 border border-amber-200">
                <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>Admin Only:</strong> These settings control Plaid integration for all users. Credentials are encrypted at rest.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Environment</label>
                  <div className="relative">
                    <select
                      value={plaidEnvironment}
                      onChange={(e) => setPlaidEnvironment(e.target.value as 'sandbox' | 'development' | 'production')}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all"
                    >
                      <option value="sandbox">Sandbox (Testing)</option>
                      <option value="development">Development</option>
                      <option value="production">Production</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client ID</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={plaidClientId}
                      onChange={(e) => setPlaidClientId(e.target.value)}
                      placeholder="Enter Plaid Client ID"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Secret Key</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={plaidSecret}
                      onChange={(e) => setPlaidSecret(e.target.value)}
                      placeholder="Enter Plaid Secret"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSavePlaidConfig}
                  disabled={savingPlaid}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} /> {savingPlaid ? 'Saving...' : 'Save Plaid Configuration'}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {/* Billing & Subscription Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <CreditCard size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Billing & Subscription</h3>
                    <p className="text-sm text-gray-500">Manage your plan, payment methods, and invoices</p>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
                {/* Loading State */}
                {stripeLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <p className="text-sm text-gray-500 mt-4">Loading subscription data...</p>
                    </div>
                ) : (
                    <>
                        {/* Current Plan Overview */}
                        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">Current Plan</h4>
                                    {subscription?.status === 'active' && (
                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">ACTIVE</span>
                                    )}
                                    {subscription?.status === 'trialing' && (
                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">TRIAL</span>
                                    )}
                                    {subscription?.status === 'past_due' && (
                                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">PAST DUE</span>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-3xl font-black text-gray-900 capitalize">{currentPlanDetails.name}</span>
                                    <span className="text-lg text-gray-500 font-medium">Plan</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {currentPlanDetails.price}/month
                                    {subscription?.current_period_end && subscription.status === 'active' && (
                                        <> • Next billing: <span className="font-bold text-gray-700">{format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}</span></>
                                    )}
                                    {subscription?.cancel_at_period_end && (
                                        <> • <span className="font-bold text-orange-700">Cancels {format(new Date(subscription.current_period_end!), 'MMM dd, yyyy')}</span></>
                                    )}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                                {subscription?.stripe_customer_id && currentPlan !== 'free' && (
                                    <button
                                        onClick={openCustomerPortal}
                                        className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                                    >
                                        Manage Subscription
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Plan Grid */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Available Plans</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Free Plan */}
                                <div className={`border rounded-2xl p-5 hover:border-gray-300 transition-all relative ${currentPlan === 'free' ? 'border-2 border-emerald-500 bg-emerald-50/10 shadow-sm' : 'border-gray-200'}`}>
                                    {currentPlan === 'free' && (
                                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg uppercase">Current</div>
                                    )}
                                    <h5 className="font-bold text-gray-900 text-lg">Free</h5>
                                    <p className="text-2xl font-black text-gray-900 my-2">$0<span className="text-sm font-medium text-gray-400">/mo</span></p>
                                    <p className="text-xs text-gray-500 mb-4">Essential tools for manual tracking</p>
                                    {currentPlan === 'free' ? (
                                        <button disabled className="w-full py-2 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm cursor-default">Current Plan</button>
                                    ) : (
                                        <button onClick={() => handlePlanChange('free')} className="w-full py-2 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">Downgrade</button>
                                    )}
                                    <ul className="mt-6 space-y-2.5">
                                        {getPlanDetails('free').features.map((feature: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                                                <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Plus Plan */}
                                <div className={`border rounded-2xl p-5 hover:border-gray-300 transition-all relative ${currentPlan === 'plus' ? 'border-2 border-emerald-500 bg-emerald-50/10 shadow-sm' : 'border-gray-200'}`}>
                                    {currentPlan === 'plus' && (
                                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg uppercase">Current</div>
                                    )}
                                    <h5 className={`font-bold text-lg ${currentPlan === 'plus' ? 'text-emerald-700' : 'text-gray-900'}`}>Plus</h5>
                                    <p className="text-2xl font-black text-gray-900 my-2">$9<span className="text-sm font-medium text-gray-400">/mo</span></p>
                                    <p className="text-xs text-gray-500 mb-4">Full debt management suite</p>
                                    {currentPlan === 'plus' ? (
                                        <button disabled className="w-full py-2 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm cursor-default">Current Plan</button>
                                    ) : currentPlanDetails.pricePerMonth > 9 ? (
                                        <button onClick={() => handlePlanChange('plus')} className="w-full py-2 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">Downgrade</button>
                                    ) : (
                                        <button onClick={() => handlePlanChange('plus')} className="w-full py-2 rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20">Upgrade</button>
                                    )}
                                    <ul className="mt-6 space-y-2.5">
                                        {getPlanDetails('plus').features.map((feature: string, idx: number) => (
                                            <li key={idx} className={`flex items-start gap-2 text-xs ${currentPlan === 'plus' ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                                                <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Premium Plan */}
                                <div className={`border rounded-2xl p-5 hover:border-indigo-300 transition-all relative overflow-hidden group ${currentPlan === 'premium' ? 'border-2 border-emerald-500 bg-emerald-50/10 shadow-sm' : 'border-indigo-200 bg-indigo-50/30'}`}>
                                    {currentPlan === 'premium' && (
                                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg uppercase z-10">Current</div>
                                    )}
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <h5 className="font-bold text-indigo-900 text-lg">Premium</h5>
                                    <p className="text-2xl font-black text-gray-900 my-2">$29<span className="text-sm font-medium text-gray-400">/mo</span></p>
                                    <p className="text-xs text-gray-500 mb-4">Everything + AI & live coaching</p>
                                    {currentPlan === 'premium' ? (
                                        <button disabled className="w-full py-2 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm cursor-default">Current Plan</button>
                                    ) : (
                                        <button onClick={() => handlePlanChange('premium')} className="w-full py-2 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">Upgrade</button>
                                    )}
                                    <ul className="mt-6 space-y-2.5">
                                        {getPlanDetails('premium').features.map((feature: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                                                <Check size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Billing History */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Billing History</h4>
                            {invoices.length > 0 ? (
                                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                                            <tr>
                                                <th className="p-4">Date</th>
                                                <th className="p-4">Amount</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right">Invoice</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {invoices.map((invoice) => (
                                                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 text-gray-900 font-medium">
                                                        {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                                                    </td>
                                                    <td className="p-4 text-gray-600">
                                                        {formatPrice(invoice.amount_paid, invoice.currency)}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                                            invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                            invoice.status === 'open' ? 'bg-blue-100 text-blue-700' :
                                                            invoice.status === 'void' ? 'bg-gray-100 text-gray-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {invoice.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {invoice.invoice_pdf ? (
                                                            <button
                                                                onClick={() => handleDownloadInvoice(invoice.invoice_pdf)}
                                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                                                title="Download Invoice PDF"
                                                            >
                                                                <Download size={16} />
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-300">
                                                                <Download size={16} />
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-2xl p-8 text-center">
                                    <p className="text-gray-500">No billing history yet</p>
                                    <p className="text-xs text-gray-400 mt-2">Your invoices will appear here after your first payment</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </section>

        {/* Data Management */}
        <section className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 overflow-hidden">
          <div className="p-6 flex flex-col gap-4">
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-xl flex items-center justify-center">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Data Management</h3>
                    <p className="text-xs text-gray-500">Manage your financial data</p>
                  </div>
               </div>
               <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={handleGenerateDummyData}
                    disabled={generating || clearing}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                     <Database size={16} />
                     {generating ? 'Generating...' : 'Generate Dummy Data'}
                  </button>
                  <button
                    onClick={handleClearAllData}
                    disabled={generating || clearing}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 border border-red-300 text-red-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                     <Trash2 size={16} />
                     {clearing ? 'Clearing...' : 'Clear All Data'}
                  </button>
               </div>
             </div>
             {message && (
               <div className={`p-3 rounded-lg text-sm ${message.includes('✓') ? 'bg-green-50 text-green-800 border border-green-200' : message.includes('✗') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                 {message}
               </div>
             )}
             <div className="bg-yellow-50 p-4 rounded-lg flex items-start gap-3 border border-yellow-200">
                <AlertTriangle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-xs text-yellow-900 leading-relaxed">
                   <strong>Note:</strong> Dummy data is for testing purposes only. Use "Generate Dummy Data" to populate your account with sample financial information. Use "Clear All Data" to remove all your financial records (this cannot be undone).
                </div>
             </div>
          </div>
        </section>

      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <form onSubmit={handleChangePassword} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-2xl text-gray-900">Change Password</h3>
                <p className="text-gray-500 text-sm mt-1">Enter your current and new password</p>
              </div>
              <button type="button" onClick={() => setShowPasswordModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                <X size={20}/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end mt-8">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95">
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <form onSubmit={handleChangeEmail} className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-2xl text-gray-900">Change Email</h3>
                <p className="text-gray-500 text-sm mt-1">You'll receive confirmation emails</p>
              </div>
              <button type="button" onClick={() => setShowEmailModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                <X size={20}/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="Enter new email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-900">
                  <strong>Note:</strong> You'll receive confirmation emails at both your old and new email addresses. You must verify both to complete the change.
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-end mt-8">
              <button type="button" onClick={() => setShowEmailModal(false)} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xl shadow-emerald-500/30 transition-all active:scale-95">
                Change Email
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default SettingsView;
