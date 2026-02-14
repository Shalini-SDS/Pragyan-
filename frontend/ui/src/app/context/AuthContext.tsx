import React, { createContext, useContext, useState, useEffect } from 'react';
import APIClient from '../utils/apiClient';

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'doctor' | 'nurse' | 'admin' | 'staff';
  staffId: string;
  hospitalId: string;
  department?: string;
  specialization?: string;
  phone?: string;
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
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loadHospitals: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');
    
    if (savedUser && accessToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
      }
    }
  }, []);

  const loadHospitals = async () => {
    try {
      const response = await APIClient.get('/auth/hospitals');
      setHospitals(response.hospitals || []);
    } catch (err) {
      console.error('Failed to load hospitals:', err);
      setError('Failed to load hospitals');
    }
  };

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
        // Redirect to password change
        return false; // Indicates password change needed
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      throw err;
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
        changePassword,
        logout,
        isAuthenticated: !!user,
        loadHospitals,
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
