'use client';
import { useState, useEffect } from 'react';
import { Question } from '../types';

interface SpacedRepetitionCardProps {
    question: Question;
    onRate: (quality: number) => void;
}

export default function SpacedRepetitionCard({ question, onRate }: SpacedRepetitionCardProps) {
    const [showAnswer, setShowAnswer] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    // Reset internal state when a new question is passed in
    useEffect(() => {
        setShowAnswer(false);
        setSelectedAnswer(null);
        setIsCorrect(null);
    }, [question.id]);

    const handleAnswerSelect = (option: string) => {
        if (selectedAnswer) return; // Prevent changing answer
        setSelectedAnswer(option);

        const correct = option === question.correct_answer;
        setIsCorrect(correct);
        setShowAnswer(true);

        // Auto rate: 4 (Good) if correct, 1 (Again) if incorrect.
        // We delay it slightly so the user can read the explanation.
        setTimeout(() => {
            onRate(correct ? 4 : 1);
        }, 3500);
    };

    const handleRateManual = (quality: number) => {
        setShowAnswer(false);
        setSelectedAnswer(null);
        setIsCorrect(null);
        onRate(quality);
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 transition-all">
            <h2 className="text-xl font-bold text-gray-100 mb-6 text-center">Review Item</h2>

            <div className="text-lg text-gray-300 min-h-[120px] flex items-center justify-center text-center p-6 bg-gray-800/50 rounded-lg">
                {question.content}
            </div>

            {/* MCQ Options Display */}
            {question.options && question.options.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((opt: string, i: number) => {
                        const isSelected = selectedAnswer === opt;
                        const isCorrectOption = showAnswer && opt === question.correct_answer;
                        const isWrongSelection = showAnswer && isSelected && !isCorrectOption;

                        let baseClasses = "p-5 rounded-2xl border text-left transition-all duration-300 font-medium ";

                        if (!showAnswer) {
                            baseClasses += "border-white/10 bg-white/5 hover:border-blue-500 hover:bg-blue-500/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:-translate-y-1 text-white";
                        } else {
                            // Revealed State Styling
                            if (isCorrectOption) {
                                baseClasses += "border-green-500 bg-green-500/20 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-[1.02] z-10";
                            } else if (isWrongSelection) {
                                baseClasses += "border-red-500 bg-red-500/20 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]";
                            } else {
                                baseClasses += "border-white/5 bg-white/5 text-gray-500 opacity-50";
                            }
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => handleAnswerSelect(opt)}
                                disabled={showAnswer}
                                className={baseClasses}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            ) : !showAnswer && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => setShowAnswer(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-all text-lg"
                    >
                        Show Answer
                    </button>
                </div>
            )}

            {showAnswer && (
                <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Active Recall Feedback */}
                    {selectedAnswer && (
                        <div className={`p-6 rounded-2xl font-bold text-center text-xl flex items-center justify-center gap-3 transition-all ${isCorrect ? 'bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]'}`}>
                            {isCorrect ? '✅ Outstanding! Correct Answer!' : '❌ Incorrect! Let\'s review it.'}
                        </div>
                    )}

                    <div className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl shadow-inner">
                        <h3 className="text-xs font-bold text-green-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Correct Answer
                        </h3>
                        <p className="text-white text-lg font-medium">{question.correct_answer || "N/A"}</p>

                        {question.explanation && (
                            <div className="mt-6 pt-6 border-t border-gray-700/50">
                                <h3 className="text-xs font-bold text-blue-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Explanation
                                </h3>
                                <p className="text-gray-300 leading-relaxed">{question.explanation}</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-6">
                        {selectedAnswer ? (
                            <div className="text-center text-gray-400 text-sm italic">
                                Automatically advancing in a few seconds...
                            </div>
                        ) : (
                            <>
                                <h3 className="text-center text-gray-400 mb-4 font-medium">How hard was it to remember?</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <button
                                        onClick={() => handleRateManual(1)}
                                        className="group relative py-3 px-4 bg-red-900/30 hover:bg-red-600 border border-red-800/50 rounded-lg transition-colors flex flex-col items-center"
                                    >
                                        <span className="font-bold text-red-200 group-hover:text-white">Again</span>
                                        <span className="text-xs text-red-400 group-hover:text-red-100 mt-1">Forgot completely</span>
                                    </button>
                                    <button
                                        onClick={() => handleRateManual(3)}
                                        className="group relative py-3 px-4 bg-orange-900/30 hover:bg-orange-600 border border-orange-800/50 rounded-lg transition-colors flex flex-col items-center"
                                    >
                                        <span className="font-bold text-orange-200 group-hover:text-white">Hard</span>
                                        <span className="text-xs text-orange-400 group-hover:text-orange-100 mt-1">Took effort</span>
                                    </button>
                                    <button
                                        onClick={() => handleRateManual(4)}
                                        className="group relative py-3 px-4 bg-blue-900/30 hover:bg-blue-600 border border-blue-800/50 rounded-lg transition-colors flex flex-col items-center"
                                    >
                                        <span className="font-bold text-blue-200 group-hover:text-white">Good</span>
                                        <span className="text-xs text-blue-400 group-hover:text-blue-100 mt-1">Remembered well</span>
                                    </button>
                                    <button
                                        onClick={() => handleRateManual(5)}
                                        className="group relative py-3 px-4 bg-green-900/30 hover:bg-green-600 border border-green-800/50 rounded-lg transition-colors flex flex-col items-center"
                                    >
                                        <span className="font-bold text-green-200 group-hover:text-white">Easy</span>
                                        <span className="text-xs text-green-400 group-hover:text-green-100 mt-1">Effortless</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
