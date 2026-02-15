/**
 * Triage Service
 * API calls related to triage assessments and ML predictions
 */

import APIClient from '../utils/apiClient';

export interface TriageData {
  patient_id?: string;
  name?: string;
  age?: number;
  contact_number?: string;
  guardian_name?: string;
  guardian_contact?: string;
  gender?: 'Male' | 'Female' | 'Other';
  blood_group?: string;
  blood_pressure: string;
  heart_rate: number;
  temperature: number;
  respiratory_rate: number;
  oxygen_saturation: number;
  symptoms: string[];
  duration?: string;
  severity: number;
  previous_conditions?: string[];
  current_medications?: string[];
  notes?: string;
  ehr_pdf?: File;
}

export class TriageService {
  /**
   * Get list of triages
   */
  static async getTriages(page = 1, limit = 10, patientId = '', status = '') {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (patientId) params.append('patient_id', patientId);
    if (status) params.append('status', status);
    return APIClient.get(`/triage?${params.toString()}`);
  }

  /**
   * Get single triage details
   */
  static async getTriage(triageId: string) {
    return APIClient.get(`/triage/${triageId}`);
  }

  /**
   * Create new triage assessment
   */
  static async createTriage(data: TriageData) {
    if (data.ehr_pdf) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'ehr_pdf' && value instanceof File) {
          formData.append('ehr_pdf', value);
          return;
        }
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
          return;
        }
        formData.append(key, String(value));
      });
      return APIClient.postForm('/triage', formData);
    }
    return APIClient.post('/triage', data);
  }

  /**
   * Update triage assessment
   */
  static async updateTriage(triageId: string, data: Partial<TriageData>) {
    return APIClient.put(`/triage/${triageId}`, data);
  }

  /**
   * Get ML predictions for triage without creating record
   */
  static async predictTriage(data: Partial<TriageData>) {
    return APIClient.post('/triage/predict', data);
  }
}

export default TriageService;
