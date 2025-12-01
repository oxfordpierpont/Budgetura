import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const from = (location.state as any)?.from?.pathname || '/dashboard';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signIn(email, password);
            toast.success('Welcome back!');
            navigate(from, { replace: true });
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to sign in';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Budgetura</h1>
                    <p className="text-gray-600">Sign in to manage your finances</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
                            <p className="text-sm text-gray-600">
                                Enter your credentials to access your account
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <Input
                            type="email"
                            label="Email"
                            placeholder="you@example.com"
                            icon={Mail}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            disabled={isLoading}
                        />

                        <Input
                            type="password"
                            label="Password"
                            placeholder="Enter your password"
                            icon={Lock}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            disabled={isLoading}
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>

                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            Sign in
                        </Button>

                        <div className="text-center text-sm">
                            <span className="text-gray-600">Don't have an account? </span>
                            <Link
                                to="/signup"
                                className="font-medium text-blue-600 hover:text-blue-700"
                            >
                                Sign up
                            </Link>
                        </div>
                    </form>
                </Card>

                <p className="text-center text-xs text-gray-500 mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
