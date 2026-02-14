import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import NurseService from '../services/NurseService';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Heart,
  Clock,
  Building2,
  Phone,
  Mail,
  Users,
} from 'lucide-react';

interface NurseRecord {
  _id?: string;
  staff_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  shift?: string;
  license_number?: string;
  qualifications?: string[];
  is_active?: boolean;
}

export default function NurseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nurse, setNurse] = useState<NurseRecord | null>(null);

  useEffect(() => {
    const fetchNurse = async () => {
      if (!id) {
        setError('Invalid nurse ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await NurseService.getNurse(id);
        setNurse(data || null);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load nurse details');
        setNurse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNurse();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">{t('common.loadingNurse')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !nurse) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="py-16 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600 dark:text-red-400" />
              <p className="text-xl text-gray-700 dark:text-gray-300">{error || t('common.nurseNotFound')}</p>
              <Button onClick={() => navigate('/nurses')} className="mt-4">
                {t('common.backToNurses')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button onClick={() => navigate('/nurses')} variant="outline" className="mb-6 dark:border-gray-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.backToNurses')}
        </Button>

        <Card className="mb-8 shadow-lg dark:bg-gradient-to-br dark:from-[#1f1a1a] dark:to-[#2b211f] dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-28 h-28 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center border-4 border-white dark:border-gray-800">
                <Heart className="w-12 h-12 text-pink-600 dark:text-pink-300" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-1 dark:text-white">{nurse.name || t('nurse.unnamed')}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{t('nurse.id')}: {nurse.staff_id || id}</p>
                  </div>
                  <Badge className={nurse.is_active === false ? 'bg-gray-500' : 'bg-green-600'}>
                    {nurse.is_active === false ? t('common.inactive') : t('common.active')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('nurse.department')}</p>
                      <p className="font-semibold dark:text-white">{nurse.department || t('common.notSet')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('nurse.shift')}</p>
                      <p className="font-semibold capitalize dark:text-white">{nurse.shift || t('common.notSet')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('nurse.license')}</p>
                      <p className="font-semibold dark:text-white">{nurse.license_number || t('common.notSet')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">{t('nurse.qualifications')}</CardTitle>
            </CardHeader>
            <CardContent>
              {nurse.qualifications && nurse.qualifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {nurse.qualifications.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">{t('nurse.noQualifications')}</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">{t('nurse.contact')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <p className="font-medium dark:text-white">{nurse.phone || t('common.notSet')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <p className="font-medium dark:text-white">{nurse.email || t('common.notSet')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
