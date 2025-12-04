import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase/client';
import toast from 'react-hot-toast';

// Initialize Stripe.js
// NOTE: Replace with your actual Stripe publishable key
// For test mode, use pk_test_... key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_KEY_HERE'
);

// Stripe Price IDs for each plan (test mode)
// These should match what you create in your Stripe Dashboard
export const STRIPE_PRICES = {
  plus: import.meta.env.VITE_STRIPE_PRICE_PLUS || 'price_test_plus',
  premium: import.meta.env.VITE_STRIPE_PRICE_PREMIUM || 'price_test_premium',
};

// Types
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan_id: 'free' | 'plus' | 'premium';
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  stripe_invoice_id: string;
  stripe_customer_id: string;
  amount_paid: number; // in cents
  amount_due: number; // in cents
  currency: string;
  status: string;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  billing_reason: string | null;
  description: string | null;
  created_at: string;
  period_start: string | null;
  period_end: string | null;
}

interface StripeContextType {
  subscription: Subscription | null;
  invoices: Invoice[];
  loading: boolean;
  createCheckoutSession: (planId: 'basic' | 'plus' | 'premium') => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  refetchSubscription: () => Promise<void>;
  refetchInvoices: () => Promise<void>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's subscription
  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If no subscription exists, that's okay - they're on free plan
        if (error.code === 'PGRST116') {
          console.log('No subscription found, user is on free plan');
          setSubscription(null);
          return;
        }
        throw error;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription data');
    }
  };

  // Fetch user's invoices
  const fetchInvoices = async () => {
    if (!user) {
      setInvoices([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Don't show toast for invoices - not critical
    }
  };

  // Load data when user changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSubscription(), fetchInvoices()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    } else {
      setSubscription(null);
      setInvoices([]);
      setLoading(false);
    }
  }, [user]);

  // Create Stripe checkout session for new subscription or upgrade
  const createCheckoutSession = async (planId: 'plus' | 'premium') => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    try {
      // Get the Stripe price ID for this plan
      const priceId = STRIPE_PRICES[planId];

      console.log('Creating checkout session for plan:', planId, 'price:', priceId);

      // Call our Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          planId,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }

      // Redirect to Stripe checkout
      if (data?.sessionUrl) {
        console.log('Redirecting to Stripe checkout:', data.sessionUrl);
        window.location.href = data.sessionUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Failed to start checkout process');
    }
  };

  // Open Stripe customer portal for managing subscription
  const openCustomerPortal = async () => {
    if (!user) {
      toast.error('Please log in to manage your subscription');
      return;
    }

    if (!subscription?.stripe_customer_id) {
      toast.error('No subscription found to manage');
      return;
    }

    try {
      console.log('Opening customer portal');

      // Call our Edge Function to create portal session
      const { data, error } = await supabase.functions.invoke('create-customer-portal');

      if (error) {
        console.error('Portal error:', error);
        throw error;
      }

      // Open portal in new window
      if (data?.url) {
        console.log('Opening portal:', data.url);
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error(error.message || 'Failed to open customer portal');
    }
  };

  return (
    <StripeContext.Provider
      value={{
        subscription,
        invoices,
        loading,
        createCheckoutSession,
        openCustomerPortal,
        refetchSubscription: fetchSubscription,
        refetchInvoices: fetchInvoices,
      }}
    >
      {children}
    </StripeContext.Provider>
  );
};

// Custom hook to use Stripe context
export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within StripeProvider');
  }
  return context;
};

// Helper function to format price in cents to dollars
export const formatPrice = (cents: number, currency: string = 'usd'): string => {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(dollars);
};

// Helper function to get plan details
export const getPlanDetails = (planId: string) => {
  const plans = {
    free: {
      name: 'Free',
      price: '$0',
      pricePerMonth: 0,
      features: [
        'Dashboard',
        'Bills & Expenses',
        'My Accounts (Plaid)',
        'Manual Entries (Unlimited)',
      ],
    },
    plus: {
      name: 'Plus',
      price: '$9',
      pricePerMonth: 9,
      features: [
        'Everything in Free',
        'Credit Card Manager',
        'Loans Manager',
        'Mortgages Manager',
        'Debt Action Plan',
        'Full Plaid Integration',
      ],
    },
    premium: {
      name: 'Premium',
      price: '$29',
      pricePerMonth: 29,
      features: [
        'Everything in Plus',
        'Financial Goals',
        'Progress Tracking',
        'Reports & Analytics',
        'Budgetura AI',
        'Live Debt Coaching',
        'Priority Support',
        'Future Updates',
      ],
    },
  };

  return plans[planId as keyof typeof plans] || plans.free;
};
