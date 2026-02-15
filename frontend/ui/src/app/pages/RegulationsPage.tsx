import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Lock, Database, TriangleAlert, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function RegulationsPage() {
  const { t } = useLanguage();

  const deploymentRequirements = [
    t('regulations.req1'),
    t('regulations.req2'),
    t('regulations.req3'),
    t('regulations.req4'),
    t('regulations.req5'),
  ];

  const architectureBlocks = [
    {
      title: t('regulations.arch.vitalSigns.title'),
      desc: t('regulations.arch.vitalSigns.body'),
    },
    {
      title: t('regulations.arch.symptomClassifier.title'),
      desc: t('regulations.arch.symptomClassifier.body'),
    },
    {
      title: t('regulations.arch.riskPredictor.title'),
      desc: t('regulations.arch.riskPredictor.body'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F1E8] via-[#FCF7F1] to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 py-10">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-[#3A2E2A] dark:text-gray-100">{t('regulations.title')}</h1>
          <p className="text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            {t('regulations.subtitle')}
          </p>
        </div>

        <Card className="shadow-md dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Lock className="w-6 h-6 text-[#D96C2B]" />
              {t('regulations.dataPrivacyTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-7">
            <p>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{t('regulations.complianceLabel')}:</span> {t('regulations.complianceBody')}
            </p>
            <p>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{t('regulations.accessControlLabel')}:</span> {t('regulations.accessControlBody')}
            </p>
            <p>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{t('regulations.dataRetentionLabel')}:</span> {t('regulations.dataRetentionBody')}
            </p>
            <p>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{t('regulations.thirdPartyLabel')}:</span> {t('regulations.thirdPartyBody')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-[#F1C6A8] bg-[#F7ECE2] dark:bg-[#3D2A20] dark:border-[#5B4030]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-[#4A2E1F] dark:text-[#FFD9C4]">
              <Database className="w-6 h-6 text-[#D96C2B]" />
              {t('regulations.syntheticTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#5C3824] dark:text-[#F3CDB8] leading-7">
            <p>
              <span className="font-semibold">{t('regulations.importantNoticeLabel')}:</span> {t('regulations.importantNoticeBody')}
            </p>
            <p>
              {t('regulations.syntheticIntro')}
            </p>
            <div className="space-y-2">
              {deploymentRequirements.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="mt-1 text-[#D96C2B]">-</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-white dark:bg-[#4A3429] p-3 text-xs text-gray-700 dark:text-gray-200 border border-[#E8D5C3] dark:border-[#6C4E3E]">
              <span className="font-semibold inline-flex items-center gap-1"><TriangleAlert className="w-3.5 h-3.5 text-[#D96C2B]" /> {t('regulations.medicalDisclaimerLabel')}:</span>
              {' '}
              {t('regulations.medicalDisclaimerBody')}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity className="w-6 h-6 text-[#D96C2B]" />
              {t('regulations.architectureTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('regulations.aiComponentsTitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {architectureBlocks.map((block) => (
                <div key={block.title} className="rounded-lg border border-[#E8D5C3] dark:border-gray-700 bg-[#F7F1E8] dark:bg-gray-950/60 p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{block.title}</p>
                  <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">{block.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-7">
              {t('regulations.architectureBody')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
