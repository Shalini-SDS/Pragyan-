import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import PatientService from '../services/PatientService';
import DoctorService from '../services/DoctorService';
import AppointmentService from '../services/AppointmentService';
import HospitalService from '../services/HospitalService';
import { toast } from 'sonner';
import { Loader2, Upload, FileText, Trash2, Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface Doctor {
  staff_id?: string;
  name?: string;
  department?: string;
  specialization?: string;
}

interface UploadedHistoryDoc {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface FacilityConfig {
  totalBeds: number;
  occupiedBeds: number;
  totalIcuBeds: number;
  occupiedIcuBeds: number;
  totalMachines: number;
  availableMachines: number;
}

export default function PatientPortalPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitalName, setHospitalName] = useState('MediTriage Hospital');
  const [uploadedDocs, setUploadedDocs] = useState<UploadedHistoryDoc[]>([]);
  const [facility, setFacility] = useState<FacilityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferredDatetime, setPreferredDatetime] = useState('');
  const [reason, setReason] = useState('');
  const [requestingDoctor, setRequestingDoctor] = useState<string | null>(null);

  const getUploadStorageKey = (patientId?: string) => `patient_history_uploads_${patientId || 'unknown'}`;

  const loadAll = async () => {
    setLoading(true);
    try {
      const [me, rec, docs, hospitalInfo] = await Promise.all([
        PatientService.getMyProfile(),
        PatientService.getMyRecords(),
        DoctorService.getDoctors(1, 200),
        HospitalService.getHospitalInfo().catch(() => null),
      ]);
      setProfile(me.patient);
      setRecords(rec.triages || []);
      setDoctors(Array.isArray(docs) ? docs : docs.doctors || []);
      setHospitalName(hospitalInfo?.name || 'MediTriage Hospital');

      const saved = localStorage.getItem(getUploadStorageKey(me.patient?.patient_id));
      setUploadedDocs(saved ? JSON.parse(saved) : []);
      const facilityCfg = localStorage.getItem('admin_facility_config');
      setFacility(facilityCfg ? JSON.parse(facilityCfg) : null);
    } catch (e: any) {
      toast.error(e.message || t('patientPortal.loadError'));
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
      toast.success(t('patientPortal.requestSuccess'));
    } catch (e: any) {
      toast.error(e.message || t('patientPortal.requestError'));
    } finally {
      setRequestingDoctor(null);
    }
  };

  const handleUploadHistory = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nextDocs: UploadedHistoryDoc[] = Array.from(files).map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }));

    const merged = [...nextDocs, ...uploadedDocs];
    setUploadedDocs(merged);
    localStorage.setItem(getUploadStorageKey(profile?.patient_id || user?.patientId), JSON.stringify(merged));
    toast.success('Historical documents added to profile');
  };

  const removeUploadedDoc = (id: string) => {
    const filtered = uploadedDocs.filter((doc) => doc.id !== id);
    setUploadedDocs(filtered);
    localStorage.setItem(getUploadStorageKey(profile?.patient_id || user?.patientId), JSON.stringify(filtered));
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadStructuredPdf = () => {
    const now = new Date();
    const medicationList: string[] =
      profile?.current_medications && Array.isArray(profile.current_medications)
        ? profile.current_medications
        : [];

    const recordMedications: string[] = records.flatMap((r) => (Array.isArray(r.current_medications) ? r.current_medications : []));
    const allMeds = Array.from(new Set([...medicationList, ...recordMedications])).filter(Boolean);

    const doctorIds = Array.from(
      new Set(
        records
          .flatMap((r) => (Array.isArray(r.doctors_following) ? r.doctors_following : []))
          .filter(Boolean)
      )
    );
    const linkedDoctors = doctors.filter((d) => d.staff_id && doctorIds.includes(d.staff_id));

    const doctorRows = linkedDoctors.length
      ? linkedDoctors
          .map(
            (d) =>
              `<tr><td>${d.name || '-'}</td><td>${d.staff_id || '-'}</td><td>${d.department || '-'}</td><td>${d.specialization || '-'}</td></tr>`
          )
          .join('')
      : '<tr><td colspan="4">No linked doctor data available in records.</td></tr>';

    const medRows = allMeds.length
      ? allMeds.map((m) => `<li>${m}</li>`).join('')
      : '<li>No medication data available.</li>';

    const triageRows = records.length
      ? records
          .map((r, idx) => {
            const dt = r.created_at ? new Date(r.created_at).toLocaleString() : '-';
            const risk = r.risk_level || r.priority_level || '-';
            const dept = r.recommended_department || r.predicted_department || '-';
            const symptoms = Array.isArray(r.current_symptoms) ? r.current_symptoms.join(', ') : r.current_symptoms || '-';
            return `<tr><td>${idx + 1}</td><td>${dt}</td><td>${risk}</td><td>${dept}</td><td>${symptoms}</td></tr>`;
          })
          .join('')
      : '<tr><td colspan="5">No historical triage records found.</td></tr>';

    const uploadRows = uploadedDocs.length
      ? uploadedDocs
          .map(
            (d, idx) =>
              `<tr><td>${idx + 1}</td><td>${d.name}</td><td>${d.type || '-'}</td><td>${formatBytes(d.size)}</td><td>${new Date(d.uploadedAt).toLocaleString()}</td></tr>`
          )
          .join('')
      : '<tr><td colspan="5">No uploaded historical documents.</td></tr>';

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${hospitalName} - Patient Clinical Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 28px; color: #1f2937; }
    h1,h2 { margin: 0 0 8px; }
    h1 { font-size: 22px; color: #1f4f8a; }
    h2 { font-size: 16px; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .meta { font-size: 12px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
    ul { margin: 6px 0 0 16px; }
    .foot { margin-top: 20px; font-size: 11px; color: #6b7280; }
  </style>
</head>
<body>
  <h1>${hospitalName}</h1>
  <div class="meta">Patient Structured Clinical Report</div>
  <div class="meta">Generated on: ${now.toLocaleString()}</div>

  <h2>Patient Details</h2>
  <div class="grid">
    <div><strong>Name:</strong> ${profile?.name || '-'}</div>
    <div><strong>Patient ID:</strong> ${profile?.patient_id || user?.patientId || '-'}</div>
    <div><strong>Contact:</strong> ${profile?.contact_number || user?.contactNumber || '-'}</div>
    <div><strong>Hospital ID:</strong> ${user?.hospitalId || '-'}</div>
  </div>

  <h2>Doctor Information</h2>
  <table>
    <thead><tr><th>Name</th><th>Staff ID</th><th>Department</th><th>Specialization</th></tr></thead>
    <tbody>${doctorRows}</tbody>
  </table>

  <h2>Medications</h2>
  <ul>${medRows}</ul>

  <h2>Triage History</h2>
  <table>
    <thead><tr><th>#</th><th>Date & Time</th><th>Risk</th><th>Department</th><th>Symptoms</th></tr></thead>
    <tbody>${triageRows}</tbody>
  </table>

  <h2>Uploaded Historical Documents</h2>
  <table>
    <thead><tr><th>#</th><th>File Name</th><th>Type</th><th>Size</th><th>Uploaded At</th></tr></thead>
    <tbody>${uploadRows}</tbody>
  </table>

  <div class="foot">
    This report was generated by MediTriage AI. For clinical decisions, verify all details with qualified healthcare professionals.
  </div>
</body>
</html>`;

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      toast.error('Unable to open report window. Please allow popups.');
      return;
    }
    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
    toast.success('Report opened. Choose "Save as PDF" in print dialog.');
  };

  if (loading) {
    return <div className="p-10 flex items-center"><Loader2 className="w-5 h-5 animate-spin mr-2" />{t('patientPortal.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('patientPortal.myProfile')}</CardTitle>
            <CardDescription>{t('patientPortal.myProfileDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>{t('patientPortal.name')}</Label><p className="font-semibold">{profile?.name || '-'}</p></div>
            <div><Label>{t('patientPortal.patientId')}</Label><p className="font-semibold">{profile?.patient_id || '-'}</p></div>
            <div><Label>{t('patientPortal.contact')}</Label><p className="font-semibold">{profile?.contact_number || '-'}</p></div>
          </CardContent>
        </Card>

        {facility && (
          <Card>
            <CardHeader>
              <CardTitle>Hospital Capacity Snapshot</CardTitle>
              <CardDescription>Latest facility settings from hospital administration.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-3 bg-white dark:bg-gray-900">
                <p className="text-sm text-gray-500">Beds</p>
                <p className="font-semibold">{facility.occupiedBeds}/{facility.totalBeds} occupied</p>
              </div>
              <div className="rounded-lg border p-3 bg-white dark:bg-gray-900">
                <p className="text-sm text-gray-500">ICU</p>
                <p className="font-semibold">{facility.occupiedIcuBeds}/{facility.totalIcuBeds} occupied</p>
              </div>
              <div className="rounded-lg border p-3 bg-white dark:bg-gray-900">
                <p className="text-sm text-gray-500">Machines</p>
                <p className="font-semibold">{facility.availableMachines}/{facility.totalMachines} available</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('patientPortal.historicalRecords')}</CardTitle>
            <CardDescription>{t('patientPortal.historicalRecordsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {records.length === 0 && <p className="text-sm text-gray-500">{t('patientPortal.noRecords')}</p>}
            {records.map((rec) => (
              <div key={rec._id} className="p-3 border rounded-lg bg-white dark:bg-gray-900">
                <p><span className="font-semibold">{t('patientPortal.date')}:</span> {rec.created_at ? new Date(rec.created_at).toLocaleString() : '-'}</p>
                <p><span className="font-semibold">{t('patientPortal.risk')}:</span> {rec.risk_level || rec.priority_level || '-'}</p>
                <p><span className="font-semibold">{t('patientPortal.department')}:</span> {rec.recommended_department || rec.predicted_department || '-'}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-[#D96C2B]" />Historical Data Upload</CardTitle>
            <CardDescription>Upload previous reports or scanned records to keep your profile history complete.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <Input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                onChange={(e) => handleUploadHistory(e.target.files)}
              />
              <Button variant="outline" className="whitespace-nowrap" onClick={downloadStructuredPdf}>
                <Download className="w-4 h-4 mr-2" />
                Download Structured PDF
              </Button>
            </div>
            <div className="space-y-2">
              {uploadedDocs.length === 0 && <p className="text-sm text-gray-500">No uploaded historical documents yet.</p>}
              {uploadedDocs.map((doc) => (
                <div key={doc.id} className="rounded-lg border bg-white dark:bg-gray-900 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium flex items-center gap-2 truncate"><FileText className="w-4 h-4 text-[#D96C2B]" />{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.type || 'Unknown'} | {formatBytes(doc.size)} | {new Date(doc.uploadedAt).toLocaleString()}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeUploadedDoc(doc.id)} aria-label="Remove document">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('patientPortal.doctorsRequest')}</CardTitle>
            <CardDescription>{t('patientPortal.doctorsRequestDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t('patientPortal.preferredDateTime')}</Label>
                <Input type="datetime-local" value={preferredDatetime} onChange={(e) => setPreferredDatetime(e.target.value)} />
              </div>
              <div>
                <Label>{t('patientPortal.reason')}</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('patientPortal.reasonPlaceholder')} />
              </div>
            </div>

            <div className="space-y-3">
              {doctors.map((doctor) => (
                <div key={doctor.staff_id} className="p-3 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-gray-900">
                  <div>
                    <p className="font-semibold">{doctor.name} ({doctor.staff_id})</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{doctor.department || '-'} | {doctor.specialization || '-'}</p>
                  </div>
                  <Button
                    onClick={() => requestAppointment(doctor.staff_id || '')}
                    disabled={!doctor.staff_id || requestingDoctor === doctor.staff_id}
                  >
                    {requestingDoctor === doctor.staff_id ? t('patientPortal.requesting') : t('patientPortal.requestAppointment')}
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
