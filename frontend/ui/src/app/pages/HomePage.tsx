import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AuthDialog } from '../components/AuthDialog';
import { ShieldCheck, Scale, FileCheck2, Activity } from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

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
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setAuthMode('login');
                setAuthOpen(true);
              }}
            >
              {t('auth.login')}
            </Button>
            <Button
              variant="outline"
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

      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card id="about" className="shadow-lg dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                {t('nav.about')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 dark:text-gray-300">
              {t('home.aboutBody')}
            </CardContent>
          </Card>
          <Card id="ethics" className="shadow-lg dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-600" />
                {t('nav.ethics')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 dark:text-gray-300">
              {t('home.ethicsBody')}
            </CardContent>
          </Card>
          <Card id="regulations" className="shadow-lg dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                {t('nav.regulations')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 dark:text-gray-300">
              {t('home.regulationsBody')}
            </CardContent>
          </Card>
        </div>
      </section>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </div>
  );
}
