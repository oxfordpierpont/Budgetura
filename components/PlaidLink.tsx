import React, { useCallback, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '../src/hooks/useAuth';
import { createPlaidLinkToken, exchangePlaidToken } from '../src/lib/supabase/operations';
import { Wallet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export const PlaidLink: React.FC<PlaidLinkProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle successful Plaid Link flow
  const onPlaidSuccess = useCallback(async (publicToken: string) => {
    if (!user) return;

    try {
      setLoading(true);
      await exchangePlaidToken(user.id, publicToken);
      toast.success('Bank account connected successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error exchanging Plaid token:', error);
      toast.error('Failed to connect bank account');
    } finally {
      setLoading(false);
    }
  }, [user, onSuccess]);

  // Initialize Plaid Link
  // Following Plaid's official React pattern
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err, metadata) => {
      // User exited the Link flow
      if (err != null) {
        console.error('Plaid Link error:', err);
        toast.error('Connection failed. Please try again.');
      }
      // Log metadata for debugging/support
      console.log('Plaid Link exit:', metadata);
      setLoading(false);
    },
    onEvent: (eventName, metadata) => {
      // Optional: Track Link flow events for analytics
      console.log('Plaid Link event:', eventName, metadata);
    },
  });

  // Generate link token and open Plaid Link
  const handleConnect = async () => {
    if (!user) {
      toast.error('You must be logged in to connect a bank account');
      return;
    }

    try {
      setLoading(true);
      const token = await createPlaidLinkToken(user.id);
      setLinkToken(token);

      // Wait for the link to be ready, then open it
      setTimeout(() => {
        if (ready) {
          open();
        }
      }, 100);
    } catch (error: any) {
      console.error('Error creating Plaid link token:', error);
      toast.error('Failed to initialize bank connection');
    } finally {
      setLoading(false);
    }
  };

  // If token is set and ready, open Plaid Link
  React.useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-5 h-5" />
          Connect Bank Account
        </>
      )}
    </button>
  );
};
