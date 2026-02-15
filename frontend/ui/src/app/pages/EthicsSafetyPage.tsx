import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ShieldCheck, Eye, BarChart3, Lock, CheckCircle2 } from 'lucide-react';

const principles = [
  {
    title: 'AI Confidence Awareness',
    body: 'Predictions include confidence signals. Low-confidence outputs are flagged for manual clinical review before action.',
    icon: ShieldCheck,
  },
  {
    title: 'Human-in-the-Loop Override',
    body: 'Medical professionals can challenge, edit, and override recommendations. Final authority always stays with clinicians.',
    icon: Eye,
  },
  {
    title: 'Bias Monitoring and Mitigation',
    body: 'Outcome variance is reviewed across demographics to identify and correct potential model bias in triage outcomes.',
    icon: BarChart3,
  },
  {
    title: 'Data Privacy and Security',
    body: 'Sensitive patient data is encrypted in transit and at rest. Access is role-based, logged, and regularly audited.',
    icon: Lock,
  },
];

const monitors = [
  { label: 'Age Groups', variance: '2.3%' },
  { label: 'Gender', variance: '1.8%' },
  { label: 'Ethnicity', variance: '3.1%' },
  { label: 'Socioeconomic', variance: '2.7%' },
];

const safetyControls = [
  'Confidence threshold enforcement for uncertain predictions',
  'Outlier detection for improbable symptom-vital combinations',
  'Multi-factor validation across symptoms, vitals, and history',
  'Audit trail logging for all triage outcomes and manual overrides',
];

export default function EthicsSafetyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F1E8] via-[#FCF7F1] to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 py-10">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-[#3A2E2A] dark:text-gray-100">Ethics & Safety</h1>
          <p className="text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Building trust through transparency, accountability, and human-centered AI design in clinical triage workflows.
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-semibold text-center mb-5 text-[#3A2E2A] dark:text-gray-100">Core Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {principles.map((item) => (
              <Card key={item.title} className="shadow-md dark:bg-gray-900 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <item.icon className="w-5 h-5 text-[#D96C2B]" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 dark:text-gray-300 leading-7">{item.body}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className="shadow-md dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">Bias Monitoring Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Real-time variance checks across demographic groups help ensure equitable treatment recommendations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {monitors.map((m) => (
                <div key={m.label} className="rounded-lg border border-[#E8D5C3] dark:border-gray-700 bg-[#FFF7EF] dark:bg-gray-950 p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400">{m.label}</p>
                  <p className="text-2xl font-bold text-[#D96C2B] mt-1">{m.variance}</p>
                  <p className="text-xs text-gray-500 mt-1">Variance from baseline</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-[#F1C6A8] dark:border-[#5B4030] bg-[#FFF1E5] dark:bg-[#3F2A1F] p-3 text-sm text-[#7A3A16] dark:text-[#FFC8A5]">
              All metrics are currently within target thresholds.
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">Safety Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {safetyControls.map((control) => (
              <div key={control} className="flex items-center justify-between rounded-lg border border-[#E8D5C3] dark:border-gray-700 p-3">
                <span className="text-sm text-gray-800 dark:text-gray-200">{control}</span>
                <span className="inline-flex items-center gap-1 text-xs text-[#D96C2B] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
