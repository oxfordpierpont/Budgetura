import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
    const { resetPassword } = useAuth();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await resetPassword(email);
            setEmailSent(true);
            toast.success('Password reset email sent!');
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to send reset email';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Card>
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                            <p className="text-gray-600 mb-6">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Click the link in the email to reset your password. The link will expire in 1 hour.
                            </p>
                            <div className="space-y-3">
                                <Button onClick={() => setEmailSent(false)} variant="outline" className="w-full">
                                    Send another email
                                </Button>
                                <Link to="/login">
                                    <Button variant="ghost" className="w-full">
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="mb-6">
                    <Link to="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Login
                    </Link>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Budgetura</h1>
                    <p className="text-gray-600">Reset your password</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot password?</h2>
                            <p className="text-sm text-gray-600">
                                No worries! Enter your email and we'll send you a reset link.
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

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            Send reset link
                        </Button>

                        <div className="text-center text-sm">
                            <span className="text-gray-600">Remember your password? </span>
                            <Link
                                to="/login"
                                className="font-medium text-blue-600 hover:text-blue-700"
                            >
                                Sign in
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
