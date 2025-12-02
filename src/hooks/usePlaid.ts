import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { PlaidAccount, PlaidItem } from '../../types';
import * as plaidOps from '../lib/supabase/operations';

export const usePlaid = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaidData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [accountsData, itemsData] = await Promise.all([
        plaidOps.getPlaidAccounts(user.id),
        plaidOps.getPlaidItems(user.id),
      ]);

      setAccounts(accountsData);
      setItems(itemsData);
    } catch (err: any) {
      console.error('Error fetching Plaid data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaidData();
  }, [user?.id]);

  return {
    accounts,
    items,
    loading,
    error,
    refetch: fetchPlaidData,
  };
};
