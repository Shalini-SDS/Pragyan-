import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';

type AuthMode = 'login' | 'signup';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: AuthMode;
}

export function AuthDialog({ open, onOpenChange, defaultMode = 'login' }: AuthDialogProps) {
  const { login, signup, hospitals, loadHospitals, loading, error, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [hospitalId, setHospitalId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'doctor' | 'nurse' | 'admin' | 'staff'>('doctor');
  const [department, setDepartment] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    clearError();
    loadHospitals();
    setMode(defaultMode);
    setHospitalId('');
    setStaffId('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setEmail('');
    setRole('doctor');
    setDepartment('');
    setSpecialization('');
    setPhone('');
  }, [open, defaultMode, clearError, loadHospitals]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !staffId || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(hospitalId, staffId, password);
      if (success) {
        toast.success('Logged in successfully');
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !staffId || !name || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        hospitalId,
        staffId,
        name,
        email: email || undefined,
        role,
        password,
        department: department || undefined,
        specialization: specialization || undefined,
        phone: phone || undefined,
      });
      toast.success('Account created successfully');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {mode === 'login' ? 'MediTriage Login' : 'Create Account'}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {mode === 'login'
              ? 'Login with your hospital credentials'
              : 'Register a new staff account'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hospital">Hospital</Label>
              <Select value={hospitalId} onValueChange={setHospitalId}>
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800">
                  {hospitals.map((hospital) => (
                    <SelectItem key={hospital.hospital_id} value={hospital.hospital_id}>
                      {hospital.name} ({hospital.hospital_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-id">Staff ID</Label>
              <Input
                id="staff-id"
                type="text"
                placeholder="e.g., DOC001"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                required
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading || loading}>
              {isLoading || loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('signup')}>
              Need an account? Sign Up
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="signup-hospital">Hospital</Label>
              <Select value={hospitalId} onValueChange={setHospitalId}>
                <SelectTrigger id="signup-hospital" className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800">
                  {hospitals.map((hospital) => (
                    <SelectItem key={hospital.hospital_id} value={hospital.hospital_id}>
                      {hospital.name} ({hospital.hospital_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-role">Role</Label>
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger id="signup-role" className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800">
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="signup-staff">Staff ID</Label>
                <Input
                  id="signup-staff"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  required
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-dept">Department</Label>
                <Input
                  id="signup-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-specialization">Specialization (Doctors)</Label>
              <Input
                id="signup-specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-phone">Phone</Label>
              <Input
                id="signup-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading || loading}>
              {isLoading || loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('login')}>
              Already have an account? Login
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
