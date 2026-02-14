import { APIClient } from '../app/services/apiClient';

/**
 * Mock utility for API testing
 * Provides common patterns for mocking API calls
 */

export const mockAPIResponse = (data: any) => {
  return Promise.resolve(data);
};

export const mockAPIError = (message: string) => {
  return Promise.reject(new Error(message));
};

/**
 * Mock fetch for testing API calls
 */
export const setupFetchMock = (mockImplementation?: jest.Mock) => {
  global.fetch = mockImplementation || jest.fn();
};

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
};

/**
 * Mock doctor data for testing
 */
export const mockDoctor = {
  _id: '1',
  staff_id: 'DOC001',
  first_name: 'John',
  last_name: 'Doe',
  gender: 'Male',
  specialization: 'Cardiology',
  department: 'Cardiology',
  is_active: true,
  hospital_id: 'hosp-123',
};

export const mockDoctorList = {
  doctors: [mockDoctor],
  total: 1,
  page: 1,
  limit: 100,
};

/**
 * Mock patient data for testing
 */
export const mockPatient = {
  _id: '1',
  patient_id: 'PAT001',
  first_name: 'Jane',
  last_name: 'Smith',
  gender: 'Female',
  blood_type: 'O+',
  allergies: ['Penicillin'],
  current_medications: ['Aspirin'],
  is_active: true,
  hospital_id: 'hosp-123',
};

export const mockPatientList = {
  patients: [mockPatient],
  total: 1,
  page: 1,
  limit: 100,
};

/**
 * Mock nurse data for testing
 */
export const mockNurse = {
  _id: '1',
  staff_id: 'NURSE001',
  first_name: 'Alice',
  last_name: 'Johnson',
  gender: 'Female',
  shift: 'morning',
  department: 'General Ward',
  is_active: true,
  hospital_id: 'hosp-123',
};

export const mockNurseList = {
  nurses: [mockNurse],
  total: 1,
  page: 1,
  limit: 100,
};

/**
 * Mock hospital data for testing
 */
export const mockHospitalOverview = {
  total_beds: 200,
  occupied_beds: 150,
  available_beds: 50,
  total_patients: 150,
  doctors_count: 45,
  nurses_count: 120,
  departments: [
    { name: 'General Ward', patient_count: 50, bed_count: 60 },
    { name: 'ICU', patient_count: 30, bed_count: 20 },
    { name: 'Emergency', patient_count: 40, bed_count: 30 },
  ],
};

/**
 * Mock auth token
 */
export const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

/**
 * Mock triage prediction response
 */
export const mockTriagePrediction = {
  risk_level: 'High',
  risk_score: 0.85,
  confidence: 0.92,
  recommended_action: 'Admit to ICU',
  reasoning: 'High fever with rapid pulse indicating possible infection',
};
