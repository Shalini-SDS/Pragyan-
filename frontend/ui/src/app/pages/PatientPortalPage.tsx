import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import PatientService from '../services/PatientService';
import DoctorService from '../services/DoctorService';
import AppointmentService from '../services/AppointmentService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Doctor {
  staff_id?: string;
  name?: string;
  department?: string;
  specialization?: string;
}

export default function PatientPortalPage() {
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferredDatetime, setPreferredDatetime] = useState('');
  const [reason, setReason] = useState('');
  const [requestingDoctor, setRequestingDoctor] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [me, rec, docs] = await Promise.all([
        PatientService.getMyProfile(),
        PatientService.getMyRecords(),
        DoctorService.getDoctors(1, 200),
      ]);
      setProfile(me.patient);
      setRecords(rec.triages || []);
      setDoctors(Array.isArray(docs) ? docs : docs.doctors || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load patient portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const requestAppointment = async (doctorStaffId: string) => {
    setRequestingDoctor(doctorStaffId);
    try {
      await AppointmentService.requestAppointment({
        doctor_staff_id: doctorStaffId,
        preferred_datetime: preferredDatetime || undefined,
        reason: reason || undefined,
      });
      toast.success('Appointment request submitted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to request appointment');
    } finally {
      setRequestingDoctor(null);
    }
  };

  if (loading) {
    return <div className="p-10 flex items-center"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading portal...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>Patient details and identity</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Name</Label><p className="font-semibold">{profile?.name || '-'}</p></div>
            <div><Label>Patient ID</Label><p className="font-semibold">{profile?.patient_id || '-'}</p></div>
            <div><Label>Contact</Label><p className="font-semibold">{profile?.contact_number || '-'}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historical Records</CardTitle>
            <CardDescription>Your triage history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {records.length === 0 && <p className="text-sm text-gray-500">No records found.</p>}
            {records.map((rec) => (
              <div key={rec._id} className="p-3 border rounded-lg bg-white dark:bg-gray-900">
                <p><span className="font-semibold">Date:</span> {rec.created_at ? new Date(rec.created_at).toLocaleString() : '-'}</p>
                <p><span className="font-semibold">Risk:</span> {rec.risk_level || rec.priority_level || '-'}</p>
                <p><span className="font-semibold">Department:</span> {rec.recommended_department || rec.predicted_department || '-'}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doctors & Appointment Request</CardTitle>
            <CardDescription>View doctors and send appointment request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Preferred Date/Time</Label>
                <Input type="datetime-local" value={preferredDatetime} onChange={(e) => setPreferredDatetime(e.target.value)} />
              </div>
              <div>
                <Label>Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Short reason for appointment" />
              </div>
            </div>

            <div className="space-y-3">
              {doctors.map((doctor) => (
                <div key={doctor.staff_id} className="p-3 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-gray-900">
                  <div>
                    <p className="font-semibold">{doctor.name} ({doctor.staff_id})</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{doctor.department || '-'} • {doctor.specialization || '-'}</p>
                  </div>
                  <Button
                    onClick={() => requestAppointment(doctor.staff_id || '')}
                    disabled={!doctor.staff_id || requestingDoctor === doctor.staff_id}
                  >
                    {requestingDoctor === doctor.staff_id ? 'Requesting...' : 'Request Appointment'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
