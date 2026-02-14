/**
 * Hospital Service
 * API calls related to hospital management and statistics
 */

import APIClient from '../utils/apiClient';

export class HospitalService {
  /**
   * Get current hospital information
   */
  static async getHospitalInfo() {
    return APIClient.get('/hospital');
  }

  /**
   * Get hospital overview statistics
   */
  static async getHospitalOverview() {
    return APIClient.get('/hospital/stats/overview');
  }

  /**
   * Get list of departments
   */
  static async getDepartments() {
    return APIClient.get('/hospital/departments');
  }
}

export default HospitalService;
