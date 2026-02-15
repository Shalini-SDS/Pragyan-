import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import APIClient from '../utils/apiClient';

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'doctor' | 'nurse' | 'admin' | 'staff' | 'patient';
  staffId?: string;
  patientId?: string;
  hospitalId: string;
  department?: string;
  specialization?: string;
  phone?: string;
  contactNumber?: string;
}

interface Hospital {
  hospital_id: string;
  name: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  hospitals: Hospital[];
  loading: boolean;
  error: string | null;
  login: (hospitalId: string, staffId: string, password: string) => Promise<boolean>;
  patientLogin: (hospitalId: string, patientId: string, contactNumber: string) => Promise<boolean>;
  signup: (payload: SignupPayload) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loadHospitals: () => Promise<void>;
  clearError: () => void;
}

interface SignupPayload {
  hospitalId: string;
  staffId: string;
  name: string;
  email?: string;
  role: 'doctor' | 'nurse' | 'admin' | 'staff';
  password: string;
  department?: string;
  specialization?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refreshUser = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      setUser(null);
      return;
    }
    try {
      const me = await APIClient.get('/auth/me');
      const appUser: User = {
        id: me.id,
        name: me.name,
        email: me.email,
        role: me.role as User['role'],
        staffId: me.staff_id,
        patientId: me.patient_id,
        hospitalId: me.hospital_id,
        department: me.department,
        specialization: me.specialization,
        phone: me.phone,
        contactNumber: me.contact_number,
      };
      setUser(appUser);
      localStorage.setItem('user', JSON.stringify(appUser));
    } catch {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
    }
  }, []);

  // Load user from localStorage on mount, then verify token with backend.
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');
    
    if (savedUser && accessToken) {
      try {
        setUser(JSON.parse(savedUser));
        refreshUser();
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
      }
    }
  }, [refreshUser]);

  const loadHospitals = useCallback(async () => {
    try {
      const response = await APIClient.get('/auth/hospitals');
      setHospitals(response.hospitals || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load hospitals:', err);
      setError('Failed to load hospitals');
    }
  }, []);

  const login = async (
    hospitalId: string,
    staffId: string,
    password: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await APIClient.post('/auth/login', {
        hospital_id: hospitalId,
        staff_id: staffId,
        password,
      });

      // Store token
      localStorage.setItem('access_token', response.access_token);

      // Convert response user format to app format
      const appUser: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as User['role'],
        staffId: response.user.staff_id,
        hospitalId: response.user.hospital_id,
        department: response.user.department,
        specialization: response.user.specialization,
        phone: response.user.phone,
      };

      setUser(appUser);
      localStorage.setItem('user', JSON.stringify(appUser));

      // Check if password reset is needed
      if (response.needs_password_reset) {
        return false;
      }
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const patientLogin = async (
    hospitalId: string,
    patientId: string,
    contactNumber: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await APIClient.post('/auth/patient-login', {
        hospital_id: hospitalId,
        patient_id: patientId,
        contact_number: contactNumber,
      });

      localStorage.setItem('access_token', response.access_token);
      const appUser: User = {
        id: response.user.id,
        name: response.user.name,
        role: 'patient',
        patientId: response.user.patient_id,
        hospitalId: response.user.hospital_id,
        contactNumber: response.user.contact_number,
      };
      setUser(appUser);
      localStorage.setItem('user', JSON.stringify(appUser));
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Patient login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload: SignupPayload): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await APIClient.post('/auth/signup', {
        hospital_id: payload.hospitalId,
        staff_id: payload.staffId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        password: payload.password,
        department: payload.department,
        specialization: payload.specialization,
        phone: payload.phone,
      });

      localStorage.setItem('access_token', response.access_token);

      const appUser: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as User['role'],
        staffId: response.user.staff_id,
        hospitalId: response.user.hospital_id,
        department: response.user.department,
        specialization: response.user.specialization,
        phone: response.user.phone,
      };
      setUser(appUser);
      localStorage.setItem('user', JSON.stringify(appUser));
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Signup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await APIClient.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });

      setLoading(false);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Password change failed';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    try {
      // Call logout endpoint
      APIClient.post('/auth/logout').catch(() => {
        // Ignore errors on logout
      });
    } catch {
      // Ignore errors
    }

    // Clear local state
    setUser(null);
    setError(null);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        hospitals,
        loading,
        error,
        login,
        patientLogin,
        signup,
        changePassword,
        refreshUser,
        logout,
        isAuthenticated: !!user,
        loadHospitals,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
