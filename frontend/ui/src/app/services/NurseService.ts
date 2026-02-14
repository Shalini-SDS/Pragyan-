/**
 * Nurse Service
 * API calls related to nurse management
 */

import APIClient from '../utils/apiClient';

export class NurseService {
  /**
   * Get list of nurses
   */
  static async getNurses(page = 1, limit = 10, department = '', shift = '', search = '') {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (department) params.append('department', department);
    if (shift) params.append('shift', shift);
    if (search) params.append('search', search);
    return APIClient.get(`/nurse?${params.toString()}`);
  }

  /**
   * Get single nurse details
   */
  static async getNurse(staffId: string) {
    return APIClient.get(`/nurse/${staffId}`);
  }

  /**
   * Create new nurse
   */
  static async createNurse(data: Record<string, unknown>) {
    return APIClient.post('/nurse', data);
  }

  /**
   * Update nurse
   */
  static async updateNurse(staffId: string, data: Record<string, unknown>) {
    return APIClient.put(`/nurse/${staffId}`, data);
  }

  /**
   * Delete nurse
   */
  static async deleteNurse(staffId: string) {
    return APIClient.delete(`/nurse/${staffId}`);
  }
}

export default NurseService;
