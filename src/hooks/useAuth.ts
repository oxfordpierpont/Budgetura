import { useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    });

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuthState({
                user: session?.user ?? null,
                session,
                loading: false,
            });
        }).catch((error) => {
            console.error('Error getting session:', error);
            // If localStorage is full, clear it and retry
            if (error.message?.includes('quota') || error.message?.includes('Storage')) {
                console.warn('Clearing localStorage due to quota error');
                localStorage.clear();
                window.location.reload();
            }
            setAuthState({
                user: null,
                session: null,
                loading: false,
            });
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            try {
                setAuthState({
                    user: session?.user ?? null,
                    session,
                    loading: false,
                });
            } catch (error: any) {
                console.error('Error updating auth state:', error);
                // If localStorage is full, clear it
                if (error.message?.includes('quota') || error.message?.includes('Storage')) {
                    console.warn('Clearing localStorage due to quota error');
                    localStorage.clear();
                    window.location.reload();
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, fullName?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) throw error;

        // Create user profile
        if (data.user) {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    id: data.user.id,
                    full_name: fullName,
                });

            if (profileError) console.error('Profile creation error:', profileError);
        }

        return data;
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return data;
        } catch (error: any) {
            // Handle localStorage quota errors
            if (error.message?.includes('quota') || error.message?.includes('Storage')) {
                console.warn('localStorage quota exceeded during sign in, clearing...');
                localStorage.clear();
                // Retry the sign in after clearing
                const { data, error: retryError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (retryError) throw retryError;
                return data;
            }
            throw error;
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
    };

    const updatePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) throw error;
    };

    return {
        user: authState.user,
        session: authState.session,
        loading: authState.loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
    };
}
