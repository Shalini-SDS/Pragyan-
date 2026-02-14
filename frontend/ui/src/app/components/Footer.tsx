import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Heart } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm">{t('footer.tagline')}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('footer.copyright')}
          </div>
        </div>
      </div>
    </footer>
  );
}
