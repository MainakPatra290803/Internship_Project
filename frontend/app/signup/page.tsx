"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mail, Lock, Key, CheckCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';


export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRequestOTP = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/v1/auth/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!res.ok) throw new Error('Failed to send OTP');
            setStep('otp');
        } catch (err) {
            setError('Failed to send OTP. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/v1/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, password })
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonErr) {
                throw new Error(text || 'Server error during signup');
            }

            if (!res.ok) throw new Error(data.detail || 'Signup failed');

            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
                router.push('/dashboard');
            } else {
                router.push('/login?signup=success');
            }
        } catch (err: any) {
            setError(err.message);
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

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonErr) {
                throw new Error(text || 'Server error during Google Signup');
            }

            if (!res.ok) throw new Error(data.detail || 'Google Signup failed');

            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
                router.push('/dashboard');
            } else {
                router.push('/login?signup=success');
            }
        } catch (err: any) {
            setError(err.message || "An unknown error occurred with Google signup.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 border-gray-800 bg-[#12121a] shadow-2xl rounded-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Create Account
                    </h1>
                    <p className="text-gray-400">Join to continue to your dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Step 1: Credentials (Email + Password) */}
                {step === 'credentials' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="space-y-6">
                            <div className="flex justify-center mb-4">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Google Signup Failed')}
                                    theme="filled_black"
                                    text="signup_with"
                                    shape="rectangular"
                                />
                            </div>

                            <div className="flex items-center my-4">
                                <div className="flex-grow border-t border-gray-800"></div>
                                <span className="mx-4 text-sm text-gray-500">or</span>
                                <div className="flex-grow border-t border-gray-800"></div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#1c1c26] border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all text-gray-200 placeholder-gray-600"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#1c1c26] border border-gray-700 rounded-lg py-3 pl-10 pr-12 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all text-gray-200 placeholder-gray-600"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <Button onClick={handleRequestOTP} disabled={loading || !email || !password} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors">
                                {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : "Get Verification Code"}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: OTP */}
                {step === 'otp' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="inline-block p-4 bg-purple-500/10 rounded-full mb-3">
                                    <Mail className="w-8 h-8 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-medium text-white">Enter Verification Code</h3>
                                <p className="text-sm text-gray-400 mt-1">We sent a code to <span className="text-white font-medium">{email}</span></p>
                                <p className="text-xs text-purple-400 mt-2 font-mono bg-purple-500/10 py-1 px-2 rounded inline-block">(Check logs for debug OTP)</p>
                            </div>
                            <div>
                                <div className="relative">
                                    <Key className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-[#1c1c26] border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all text-gray-200 placeholder-gray-600 tracking-widest text-center text-lg font-mono"
                                        placeholder="123456"
                                        maxLength={6}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleSignup} disabled={loading || otp.length < 6} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors">
                                {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : "Verify & Complete Signup"}
                            </Button>
                            <button onClick={() => setStep('credentials')} className="w-full text-sm text-gray-500 hover:text-gray-300 mt-2 transition-colors">
                                Change Email
                            </button>
                        </div>
                    </motion.div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
                    Already have an account? <a href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Log in</a>
                </div>
            </Card>
        </div>
    );
}
