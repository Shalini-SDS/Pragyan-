import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import PatientService from '../services/PatientService';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, User, Phone, AlertCircle, Activity, FileText, Loader2 } from 'lucide-react';

interface TriageRecord {
  _id?: string;
  priority_level?: string;
  predicted_department?: string;
  symptoms?: string[];
  risk_score?: number;
  created_at?: string;
}

interface PatientRecord {
  _id?: string;
  patient_id?: string;
  name?: string;
  age?: number;
  gender?: string;
  contact_number?: string;
  guardian_name?: string;
  guardian_contact?: string;
  blood_group?: string;
  medical_history?: string[];
  allergies?: string[];
  current_medications?: string[];
  created_at?: string;
}

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [triages, setTriages] = useState<TriageRecord[]>([]);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) {
        setError('Invalid patient ID');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await PatientService.getPatient(id);
        setPatient(data.patient || null);
        setTriages(Array.isArray(data.recent_triages) ? data.recent_triages : []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load patient details');
        setPatient(null);
        setTriages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'Critical':
        return 'bg-red-200 text-red-900 border-red-400';
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const latestTriage = triages.length > 0 ? triages[0] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">{t('common.loadingPatient')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="py-16 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600 dark:text-red-400" />
              <p className="text-xl text-gray-700 dark:text-gray-300">{error || t('common.patientNotFound')}</p>
              <Button onClick={() => navigate('/patients')} className="mt-4">
                {t('common.backToPatients')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button onClick={() => navigate('/patients')} variant="outline" className="mb-6 dark:border-gray-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.backToPatients')}
        </Button>

        <Card className="mb-8 shadow-lg dark:bg-gradient-to-br dark:from-[#1f1a1a] dark:to-[#2b211f] dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="text-center md:text-left">
                <div className="w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto md:mx-0 border-4 border-white dark:border-gray-800">
                  <User className="w-16 h-16 text-blue-600 dark:text-blue-300" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-1 dark:text-white">{patient.name || t('patient.unnamed')}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{t('patient.id')}: {patient.patient_id || id}</p>
                  </div>
                  {latestTriage?.priority_level && (
                    <Badge className={`${getRiskColor(latestTriage.priority_level)} border px-4 py-2`}>
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {latestTriage.priority_level} Risk
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('patient.age')}</p>
                    <p className="font-semibold dark:text-white">{patient.age ?? t('common.na')} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('patient.gender')}</p>
                    <p className="font-semibold dark:text-white">{patient.gender || t('common.na')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('patient.contact')}</p>
                    <p className="font-semibold dark:text-white">{patient.contact_number || t('common.na')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('patient.bloodGroup')}</p>
                    <p className="font-semibold dark:text-white">{patient.blood_group || t('common.na')}</p>
                  </div>
                  {latestTriage?.predicted_department && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('patient.recommendedDepartment')}</p>
                      <Badge variant="secondary" className="text-base px-3 py-1 dark:bg-gray-800 dark:text-gray-100">
                        {latestTriage.predicted_department}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t('patient.medicalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('patient.previousConditions')}</p>
              <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg dark:text-gray-200">
                {patient.medical_history?.length ? patient.medical_history.join(', ') : t('patient.noConditions')}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('patient.allergies')}</p>
              <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg dark:text-gray-200">
                {patient.allergies?.length ? patient.allergies.join(', ') : t('patient.noAllergies')}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('patient.currentMeds')}</p>
              <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg dark:text-gray-200">
                {patient.current_medications?.length ? patient.current_medications.join(', ') : t('patient.noMeds')}
              </p>
            </div>
          </CardContent>
        </Card>

        {(patient.guardian_name || patient.guardian_contact) && (
          <Card className="mb-8 shadow-lg dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                {t('patient.guardian')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('patient.name')}</p>
                  <p className="font-semibold dark:text-white">{patient.guardian_name || t('common.na')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('patient.contact')}</p>
                  <p className="font-semibold dark:text-white">{patient.guardian_contact || t('common.na')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 shadow-lg dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('patient.recentTriages')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {triages.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('patient.noTriages')}</p>
            ) : (
              <div className="space-y-4">
                {triages.map((triage) => (
                  <div key={triage._id} className="p-4 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <Badge className={getRiskColor(triage.priority_level)}>{triage.priority_level || 'Unknown'} Risk</Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {triage.created_at ? new Date(triage.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-sm dark:text-gray-200 mb-1">
                      <span className="font-semibold">{t('patient.department')}:</span> {triage.predicted_department || t('common.na')}
                    </p>
                    <p className="text-sm dark:text-gray-200 mb-1">
                      <span className="font-semibold">{t('patient.symptoms')}:</span>{' '}
                      {triage.symptoms?.length ? triage.symptoms.join(', ') : t('common.na')}
                    </p>
                    <p className="text-sm dark:text-gray-200">
                      <span className="font-semibold">{t('patient.riskScore')}:</span> {triage.risk_score ?? t('common.na')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Link to={`/patients/${patient.patient_id || id}/test-reports`}>
          <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold dark:text-white">{t('patient.viewReports')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t('patient.reportSub')}
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-6 h-6 text-blue-600 rotate-180" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
