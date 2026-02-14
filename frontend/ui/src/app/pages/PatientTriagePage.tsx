import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
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

  const [formData, setFormData] = useState({
    patientId: '',
    name: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    contactNumber: '',
    symptoms: [] as string[],
    previousConditions: '',
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

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.age || !formData.contactNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    const normalizedSymptoms = formData.symptoms.filter(Boolean);
    if (normalizedSymptoms.length === 0) {
      toast.error('Please enter at least one symptom');
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
        symptoms: normalizedSymptoms,
        severity: parseInt(formData.severity, 10),
      };

      const predictions = await TriageService.predictTriage(triageData);

      setTriageResult({
        riskLevel: predictions.priority_level || predictions.risk_level || 'Medium',
        recommendedDepartment: predictions.predicted_department || 'General Medicine',
        riskScore: predictions.risk_score || 0.5,
        confidence: predictions.confidence || 0.5,
        reasoning: predictions.reasoning || ['AI triage completed successfully.'],
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
        medical_history: formData.previousConditions ? [formData.previousConditions] : undefined,
      };

      let patientId = formData.patientId;
      if (!patientId) {
        const response = await PatientService.createPatient(patientData);
        patientId = response._id;
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
          symptoms: normalizedSymptoms,
          severity: parseInt(formData.severity, 10),
          duration: undefined,
          previous_conditions: formData.previousConditions ? [formData.previousConditions] : undefined,
        };

        await TriageService.createTriage(triagePayload);
      }

      setShowResult(true);
      toast.success('Triage assessment completed successfully!');

      setTimeout(() => {
        document.getElementById('triage-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process triage');
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
          <h1 className="text-4xl font-bold mb-2 dark:text-white">Patient Triage</h1>
          <p className="text-gray-600 dark:text-gray-400">AI-powered patient assessment and department routing</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Enter patient details for AI-based triage assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age *</Label>
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
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value: any) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contactNumber">Contact Number *</Label>
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
                <h3 className="font-semibold text-lg">Medical Information</h3>
                <div>
                  <Label htmlFor="symptoms">Current Symptoms *</Label>
                  <Textarea
                    id="symptoms"
                    value={formData.symptoms.join(', ')}
                    onChange={(e) =>
                      handleInputChange(
                        'symptoms',
                        e.target.value
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="e.g., chest pain, shortness of breath, dizziness"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="previousConditions">Previous Medical Conditions</Label>
                  <Textarea
                    id="previousConditions"
                    value={formData.previousConditions}
                    onChange={(e) => handleInputChange('previousConditions', e.target.value)}
                    placeholder="List any previous medical conditions, allergies, or ongoing treatments..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="doctorsFollowing">Doctors Following (comma-separated IDs)</Label>
                  <Input
                    id="doctorsFollowing"
                    value={formData.doctorsFollowing}
                    onChange={(e) => handleInputChange('doctorsFollowing', e.target.value)}
                    placeholder="D001, D002"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vital Signs (if available)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bloodPressure">Blood Pressure</Label>
                    <Input
                      id="bloodPressure"
                      value={formData.bloodPressure}
                      onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                      placeholder="120/80"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                    <Input
                      id="heartRate"
                      type="number"
                      value={formData.heartRate}
                      onChange={(e) => handleInputChange('heartRate', e.target.value)}
                      placeholder="72"
                    />
                  </div>
                  <div>
                    <Label htmlFor="temperature">Temperature (F)</Label>
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
                    <Label htmlFor="respiratoryRate">Respiratory Rate (/min)</Label>
                    <Input
                      id="respiratoryRate"
                      type="number"
                      value={formData.respiratoryRate}
                      onChange={(e) => handleInputChange('respiratoryRate', e.target.value)}
                      placeholder="16"
                    />
                  </div>
                  <div>
                    <Label htmlFor="oxygenSaturation">Oxygen Saturation (%)</Label>
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
                <h3 className="font-semibold text-lg">Guardian/Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input
                      id="guardianName"
                      value={formData.guardianName}
                      onChange={(e) => handleInputChange('guardianName', e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardianContact">Guardian Contact</Label>
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
                    Processing Triage...
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5 mr-2" />
                    Perform AI Triage Assessment
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
                Triage Assessment Complete
              </CardTitle>
              <CardDescription>AI-generated risk assessment and department recommendation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-2 block">Risk Level</Label>
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 ${getRiskColor(triageResult.riskLevel)}`}>
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-bold text-lg">{triageResult.riskLevel} Risk</span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Recommended Department</Label>
                <div className="bg-blue-50 border-2 border-blue-300 px-6 py-3 rounded-lg inline-block">
                  <span className="font-bold text-lg text-blue-800">{triageResult.recommendedDepartment}</span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Clinical Reasoning</Label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {triageResult.reasoning.map((reason, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-sm">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Required Tests and Procedures</Label>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {triageResult.requiredTests.map((test, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        <span className="text-sm">{test}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => navigate('/patients')}>View Patient Records</Button>
                <Button onClick={() => navigate('/hospital-overview')} variant="outline">
                  Hospital Overview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
