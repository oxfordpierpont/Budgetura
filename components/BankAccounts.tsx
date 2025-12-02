import React, { useState } from 'react';
import { usePlaid } from '../src/hooks/usePlaid';
import { PlaidLink } from './PlaidLink';
import { disconnectPlaidItem } from '../src/lib/supabase/operations';
import { Building2, CreditCard, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
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
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bank Accounts</h2>
          <p className="text-gray-600 mt-1">
            Connect your bank accounts to track balances and transactions
          </p>
        </div>
        <PlaidLink onSuccess={refetch} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Bank Accounts Connected
          </h3>
          <p className="text-gray-600 mb-6">
            Connect your bank account to automatically track your finances
          </p>
          <PlaidLink onSuccess={refetch} />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const itemAccounts = accounts.filter((acc) => acc.item_id === item.item_id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.institution_name || 'Unknown Institution'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Connected {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnect(item.item_id)}
                    disabled={disconnecting === item.item_id}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {disconnecting === item.item_id ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>

                <div className="divide-y divide-gray-200">
                  {itemAccounts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No accounts found
                    </div>
                  ) : (
                    itemAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {account.name}
                                {account.mask && (
                                  <span className="text-gray-500 ml-2">
                                    ****{account.mask}
                                  </span>
                                )}
                              </p>
                              {account.official_name && (
                                <p className="text-sm text-gray-500">
                                  {account.official_name}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {account.type}
                                {account.subtype && ` • ${account.subtype}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(account.current_balance)}
                            </p>
                            {account.available_balance !== null && (
                              <p className="text-sm text-gray-500">
                                Available: {formatCurrency(account.available_balance)}
                              </p>
                            )}
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
