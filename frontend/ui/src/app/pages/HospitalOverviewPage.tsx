import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { HospitalService } from '../services/HospitalService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Bed, Users, Activity, AlertTriangle, Stethoscope, Ambulance, Heart, TrendingUp, Clock, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AmbulancePanel } from '../components/AmbulancePanel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
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

export default function HospitalOverviewPage() {
  const { t } = useLanguage();
  const [hospitalData, setHospitalData] = useState<HospitalOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        setLoading(true);
        const data = await HospitalService.getHospitalOverview();
        setHospitalData(data);
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
  }, []);

  // Calculate statistics from hospitalData
  const totalAdmitted = hospitalData?.total_patients || 0;
  const totalBeds = hospitalData?.total_beds || 100;
  const occupiedBeds = hospitalData?.occupied_beds || 0;
  const availableBeds = hospitalData?.available_beds || totalBeds - occupiedBeds;
  const doctorsCount = hospitalData?.doctors_count || 0;
  const nursesCount = hospitalData?.nurses_count || 0;

  // Determine emergency status based on bed availability
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

  const getDepartmentStatus = (waiting: number) => {
    if (waiting > 20) return { status: 'Critical', color: 'bg-red-500 dark:bg-red-600' };
    if (waiting > 10) return { status: 'Busy', color: 'bg-yellow-500 dark:bg-yellow-600' };
    return { status: 'Normal', color: 'bg-green-500 dark:bg-green-600' };
  };

  const getBedStatus = (available: number, total: number) => {
    const percentage = total > 0 ? (available / total) * 100 : 0;
    if (percentage <= 10) return { status: 'Critical', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/30' };
    if (percentage <= 30) return { status: 'Low', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/30' };
    return { status: 'Available', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/30' };
  };

  const getEquipmentStatus = (available: number) => {
    if (available === 0) return { status: 'Full', color: 'text-red-600 dark:text-red-400' };
    if (available <= 2) return { status: 'Limited', color: 'text-yellow-600 dark:text-yellow-400' };
    return { status: 'Available', color: 'text-green-600 dark:text-green-400' };
  };

  const chartColors = ['#93c5fd', '#c4b5fd', '#67e8f9', '#6ee7b7', '#fcd34d', '#fca5a5', '#f9a8d4', '#a5b4fc'];

  // Prepare department data for chart
  const departmentChartData = (hospitalData?.departments || []).map((dept, idx) => ({
    name: dept.name || `Department ${idx + 1}`,
    patients: dept.patient_count || 0,
  })).slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('overview.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('overview.subtitle')}</p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('overview.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800 border-red-200 mb-8">
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-600 dark:text-red-400" />
              <p className="text-lg text-red-700 dark:text-red-400 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Content - Only show when not loading and no error */}
        {!loading && !error && (
          <>
        {/* Emergency Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
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
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
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
                    <h3 className="font-bold text-lg dark:text-white">{t('overview.hospitalStatus')}: {emergencyStatusLabel}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {availableBeds} {t('overview.bedsAvailable')} • {occupiedBeds} {t('overview.bedsOccupied')}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`${getStatusColor(emergencyStatus)} text-white px-4 py-2 text-base`}
                >
                  {emergencyStatusLabel}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics */}
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
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('overview.outOf')} {totalBeds}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bed Availability */}
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

          {/* Department Load */}
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
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ambulance Fleet Management */}
        <div className="mb-8">
          <AmbulancePanel />
        </div>
          </>
        )}
      </div>
    </div>
  );
}
