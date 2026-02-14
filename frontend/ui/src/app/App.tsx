import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage, Language } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import PatientTriagePage from './pages/PatientTriagePage';
import HospitalOverviewPage from './pages/HospitalOverviewPage';
import DoctorsPage from './pages/DoctorsPage';
import DoctorDetailPage from './pages/DoctorDetailPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import TestReportPage from './pages/TestReportPage';
import NursesPage from './pages/NursesPage';
import ProfilePage from './pages/ProfilePage';
import { AuthDialog } from './components/AuthDialog';
import { Activity, Users, Building2, UserCheck, Stethoscope, Moon, Sun, Languages, Heart, User, LogOut, KeyRound } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { toast } from 'sonner';

function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { changePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Update your account password.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old-password">Current Password</Label>
            <Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Update Password'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Navigation() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const navItems = [
    { path: '/triage', label: 'Triage', icon: UserCheck },
    { path: '/hospital-overview', label: 'Overview', icon: Building2 },
    { path: '/doctors', label: 'Doctors', icon: Stethoscope },
    { path: '/nurses', label: 'Nurses', icon: Heart },
    { path: '/patients', label: 'Patients', icon: Users },
  ];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'ta', label: 'Tamil' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to={isAuthenticated ? '/triage' : '/'} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-[#D96C2B] to-[#F28C6F] rounded-xl flex items-center justify-center shadow-soft">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#D96C2B] to-[#F28C6F] bg-clip-text text-transparent hidden sm:inline">
              MediTriage AI
            </span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm ${
                        isActive
                          ? 'bg-gradient-to-r from-[#D96C2B] to-[#F28C6F] text-white shadow-soft'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-[#F4EDE4] dark:hover:bg-gray-800'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="dark:border-gray-700">
                    <Languages className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={language === lang.code ? 'bg-blue-50 dark:bg-blue-900' : ''}
                    >
                      {lang.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="icon" onClick={toggleTheme} className="dark:border-gray-700">
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="dark:border-gray-700">
                    <User className="w-4 h-4 mr-2" />
                    <span className="max-w-24 truncate">{user?.name || 'Profile'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      toast.success('Logged out');
                    }}
                    className="text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a href="/#about" className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">About</a>
              <a href="/#ethics" className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">Ethics</a>
              <a href="/#regulations" className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">Regulations</a>
              <Button size="sm" onClick={() => { setAuthMode('login'); setAuthDialogOpen(true); }}>Login</Button>
              <Button size="sm" variant="outline" onClick={() => { setAuthMode('signup'); setAuthDialogOpen(true); }}>
                Sign Up
              </Button>
              <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} defaultMode={authMode} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navigation />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/triage" replace /> : <HomePage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />

          <Route path="/triage" element={<ProtectedRoute><PatientTriagePage /></ProtectedRoute>} />
          <Route path="/hospital-overview" element={<ProtectedRoute><HospitalOverviewPage /></ProtectedRoute>} />
          <Route path="/doctors" element={<ProtectedRoute><DoctorsPage /></ProtectedRoute>} />
          <Route path="/doctors/:id" element={<ProtectedRoute><DoctorDetailPage /></ProtectedRoute>} />
          <Route path="/nurses" element={<ProtectedRoute><NursesPage /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
          <Route path="/patients/:id" element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />
          <Route path="/patients/:id/test-reports" element={<ProtectedRoute><TestReportPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to={isAuthenticated ? '/triage' : '/'} replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <AppProvider>
                <AppContent />
                <Footer />
                <Toaster />
              </AppProvider>
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
