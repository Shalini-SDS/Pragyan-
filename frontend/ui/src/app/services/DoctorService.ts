/**
 * Doctor Service
 * API calls related to doctor management
 */

import APIClient from '../utils/apiClient';

export class DoctorService {
  /**
   * Get list of doctors
   */
  static async getDoctors(page = 1, limit = 10, department = '', specialization = '', search = '') {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (department) params.append('department', department);
    if (specialization) params.append('specialization', specialization);
    if (search) params.append('search', search);
    return APIClient.get(`/doctor?${params.toString()}`);
  }

  /**
   * Get single doctor details
   */
  static async getDoctor(staffId: string) {
    return APIClient.get(`/doctor/${staffId}`);
  }

  /**
   * Get only patients associated with logged-in doctor
   */
  static async getMyPatients() {
    return APIClient.get('/doctor/my-patients');
  }

  /**
   * Create new doctor
   */
  static async createDoctor(data: Record<string, unknown>) {
    return APIClient.post('/doctor', data);
  }

  /**
   * Update doctor
   */
  static async updateDoctor(staffId: string, data: Record<string, unknown>) {
    return APIClient.put(`/doctor/${staffId}`, data);
  }

  /**
   * Delete doctor
   */
  static async deleteDoctor(staffId: string) {
    return APIClient.delete(`/doctor/${staffId}`);
  }
}

export default DoctorService;
