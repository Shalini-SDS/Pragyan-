import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { PatientService } from '../services/PatientService';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, User, AlertCircle, Activity, Heart, Thermometer, Phone, Loader2 } from 'lucide-react';
import { PatientsEnRouteIndicator } from '../components/PatientsEnRouteIndicator';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

interface Patient {
  _id?: string;
  patient_id?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  blood_type?: string;
  allergies?: string[];
  current_medications?: string[];
  is_active?: boolean;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await PatientService.getPatients(1, 100);
        setPatients(Array.isArray(data) ? data : data.patients || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        setError('Failed to load patients. Please try again.');
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Filter patients based on search query
  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(query) ||
      (patient.patient_id || '').toLowerCase().includes(query) ||
      (patient.blood_type || '').toLowerCase().includes(query)
    );
  });

  // Sort by status
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const aActive = a.is_active !== false ? 0 : 1;
    const bActive = b.is_active !== false ? 0 : 1;
    return aActive - bActive;
  });

  const getStatusColor = (active?: boolean) => {
    return active !== false ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400';
  };

  const stats = [
    { label: 'Total Patients', value: patients.length, color: 'blue', icon: User },
    { label: 'Active', value: patients.filter(p => p.is_active !== false).length, color: 'green', icon: Heart },
    { label: 'Inactive', value: patients.filter(p => p.is_active === false).length, color: 'gray', icon: AlertCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Patient Records
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Search and view patient information</p>
        </motion.div>

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div key={index} whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card className="dark:bg-gray-900 dark:border-gray-800 hover:shadow-lg transition-all">
                  <CardContent className="pt-6 text-center relative">
                    <stat.icon className={`w-8 h-8 mx-auto mb-2 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-3xl font-bold dark:text-white">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

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
                  placeholder="Search by name, ID, or blood type..."
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
                  Found {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading patients...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800 border-red-200">
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-600 dark:text-red-400" />
              <p className="text-lg text-red-700 dark:text-red-400 font-medium">{error}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Please try again or contact support</p>
            </CardContent>
          </Card>
        )}

        {/* Patients En Route Indicator */}
        {!loading && <PatientsEnRouteIndicator />}

        {/* Patients Grid */}
        {!loading && !error && (
          <>
            {sortedPatients.length === 0 ? (
              <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="py-16 text-center">
                  <User className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-xl text-gray-500 dark:text-gray-400">No patients found</p>
                  <p className="text-gray-400 dark:text-gray-500 mt-2">Try adjusting your search query</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedPatients.map((patient) => (
                  <motion.div
                    key={patient._id || patient.patient_id}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Link to={`/patients/${patient._id || patient.patient_id}`}>
                      <Card className="hover:shadow-2xl transition-all cursor-pointer h-full dark:bg-gray-900 dark:border-gray-800 group">
                        <CardContent className="pt-6 relative">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg mb-1 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {patient.first_name} {patient.last_name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{patient.patient_id || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Patient Info */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Gender</span>
                              <span className="font-medium dark:text-white">{patient.gender || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Blood Type</span>
                              <span className="font-medium dark:text-white">{patient.blood_type || 'Not specified'}</span>
                            </div>
                          </div>

                          {/* Allergies */}
                          {patient.allergies && patient.allergies.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Allergies</p>
                              <div className="flex flex-wrap gap-1">
                                {patient.allergies.slice(0, 2).map((allergy, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {allergy}
                                  </Badge>
                                ))}
                                {patient.allergies.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{patient.allergies.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Medications */}
                          {patient.current_medications && patient.current_medications.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Current Medications</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                {patient.current_medications.join(', ')}
                              </p>
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="flex items-center justify-between pt-4 border-t dark:border-gray-800">
                            <Badge 
                              className={patient.is_active !== false ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700'}
                            >
                              {patient.is_active !== false ? 'Active' : 'Inactive'}
                            </Badge>
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