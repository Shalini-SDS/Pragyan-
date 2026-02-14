import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router';
import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage, Language } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
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
import { Activity, Home, Users, Building2, UserCheck, Stethoscope, Moon, Sun, Languages, Heart } from 'lucide-react';
import { Button } from './components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';

function Navigation() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/triage', label: t('nav.triage'), icon: UserCheck },
    { path: '/hospital-overview', label: t('nav.overview'), icon: Building2 },
    { path: '/doctors', label: t('nav.doctors'), icon: Stethoscope },
    { path: '/nurses', label: t('nav.nurses'), icon: Heart },
    { path: '/patients', label: t('nav.patients'), icon: Users },
  ];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'ta', label: 'தமிழ்' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-[#D96C2B] to-[#F28C6F] rounded-xl flex items-center justify-center shadow-soft">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#D96C2B] to-[#F28C6F] bg-clip-text text-transparent hidden sm:inline">
              MediTriage AI
            </span>
          </Link>

          {/* Navigation Links */}
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

            {/* Language Selector */}
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

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="dark:border-gray-700"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navigation />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/triage" element={<PatientTriagePage />} />
          <Route path="/hospital-overview" element={<HospitalOverviewPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/doctors/:id" element={<DoctorDetailPage />} />
          <Route path="/nurses" element={<NursesPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/patients/:id/test-reports" element={<TestReportPage />} />
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