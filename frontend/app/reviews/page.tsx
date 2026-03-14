'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDueReviews, submitReviewQuality, fetchStudentStats } from '../lib/api';
import SpacedRepetitionCard from '../components/SpacedRepetitionCard';
import { Flame, Clock } from 'lucide-react';

export default function ReviewsPage() {
    const [dueReviews, setDueReviews] = useState<any[]>([]);
    const [stats, setStats] = useState<{ current_streak: number, total_active_minutes: number } | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [reviews, userStats] = await Promise.all([
                    fetchDueReviews(),
                    fetchStudentStats()
                ]);
                setDueReviews(reviews);
                setStats(userStats);
            } catch (err) {
                console.error("Failed to load review data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleRate = async (quality: number) => {
        const currentItem = dueReviews[currentIndex];
        try {
            await submitReviewQuality({ content_item_id: currentItem.id, quality });
            // Move to the next card after a slight delay for better UX
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 300);
        } catch (err) {
            console.error("Failed to submit review:", err);
            alert("Error submitting review. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (dueReviews.length === 0 || currentIndex >= dueReviews.length) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950 p-6">
                <div className="text-center max-w-md bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-2xl">
                    <div className="text-5xl mb-4">🎉</div>
                    <h1 className="text-2xl font-bold text-white mb-2">You're All Caught Up!</h1>
                    <p className="text-gray-400 mb-6">You have completed all your daily reviews. Check back tomorrow to strengthen your memory.</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-all"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            {/* Stats Header */}
            {stats && (
                <div className="w-full max-w-2xl mb-8 grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-500/20 p-2 rounded-lg text-orange-400 border border-orange-500/30">
                                <Flame className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 font-medium">Study Streak</p>
                                <p className="text-xl font-bold text-white">{stats.current_streak} {stats.current_streak === 1 ? 'Day' : 'Days'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 border border-blue-500/30">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 font-medium">Total Active Time</p>
                                <p className="text-xl font-bold text-white">{stats.total_active_minutes} min</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-2xl mb-8 flex justify-between items-center text-gray-400">
                <span className="font-semibold text-purple-400 uppercase tracking-widest text-sm">Daily Reviews</span>
                <span className="font-mono bg-gray-900 px-3 py-1 rounded-full text-sm border border-gray-800">
                    {currentIndex + 1} / {dueReviews.length}
                </span>
            </div>

            <SpacedRepetitionCard
                question={dueReviews[currentIndex]}
                onRate={handleRate}
            />
        </div>
    );
}
