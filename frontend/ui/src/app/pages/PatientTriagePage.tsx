import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertCircle, CheckCircle, Activity, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import TriageService, { TriageData } from '../services/TriageService';
import PatientService from '../services/PatientService';

interface TriageResult {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendedDepartment: string;
  riskScore: number;
  confidence: number;
  reasoning: string[];
  requiredTests: string[];
}

export default function PatientTriagePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const commonSymptoms = [
    t('triage.symptom.chestPain'),
    t('triage.symptom.breathing'),
    t('triage.symptom.headache'),
    t('triage.symptom.abdominal'),
    t('triage.symptom.fever'),
    t('triage.symptom.nausea'),
    t('triage.symptom.dizziness'),
    t('triage.symptom.confusion'),
    t('triage.symptom.loc'),
  ];

  const commonConditions = [
    t('triage.condition.diabetes'),
    t('triage.condition.hypertension'),
    t('triage.condition.heartDisease'),
    t('triage.condition.asthma'),
    t('triage.condition.cancer'),
    t('triage.condition.kidneyDisease'),
    t('triage.condition.none'),
  ];

  const [formData, setFormData] = useState({
    patientId: '',
    name: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    contactNumber: '',
    symptoms: [] as string[],
    previousConditions: [] as string[],
    guardianName: '',
    guardianContact: '',
    doctorsFollowing: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    severity: '5',
  });

  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [symptomsText, setSymptomsText] = useState('');
  const [conditionsText, setConditionsText] = useState('');

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const parseItemList = (rawText: string): string[] =>
    rawText
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);

  const syncSymptomsFromText = (rawText: string) => {
    const parsed = parseItemList(rawText);
    setFormData((prev) => ({ ...prev, symptoms: parsed }));
  };

  const syncConditionsFromText = (rawText: string) => {
    const parsed = parseItemList(rawText);
    setFormData((prev) => ({ ...prev, previousConditions: parsed }));
  };

  const toggleListValue = (field: 'symptoms' | 'previousConditions', value: string) => {
    setFormData((prev) => {
      const lower = value.toLowerCase();
      const existing = prev[field];
      const hasValue = existing.some((item) => item.toLowerCase() === lower);
      if (hasValue) {
        const updated = existing.filter((item) => item.toLowerCase() !== lower);
        if (field === 'symptoms') {
          setSymptomsText(updated.join(', '));
        } else {
          setConditionsText(updated.join(', '));
        }
        return { ...prev, [field]: updated };
      }
      const updated = [...existing, value];
      if (field === 'symptoms') {
        setSymptomsText(updated.join(', '));
      } else {
        setConditionsText(updated.join(', '));
      }
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.age || !formData.contactNumber) {
      toast.error(t('triage.error.required'));
      return;
    }

    const normalizedSymptoms = formData.symptoms.filter(Boolean);
    const normalizedConditions = formData.previousConditions.filter(Boolean);
    if (normalizedSymptoms.length === 0) {
      toast.error(t('triage.error.symptomRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const triageData: Partial<TriageData> = {
        blood_pressure: formData.bloodPressure || '120/80',
        heart_rate: parseInt(formData.heartRate, 10) || 0,
        temperature: parseFloat(formData.temperature) || 37,
        respiratory_rate: parseInt(formData.respiratoryRate, 10) || 16,
        oxygen_saturation: parseInt(formData.oxygenSaturation, 10) || 98,
        gender: formData.gender,
        symptoms: normalizedSymptoms,
        previous_conditions: normalizedConditions,
        severity: parseInt(formData.severity, 10),
      };

      const predictions = await TriageService.predictTriage(triageData);

      setTriageResult({
        riskLevel: predictions.priority_level || predictions.risk_level || t('triage.risk.medium'),
        recommendedDepartment: predictions.predicted_department || t('triage.department.general'),
        riskScore: predictions.risk_score || 0.5,
        confidence: predictions.confidence || 0.5,
        reasoning: predictions.reasoning || [t('triage.success.reasoningDefault')],
        requiredTests: predictions.recommended_tests || [],
      });

      const patientData = {
        name: formData.name,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        contact_number: formData.contactNumber,
        email: undefined,
        address: undefined,
        guardian_name: formData.guardianName || undefined,
        guardian_contact: formData.guardianContact || undefined,
        medical_history: normalizedConditions.length > 0 ? normalizedConditions : undefined,
      };

      let patientId = formData.patientId;
      if (!patientId) {
        const response = await PatientService.createPatient(patientData);
        patientId = response.patient_id || response._id;
        setFormData((prev) => ({ ...prev, patientId }));
      }

      if (patientId || user) {
        const triagePayload: TriageData = {
          patient_id: patientId,
          blood_pressure: formData.bloodPressure || '120/80',
          heart_rate: parseInt(formData.heartRate, 10) || 0,
          temperature: parseFloat(formData.temperature) || 37,
          respiratory_rate: parseInt(formData.respiratoryRate, 10) || 16,
          oxygen_saturation: parseInt(formData.oxygenSaturation, 10) || 98,
          gender: formData.gender,
          symptoms: normalizedSymptoms,
          severity: parseInt(formData.severity, 10),
          duration: undefined,
          previous_conditions: normalizedConditions.length > 0 ? normalizedConditions : undefined,
        };

        await TriageService.createTriage(triagePayload);
      }

      setShowResult(true);
      toast.success(t('triage.success.complete'));

      setTimeout(() => {
        document.getElementById('triage-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      toast.error(error.message || t('triage.error.failed'));
      console.error('Triage error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
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

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 py-8 transition-colors">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 dark:text-white">{t('triage.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('triage.subtitle')}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('triage.patientInfo')}</CardTitle>
            <CardDescription>{t('triage.patientInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('triage.basicInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t('triage.fullName')} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={t('triage.fullNamePlaceholder')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">{t('triage.age')} *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="45"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">{t('triage.gender')} *</Label>
                    <Select value={formData.gender} onValueChange={(value: any) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">{t('triage.genderMale')}</SelectItem>
                        <SelectItem value="Female">{t('triage.genderFemale')}</SelectItem>
                        <SelectItem value="Other">{t('triage.genderOther')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contactNumber">{t('triage.contactNumber')} *</Label>
                    <Input
                      id="contactNumber"
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      placeholder="+1-555-0100"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('triage.medicalInfo')}</h3>
                <div>
                  <Label htmlFor="symptoms">{t('triage.currentSymptoms')} *</Label>
                  <Textarea
                    id="symptoms"
                    value={symptomsText}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setSymptomsText(raw);
                      syncSymptomsFromText(raw);
                    }}
                    placeholder={t('triage.symptomsPlaceholder')}
                    rows={4}
                    required
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {commonSymptoms.map((symptom) => {
                      const active = formData.symptoms.some((s) => s.toLowerCase() === symptom.toLowerCase());
                      return (
                        <button
                          key={symptom}
                          type="button"
                          onClick={() => toggleListValue('symptoms', symptom)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            active
                              ? 'bg-[#D96C2B] text-white border-[#D96C2B]'
                              : 'bg-[#E9DED0] dark:bg-[#3B2F2F] text-[#4A3A31] dark:text-[#F3E6D8] border-transparent'
                          }`}
                        >
                          {symptom}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('triage.symptomsExample')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="previousConditions">{t('triage.previousConditions')}</Label>
                  <Textarea
                    id="previousConditions"
                    value={conditionsText}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setConditionsText(raw);
                      syncConditionsFromText(raw);
                    }}
                    placeholder={t('triage.conditionsPlaceholder')}
                    rows={3}
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {commonConditions.map((condition) => {
                      const active = formData.previousConditions.some((c) => c.toLowerCase() === condition.toLowerCase());
                      return (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => toggleListValue('previousConditions', condition)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            active
                              ? 'bg-[#C25D22] text-white border-[#C25D22]'
                              : 'bg-[#E9DED0] dark:bg-[#3B2F2F] text-[#4A3A31] dark:text-[#F3E6D8] border-transparent'
                          }`}
                        >
                          {condition}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label htmlFor="doctorsFollowing">{t('triage.doctorsFollowing')}</Label>
                  <Input
                    id="doctorsFollowing"
                    value={formData.doctorsFollowing}
                    onChange={(e) => handleInputChange('doctorsFollowing', e.target.value)}
                    placeholder="D001, D002"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('triage.vitals')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bloodPressure">{t('triage.bloodPressure')}</Label>
                    <Input
                      id="bloodPressure"
                      value={formData.bloodPressure}
                      onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                      placeholder="120/80"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heartRate">{t('triage.heartRate')}</Label>
                    <Input
                      id="heartRate"
                      type="number"
                      value={formData.heartRate}
                      onChange={(e) => handleInputChange('heartRate', e.target.value)}
                      placeholder="72"
                    />
                  </div>
                  <div>
                    <Label htmlFor="temperature">{t('triage.temperature')}</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => handleInputChange('temperature', e.target.value)}
                      placeholder="98.6"
                    />
                  </div>
                  <div>
                    <Label htmlFor="respiratoryRate">{t('triage.respiratoryRate')}</Label>
                    <Input
                      id="respiratoryRate"
                      type="number"
                      value={formData.respiratoryRate}
                      onChange={(e) => handleInputChange('respiratoryRate', e.target.value)}
                      placeholder="16"
                    />
                  </div>
                  <div>
                    <Label htmlFor="oxygenSaturation">{t('triage.oxygenSaturation')}</Label>
                    <Input
                      id="oxygenSaturation"
                      type="number"
                      value={formData.oxygenSaturation}
                      onChange={(e) => handleInputChange('oxygenSaturation', e.target.value)}
                      placeholder="98"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('triage.guardian')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guardianName">{t('triage.guardianName')}</Label>
                    <Input
                      id="guardianName"
                      value={formData.guardianName}
                      onChange={(e) => handleInputChange('guardianName', e.target.value)}
                      placeholder={t('triage.guardianNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardianContact">{t('triage.guardianContact')}</Label>
                    <Input
                      id="guardianContact"
                      value={formData.guardianContact}
                      onChange={(e) => handleInputChange('guardianContact', e.target.value)}
                      placeholder="+1-555-0101"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('triage.processing')}
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5 mr-2" />
                    {t('triage.submit')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {showResult && triageResult && (
          <Card id="triage-result" className="shadow-lg mt-8 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                {t('triage.resultTitle')}
              </CardTitle>
              <CardDescription>{t('triage.resultSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-2 block">{t('triage.riskLevel')}</Label>
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 ${getRiskColor(triageResult.riskLevel)}`}>
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-bold text-lg">{triageResult.riskLevel} {t('triage.riskSuffix')}</span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">{t('triage.recommendedDepartment')}</Label>
                <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 px-6 py-3 rounded-lg inline-block">
                  <span className="font-bold text-lg text-blue-800 dark:text-blue-200">{triageResult.recommendedDepartment}</span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">{t('triage.clinicalReasoning')}</Label>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-lg space-y-2">
                  {triageResult.reasoning.map((reason, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-800 dark:text-gray-200">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">{t('triage.requiredTests')}</Label>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {triageResult.requiredTests.map((test, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        <span className="text-sm text-gray-800 dark:text-gray-200">{test}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => navigate('/patients')}>{t('triage.viewPatients')}</Button>
                <Button onClick={() => navigate('/hospital-overview')} variant="outline">
                  {t('nav.overview')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
