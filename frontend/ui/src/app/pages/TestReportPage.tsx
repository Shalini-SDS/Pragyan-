import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Activity, FileText, Loader2, AlertCircle, Download, Building2 } from 'lucide-react';
import PatientService from '../services/PatientService';
import HospitalService from '../services/HospitalService';
import { toast } from 'sonner';

type UploadedHistoryDoc = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
};

type FacilityConfig = {
  totalBeds: number;
  occupiedBeds: number;
  totalIcuBeds: number;
  occupiedIcuBeds: number;
  totalMachines: number;
  availableMachines: number;
};

const FACILITY_KEY = 'admin_facility_config';

export default function TestReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState('MediTriage Hospital');
  const [patient, setPatient] = useState<any>(null);
  const [triages, setTriages] = useState<any[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedHistoryDoc[]>([]);
  const [facility, setFacility] = useState<FacilityConfig | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Invalid patient ID');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let patientRes: any = null;
        const hospitalRes = await HospitalService.getHospitalInfo().catch(() => null);
        try {
          patientRes = await PatientService.getPatient(id);
        } catch {
          const list = await PatientService.getPatients(1, 500, id).catch(() => null);
          const patients = Array.isArray(list) ? list : list?.patients || [];
          const matched = patients.find((p: any) => p?.patient_id === id || p?._id === id);
          if (matched?.patient_id || matched?._id) {
            patientRes = await PatientService.getPatient(matched.patient_id || matched._id);
          } else {
            throw new Error('Patient not found');
          }
        }

        const p = patientRes?.patient || null;
        setPatient(p);
        setTriages(Array.isArray(patientRes?.recent_triages) ? patientRes.recent_triages : []);
        setHospitalName(hospitalRes?.name || 'MediTriage Hospital');

        const key = `patient_history_uploads_${p?.patient_id || id}`;
        const docs = localStorage.getItem(key);
        setUploadedDocs(docs ? JSON.parse(docs) : []);

        const facilityStr = localStorage.getItem(FACILITY_KEY);
        setFacility(facilityStr ? JSON.parse(facilityStr) : null);

        setError(null);
      } catch (e: any) {
        setError(e.message || 'Patient not found');
        setPatient(null);
        setTriages([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const allMedications = useMemo(() => {
    const fromProfile = Array.isArray(patient?.current_medications) ? patient.current_medications : [];
    const fromTriages = triages.flatMap((t) => (Array.isArray(t.current_medications) ? t.current_medications : []));
    return Array.from(new Set([...fromProfile, ...fromTriages])).filter(Boolean);
  }, [patient, triages]);

  const downloadClinicalReport = () => {
    if (!patient) return;
    const now = new Date();
    const medsList = allMedications.length ? allMedications.map((m) => `<li>${m}</li>`).join('') : '<li>No medication data available.</li>';
    const triageRows = triages.length
      ? triages
          .map((t, idx) => {
            const risk = t.priority_level || t.risk_level || '-';
            const dept = t.predicted_department || t.recommended_department || '-';
            const dt = t.created_at ? new Date(t.created_at).toLocaleString() : '-';
            const symptoms = Array.isArray(t.symptoms) ? t.symptoms.join(', ') : t.symptoms || '-';
            return `<tr><td>${idx + 1}</td><td>${dt}</td><td>${risk}</td><td>${dept}</td><td>${symptoms}</td></tr>`;
          })
          .join('')
      : '<tr><td colspan="5">No triage records</td></tr>';

    const docRows = uploadedDocs.length
      ? uploadedDocs.map((d, idx) => `<tr><td>${idx + 1}</td><td>${d.name}</td><td>${d.type}</td><td>${formatBytes(d.size)}</td><td>${new Date(d.uploadedAt).toLocaleString()}</td></tr>`).join('')
      : '<tr><td colspan="5">No uploaded historical documents.</td></tr>';

    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>${hospitalName} - Clinical Report</title>
      <style>body{font-family:Arial;margin:24px;color:#111827}h1{margin:0 0 4px;font-size:24px;color:#1f4f8a}h2{margin:18px 0 8px;font-size:16px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}.meta{font-size:12px;color:#4b5563}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #d1d5db;padding:6px;text-align:left}th{background:#f3f4f6}ul{margin:6px 0 0 16px}</style></head><body>
      <h1>${hospitalName}</h1><div class="meta">Patient Clinical Report</div><div class="meta">Generated: ${now.toLocaleString()}</div>
      <h2>Patient Details</h2><p><b>Name:</b> ${patient?.name || '-'}<br/><b>Patient ID:</b> ${patient?.patient_id || id}<br/><b>Contact:</b> ${patient?.contact_number || '-'}<br/><b>Age/Gender:</b> ${patient?.age ?? '-'} / ${patient?.gender || '-'}</p>
      <h2>Current Medications</h2><ul>${medsList}</ul>
      <h2>Triage History</h2><table><thead><tr><th>#</th><th>Date</th><th>Risk</th><th>Department</th><th>Symptoms</th></tr></thead><tbody>${triageRows}</tbody></table>
      <h2>Uploaded Historical Documents</h2><table><thead><tr><th>#</th><th>File Name</th><th>Type</th><th>Size</th><th>Uploaded At</th></tr></thead><tbody>${docRows}</tbody></table>
      </body></html>`;

    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Popup blocked. Please allow popups for PDF report.');
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  if (loading) {
    return <div className="p-10 flex items-center"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading test report...</div>;
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="py-16 text-center">
              <AlertCircle className="w-10 h-10 mx-auto text-red-600 mb-3" />
              <p className="text-xl text-gray-500">{error || 'Patient not found'}</p>
              <Button onClick={() => navigate('/patients')} className="mt-4">Back to Patients</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <Button onClick={() => navigate(`/patients/${id}`)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patient Details
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Reports & Health Insights</span>
              <Button variant="outline" onClick={downloadClinicalReport}>
                <Download className="w-4 h-4 mr-2" />
                Download Structured PDF
              </Button>
            </CardTitle>
            <CardDescription>{patient.name} ({patient.patient_id || id})</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><p className="text-sm text-gray-500">Hospital</p><p className="font-semibold">{hospitalName}</p></div>
            <div><p className="text-sm text-gray-500">Age</p><p className="font-semibold">{patient.age ?? '-'}</p></div>
            <div><p className="text-sm text-gray-500">Gender</p><p className="font-semibold">{patient.gender || '-'}</p></div>
            <div><p className="text-sm text-gray-500">Contact</p><p className="font-semibold">{patient.contact_number || '-'}</p></div>
          </CardContent>
        </Card>

        {facility && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-[#D96C2B]" />Hospital Capacity Snapshot</CardTitle>
              <CardDescription>Reflects latest admin capacity settings.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-3"><p className="text-sm text-gray-500">Beds</p><p className="font-semibold">{facility.occupiedBeds}/{facility.totalBeds} occupied</p></div>
              <div className="rounded-lg border p-3"><p className="text-sm text-gray-500">ICU</p><p className="font-semibold">{facility.occupiedIcuBeds}/{facility.totalIcuBeds} occupied</p></div>
              <div className="rounded-lg border p-3"><p className="text-sm text-gray-500">Machines</p><p className="font-semibold">{facility.availableMachines}/{facility.totalMachines} available</p></div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />Recent Triage Records</CardTitle>
          </CardHeader>
          <CardContent>
            {triages.length === 0 ? <p className="text-gray-500">No triage records available.</p> : (
              <div className="space-y-3">
                {triages.map((t, idx) => (
                  <div key={t._id || idx} className="rounded-lg border p-3 bg-white">
                    <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
                      <Badge>{t.priority_level || t.risk_level || 'Unknown'} Risk</Badge>
                      <span className="text-xs text-gray-500">{t.created_at ? new Date(t.created_at).toLocaleString() : ''}</span>
                    </div>
                    <p className="text-sm"><span className="font-semibold">Department:</span> {t.predicted_department || t.recommended_department || '-'}</p>
                    <p className="text-sm"><span className="font-semibold">Symptoms:</span> {Array.isArray(t.symptoms) ? t.symptoms.join(', ') : t.symptoms || '-'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Medications</CardTitle>
          </CardHeader>
          <CardContent>
            {allMedications.length === 0 ? <p className="text-gray-500">No medications recorded.</p> : (
              <ul className="list-disc pl-5 space-y-1">
                {allMedications.map((m) => <li key={m}>{m}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Uploaded Historical Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {uploadedDocs.length === 0 ? <p className="text-gray-500">No historical documents uploaded for this patient.</p> : (
              <div className="space-y-2">
                {uploadedDocs.map((d) => (
                  <div key={d.id} className="rounded border p-3">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-gray-500">{d.type || '-'} | {formatBytes(d.size)} | {new Date(d.uploadedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
