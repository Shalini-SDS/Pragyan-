import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PatientLoginPage() {
  const navigate = useNavigate();
  const { hospitals, loadHospitals, patientLogin, loading } = useAuth();
  const [hospitalId, setHospitalId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !patientId || !contactNumber) {
      toast.error('Please fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      await patientLogin(hospitalId, patientId, contactNumber);
      toast.success('Patient login successful');
      navigate('/patient-portal');
    } catch (err: any) {
      toast.error(err.message || 'Patient login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="container mx-auto px-4 max-w-xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Patient Login</CardTitle>
            <CardDescription>Login with Patient ID and registered contact number.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Hospital</Label>
                <Select value={hospitalId} onValueChange={setHospitalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((h) => (
                      <SelectItem key={h.hospital_id} value={h.hospital_id}>
                        {h.name} ({h.hospital_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Patient ID</Label>
                <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="PAT-XXXXXXXX" />
              </div>
              <div>
                <Label>Registered Contact Number</Label>
                <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+1-555-0100" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || loading}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging in...</> : 'Login as Patient'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
