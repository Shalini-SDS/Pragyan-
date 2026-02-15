import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Lock, Database, TriangleAlert, Activity } from 'lucide-react';

const deploymentRequirements = [
  'Rigorous clinical validation and regulatory approval (e.g., FDA clearance)',
  'Training on diverse, real-world clinical datasets',
  'Continuous monitoring and performance validation',
  'Integration with hospital information systems and EHR platforms',
  'Comprehensive staff training and change management',
];

const architectureBlocks = [
  {
    title: 'Vital Signs Analyzer',
    desc: 'Processes blood pressure, heart rate, temperature, and oxygen levels to detect abnormal patterns.',
  },
  {
    title: 'Symptom Classifier',
    desc: 'Natural language processing to analyze symptom severity and combinations.',
  },
  {
    title: 'Risk Predictor',
    desc: 'Ensemble model combining vitals, symptoms, and medical history for final risk assessment.',
  },
];

export default function RegulationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F1E8] via-[#FCF7F1] to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 py-10">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-[#3A2E2A] dark:text-gray-100">Regulations</h1>
          <p className="text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Regulatory and privacy controls for safe AI triage deployment in healthcare operations.
          </p>
        </div>

        <Card className="shadow-md dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Lock className="w-6 h-6 text-[#D96C2B]" />
              Data Privacy Statement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-7">
            <p>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Compliance:</span> MediTriage aligns with HIPAA,
              GDPR, and relevant healthcare data protection expectations. All patient information is encrypted in transit and at
              rest using industry-standard controls.
            </p>
            <p>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Access Control:</span> Role-based access ensures
              that only authorized medical personnel can view patient records. All access events are logged and auditable.
            </p>
            <p>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Data Retention:</span> Patient data is retained
              according to legal requirements and institutional policy. Anonymized data may be used to improve model accuracy
              while preserving patient privacy.
            </p>
            <p>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Third-Party Sharing:</span> Patient data is never
              shared for commercial purposes. Data sharing for approved research requires explicit consent and institutional review.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-[#F1C6A8] bg-[#F7ECE2] dark:bg-[#3D2A20] dark:border-[#5B4030]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-[#4A2E1F] dark:text-[#FFD9C4]">
              <Database className="w-6 h-6 text-[#D96C2B]" />
              Synthetic Data Disclosure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#5C3824] dark:text-[#F3CDB8] leading-7">
            <p>
              <span className="font-semibold">Important Notice:</span> This demonstration uses entirely synthetic patient data
              generated for illustrative purposes. No real patient information is stored, processed, or displayed.
            </p>
            <p>
              The AI models and algorithms demonstrated here are conceptual representations of healthcare triage systems.
              In production environments, such systems require:
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
              <span className="font-semibold inline-flex items-center gap-1"><TriangleAlert className="w-3.5 h-3.5 text-[#D96C2B]" /> Medical Disclaimer:</span>
              {' '}
              This system is for demonstration only and should not be used for actual medical decision-making.
              Always consult qualified healthcare professionals for diagnosis and treatment.
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity className="w-6 h-6 text-[#D96C2B]" />
              System Architecture Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Model Components</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {architectureBlocks.map((block) => (
                <div key={block.title} className="rounded-lg border border-[#E8D5C3] dark:border-gray-700 bg-[#F7F1E8] dark:bg-gray-950/60 p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{block.title}</p>
                  <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">{block.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-7">
              Each prediction includes weighted contributing factors, allowing medical professionals to understand why the AI
              made a specific recommendation. This transparency supports safer clinical adoption and informed decision-making.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

