import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Award,
  Video,
  Stethoscope,
  Activity,
} from 'lucide-react';

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { doctors } = useApp();

  const doctor = doctors.find((d) => d.id === id);

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-xl text-gray-500">Doctor not found</p>
              <Button onClick={() => navigate('/doctors')} className="mt-4">
                Back to Doctors
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getAvailabilityStatus = () => {
    if (doctor.onLeave) {
      return { text: 'On Leave', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    }
    if (doctor.available) {
      return { text: 'Available', color: 'bg-green-500', textColor: 'text-green-600' };
    }
    return { text: 'Busy', color: 'bg-red-500', textColor: 'text-red-600' };
  };

  const getQueueStatus = () => {
    const percentage = (doctor.currentTokenCount / doctor.maxPatientsPerDay) * 100;
    if (percentage >= 90) {
      return { text: 'Fully Booked', color: 'bg-red-100 text-red-800', icon: '🔴' };
    }
    if (percentage >= 60) {
      return { text: 'Limited Slots', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' };
    }
    return { text: 'Available', color: 'bg-green-100 text-green-800', icon: '🟢' };
  };

  const status = getAvailabilityStatus();
  const queueStatus = getQueueStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button onClick={() => navigate('/doctors')} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Doctors
        </Button>

        {/* Header Card */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo and Status */}
              <div className="text-center md:text-left">
                <div className="relative inline-block mb-4">
                  <img
                    src={doctor.photo}
                    alt={doctor.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
                  />
                  <div className={`absolute bottom-0 right-0 w-8 h-8 rounded-full border-4 border-white ${status.color}`}></div>
                </div>
                <Badge className={`${status.textColor} border-current`} variant="outline">
                  {status.text}
                </Badge>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{doctor.name}</h1>
                    <p className="text-gray-600">Doctor ID: {doctor.id}</p>
                  </div>
                  {doctor.emergencyOnCall && (
                    <Badge className="bg-red-600">Emergency On-Call</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-semibold">{doctor.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Qualification</p>
                      <p className="font-semibold">{doctor.qualification}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="font-semibold">{doctor.experience} years</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">License Number</p>
                      <p className="font-semibold">{doctor.licenseNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Schedule & Availability */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule & Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-600">OPD Days</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {doctor.opdDays.map((day, index) => (
                    <Badge key={index} variant="secondary">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-600">OPD Timings</span>
                </div>
                <p className="font-semibold">{doctor.opdTime}</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Current Queue Status</span>
                  <Badge className={queueStatus.color}>{queueStatus.icon} {queueStatus.text}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Token Count:</span>
                  <span className="font-bold text-lg">
                    {doctor.currentTokenCount} / {doctor.maxPatientsPerDay}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(doctor.currentTokenCount / doctor.maxPatientsPerDay) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {doctor.teleconsultAvailable && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Video className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Teleconsultation Available</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact & Location */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Contact & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-600">Room Location</span>
                </div>
                <p className="font-semibold">Room {doctor.roomNumber}</p>
                <p className="text-sm text-gray-600">{doctor.floor}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-600">Extension Number</span>
                </div>
                <p className="font-semibold">Ext. {doctor.extensionNumber}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-600">Consultation Fee</span>
                </div>
                <p className="font-semibold text-xl">${doctor.consultationFee}</p>
              </div>
            </CardContent>
          </Card>

          {/* Privileges & Authority */}
          <Card className="shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Privileges & Authority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg text-center ${doctor.admittingPrivileges ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${doctor.admittingPrivileges ? 'bg-green-100' : 'bg-gray-200'}`}>
                    <Users className={`w-6 h-6 ${doctor.admittingPrivileges ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <p className="text-sm font-semibold mb-1">Admitting Privileges</p>
                  <Badge variant={doctor.admittingPrivileges ? 'default' : 'secondary'}>
                    {doctor.admittingPrivileges ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className={`p-4 rounded-lg text-center ${doctor.surgicalClearance ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${doctor.surgicalClearance ? 'bg-blue-100' : 'bg-gray-200'}`}>
                    <Stethoscope className={`w-6 h-6 ${doctor.surgicalClearance ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <p className="text-sm font-semibold mb-1">Surgical Clearance</p>
                  <Badge variant={doctor.surgicalClearance ? 'default' : 'secondary'}>
                    {doctor.surgicalClearance ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className={`p-4 rounded-lg text-center ${doctor.emergencyOnCall ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${doctor.emergencyOnCall ? 'bg-red-100' : 'bg-gray-200'}`}>
                    <Activity className={`w-6 h-6 ${doctor.emergencyOnCall ? 'text-red-600' : 'text-gray-400'}`} />
                  </div>
                  <p className="text-sm font-semibold mb-1">Emergency On-Call</p>
                  <Badge variant={doctor.emergencyOnCall ? 'default' : 'secondary'}>
                    {doctor.emergencyOnCall ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className={`p-4 rounded-lg text-center ${doctor.teleconsultAvailable ? 'bg-purple-50' : 'bg-gray-50'}`}>
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${doctor.teleconsultAvailable ? 'bg-purple-100' : 'bg-gray-200'}`}>
                    <Video className={`w-6 h-6 ${doctor.teleconsultAvailable ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <p className="text-sm font-semibold mb-1">Teleconsultation</p>
                  <Badge variant={doctor.teleconsultAvailable ? 'default' : 'secondary'}>
                    {doctor.teleconsultAvailable ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
