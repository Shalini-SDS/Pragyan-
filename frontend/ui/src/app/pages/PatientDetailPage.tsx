import React from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft,
  User,
  Phone,
  AlertCircle,
  Activity,
  FileText,
  Pill,
  Scissors,
  Clock,
} from 'lucide-react';

export default function PatientDetailPage() {
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

  const getRiskColor = (risk?: string) => {
    switch (risk) {
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

  const getSurgeryStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMedicationStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Discontinued':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button onClick={() => navigate('/patients')} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patients
        </Button>

        {/* Header Card */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Patient Avatar */}
              <div className="text-center md:text-left">
                <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mx-auto md:mx-0">
                  <User className="w-16 h-16 text-blue-600" />
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{patient.name}</h1>
                    <p className="text-gray-600">Patient ID: {patient.id}</p>
                  </div>
                  {patient.riskLevel && (
                    <Badge className={`${getRiskColor(patient.riskLevel)} border px-4 py-2`}>
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {patient.riskLevel} Risk
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-semibold">{patient.age} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-semibold">{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-semibold">{patient.contactNumber}</p>
                  </div>
                  {patient.recommendedDepartment && (
                    <div className="md:col-span-3">
                      <p className="text-sm text-gray-600 mb-1">Recommended Department</p>
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {patient.recommendedDepartment}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Current Symptoms</p>
              <p className="p-3 bg-gray-50 rounded-lg">{patient.symptoms}</p>
            </div>

            {patient.previousConditions && (
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Previous Medical Conditions</p>
                <p className="p-3 bg-gray-50 rounded-lg">{patient.previousConditions}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Vital Signs</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {patient.vitals.bloodPressure && (
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600 mb-1">Blood Pressure</p>
                    <p className="font-bold text-red-700">{patient.vitals.bloodPressure}</p>
                  </div>
                )}
                {patient.vitals.heartRate && (
                  <div className="p-3 bg-pink-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600 mb-1">Heart Rate</p>
                    <p className="font-bold text-pink-700">{patient.vitals.heartRate} bpm</p>
                  </div>
                )}
                {patient.vitals.temperature && (
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600 mb-1">Temperature</p>
                    <p className="font-bold text-orange-700">{patient.vitals.temperature}°F</p>
                  </div>
                )}
                {patient.vitals.respiratoryRate && (
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600 mb-1">Respiratory Rate</p>
                    <p className="font-bold text-blue-700">{patient.vitals.respiratoryRate}/min</p>
                  </div>
                )}
                {patient.vitals.oxygenSaturation && (
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600 mb-1">SpO₂</p>
                    <p className="font-bold text-green-700">{patient.vitals.oxygenSaturation}%</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Information */}
        {(patient.guardianName || patient.guardianContact) && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Guardian/Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.guardianName && (
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{patient.guardianName}</p>
                  </div>
                )}
                {patient.guardianContact && (
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-semibold">{patient.guardianContact}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Reports Link */}
        <Link to={`/patients/${patient.id}/test-reports`}>
          <Card className="mb-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">View Test Reports & Health Insights</h3>
                    <p className="text-sm text-gray-600">
                      Comprehensive health metrics, organ health, and medication insights
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-6 h-6 text-blue-600 rotate-180" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Surgeries */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Surgery Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!patient.surgeries || patient.surgeries.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No surgeries recorded</p>
              ) : (
                <div className="space-y-4">
                  {patient.surgeries.map((surgery) => (
                    <div key={surgery.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{surgery.type}</h4>
                          <p className="text-sm text-gray-600">Surgeon: {surgery.surgeon}</p>
                        </div>
                        <Badge className={getSurgeryStatusColor(surgery.status)}>{surgery.status}</Badge>
                      </div>
                      {surgery.scheduledDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {surgery.status === 'Completed' && surgery.performedDate
                              ? `Performed: ${new Date(surgery.performedDate).toLocaleDateString()}`
                              : `Scheduled: ${new Date(surgery.scheduledDate).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                      {surgery.notes && (
                        <p className="text-sm text-gray-600 mt-2 p-2 bg-white rounded">
                          {surgery.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medications */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!patient.medications || patient.medications.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No medications recorded</p>
              ) : (
                <div className="space-y-4">
                  {patient.medications.map((medication) => (
                    <div key={medication.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{medication.name}</h4>
                          <p className="text-sm text-gray-600">
                            {medication.dosage} - {medication.frequency}
                          </p>
                        </div>
                        <Badge className={getMedicationStatusColor(medication.status)}>
                          {medication.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        <p>Administered by: {medication.administeredBy}</p>
                        <p>
                          Date: {new Date(medication.administeredAt).toLocaleDateString()}{' '}
                          {new Date(medication.administeredAt).toLocaleTimeString()}
                        </p>
                        {medication.endDate && (
                          <p>End Date: {new Date(medication.endDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Registration Info */}
        <Card className="mt-8 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-600">
              Patient registered on {new Date(patient.registeredAt).toLocaleDateString()} at{' '}
              {new Date(patient.registeredAt).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
