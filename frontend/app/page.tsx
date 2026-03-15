"use client";

import Link from 'next/link';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Database, CheckCircle, TrendingUp, Award, Users, BookOpen, Brain, Briefcase, Code, ChevronDown, ChevronUp } from 'lucide-react';

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Parallax effects
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end start"] });
  const yHeroText = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityHeroText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const healthUrl = backendUrl 
          ? (backendUrl.endsWith('/') ? `${backendUrl}health` : `${backendUrl}/health`)
          : '/health';
          
        console.log("Checking health at:", healthUrl);
        const res = await fetch(healthUrl);
        console.log("Health response:", res.status);
        if (res.ok) setHealthStatus('online');
        else setHealthStatus('offline');
      } catch (e) {
        console.error("Health check failed:", e);
        setHealthStatus('offline');
      }
    };
    checkHealth();
  }, []);

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const faqs = [
    {
      q: "Is this suitable for 1st-year B.Tech students?",
      a: "Absolutely! Early adoption gives you a massive advantage. We start from the very basics of C/C++ and Data Structures, progressively building your logic for advanced algorithms."
    },
    {
      q: "Does AI Tutor help with FAANG/MAANG placement prep?",
      a: "Yes. Our adaptive engine dynamically generates coding problems aligned with top-tier company interview patterns. The AI acts as your mock interviewer, guiding your optimization strategies."
    },
    {
      q: "Is GATE CSE content covered in this tutor?",
      a: "Our core modules cover Operating Systems, DBMS, Computer Networks, and Theory of Computation, strictly mapped to the GATE syllabus. We generate novel MCQs and NATs to ensure you're not just memorizing PYQs."
    },
    {
      q: "How is this different from YouTube tutorials or standard MOOCs?",
      a: "Passive watching doesn't build problem-solving skills. AI Tutor is an active learning platform. It analyzes code you write, explains exactly where your logic fails, and modifies future questions based on your specific weaknesses."
    }
  ];

  const courses = [
    { title: "Data Structures & Algorithms", level: "Beginner to Advanced", color: "from-blue-500 to-indigo-500", icon: <Code className="w-5 h-5" /> },
    { title: "Full-Stack Web Development (MERN)", level: "Intermediate", color: "from-purple-500 to-pink-500", icon: <Database className="w-5 h-5" /> },
    { title: "Core CSE: OS, DBMS & Networks", level: "GATE / Placement", color: "from-emerald-500 to-teal-500", icon: <Briefcase className="w-5 h-5" /> },
    { title: "Machine Learning Foundations", level: "Beginner", color: "from-orange-500 to-red-500", icon: <Brain className="w-5 h-5" /> },
    { title: "Aptitude & Logical Reasoning", level: "Campus Prep", color: "from-yellow-400 to-orange-500", icon: <TrendingUp className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-blue-500/30 overflow-x-hidden" ref={targetRef}>

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/15 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full">
        {/* Navigation Bar */}
        <div className="pt-6 px-6 relative z-50 w-full">
          <nav className="max-w-7xl mx-auto px-6 md:px-8 flex justify-between items-center py-4 border border-white/10 bg-black/60 backdrop-blur-md rounded-full shadow-2xl">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 overflow-hidden rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-purple-500/40 transition-all duration-300 transform group-hover:scale-105 border border-white/10">
                <img src="/icon.png" alt="AI Tutor Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:to-white transition-all">AI Tutor</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
              <Link href="#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="#modules" className="hover:text-white transition-colors">CSE Modules</Link>
              <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
            </div>

            <div className="flex items-center gap-4">
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border ${healthStatus === 'online' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                healthStatus === 'offline' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  'bg-gray-800 border-gray-700 text-gray-400'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${healthStatus === 'online' ? 'bg-green-500 animate-pulse' : healthStatus === 'offline' ? 'bg-red-500' : 'bg-gray-400'}`} />
                <span className="hidden sm:inline">{healthStatus === 'checking' ? 'Connecting...' : `System ${healthStatus}`}</span>
              </div>

              <Link href="/login" className="text-gray-300 hover:text-white px-5 py-2 transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="bg-white text-black hover:bg-gray-200 rounded-full px-7 py-2.5 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
                Sign Up
              </Link>
            </div>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div style={{ y: yHeroText, opacity: opacityHeroText }} initial="hidden" animate="show" variants={staggerContainer} className="max-w-4xl mx-auto z-10">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-sm font-medium text-blue-300 tracking-wide uppercase">Built for Indian Engineering Students</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tighter leading-[1.1]">
              Crack Top Placements & <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                GATE with AI Mastery
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              The ultimate B.Tech companion. Master Data Structures, Algorithms, Web Dev, and core subjects with an AI tutor that adapts to your learning speed in real-time.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 text-lg rounded-full shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] w-full border border-white/10">
                  Start Free Practice
                </Button>
              </Link>
              <Link href="#modules" className="w-full sm:w-auto">
                <Button variant="outline" className="h-14 border-gray-700 hover:border-gray-500 hover:bg-white/5 text-gray-300 px-10 text-lg rounded-full w-full transition-all">
                  Explore CSE Modules
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats Banner (Inspired by Screenshot) */}
        <section className="py-12 border-y border-white/5 bg-black/40 backdrop-blur-md relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-gray-800">
              {[
                { label: "Active CSE Students", value: "50K+", icon: <Users className="w-5 h-5 text-blue-400 mb-2" /> },
                { label: "Problems Solved", value: "1M+", icon: <Code className="w-5 h-5 text-purple-400 mb-2" /> },
                { label: "Concept Mastery Rate", value: "94%", icon: <TrendingUp className="w-5 h-5 text-green-400 mb-2" /> },
                { label: "Top NIT/IIT Users", value: "15+", icon: <Award className="w-5 h-5 text-orange-400 mb-2" /> }
              ].map((stat, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="flex flex-col items-center justify-center text-center px-4"
                >
                  {stat.icon}
                  <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-500">{stat.value}</h3>
                  <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section (Inspired by Screenshot) */}
        <section id="modules" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/3"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
                Interactive courses built for Indian engineers.
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Create a custom learning pathway tailored to your university syllabus, GATE preparation, or placements.
              </p>
              <Link href="/signup">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-full group transition-all shrink-0">
                  Browse Full Syllabus
                  <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
                </Button>
              </Link>
            </motion.div>

            <div className="lg:w-2/3 grid gap-4 w-full">
              {courses.map((course, i) => (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="bg-gray-900/40 hover:bg-gray-800/60 border border-gray-800 hover:border-gray-600 p-6 rounded-2xl flex items-center justify-between group transition-all cursor-pointer backdrop-blur-sm shadow-xl"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center shadow-lg`}>
                      {course.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-200 group-hover:text-white transition-colors">{course.title}</h3>
                      <p className="text-sm text-gray-500">{course.level}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all">
                    <span className="text-gray-500 group-hover:text-black transition-colors">▶</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof / Testimonials (Inspired by Screenshot) */}
        <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Loved by learners nationwide</h2>
            <p className="text-gray-400">Real stories from B.Tech students who cracked their dream goals.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "The adaptive DSA modules helped me identify my weak spots in Dynamic Programming just in time for my FAANG interviews. This is a game changer for on-campus placements.", name: "Rahul D.", title: "Placed at Top Product Company" },
              { quote: "The Operating Systems and DBMS practice quizzes are exactly what you need for GATE prep. The AI explains the reasoning behind every NAT question perfectly.", name: "Sneha K.", title: "GATE CSE AIR 154" },
              { quote: "As a tier-3 college student, I lacked good professors. The AI Tutor's step-by-step guidance in Web Dev took me from knowing nothing to building full-stack apps in weeks.", name: "Arjun M.", title: "Pre-Final Year CSE Student" },
            ].map((test, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                key={i}
                className="bg-gradient-to-b from-gray-900/50 to-black border border-gray-800 p-8 rounded-3xl relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex gap-1 text-yellow-500 mb-6">
                  {"★★★★★".split('').map((star, i) => <span key={i}>{star}</span>)}
                </div>
                <p className="text-gray-300 mb-8 leading-relaxed italic border-l-2 border-gray-700 pl-4">{`"${test.quote}"`}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">
                    {test.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-200">{test.name}</h4>
                    <p className="text-xs text-blue-400 uppercase tracking-wider">{test.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section (Inspired by Screenshot) */}
        <section id="faq" className="py-24 px-6 max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 pb-2">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-800/30 transition-colors"
                >
                  <span className="font-semibold text-lg text-gray-200">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-blue-600/20 text-blue-400 transition-transform ${activeFaq === i ? 'rotate-180 bg-blue-600 text-white' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                {/* Expandable Content */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${activeFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-gray-800/50">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Global CTA */}
        <section className="py-24 px-6 relative z-10 mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto bg-gradient-to-br from-blue-900 border border-blue-500/30 p-12 md:p-20 rounded-[3rem] text-center shadow-2xl overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-blue-600/10 blur-3xl"></div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-white">Ready to elevate your CGPA?</h2>
              <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">Join thousands of CSE students learning smarter not harder.</p>
              <Link href="/signup" className="inline-block bg-white text-blue-900 hover:bg-gray-100 px-10 py-5 text-lg rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 font-bold">
                Start Your Learning Journey
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-16 border-t border-gray-800 bg-black/80 backdrop-blur-md relative z-10">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

            {/* Branding & Contact */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 overflow-hidden rounded-lg">
                    <img src="/icon.png" alt="AI Tutor Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-white">AI Tutor</span>
              </div>
              <p className="text-gray-400">Next level AI tutoring for B.Tech & CSE students.</p>

              <div className="pt-4 space-y-3">
                <h4 className="text-white font-semibold mb-2">Contact</h4>
                <a href="mailto:mainakp2003@gmail.com" className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                  <span>✉</span> mainakp2003@gmail.com
                </a>
                <a href="tel:+919876543210" className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                  <span>📞</span> +91 98765 43210
                </a>
                <div className="flex items-start gap-2 text-gray-400">
                  <span>📍</span>
                  <span>
                    Tech Park, Sector V<br />
                    Salt Lake City, Kolkata,<br />
                    West Bengal 700091, India
                  </span>
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Products</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">B2B Institutional API</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Placement Prep</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Free DSA Tracker</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">White Label Solutions</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">AI for University Professors</Link></li>
              </ul>
            </div>

            {/* Tools */}
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Tools</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">AI Code Debugger</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Algorithm Visualizer</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Mock Interview Generator</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">GATE Question Bank</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Adaptive Flashcards</Link></li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">About</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Campus Ambassador Program ↗</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>

          </div>

          <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} AI Tutor | All Rights Reserved</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span className="text-gray-600">Built for Indian Engineers</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
