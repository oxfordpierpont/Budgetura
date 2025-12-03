import React, { useState, useEffect } from 'react';
import { usePlaid } from '../src/hooks/usePlaid';
import { PlaidLink } from './PlaidLink';
import { disconnectPlaidItem } from '../src/lib/supabase/operations';
import { Building2, CreditCard, Trash2, RefreshCw, AlertCircle, Plus, Wallet, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const BankAccounts: React.FC = () => {
  const { accounts, items, loading, error, refetch } = usePlaid();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const handleDisconnect = async (itemId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect this bank? All associated accounts will be removed.'
    );

    if (!confirmed) return;

    try {
      setDisconnecting(itemId);
      await disconnectPlaidItem(itemId);
      toast.success('Bank disconnected successfully');
      await refetch();
    } catch (error: any) {
      console.error('Error disconnecting bank:', error);
      toast.error('Failed to disconnect bank');
    } finally {
      setDisconnecting(null);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-[#F3F4F6]">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white p-4 rounded-full shadow-sm">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          <p className="text-gray-500 font-medium">Syncing with Plaid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#F3F4F6] h-full overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Accounts</h1>
          <p className="text-gray-500 mt-1 font-medium">
            Connect your bank accounts to track balances and transactions.
          </p>
        </div>
        <PlaidLink onSuccess={refetch} />
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200 shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
            <Building2 size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Bank Accounts Connected
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Connect your primary bank account to automatically sync balances, track spending, and power the AI coach.
          </p>
          <PlaidLink onSuccess={refetch} />
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => {
            const itemAccounts = accounts.filter((acc) => acc.item_id === item.item_id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Institution Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gray-50/50 border-b border-gray-100 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-blue-600 shadow-sm">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {item.institution_name || 'Unknown Institution'}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          Connected {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDisconnect(item.item_id)}
                    disabled={disconnecting === item.item_id}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {disconnecting === item.item_id ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Disconnect
                      </>
                    )}
                  </button>
                </div>

                {/* Accounts List */}
                <div className="divide-y divide-gray-100">
                  {itemAccounts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 font-medium">
                      No accounts found for this institution.
                    </div>
                  ) : (
                    itemAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-5 hover:bg-gray-50/50 transition-colors group cursor-default"
                      >
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${account.type === 'credit' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                              {account.type === 'credit' ? <CreditCard size={18} /> : <Wallet size={18} />}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-base flex items-center gap-2">
                                {account.name}
                                {account.mask && (
                                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                    •••• {account.mask}
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {account.official_name && (
                                  <span className="text-xs text-gray-500 hidden sm:inline">
                                    {account.official_name}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                  {account.subtype || account.type}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right w-full sm:w-auto bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-gray-100 sm:border-none flex justify-between sm:block items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase sm:hidden">Current Balance</span>
                            <div>
                              <p className={`font-bold text-lg ${account.type === 'credit' ? 'text-gray-900' : 'text-emerald-600'}`}>
                                {formatCurrency(account.current_balance)}
                              </p>
                              {account.available_balance !== null && (
                                <p className="text-xs font-medium text-gray-400 mt-0.5">
                                  Available: {formatCurrency(account.available_balance)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
