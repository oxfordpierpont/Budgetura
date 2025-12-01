import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Shield, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
    const navigate = useNavigate();
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
            <div className="flex min-h-screen w-full bg-white font-sans">
                {/* Left Side - Confirmation */}
                <div className="w-full lg:w-[45%] flex flex-col p-8 md:p-12 lg:p-16 justify-center relative z-10 bg-white">
                    <div className="max-w-md w-full mx-auto text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Check your email</h1>
                        <p className="text-gray-600 mb-2">
                            We've sent a password reset link to
                        </p>
                        <p className="font-semibold text-gray-900 mb-6">{email}</p>
                        <p className="text-sm text-gray-500 mb-8">
                            Click the link in the email to reset your password. The link will expire in 1 hour.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => setEmailSent(false)}
                                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-lg transition-all text-base"
                            >
                                Send another email
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.98] text-base"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side - Marketing Visual */}
                <div className="hidden lg:flex flex-1 bg-[#8B5CF6] relative overflow-hidden flex-col items-center justify-center p-12 text-center isolate">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1] to-[#A855F7] z-[-1]"></div>
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none mix-blend-overlay"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none mix-blend-overlay"></div>

                    <div className="absolute top-24 right-32 text-white/60"><Sparkles size={28} className="animate-pulse" /></div>
                    <div className="absolute top-48 right-16 text-white/40"><Sparkles size={16} /></div>
                    <div className="absolute top-32 left-32 text-white/30"><Sparkles size={20} /></div>

                    <div className="max-w-xl mx-auto relative z-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-8 backdrop-blur-sm">
                            <CheckCircle className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-6 leading-[1.15] tracking-tight">
                            Help is on the Way!
                        </h2>
                        <p className="text-lg text-indigo-100 leading-relaxed max-w-lg mx-auto font-medium">
                            Check your inbox and follow the instructions to reset your password.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full bg-white font-sans">
            {/* Left Side - Forgot Password Form */}
            <div className="w-full lg:w-[45%] flex flex-col p-8 md:p-12 lg:p-16 justify-between relative z-10 bg-white">

                {/* Logo */}
                <div className="flex justify-center w-full mb-12">
                    <img
                        src="/assets/images/Budgetura-logo-long.png"
                        alt="Budgetura Logo"
                        className="w-[30%] h-auto object-contain"
                    />
                </div>

                {/* Form Container */}
                <div className="max-w-md w-full mx-auto">
                    <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-8 font-medium transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Login
                    </Link>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Forgot password?</h1>
                    <p className="text-gray-600 mb-8">No worries! Enter your email and we'll send you a reset link.</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-6">
                            <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900 bg-white"
                                placeholder="name@company.com"
                                required
                                autoComplete="email"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.98] text-base disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div className="text-center text-sm font-medium">
                            <span className="text-gray-500">Remember your password? </span>
                            <Link to="/login" className="text-gray-500 hover:text-gray-900 transition-colors">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400 font-medium">
                    <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <a href="#" className="hover:text-gray-600 transition-colors">Security</a>
                </div>
            </div>

            {/* Right Side - Marketing Visual */}
            <div className="hidden lg:flex flex-1 bg-[#8B5CF6] relative overflow-hidden flex-col items-center justify-center p-12 text-center isolate">
                {/* Background Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1] to-[#A855F7] z-[-1]"></div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none mix-blend-overlay"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none mix-blend-overlay"></div>

                {/* Stars decoration */}
                <div className="absolute top-24 right-32 text-white/60"><Sparkles size={28} className="animate-pulse" /></div>
                <div className="absolute top-48 right-16 text-white/40"><Sparkles size={16} /></div>
                <div className="absolute top-32 left-32 text-white/30"><Sparkles size={20} /></div>

                <div className="max-w-xl mx-auto mb-16 relative z-10">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-8 border border-white/20 shadow-sm backdrop-blur-md">
                        <span className="bg-white text-[#6366F1] px-1.5 rounded-sm mr-2 text-[10px] uppercase tracking-wider">Secure</span>
                        Password Recovery
                    </div>
                    <h2 className="text-5xl font-bold text-white mb-6 leading-[1.15] tracking-tight">
                        We've Got You Covered
                    </h2>
                    <p className="text-lg text-indigo-100 leading-relaxed max-w-lg mx-auto font-medium">
                        Your security is our priority. We'll help you get back into your account safely.
                    </p>
                </div>

                {/* Security Visual */}
                <div className="relative w-full max-w-lg perspective-1000">
                    {/* Floating Icon 1 */}
                    <div className="absolute -right-8 -top-16 bg-black text-white p-4 rounded-2xl shadow-2xl transform rotate-12 z-20">
                        <Shield size={32} />
                    </div>

                    {/* Floating Icon 2 */}
                    <div className="absolute -left-12 top-24 bg-gradient-to-br from-blue-400 to-cyan-500 text-white p-4 rounded-2xl shadow-2xl transform -rotate-12 z-20">
                        <Lock size={32} />
                    </div>

                    {/* Main Card (Security Features) */}
                    <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border-[6px] border-white backdrop-blur-sm transform rotate-[-6deg] hover:rotate-0 transition-transform duration-700 mx-auto max-w-[340px] relative z-10">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-2">
                                <Shield className="text-purple-600 fill-purple-600" size={16} />
                                <span className="font-bold text-purple-600 text-sm">Security First</span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 bg-gray-50 min-h-[240px] flex flex-col gap-4 text-left">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Secure Reset Link</p>
                                    <p className="text-xs text-gray-500">Expires in 1 hour for safety</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Email Verification</p>
                                    <p className="text-xs text-gray-500">Only you can reset your password</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Encrypted Data</p>
                                    <p className="text-xs text-gray-500">Your information stays protected</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Background Card */}
                    <div className="absolute top-12 left-12 right-12 bottom-[-40px] bg-white/10 rounded-[40px] transform rotate-[8deg] z-0 backdrop-blur-sm"></div>
                </div>
            </div>
        </div>
    );
}
