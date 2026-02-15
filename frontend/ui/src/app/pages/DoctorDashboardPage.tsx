import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import DoctorService from '../services/DoctorService';
import AppointmentService from '../services/AppointmentService';
import ResourceStatusService from '../services/ResourceStatusService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function DoctorDashboardPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [resourceStatus, setResourceStatus] = useState<{
    doctors: { available: number; total: number };
    machines: { available: number; total: number };
    rooms: { available: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const loadAll = async () => {
    setLoading(true);
    try {
      const [mypatients, appts, resources] = await Promise.all([
        DoctorService.getMyPatients(),
        AppointmentService.listAppointments('pending'),
        ResourceStatusService.getResourceStatus(),
      ]);
      setPatients(mypatients.patients || []);
      setAppointments(appts.appointments || []);
      setResourceStatus(resources?.resources || null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load doctor dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateStatus = async (id: string, status: 'approved' | 'confirmed' | 'rejected') => {
    setUpdatingId(id);
    try {
      await AppointmentService.updateAppointmentStatus(id, status, notes[id] || '');
      toast.success(`Appointment ${status}`);
      await loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update appointment');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="p-10 flex items-center"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Availability</CardTitle>
            <CardDescription>Read-only resource status updated by nursing operations</CardDescription>
          </CardHeader>
          <CardContent>
            {!resourceStatus ? (
              <p className="text-sm text-gray-500">No resource status available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border bg-white dark:bg-gray-900">
                  <p className="text-sm text-gray-500">Doctors</p>
                  <p className="font-semibold">{resourceStatus.doctors.available}/{resourceStatus.doctors.total} available</p>
                </div>
                <div className="p-3 rounded-lg border bg-white dark:bg-gray-900">
                  <p className="text-sm text-gray-500">Machines</p>
                  <p className="font-semibold">{resourceStatus.machines.available}/{resourceStatus.machines.total} available</p>
                </div>
                <div className="p-3 rounded-lg border bg-white dark:bg-gray-900">
                  <p className="text-sm text-gray-500">Rooms</p>
                  <p className="font-semibold">{resourceStatus.rooms.available}/{resourceStatus.rooms.total} available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Patients</CardTitle>
            <CardDescription>Only patients assigned/requested to you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {patients.length === 0 && <p className="text-sm text-gray-500">No assigned patients.</p>}
            {patients.map((entry) => (
              <div key={entry.patient?.patient_id} className="p-3 border rounded-lg bg-white dark:bg-gray-900">
                <p className="font-semibold">{entry.patient?.name} ({entry.patient?.patient_id})</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Latest triage: {entry.latest_triage?.risk_level || entry.latest_triage?.priority_level || '-'} / {entry.latest_triage?.recommended_department || entry.latest_triage?.predicted_department || '-'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Latest appointment: {entry.latest_appointment?.status || '-'}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Requests</CardTitle>
            <CardDescription>Review patient requests and approve/confirm/reject</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointments.length === 0 && <p className="text-sm text-gray-500">No pending appointment requests.</p>}
            {appointments.map((appt) => (
              <div key={appt._id} className="p-4 border rounded-lg bg-white dark:bg-gray-900 space-y-2">
                <p className="font-semibold">{appt.patient_profile?.name || appt.patient_id} ({appt.patient_id})</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reason: {appt.reason || '-'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Preferred: {appt.preferred_datetime || '-'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Latest triage: {appt.latest_triage?.risk_level || appt.latest_triage?.priority_level || '-'} / {appt.latest_triage?.recommended_department || appt.latest_triage?.predicted_department || '-'}
                </p>
                <Input
                  placeholder="Doctor note (optional)"
                  value={notes[appt._id] || ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [appt._id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button disabled={updatingId === appt._id} onClick={() => updateStatus(appt._id, 'approved')}>Approve</Button>
                  <Button disabled={updatingId === appt._id} variant="outline" onClick={() => updateStatus(appt._id, 'confirmed')}>Confirm</Button>
                  <Button disabled={updatingId === appt._id} variant="destructive" onClick={() => updateStatus(appt._id, 'rejected')}>Reject</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
