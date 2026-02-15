import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AuthDialog } from '../components/AuthDialog';
import { ShieldCheck, Activity, Brain, HeartPulse, GitBranch, BarChart3, Users, Gauge } from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const target = document.getElementById(hash);
    if (!target) return;
    const id = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF3EA] via-white to-[#FFF8F1] dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4EDE4] dark:bg-gray-800 text-[#D96C2B] mb-6">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">{t('home.portal')}</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#D96C2B] to-[#F28C6F] bg-clip-text text-transparent">
            {t('home.heroTitle')}
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="h-14 px-10 text-xl font-semibold rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
              onClick={() => {
                setAuthMode('login');
                setAuthOpen(true);
              }}
            >
              {t('auth.login')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-10 text-xl font-semibold rounded-2xl border-2"
              onClick={() => {
                setAuthMode('signup');
                setAuthOpen(true);
              }}
            >
              {t('auth.signup')}
            </Button>
          </div>
        </motion.div>
      </section>

      <section id="about" className="scroll-mt-24 container mx-auto px-4 py-12 md:py-20">
        <Card className="max-w-5xl mx-auto shadow-lg dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ShieldCheck className="w-6 h-6 text-green-600" />
              {t('nav.about')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-base text-gray-700 dark:text-gray-300 leading-8">
            <p>{t('home.aboutBody')}</p>
            <p>
              MediTriage combines clinical vitals, symptom severity, and historical context to support faster first-line
              triage decisions in emergency workflows. It is designed for nurse and doctor teams who need consistent,
              explainable prioritization during high patient volume.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-[#E8D5C3] dark:border-gray-700 bg-[#FFF7EF] dark:bg-gray-950 p-4">
                <Brain className="w-5 h-5 text-[#D96C2B] mb-2" />
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Risk Prediction Engine</p>
                <p className="text-xs mt-1">AI-assisted scoring from symptoms, vitals, and medical history.</p>
              </div>
              <div className="rounded-lg border border-[#E8D5C3] dark:border-gray-700 bg-[#FFF7EF] dark:bg-gray-950 p-4">
                <GitBranch className="w-5 h-5 text-[#D96C2B] mb-2" />
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Department Routing</p>
                <p className="text-xs mt-1">Recommends likely care department with confidence and reasoning.</p>
              </div>
              <div className="rounded-lg border border-[#E8D5C3] dark:border-gray-700 bg-[#FFF7EF] dark:bg-gray-950 p-4">
                <HeartPulse className="w-5 h-5 text-[#D96C2B] mb-2" />
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Clinical Explainability</p>
                <p className="text-xs mt-1">Shows top contributing features to support transparent decisions.</p>
              </div>
              <div className="rounded-lg border border-[#E8D5C3] dark:border-gray-700 bg-[#FFF7EF] dark:bg-gray-950 p-4">
                <BarChart3 className="w-5 h-5 text-[#D96C2B] mb-2" />
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Operational Insight</p>
                <p className="text-xs mt-1">Supports queue balancing, urgency tracking, and audit readiness.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container mx-auto px-4 pt-4 pb-16">
        <Card className="max-w-3xl mx-auto border-[#E8D5C3] bg-gradient-to-b from-white to-[#F6F0E8] dark:from-gray-900 dark:to-gray-950 shadow-2xl [transform-style:preserve-3d]">
          <CardContent className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6 p-7">
            <div className="relative overflow-hidden rounded-xl border border-[#E8D5C3] bg-[#FDF7F0] dark:bg-gray-950/80 p-4 shadow-inner">
              <div className="absolute inset-0 opacity-35" aria-hidden="true">
                <svg className="h-full w-full">
                  <defs>
                    <pattern id="pulse-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E9D6C5" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#pulse-grid)" />
                </svg>
              </div>
              <motion.div
                aria-hidden="true"
                className="absolute -top-8 bottom-0 w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm"
                animate={{ x: ['-15%', '115%'] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
              />
              <svg viewBox="0 0 520 150" className="relative w-full" aria-label="Live pulse monitor">
                <defs>
                  <linearGradient id="pulse-line" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F2A66F" />
                    <stop offset="45%" stopColor="#E38B4E" />
                    <stop offset="100%" stopColor="#D96C2B" />
                  </linearGradient>
                  <filter id="pulse-glow">
                    <feGaussianBlur stdDeviation="2.4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <motion.path
                  d="M10 92 H110 L140 92 L160 54 L179 120 L205 38 L228 92 H282 L300 70 L318 92 H510"
                  fill="none"
                  stroke="url(#pulse-line)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#pulse-glow)"
                  strokeDasharray="760"
                  initial={{ strokeDashoffset: 760 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.2 }}
                />
                <motion.circle
                  r="6"
                  fill="#D96C2B"
                  filter="url(#pulse-glow)"
                  animate={{ cx: [10, 510], cy: [92, 92] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                />
              </svg>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-[#3A2E2A] dark:text-gray-100">
                <Users className="w-4 h-4 text-[#D96C2B] mt-1" />
                <div>
                  <p className="text-xl font-bold">247</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Patients Triaged Today</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-[#3A2E2A] dark:text-gray-100">
                <Gauge className="w-4 h-4 text-[#D96C2B] mt-1" />
                <div>
                  <p className="text-xl font-bold">98.6%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">AI Accuracy Rate</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="bg-[#F2F2F2] dark:bg-gray-900/80 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-4xl font-bold text-[#2E2220] dark:text-gray-100">Intelligent Features</h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Powered by advanced AI to support healthcare professionals in making life-saving decisions.
            </p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#E8D5C3] bg-[#ECE5DC] dark:bg-gray-950 dark:border-gray-700 p-4 shadow-sm">
              <Brain className="w-5 h-5 text-[#D96C2B] mb-2" />
              <p className="font-semibold text-sm text-[#2E2220] dark:text-gray-100">Risk Prediction Engine</p>
              <p className="text-xs mt-2 text-gray-700 dark:text-gray-300">Advanced AI algorithms analyze patient vitals and symptoms to predict risk levels with high accuracy.</p>
            </div>
            <div className="rounded-xl border border-[#E8D5C3] bg-[#ECE5DC] dark:bg-gray-950 dark:border-gray-700 p-4 shadow-sm">
              <GitBranch className="w-5 h-5 text-[#D96C2B] mb-2" />
              <p className="font-semibold text-sm text-[#2E2220] dark:text-gray-100">Department Recommendation</p>
              <p className="text-xs mt-2 text-gray-700 dark:text-gray-300">Intelligent routing to the appropriate department based on patient condition and hospital capacity.</p>
            </div>
            <div className="rounded-xl border border-[#E8D5C3] bg-[#ECE5DC] dark:bg-gray-950 dark:border-gray-700 p-4 shadow-sm">
              <HeartPulse className="w-5 h-5 text-[#D96C2B] mb-2" />
              <p className="font-semibold text-sm text-[#2E2220] dark:text-gray-100">Explainable AI</p>
              <p className="text-xs mt-2 text-gray-700 dark:text-gray-300">Transparent decision-making with clear explanations of contributing factors for every prediction.</p>
            </div>
            <div className="rounded-xl border border-[#E8D5C3] bg-[#ECE5DC] dark:bg-gray-950 dark:border-gray-700 p-4 shadow-sm">
              <BarChart3 className="w-5 h-5 text-[#D96C2B] mb-2" />
              <p className="font-semibold text-sm text-[#2E2220] dark:text-gray-100">Hospital Load Monitoring</p>
              <p className="text-xs mt-2 text-gray-700 dark:text-gray-300">Real-time dashboards tracking patient flow, bed distribution, and department utilization.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#3A2B2B] text-[#F5EFE8]">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="font-bold text-white">PulsePoint AI</p>
              <p className="mt-3 text-[#E4D4C8]">Smart triage intelligence for modern healthcare facilities.</p>
            </div>
            <div>
              <p className="font-bold text-white">Quick Links</p>
              <div className="mt-3 flex flex-col gap-1">
                <a href="/#about" className="hover:text-white">About</a>
                <Link to="/ethics-safety" className="hover:text-white">Ethics &amp; Safety</Link>
                <Link to="/regulations" className="hover:text-white">Regulations</Link>
              </div>
            </div>
            <div>
              <p className="font-bold text-white">Notice</p>
              <p className="mt-3 text-[#E4D4C8]">This system uses synthetic data for demonstration. Always consult qualified healthcare professionals for medical decisions.</p>
            </div>
          </div>
        </div>
      </section>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </div>
  );
}
