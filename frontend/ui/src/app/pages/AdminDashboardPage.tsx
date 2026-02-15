import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Loader2, Settings2, Activity, Bed, Cpu, Users, UserRound, Stethoscope } from 'lucide-react';
import DoctorService from '../services/DoctorService';
import NurseService from '../services/NurseService';
import HospitalService from '../services/HospitalService';
import AppointmentService from '../services/AppointmentService';
import ResourceStatusService from '../services/ResourceStatusService';

type FacilityConfig = {
  totalBeds: number;
  occupiedBeds: number;
  totalIcuBeds: number;
  occupiedIcuBeds: number;
  totalMachines: number;
  availableMachines: number;
};

const FACILITY_KEY = 'admin_facility_config';

const defaultFacility: FacilityConfig = {
  totalBeds: 120,
  occupiedBeds: 80,
  totalIcuBeds: 24,
  occupiedIcuBeds: 12,
  totalMachines: 30,
  availableMachines: 14,
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [savingFacility, setSavingFacility] = useState(false);
  const [creatingDoctor, setCreatingDoctor] = useState(false);
  const [creatingNurse, setCreatingNurse] = useState(false);

  const [doctorCount, setDoctorCount] = useState(0);
  const [nurseCount, setNurseCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);

  const [doctorForm, setDoctorForm] = useState({
    staff_id: '',
    name: '',
    department: '',
    specialization: '',
    email: '',
    phone: '',
  });

  const [nurseForm, setNurseForm] = useState({
    staff_id: '',
    name: '',
    department: '',
    shift: '',
    email: '',
    phone: '',
  });

  const [facility, setFacility] = useState<FacilityConfig>(defaultFacility);

  const bedUtilization = useMemo(() => {
    if (!facility.totalBeds) return 0;
    return Math.min(100, Math.round((facility.occupiedBeds / facility.totalBeds) * 100));
  }, [facility]);

  const icuUtilization = useMemo(() => {
    if (!facility.totalIcuBeds) return 0;
    return Math.min(100, Math.round((facility.occupiedIcuBeds / facility.totalIcuBeds) * 100));
  }, [facility]);

  const machineUtilization = useMemo(() => {
    if (!facility.totalMachines) return 0;
    const used = Math.max(0, facility.totalMachines - facility.availableMachines);
    return Math.min(100, Math.round((used / facility.totalMachines) * 100));
  }, [facility]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(FACILITY_KEY);
      if (stored) {
        setFacility({ ...defaultFacility, ...JSON.parse(stored) });
      }

      const [docs, nurses, overview, appts] = await Promise.all([
        DoctorService.getDoctors(1, 200),
        NurseService.getNurses(1, 200),
        HospitalService.getHospitalOverview(),
        AppointmentService.listAppointments('pending'),
      ]);

      const doctors = Array.isArray(docs) ? docs : docs.doctors || [];
      const nurseList = Array.isArray(nurses) ? nurses : nurses.nurses || [];
      setDoctorCount(doctors.length);
      setNurseCount(nurseList.length);
      setPatientCount(overview?.total_patients || 0);
      setPendingAppointments((appts?.appointments || []).length);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const saveFacility = async () => {
    const normalized: FacilityConfig = {
      totalBeds: Math.max(0, facility.totalBeds),
      occupiedBeds: Math.max(0, Math.min(facility.occupiedBeds, facility.totalBeds)),
      totalIcuBeds: Math.max(0, facility.totalIcuBeds),
      occupiedIcuBeds: Math.max(0, Math.min(facility.occupiedIcuBeds, facility.totalIcuBeds)),
      totalMachines: Math.max(0, facility.totalMachines),
      availableMachines: Math.max(0, Math.min(facility.availableMachines, facility.totalMachines)),
    };
    setSavingFacility(true);
    try {
      localStorage.setItem(FACILITY_KEY, JSON.stringify(normalized));
      setFacility(normalized);

      const current = await ResourceStatusService.getResourceStatus().catch(() => null);
      const payload = {
        resources: {
          doctors: current?.resources?.doctors || { available: doctorCount, total: doctorCount },
          machines: { available: normalized.availableMachines, total: normalized.totalMachines },
          rooms: { available: normalized.totalBeds - normalized.occupiedBeds, total: normalized.totalBeds },
        },
        notes: current?.notes || 'Updated from admin dashboard',
      };
      await ResourceStatusService.updateResourceStatus(payload as any);
      toast.success('Facility settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save facility settings');
    } finally {
      setSavingFacility(false);
    }
  };

  const createDoctor = async () => {
    if (!doctorForm.staff_id || !doctorForm.name || !doctorForm.department) {
      toast.error('Please fill required doctor fields');
      return;
    }
    setCreatingDoctor(true);
    try {
      await DoctorService.createDoctor(doctorForm as any);
      toast.success('Doctor added');
      setDoctorForm({ staff_id: '', name: '', department: '', specialization: '', email: '', phone: '' });
      await loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add doctor');
    } finally {
      setCreatingDoctor(false);
    }
  };

  const createNurse = async () => {
    if (!nurseForm.staff_id || !nurseForm.name || !nurseForm.department) {
      toast.error('Please fill required nurse fields');
      return;
    }
    setCreatingNurse(true);
    try {
      await NurseService.createNurse(nurseForm as any);
      toast.success('Nurse added');
      setNurseForm({ staff_id: '', name: '', department: '', shift: '', email: '', phone: '' });
      await loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add nurse');
    } finally {
      setCreatingNurse(false);
    }
  };

  if (loading) {
    return <div className="p-10 flex items-center"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading admin dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5 text-[#D96C2B]" />Admin Dashboard</CardTitle>
            <CardDescription>Manage hospital staffing, capacity, and operational performance.</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><p className="text-sm text-gray-500">Doctors</p><Stethoscope className="w-4 h-4 text-blue-600" /></div><p className="text-2xl font-bold">{doctorCount}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><p className="text-sm text-gray-500">Nurses</p><UserRound className="w-4 h-4 text-green-600" /></div><p className="text-2xl font-bold">{nurseCount}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><p className="text-sm text-gray-500">Patients</p><Users className="w-4 h-4 text-purple-600" /></div><p className="text-2xl font-bold">{patientCount}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><p className="text-sm text-gray-500">Pending Appointments</p><Activity className="w-4 h-4 text-amber-600" /></div><p className="text-2xl font-bold">{pendingAppointments}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bed className="w-5 h-5 text-[#D96C2B]" />Hospital Capacity Management</CardTitle>
            <CardDescription>Set beds, ICU, and machine availability for operations planning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Total Beds</Label><Input type="number" min={0} value={facility.totalBeds} onChange={(e) => setFacility((p) => ({ ...p, totalBeds: Number(e.target.value || 0) }))} /></div>
              <div><Label>Occupied Beds</Label><Input type="number" min={0} value={facility.occupiedBeds} onChange={(e) => setFacility((p) => ({ ...p, occupiedBeds: Number(e.target.value || 0) }))} /></div>
              <div className="rounded-lg border p-3 bg-white dark:bg-gray-900"><p className="text-sm text-gray-500">Bed Utilization</p><p className="text-xl font-bold">{bedUtilization}%</p></div>
              <div><Label>Total ICU Beds</Label><Input type="number" min={0} value={facility.totalIcuBeds} onChange={(e) => setFacility((p) => ({ ...p, totalIcuBeds: Number(e.target.value || 0) }))} /></div>
              <div><Label>Occupied ICU Beds</Label><Input type="number" min={0} value={facility.occupiedIcuBeds} onChange={(e) => setFacility((p) => ({ ...p, occupiedIcuBeds: Number(e.target.value || 0) }))} /></div>
              <div className="rounded-lg border p-3 bg-white dark:bg-gray-900"><p className="text-sm text-gray-500">ICU Utilization</p><p className="text-xl font-bold">{icuUtilization}%</p></div>
              <div><Label>Total Machines</Label><Input type="number" min={0} value={facility.totalMachines} onChange={(e) => setFacility((p) => ({ ...p, totalMachines: Number(e.target.value || 0) }))} /></div>
              <div><Label>Available Machines</Label><Input type="number" min={0} value={facility.availableMachines} onChange={(e) => setFacility((p) => ({ ...p, availableMachines: Number(e.target.value || 0) }))} /></div>
              <div className="rounded-lg border p-3 bg-white dark:bg-gray-900"><p className="text-sm text-gray-500">Machine Utilization</p><p className="text-xl font-bold">{machineUtilization}%</p></div>
            </div>
            <Button onClick={saveFacility} disabled={savingFacility}>{savingFacility ? 'Saving...' : 'Save Capacity Settings'}</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Doctor</CardTitle>
              <CardDescription>Create a new doctor profile for this hospital.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Staff ID *</Label><Input value={doctorForm.staff_id} onChange={(e) => setDoctorForm((p) => ({ ...p, staff_id: e.target.value }))} /></div>
                <div><Label>Name *</Label><Input value={doctorForm.name} onChange={(e) => setDoctorForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Department *</Label><Input value={doctorForm.department} onChange={(e) => setDoctorForm((p) => ({ ...p, department: e.target.value }))} /></div>
                <div><Label>Specialization</Label><Input value={doctorForm.specialization} onChange={(e) => setDoctorForm((p) => ({ ...p, specialization: e.target.value }))} /></div>
                <div><Label>Email</Label><Input value={doctorForm.email} onChange={(e) => setDoctorForm((p) => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>Phone</Label><Input value={doctorForm.phone} onChange={(e) => setDoctorForm((p) => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <Button onClick={createDoctor} disabled={creatingDoctor}>{creatingDoctor ? 'Adding...' : 'Add Doctor'}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Nurse</CardTitle>
              <CardDescription>Create a new nurse profile for this hospital.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Staff ID *</Label><Input value={nurseForm.staff_id} onChange={(e) => setNurseForm((p) => ({ ...p, staff_id: e.target.value }))} /></div>
                <div><Label>Name *</Label><Input value={nurseForm.name} onChange={(e) => setNurseForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Department *</Label><Input value={nurseForm.department} onChange={(e) => setNurseForm((p) => ({ ...p, department: e.target.value }))} /></div>
                <div><Label>Shift</Label><Input value={nurseForm.shift} onChange={(e) => setNurseForm((p) => ({ ...p, shift: e.target.value }))} /></div>
                <div><Label>Email</Label><Input value={nurseForm.email} onChange={(e) => setNurseForm((p) => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>Phone</Label><Input value={nurseForm.phone} onChange={(e) => setNurseForm((p) => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <Button onClick={createNurse} disabled={creatingNurse}>{creatingNurse ? 'Adding...' : 'Add Nurse'}</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="w-5 h-5 text-[#D96C2B]" />System Performance Snapshot</CardTitle>
            <CardDescription>Real-time operational indicators for admin monitoring.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 bg-white dark:bg-gray-900"><p className="text-sm text-gray-500">Staff Load</p><p className="text-lg font-semibold">{doctorCount + nurseCount} active clinical staff</p></div>
            <div className="rounded-lg border p-4 bg-white dark:bg-gray-900"><p className="text-sm text-gray-500">Infra Pressure</p><p className="text-lg font-semibold">Beds {bedUtilization}% | ICU {icuUtilization}%</p></div>
            <div className="rounded-lg border p-4 bg-white dark:bg-gray-900"><p className="text-sm text-gray-500">Workflow Queue</p><p className="text-lg font-semibold">{pendingAppointments} pending appointment actions</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

