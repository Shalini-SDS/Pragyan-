import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import ResourceStatusService from '../services/ResourceStatusService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type Bucket = { available: number; total: number };

export default function NurseOperationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [resources, setResources] = useState<{
    doctors: Bucket;
    machines: Bucket;
    rooms: Bucket;
  }>({
    doctors: { available: 0, total: 0 },
    machines: { available: 0, total: 0 },
    rooms: { available: 0, total: 0 },
  });
  const isEditable = user?.role === 'nurse' || user?.role === 'admin' || user?.role === 'staff';

  const load = async () => {
    setLoading(true);
    try {
      const data = await ResourceStatusService.getResourceStatus();
      setResources(data.resources || resources);
      setNotes(data.notes || '');
    } catch (e: any) {
      toast.error(e.message || 'Failed to load resource status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setBucketValue = (key: 'doctors' | 'machines' | 'rooms', field: 'available' | 'total', value: string) => {
    setResources((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: Math.max(0, Number(value || 0)),
      },
    }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await ResourceStatusService.updateResourceStatus({ resources, notes });
      toast.success('Resource status updated');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update resource status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 flex items-center"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading nurse operations...</div>;
  }

  const blocks: Array<{ key: 'doctors' | 'machines' | 'rooms'; title: string }> = [
    { key: 'doctors', title: 'Doctors Availability' },
    { key: 'machines', title: 'Machines Availability' },
    { key: 'rooms', title: 'Rooms Availability' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nurse Operations Dashboard</CardTitle>
            <CardDescription>
              Update and monitor availability counts for doctors, machines, and rooms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {blocks.map((block) => (
              <div key={block.key} className="p-4 border rounded-lg bg-white dark:bg-gray-900">
                <h3 className="font-semibold mb-3">{block.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Available</Label>
                    <Input
                      type="number"
                      min={0}
                      disabled={!isEditable}
                      value={resources[block.key].available}
                      onChange={(e) => setBucketValue(block.key, 'available', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Total</Label>
                    <Input
                      type="number"
                      min={0}
                      disabled={!isEditable}
                      value={resources[block.key].total}
                      onChange={(e) => setBucketValue(block.key, 'total', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div>
              <Label>Notes</Label>
              <Input
                value={notes}
                disabled={!isEditable}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shift notes for availability updates"
              />
            </div>

            {isEditable && (
              <Button onClick={onSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Availability'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
