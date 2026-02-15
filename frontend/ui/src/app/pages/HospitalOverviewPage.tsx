import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { HospitalService } from '../services/HospitalService';
import { PatientService } from '../services/PatientService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Bed, Users, AlertTriangle, Stethoscope, HeartPulse, TrendingUp, UserCheck, Loader2, AlertCircle, Brain, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { AmbulancePanel } from '../components/AmbulancePanel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface HospitalOverviewData {
  total_beds?: number;
  occupied_beds?: number;
  available_beds?: number;
  total_patients?: number;
  doctors_count?: number;
  nurses_count?: number;
  departments?: { name: string; patient_count?: number; bed_count?: number }[];
  [key: string]: any;
}

interface PatientOverviewData {
  _id?: string;
  patient_id?: string;
  age?: number;
  gender?: string;
  latest_triage?: {
    priority_level?: string;
    risk_level?: string;
    predicted_department?: string;
    recommended_department?: string;
    risk_score?: number;
    symptoms?: string[] | string;
    current_symptoms?: string[] | string;
    created_at?: string;
  };
}

export default function HospitalOverviewPage() {
  const { t } = useLanguage();
  const [hospitalData, setHospitalData] = useState<HospitalOverviewData | null>(null);
  const [patients, setPatients] = useState<PatientOverviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        setLoading(true);
        const [overviewData, patientData] = await Promise.all([
          HospitalService.getHospitalOverview(),
          PatientService.getPatients(1, 500),
        ]);
        const patientRows = Array.isArray(patientData) ? patientData : patientData?.patients || [];
        setHospitalData(overviewData);
        setPatients(patientRows);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch hospital data:', err);
        setError(t('overview.errorLoad'));
        setHospitalData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, [t]);

  const totalAdmitted = hospitalData?.total_patients || 0;
  const totalBeds = hospitalData?.total_beds || 100;
  const occupiedBeds = hospitalData?.occupied_beds || 0;
  const availableBeds = hospitalData?.available_beds || totalBeds - occupiedBeds;
  const doctorsCount = hospitalData?.doctors_count || 0;
  const nursesCount = hospitalData?.nurses_count || 0;

  const emergencyStatus = availableBeds <= 10 ? 'Critical' : availableBeds <= 30 ? 'Busy' : 'Normal';
  const emergencyStatusLabel = t(`overview.status.${emergencyStatus.toLowerCase()}`);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal':
        return 'bg-green-500 dark:bg-green-600';
      case 'Busy':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'Critical':
        return 'bg-red-500 dark:bg-red-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  const getBedStatus = (available: number, total: number) => {
    const percentage = total > 0 ? (available / total) * 100 : 0;
    if (percentage <= 10) return { status: 'Critical', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/30' };
    if (percentage <= 30) return { status: 'Low', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/30' };
    return { status: 'Available', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/30' };
  };

  const chartColors = ['#93c5fd', '#c4b5fd', '#67e8f9', '#6ee7b7', '#fcd34d', '#fca5a5', '#f9a8d4', '#a5b4fc'];

  const departmentChartData = (hospitalData?.departments || [])
    .map((dept, idx) => ({
      name: dept.name || `Department ${idx + 1}`,
      patients: dept.patient_count || 0,
    }))
    .slice(0, 8);

  const normalizedTriages = useMemo(() => {
    return patients
      .map((p) => p.latest_triage)
      .filter(Boolean) as NonNullable<PatientOverviewData['latest_triage']>[];
  }, [patients]);

  const normalizeRisk = (value?: string) => {
    const risk = (value || '').toLowerCase();
    if (risk.includes('critical')) return 'Critical';
    if (risk.includes('high')) return 'High';
    if (risk.includes('medium')) return 'Medium';
    if (risk.includes('low')) return 'Low';
    return 'Unknown';
  };

  const riskCounts = useMemo(() => {
    const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0, Unknown: 0 };
    for (const triage of normalizedTriages) {
      const risk = normalizeRisk(triage.priority_level || triage.risk_level);
      counts[risk] += 1;
    }
    return counts;
  }, [normalizedTriages]);

  const riskSummaryData = useMemo(() => {
    const total = normalizedTriages.length || 1;
    return ['Critical', 'High', 'Medium', 'Low', 'Unknown'].map((risk) => ({
      risk,
      count: riskCounts[risk] || 0,
      percentage: Math.round(((riskCounts[risk] || 0) / total) * 100),
    }));
  }, [riskCounts, normalizedTriages.length]);

  const riskPieData = useMemo(() => riskSummaryData.filter((row) => row.count > 0), [riskSummaryData]);

  const departmentInsights = useMemo(() => {
    const scoreWeight: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4, Unknown: 0 };
    const map = new Map<string, { cases: number; scoreSum: number; symptomCounts: Map<string, number> }>();

    for (const triage of normalizedTriages) {
      const dept = triage.predicted_department || triage.recommended_department || 'Unassigned';
      const risk = normalizeRisk(triage.priority_level || triage.risk_level);
      const symptomsRaw = Array.isArray(triage.symptoms)
        ? triage.symptoms
        : Array.isArray(triage.current_symptoms)
        ? triage.current_symptoms
        : typeof triage.symptoms === 'string'
        ? triage.symptoms.split(',')
        : typeof triage.current_symptoms === 'string'
        ? triage.current_symptoms.split(',')
        : [];

      if (!map.has(dept)) {
        map.set(dept, { cases: 0, scoreSum: 0, symptomCounts: new Map() });
      }
      const entry = map.get(dept)!;
      entry.cases += 1;
      entry.scoreSum += scoreWeight[risk] || 0;
      for (const symptom of symptomsRaw) {
        const key = String(symptom).trim().toLowerCase();
        if (!key) continue;
        entry.symptomCounts.set(key, (entry.symptomCounts.get(key) || 0) + 1);
      }
    }

    return Array.from(map.entries())
      .map(([department, value]) => {
        const topSymptom = Array.from(value.symptomCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || t('overview.analytics.noSignal');
        return {
          department,
          cases: value.cases,
          avgSeverity: value.cases > 0 ? Number((value.scoreSum / value.cases).toFixed(2)) : 0,
          topSymptom,
        };
      })
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 8);
  }, [normalizedTriages, t]);

  const symptomTrends = useMemo(() => {
    const symptomMap = new Map<string, number>();
    for (const triage of normalizedTriages) {
      const symptomsRaw = Array.isArray(triage.symptoms)
        ? triage.symptoms
        : Array.isArray(triage.current_symptoms)
        ? triage.current_symptoms
        : typeof triage.symptoms === 'string'
        ? triage.symptoms.split(',')
        : typeof triage.current_symptoms === 'string'
        ? triage.current_symptoms.split(',')
        : [];
      for (const symptom of symptomsRaw) {
        const key = String(symptom).trim();
        if (!key) continue;
        symptomMap.set(key, (symptomMap.get(key) || 0) + 1);
      }
    }
    return Array.from(symptomMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [normalizedTriages]);

  const hourlyTriageTrend = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, cases: 0 }));
    for (const triage of normalizedTriages) {
      const dt = triage.created_at ? new Date(triage.created_at) : null;
      if (!dt || Number.isNaN(dt.getTime())) continue;
      const hour = dt.getHours();
      buckets[hour].cases += 1;
    }
    return buckets;
  }, [normalizedTriages]);

  const riskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'Critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('overview.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('overview.subtitle')}</p>
        </motion.div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('overview.loading')}</p>
          </div>
        )}

        {error && (
          <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800 border-red-200 mb-8">
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-600 dark:text-red-400" />
              <p className="text-lg text-red-700 dark:text-red-400 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card
                className={`mb-8 border-2 ${
                  emergencyStatus === 'Critical'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
                    : emergencyStatus === 'Busy'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700'
                    : 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                } shadow-lg`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                        <AlertTriangle
                          className={`w-8 h-8 ${
                            emergencyStatus === 'Critical'
                              ? 'text-red-600 dark:text-red-400'
                              : emergencyStatus === 'Busy'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        />
                      </motion.div>
                      <div>
                        <h3 className="font-bold text-lg dark:text-white">
                          {t('overview.hospitalStatus')}: {emergencyStatusLabel}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {availableBeds} {t('overview.bedsAvailable')} | {occupiedBeds} {t('overview.bedsOccupied')}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(emergencyStatus)} text-white px-4 py-2 text-base`}>{emergencyStatusLabel}</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card className="dark:bg-gray-900 dark:border-gray-800 hover:shadow-xl transition-all">
                  <CardContent className="pt-6 relative">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{t('overview.live')}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('overview.totalPatients')}</p>
                    <p className="text-3xl font-bold dark:text-white">{totalAdmitted}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('overview.currentlyInHospital')}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card className="dark:bg-gray-900 dark:border-gray-800 hover:shadow-xl transition-all">
                  <CardContent className="pt-6 relative">
                    <div className="flex items-center justify-between mb-2">
                      <Stethoscope className="w-8 h-8 text-red-600 dark:text-red-400" />
                      <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{t('overview.staff')}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('nav.doctors')}</p>
                    <p className="text-3xl font-bold dark:text-white">{doctorsCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('overview.onDuty')}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card className="dark:bg-gray-900 dark:border-gray-800 hover:shadow-xl transition-all">
                  <CardContent className="pt-6 relative">
                    <div className="flex items-center justify-between mb-2">
                      <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{t('overview.staff')}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('nav.nurses')}</p>
                    <p className="text-3xl font-bold dark:text-white">{nursesCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('overview.onDuty')}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card className="dark:bg-gray-900 dark:border-gray-800 hover:shadow-xl transition-all">
                  <CardContent className="pt-6 relative">
                    <div className="flex items-center justify-between mb-2">
                      <Bed className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">{t('overview.available')}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('overview.freeBeds')}</p>
                    <p className="text-3xl font-bold dark:text-white">{availableBeds}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {t('overview.outOf')} {totalBeds}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <Card className="lg:col-span-2 dark:bg-gray-900 dark:border-gray-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <HeartPulse className="w-6 h-6 text-red-500" />
                    {t('overview.analytics.riskSummary')}
                  </CardTitle>
                  <CardDescription>{t('overview.analytics.riskSummaryDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                    {riskSummaryData.map((entry) => (
                      <div key={entry.risk} className="rounded-lg border dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                          <Badge className={riskBadgeClass(entry.risk)}>{entry.risk}</Badge>
                          <span className="text-xs text-gray-500">{entry.percentage}%</span>
                        </div>
                        <p className="text-2xl font-bold mt-3 dark:text-white">{entry.count}</p>
                        <p className="text-xs text-gray-500">{t('overview.analytics.cases')}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('overview.analytics.mlCoverage')}: {normalizedTriages.length}/{patients.length}
                  </p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-900 dark:border-gray-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <TrendingUp className="w-6 h-6 text-indigo-500" />
                    {t('overview.analytics.riskDistribution')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie data={riskPieData} dataKey="count" nameKey="risk" cx="50%" cy="50%" outerRadius={80} label>
                        {riskPieData.map((entry, index) => (
                          <Cell key={`risk-cell-${entry.risk}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="dark:bg-gray-900 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Bed className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    {t('overview.bedStatus')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <motion.div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium dark:text-white">{t('overview.totalBeds')}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {occupiedBeds} {t('overview.occupied')}, {availableBeds} {t('overview.available')}
                          </p>
                        </div>
                        <Badge className={`${getBedStatus(availableBeds, totalBeds).bgColor} ${getBedStatus(availableBeds, totalBeds).color} border-none`}>
                          {t(`overview.bed.${getBedStatus(availableBeds, totalBeds).status.toLowerCase()}`)}
                        </Badge>
                      </div>
                      <div className="relative">
                        <Progress value={totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0} className="h-3" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}% {t('overview.occupied')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>

              {departmentChartData.length > 0 && (
                <Card className="dark:bg-gray-900 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Stethoscope className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      {t('overview.departments')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={departmentChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#9ca3af' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            border: '1px solid #374151',
                            borderRadius: '0.5rem',
                            color: '#f3f4f6',
                          }}
                        />
                        <Bar dataKey="patients" radius={[8, 8, 0, 0]}>
                          {departmentChartData.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="dark:bg-gray-900 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Brain className="w-6 h-6 text-emerald-500" />
                    {t('overview.analytics.departmentInsights')}
                  </CardTitle>
                  <CardDescription>{t('overview.analytics.departmentInsightsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {departmentInsights.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={departmentInsights}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                          <XAxis dataKey="department" tick={{ fill: '#9ca3af', fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                          <YAxis tick={{ fill: '#9ca3af' }} />
                          <Tooltip />
                          <Bar dataKey="cases" radius={[8, 8, 0, 0]}>
                            {departmentInsights.map((entry, idx) => (
                              <Cell key={`dept-insight-${entry.department}`} fill={chartColors[idx % chartColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {departmentInsights.slice(0, 4).map((entry) => (
                          <div key={`${entry.department}-row`} className="rounded-md border dark:border-gray-700 p-3 flex items-center justify-between bg-white dark:bg-gray-900">
                            <div>
                              <p className="font-medium dark:text-white">{entry.department}</p>
                              <p className="text-xs text-gray-500">
                                {t('overview.analytics.topSignal')}: {entry.topSymptom}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold dark:text-white">
                                {entry.cases} {t('overview.analytics.cases')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t('overview.analytics.avgSeverity')}: {entry.avgSeverity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">{t('overview.analytics.noDepartmentData')}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-900 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Activity className="w-6 h-6 text-cyan-500" />
                    {t('overview.analytics.inputVisuals')}
                  </CardTitle>
                  <CardDescription>{t('overview.analytics.inputVisualsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-2 dark:text-gray-100">{t('overview.analytics.topSymptoms')}</p>
                    {symptomTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={symptomTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={64} />
                          <YAxis tick={{ fill: '#9ca3af' }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-gray-500">{t('overview.analytics.noInputSignals')}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2 dark:text-gray-100">{t('overview.analytics.hourlyLoad')}</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={hourlyTriageTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                        <XAxis dataKey="hour" tick={{ fill: '#9ca3af', fontSize: 10 }} interval={3} />
                        <YAxis tick={{ fill: '#9ca3af' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="cases" stroke="#f97316" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8">
              <AmbulancePanel />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
