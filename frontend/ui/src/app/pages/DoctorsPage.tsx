import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DoctorService } from '../services/DoctorService';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, Users, Stethoscope, Clock, MapPin, Phone, Loader2, AlertCircle } from 'lucide-react';

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

interface Doctor {
  _id?: string;
  staff_id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  specialization?: string;
  license_number?: string;
  qualifications?: string[];
  experience_years?: number;
  is_active?: boolean;
}

export default function DoctorsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data = await DoctorService.getDoctors(1, 100);
        setDoctors(Array.isArray(data) ? data : data.doctors || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
        setError('Failed to load doctors. Please try again.');
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Filter doctors based on search query and exclude current user if they're a doctor
  const filteredDoctors = doctors.filter((doctor) => {
    // Hide the current doctor's profile from the list
    if (user?.role === 'doctor' && doctor.staff_id === user.staffId) {
      return false;
    }
    
    const query = searchQuery.toLowerCase();
    const fullName = (
      doctor.name ||
      `${doctor.first_name || ''} ${doctor.last_name || ''}`
    ).toLowerCase();
    return (
      fullName.includes(query) ||
      (doctor.department || '').toLowerCase().includes(query) ||
      (doctor.specialization || '').toLowerCase().includes(query) ||
      (doctor.staff_id || '').toLowerCase().includes(query)
    );
  });

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
            {t('doctors.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('doctors.subtitle')}</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8 shadow-lg dark:bg-gray-900 dark:border-gray-800 hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <Input
                  type="text"
                  placeholder={t('doctors.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-6 text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              {searchQuery && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-sm text-gray-600 dark:text-gray-400"
                >
                  {t('common.found')} {filteredDoctors.length} {t(filteredDoctors.length !== 1 ? 'doctors.itemsPlural' : 'doctors.itemSingle')}
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">{t('doctors.loading')}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800 border-red-200 dark:border-red-800 mb-8">
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="dark:bg-gray-900 dark:border-gray-800 hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('doctors.total')}</p>
                <p className="text-2xl font-bold dark:text-white">{doctors.length}</p>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-900 dark:border-gray-800 hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="pt-6 text-center">
                <Stethoscope className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.active')}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {doctors.filter((d) => d.is_active !== false).length}
                </p>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-900 dark:border-gray-800 hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.found')}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredDoctors.length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Doctors Grid */}
        {!loading && !error && (
          <>
            {filteredDoctors.length === 0 ? (
              <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-xl text-gray-500 dark:text-gray-400">{t('doctors.empty')}</p>
                  <p className="text-gray-400 dark:text-gray-500 mt-2">{t('common.trySearch')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDoctors.map((doctor) => (
                  <motion.div
                    key={doctor._id || doctor.staff_id}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Link to={`/doctors/${doctor.staff_id}`}>
                      <Card className="hover:shadow-2xl transition-all cursor-pointer h-full dark:bg-gray-900 dark:border-gray-800 group">
                        <CardContent className="pt-6 relative">
                          <div className="text-center">
                            {/* Doctor Avatar */}
                            <div className="relative inline-block mb-4">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                              >
                                <div className="w-24 h-24 rounded-full mx-auto border-4 border-white dark:border-gray-800 shadow-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                  <Users className="w-12 h-12 text-white" />
                                </div>
                              </motion.div>
                            </div>

                            {/* Doctor Info */}
                            <h3 className="font-bold text-lg mb-1 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {doctor.name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || t('doctor.unnamed')}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{doctor.staff_id}</p>

                            {/* Department Badge */}
                            {doctor.department && (
                              <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
                                <Stethoscope className="w-3 h-3 mr-1" />
                                {doctor.department}
                              </Badge>
                            )}

                            {/* Specialization */}
                            {doctor.specialization && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {doctor.specialization}
                              </p>
                            )}

                            {/* Experience */}
                            {doctor.experience_years && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {doctor.experience_years} {t('doctor.years')} {t('doctors.experienceSuffix')}
                              </p>
                            )}

                            {/* License */}
                            <div className="mt-4 pt-4 border-t dark:border-gray-800">
                              {doctor.license_number ? (
                                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                                  {t('doctors.licensed')}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                                  {t('doctors.noLicense')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
