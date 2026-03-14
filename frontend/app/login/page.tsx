"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Correct import for App Router
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';


function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showReset, setShowReset] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1: email, 2: code+password
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (searchParams.get('signup') === 'success') {
            setSuccess('Account created! Please log in.');
        }
    }, [searchParams]);

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.detail || 'Login failed');

            // Store Token
            localStorage.setItem('token', data.access_token);

            // Redirect
            router.push('/dashboard');
        } catch (err: any) {
            // FastAPI sometimes returns detail as an array of objects
            if (typeof err.message === 'object') {
                setError(JSON.stringify(err.message));
            } else if (err.message) {
                setError(String(err.message));
            } else {
                setError("An unknown error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/v1/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.detail || 'Google Login failed');

            // Store Token
            localStorage.setItem('token', data.access_token);

            // Redirect
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || "An unknown error occurred with Google login.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <Card className="max-w-md w-full p-8 border-purple-500/20 bg-gray-900/50 backdrop-blur-xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    Welcome Back
                </h1>
                <p className="text-gray-400 mt-2">Log in to continue learning</p>
            </div>

            {success && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg mb-6 text-sm text-center animate-pulse">
                    {success}
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
                    {error}
                </div>
            )}

            {!showReset ? (
                <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Login Failed')}
                            theme="filled_black"
                            text="signin_with"
                            shape="rectangular"
                        />
                    </div>

                    <div className="flex items-center my-4">
                        <div className="flex-grow border-t border-gray-700"></div>
                        <span className="mx-4 text-sm text-gray-500">or</span>
                        <div className="flex-grow border-t border-gray-700"></div>
                    </div>

                    <div>

                        <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="student@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="block text-sm text-gray-400">Password</label>
                            <button onClick={() => setShowReset(true)} className="text-xs text-purple-400 hover:text-purple-300">
                                Forgot password?
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <Button onClick={handleLogin} disabled={loading || !email || !password} className="w-full bg-purple-600 hover:bg-purple-500">
                        {loading ? <Loader2 className="animate-spin" /> : <>Log In <LogIn className="ml-2 w-4 h-4" /></>}
                    </Button>
                </div>
            ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-4">
                        <p className="text-sm text-gray-400">Reset your password to regain access</p>
                    </div>

                    {resetStep === 1 ? (
                        <>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="student@example.com"
                                />
                            </div>
                            <Button onClick={handleRequestReset} disabled={loading || !email} className="w-full bg-purple-600">
                                {loading ? <Loader2 className="animate-spin" /> : "Send Reset Code"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Enter 6-digit Code</label>
                                <input
                                    type="text"
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2.5 px-4 text-center tracking-widest font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="000000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <Button onClick={handleConfirmReset} disabled={loading || !resetCode || !newPassword} className="w-full bg-purple-600">
                                {loading ? <Loader2 className="animate-spin" /> : "Change Password"}
                            </Button>
                        </>
                    )}

                    <button onClick={() => { setShowReset(false); setResetStep(1); }} className="w-full text-sm text-gray-500 hover:text-gray-300 py-2">
                        Back to Login
                    </button>
                </div>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
                Don't have an account? <a href="/signup" className="text-purple-400 hover:text-purple-300">Sign up</a>
            </div>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <Suspense fallback={<Card className="max-w-md w-full p-8 border-purple-500/20 bg-gray-900/50 backdrop-blur-xl flex justify-center items-center h-[500px]"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></Card>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
