"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Home, BrainCircuit, Target, MessageSquare, ShieldAlert, Repeat, Users, Calendar } from 'lucide-react';

export function AuthNavbar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Reviews', href: '/reviews', icon: Repeat },
        { name: 'Practice', href: '/adaptive/choose', icon: BrainCircuit },
        { name: 'Progress', href: '/progress', icon: Target },
        { name: 'Planner', href: '/planner', icon: Calendar },
        { name: 'Chat', href: '/chat', icon: MessageSquare },
        { name: 'Assessments', href: '/assessment/1', icon: ShieldAlert },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 overflow-hidden rounded-lg border border-white/10 group-hover:border-white/20 transition-colors">
                                <img src="/icon.png" alt="AI Tutor Logo" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 group-hover:from-blue-300 group-hover:to-purple-300 transition-all">
                                AI Tutor
                            </span>
                        </Link>

                        <div className="hidden md:block">
                            <div className="flex items-center space-x-1 sm:space-x-4">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href ||
                                        (item.name === 'Practice' && pathname.startsWith('/adaptive'));
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? 'bg-white/10 text-white shadow-sm'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-white hover:bg-white/10 px-4 py-2 flex items-center gap-2 rounded-full transition-colors text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Log Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
