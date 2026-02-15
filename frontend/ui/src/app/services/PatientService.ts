/**
 * Patient Service
 * API calls related to patient management
 */

import APIClient from '../utils/apiClient';

export class PatientService {
  /**
   * Get list of patients
   */
  static async getPatients(page = 1, limit = 10, search = '', filters: { priority?: string; department?: string } = {}) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.department) params.append('department', filters.department);
    return APIClient.get(`/patient?${params.toString()}`);
  }

  /**
   * Get single patient details
   */
  static async getPatient(patientId: string) {
    return APIClient.get(`/patient/${patientId}`);
  }

  static async getMyProfile() {
    return APIClient.get('/patient/me');
  }

  static async getMyRecords() {
    return APIClient.get('/patient/me/records');
  }

  /**
   * Create new patient
   */
  static async createPatient(data: Record<string, unknown>) {
    return APIClient.post('/patient', data);
  }

  /**
   * Update patient
   */
  static async updatePatient(patientId: string, data: Record<string, unknown>) {
    return APIClient.put(`/patient/${patientId}`, data);
  }

  /**
   * Delete patient
   */
  static async deletePatient(patientId: string) {
    return APIClient.delete(`/patient/${patientId}`);
  }
}

export default PatientService;
