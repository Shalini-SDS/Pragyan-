import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { NurseService } from '../services/NurseService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Search, Heart, ChevronDown, ChevronUp, CheckCircle, Users, Clock, MapPin, Phone, Activity, Loader2, AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';

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

interface Nurse {
  _id?: string;
  staff_id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  shift?: string;
  license_number?: string;
  qualifications?: string[];
  is_active?: boolean;
}

export default function NursesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNurse, setExpandedNurse] = useState<string | null>(null);

  useEffect(() => {
    const fetchNurses = async () => {
      try {
        setLoading(true);
        const data = await NurseService.getNurses(1, 100);
        setNurses(Array.isArray(data) ? data : data.nurses || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch nurses:', err);
        setError('Failed to load nurses. Please try again.');
        setNurses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNurses();
  }, []);

  // Filter nurses based on search query and exclude current user if they're a nurse
  const filteredNurses = nurses.filter((nurse) => {
    // Hide the current nurse's profile from the list
    if (user?.role === 'nurse' && nurse.staff_id === user.staffId) {
      return false;
    }
    
    const query = searchQuery.toLowerCase();
    const fullName = (
      nurse.name ||
      `${nurse.first_name || ''} ${nurse.last_name || ''}`
    ).toLowerCase();
    return (
      fullName.includes(query) ||
      (nurse.staff_id || '').toLowerCase().includes(query) ||
      (nurse.department || '').toLowerCase().includes(query)
    );
  });

  const sortNursesByShift = (nurseList: Nurse[]) => {
    const shiftOrder = { morning: 0, afternoon: 1, night: 2 };
    return [...nurseList].sort((a, b) => {
      const shiftA = shiftOrder[a.shift || 'morning'] || 999;
      const shiftB = shiftOrder[b.shift || 'morning'] || 999;
      return shiftA - shiftB;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {t('nurses.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('nurses.subtitle')}</p>
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
                  placeholder={t('nurses.searchPlaceholder')}
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
                  {t('common.found')} {filteredNurses.length} {t(filteredNurses.length !== 1 ? 'nurses.itemsPlural' : 'nurses.itemSingle')}
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">{t('nurses.loading')}</span>
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
                <Heart className="w-8 h-8 mx-auto mb-2 text-pink-600 dark:text-pink-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('nurses.total')}</p>
                <p className="text-2xl font-bold dark:text-white">{nurses.length}</p>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-900 dark:border-gray-800 hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.active')}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {nurses.filter((n) => n.is_active !== false).length}
                </p>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-900 dark:border-gray-800 hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="pt-6 text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.found')}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredNurses.length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Nurses List */}
        {!loading && !error && (
          <>
            {filteredNurses.length === 0 ? (
              <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="py-16 text-center">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-xl text-gray-500 dark:text-gray-400">{t('nurses.empty')}</p>
                  <p className="text-gray-400 dark:text-gray-500 mt-2">{t('common.trySearch')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNurses.map((nurse) => (
                  <Link key={nurse._id || nurse.staff_id} to={`/nurses/${nurse.staff_id}`}>
                    <Card className="hover:shadow-xl transition-all dark:bg-gray-900 dark:border-gray-800 group cursor-pointer">
                      <CardContent className="pt-6">
                      <div className="text-center">
                        {/* Nurse Avatar */}
                        <div className="relative inline-block mb-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            <div className="w-24 h-24 rounded-full mx-auto border-4 border-white dark:border-gray-800 shadow-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                              <Heart className="w-12 h-12 text-white" />
                            </div>
                          </motion.div>
                        </div>

                        {/* Nurse Info */}
                        <h3 className="font-bold text-lg mb-1 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                          {nurse.name || `${nurse.first_name || ''} ${nurse.last_name || ''}`.trim() || t('nurse.unnamed')}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{nurse.staff_id}</p>

                        {/* Department Badge */}
                        {nurse.department && (
                          <Badge className="mb-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white border-none">
                            <Heart className="w-3 h-3 mr-1" />
                            {nurse.department}
                          </Badge>
                        )}

                        {/* Shift */}
                        {nurse.shift && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 capitalize">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {nurse.shift} {t('nurse.shift')}
                          </p>
                        )}

                        {/* License */}
                        <div className="mt-4 pt-4 border-t dark:border-gray-800">
                          {nurse.license_number ? (
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                              {t('nurses.licensed')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                              {t('nurses.noLicense')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
