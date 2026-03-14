"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Database, Network, Cpu, Code2, ArrowRight, Terminal, Lightbulb } from 'lucide-react';

export default function ChooseTopic() {
    const topics = [
        {
            id: 1,
            name: "Data Structures",
            description: "Arrays, Lists, Trees, Graphs, Hash Tables.",
            icon: <Database className="w-8 h-8 text-blue-400" />,
            color: "from-blue-900/20 to-transparent",
            borderColor: "border-blue-500/20",
            hoverBorder: "group-hover:border-blue-500/50"
        },
        {
            id: 2,
            name: "Algorithms",
            description: "Sorting, Searching, Dynamic Programming, Greedy.",
            icon: <Code2 className="w-8 h-8 text-purple-400" />,
            color: "from-purple-900/20 to-transparent",
            borderColor: "border-purple-500/20",
            hoverBorder: "group-hover:border-purple-500/50"
        },
        {
            id: 3,
            name: "Operating Systems",
            description: "Processes, Threads, Memory Management, File Systems.",
            icon: <Cpu className="w-8 h-8 text-green-400" />,
            color: "from-green-900/20 to-transparent",
            borderColor: "border-green-500/20",
            hoverBorder: "group-hover:border-green-500/50"
        },
        {
            id: 4,
            name: "Computer Networks",
            description: "OSI Model, TCP/IP, Routing, Application Protocols.",
            icon: <Network className="w-8 h-8 text-orange-400" />,
            color: "from-orange-900/20 to-transparent",
            borderColor: "border-orange-500/20",
            hoverBorder: "group-hover:border-orange-500/50"
        },
        {
            id: 5,
            name: "Pseudocode",
            description: "Variables, Conditions, Loops, Functions, Array Ops.",
            icon: <Terminal className="w-8 h-8 text-pink-400" />,
            color: "from-pink-900/20 to-transparent",
            borderColor: "border-pink-500/20",
            hoverBorder: "group-hover:border-pink-500/50"
        },
        {
            id: 6,
            name: "Aptitude",
            description: "Logical Reasoning, Quantitative, Data, Verbal.",
            icon: <Lightbulb className="w-8 h-8 text-yellow-400" />,
            color: "from-yellow-900/20 to-transparent",
            borderColor: "border-yellow-500/20",
            hoverBorder: "group-hover:border-yellow-500/50"
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center relative">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-5xl w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl font-bold mb-4">Select a CSE Subject</h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Focus your adaptive practice session on a specific Computer Science domain.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topics.map((topic, idx) => (
                        <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Link href={`/adaptive?topic_id=${topic.id}&topic_name=${encodeURIComponent(topic.name)}`} className="block group">
                                <Card className={`h-full bg-gradient-to-br ${topic.color} ${topic.borderColor} ${topic.hoverBorder} p-8 relative overflow-hidden transition-all duration-300`}>
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                            {topic.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold mb-2 group-hover:text-white transition-colors text-gray-200">
                                                {topic.name}
                                            </h2>
                                            <p className="text-sm text-gray-400 mb-4">
                                                {topic.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-gray-300 text-sm font-semibold group-hover:translate-x-2 transition-transform mt-4 border-t border-white/10 pt-4">
                                        Start Practice <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors text-sm">
                        &larr; Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
