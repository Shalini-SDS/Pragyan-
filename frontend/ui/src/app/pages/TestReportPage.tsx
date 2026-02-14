import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft,
  Activity,
  Heart,
  Wind,
  Droplet,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';

export default function TestReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients } = useApp();

  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-xl text-gray-500">Patient not found</p>
              <Button onClick={() => navigate('/patients')} className="mt-4">
                Back to Patients
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Good':
        return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', icon: 'text-green-600' };
      case 'Caution':
        return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', icon: 'text-yellow-600' };
      case 'Critical':
        return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: 'text-red-600' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800', icon: 'text-gray-600' };
    }
  };

  const organIcons = {
    heart: Heart,
    lungs: Wind,
    liver: Activity,
    kidneys: Droplet,
    brain: Brain,
    blood: Zap,
  };

  // Calculate BMI if height and weight available
  const bmi = patient.testReports?.height && patient.testReports?.weight
    ? (patient.testReports.weight / Math.pow(patient.testReports.height / 100, 2)).toFixed(1)
    : null;

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: 'Underweight', color: 'text-yellow-600' };
    if (bmi < 25) return { status: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { status: 'Overweight', color: 'text-yellow-600' };
    return { status: 'Obese', color: 'text-red-600' };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button onClick={() => navigate(`/patients/${id}`)} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patient Details
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Test Reports & Health Insights</h1>
          <p className="text-gray-600">
            {patient.name} ({patient.id})
          </p>
        </div>

        {/* Basic Vitals & Reports */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Basic Health Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Blood Pressure */}
              {patient.vitals.bloodPressure && (
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-red-600" />
                  <p className="text-sm text-gray-600 mb-1">Blood Pressure</p>
                  <p className="text-2xl font-bold text-red-700">{patient.vitals.bloodPressure}</p>
                  <p className="text-xs text-gray-500 mt-1">mmHg</p>
                </div>
              )}

              {/* Heart Rate */}
              {patient.vitals.heartRate && (
                <div className="p-4 bg-pink-50 rounded-lg text-center">
                  <Heart className="w-8 h-8 mx-auto mb-2 text-pink-600" />
                  <p className="text-sm text-gray-600 mb-1">Heart Rate</p>
                  <p className="text-2xl font-bold text-pink-700">{patient.vitals.heartRate}</p>
                  <p className="text-xs text-gray-500 mt-1">bpm</p>
                </div>
              )}

              {/* Blood Sugar */}
              {patient.testReports?.bloodSugar && (
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <Droplet className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm text-gray-600 mb-1">Blood Sugar</p>
                  <p className="text-2xl font-bold text-purple-700">{patient.testReports.bloodSugar}</p>
                  <p className="text-xs text-gray-500 mt-1">mg/dL</p>
                </div>
              )}

              {/* Temperature */}
              {patient.vitals.temperature && (
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-sm text-gray-600 mb-1">Temperature</p>
                  <p className="text-2xl font-bold text-orange-700">{patient.vitals.temperature}</p>
                  <p className="text-xs text-gray-500 mt-1">°F</p>
                </div>
              )}

              {/* Height */}
              {patient.testReports?.height && (
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600 mb-1">Height</p>
                  <p className="text-2xl font-bold text-blue-700">{patient.testReports.height}</p>
                  <p className="text-xs text-gray-500 mt-1">cm</p>
                </div>
              )}

              {/* Weight */}
              {patient.testReports?.weight && (
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600 mb-1">Weight</p>
                  <p className="text-2xl font-bold text-green-700">{patient.testReports.weight}</p>
                  <p className="text-xs text-gray-500 mt-1">kg</p>
                </div>
              )}

              {/* BMI */}
              {bmi && (
                <div className="p-4 bg-indigo-50 rounded-lg text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                  <p className="text-sm text-gray-600 mb-1">BMI</p>
                  <p className="text-2xl font-bold text-indigo-700">{bmi}</p>
                  <p className={`text-xs font-semibold mt-1 ${getBMIStatus(parseFloat(bmi)).color}`}>
                    {getBMIStatus(parseFloat(bmi)).status}
                  </p>
                </div>
              )}

              {/* Oxygen Saturation */}
              {patient.vitals.oxygenSaturation && (
                <div className="p-4 bg-teal-50 rounded-lg text-center">
                  <Wind className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                  <p className="text-sm text-gray-600 mb-1">SpO₂</p>
                  <p className="text-2xl font-bold text-teal-700">{patient.vitals.oxygenSaturation}</p>
                  <p className="text-xs text-gray-500 mt-1">%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Organ Health Insights */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Organ-Specific Health Insights</h2>
          <p className="text-gray-600 mb-6">
            Click on each organ to view detailed health status, medication side effects, and recommendations
          </p>

          {patient.organHealth && Object.keys(patient.organHealth).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(patient.organHealth).map(([organ, health]) => {
                const colors = getStatusColor(health.status);
                const IconComponent = organIcons[organ as keyof typeof organIcons] || Activity;

                return (
                  <Card
                    key={organ}
                    className={`shadow-lg border-2 ${colors.border} hover:shadow-xl transition-all cursor-pointer`}
                  >
                    <CardHeader className={colors.bg}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center`}>
                            <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                          </div>
                          <div>
                            <CardTitle className="capitalize">{organ}</CardTitle>
                            <Badge className={`${colors.text} mt-1`} variant="outline">
                              {health.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {/* Notes */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-semibold text-gray-700">Assessment</p>
                        </div>
                        <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded">{health.notes}</p>
                      </div>

                      {/* Recommendations */}
                      {health.recommendations.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm font-semibold text-gray-700">Recommendations</p>
                          </div>
                          <ul className="space-y-1">
                            {health.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-green-600 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Alerts */}
                      {health.alerts.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <p className="text-sm font-semibold text-red-700">Alerts & Warnings</p>
                          </div>
                          <div className="space-y-2">
                            {health.alerts.map((alert, index) => (
                              <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-700">{alert}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl text-gray-500">No organ health data available</p>
                <p className="text-gray-400 mt-2">Complete tests to generate health insights</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Current Medications Overview */}
        {patient.medications && patient.medications.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Current Medications & Side Effects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patient.medications
                  .filter((med) => med.status === 'Active')
                  .map((medication) => (
                    <div key={medication.id} className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{medication.name}</h4>
                          <p className="text-sm text-gray-600">
                            {medication.dosage} - {medication.frequency}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="mt-3 p-3 bg-white rounded">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Monitoring Required:</p>
                        <p className="text-xs text-gray-600">
                          Regular monitoring of organ function recommended while on this medication
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
