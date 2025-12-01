import React, { useState } from 'react';
import { Sparkles, Zap, PieChart } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const from = (location.state as any)?.from?.pathname || '/dashboard';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await signIn(email, password);
            toast.success('Welcome back!');
            navigate(from, { replace: true });
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to sign in';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white font-sans">
            {/* Left Side - Login Form */}
            <div className="w-full lg:w-[45%] flex flex-col p-8 md:p-12 lg:p-16 justify-between relative z-10 bg-white">

                {/* Logo */}
                <div className="flex items-center gap-3 mb-12">
                    {/* Using text fallback if image is missing, or placeholder */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">B</div>
                        <span className="text-xl font-bold text-gray-900">Budgetura</span>
                    </div>
                </div>

                {/* Form Container */}
                <div className="max-w-md w-full mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Log in</h1>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900 bg-white"
                                placeholder="name@company.com"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900 bg-white"
                                placeholder="••••••••••"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.98] text-base disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Logging in...' : 'Log In'}
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 font-bold">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-700 text-sm shadow-sm">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Google
                            </button>
                            <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 bg-black border border-black rounded-xl hover:bg-gray-800 transition-colors font-bold text-white text-sm shadow-sm">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.69-.74 2.4.29 3.28 1.45 3.38 1.52-.35.21-2.19 1.4-2.12 4.19.06 2.5 2.15 3.73 2.15 3.76-.03.07-.48 1.58-1.55 3.19-1.05 1.55-2.47 3.14-2.58 3.17-.11.03-1.52.92-3.08.32zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-2.05 4.35-3.74 4.25z" />
                                </svg>
                                Apple
                            </button>
                        </div>

                        <div className="flex items-center justify-between text-sm mt-6 font-medium">
                            <Link to="/signup" className="text-gray-500 hover:text-gray-900 transition-colors">Create an account</Link>
                            <Link to="/forgot-password" className="text-gray-500 hover:text-gray-900 transition-colors">Forgot your password?</Link>
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

                <div className="max-w-xl mx-auto mb-20 relative z-10">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-8 border border-white/20 shadow-sm backdrop-blur-md">
                        <span className="bg-white text-[#6366F1] px-1.5 rounded-sm mr-2 text-[10px] uppercase tracking-wider">New</span>
                        Budgetura v2.1
                    </div>
                    <h2 className="text-5xl font-bold text-white mb-6 leading-[1.15] tracking-tight">
                        Budgetura's AI Coach Becomes Financial Smart
                    </h2>
                    <p className="text-lg text-indigo-100 leading-relaxed max-w-lg mx-auto font-medium">
                        Create AI-tailored strategies, designed specifically for your debt payoff and financial goals. Available for all plans (including Free)!
                    </p>
                </div>

                {/* 3D Floating Mockups */}
                <div className="relative w-full max-w-lg perspective-1000">

                    {/* Floating Icon 1 */}
                    <div className="absolute -right-8 -top-16 bg-black text-white p-4 rounded-2xl shadow-2xl transform rotate-12 z-20">
                        <PieChart size={32} />
                    </div>

                    {/* Floating Icon 2 */}
                    <div className="absolute -left-12 top-24 bg-gradient-to-br from-orange-400 to-pink-500 text-white p-4 rounded-2xl shadow-2xl transform -rotate-12 z-20">
                        <Zap size={32} fill="currentColor" />
                    </div>

                    {/* Main Card (Phone Interface) */}
                    <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border-[6px] border-white backdrop-blur-sm transform rotate-[-6deg] hover:rotate-0 transition-transform duration-700 mx-auto max-w-[340px] relative z-10">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-2">
                                <Sparkles className="text-purple-600 fill-purple-600" size={16} />
                                <span className="font-bold text-purple-600 text-sm">AI Coach</span>
                            </div>
                            <div className="flex gap-1.5 opacity-30">
                                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 bg-gray-50 min-h-[320px] flex flex-col gap-4 text-left">
                            <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">You</p>
                                <p className="text-sm font-medium text-gray-800 leading-relaxed">What do you want to write about?</p>
                                <div className="mt-2 bg-gray-50 p-2 rounded-lg text-xs text-gray-500 italic border border-dashed border-gray-200">
                                    Write a Instagram post about our new...
                                </div>
                            </div>

                            <div className="bg-purple-100/50 p-4 rounded-2xl rounded-tr-sm shadow-sm border border-purple-100">
                                <p className="text-sm leading-relaxed text-gray-700">
                                    Fancy a freshly brewed cup from your local coffee shop? Come and try our new espresso!
                                </p>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-purple-200/50">
                                    <div className="flex gap-2">
                                        <div className="w-4 h-4 rounded bg-purple-200"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] text-purple-600 font-bold flex items-center gap-1">
                                            Retry
                                        </span>
                                        <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-bold">
                                            Replace
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-auto">
                                <button type="button" className="flex-1 py-2 bg-white border border-purple-200 text-purple-600 text-[10px] font-bold rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-1 shadow-sm">
                                    <Sparkles size={10} /> Rephrase
                                </button>
                                <button type="button" className="flex-1 py-2 bg-white border border-gray-200 text-gray-500 text-[10px] font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                                    Shorten
                                </button>
                                <button type="button" className="flex-1 py-2 bg-white border border-gray-200 text-gray-500 text-[10px] font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                                    + Expand
                                </button>
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
