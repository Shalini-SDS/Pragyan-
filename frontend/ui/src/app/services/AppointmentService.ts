import APIClient from '../utils/apiClient';

export interface AppointmentRequestPayload {
  doctor_staff_id: string;
  preferred_datetime?: string;
  reason?: string;
}

export class AppointmentService {
  static async requestAppointment(data: AppointmentRequestPayload) {
    return APIClient.post('/appointment/request', data);
  }

  static async listAppointments(status = '') {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const query = params.toString();
    return APIClient.get(`/appointment${query ? `?${query}` : ''}`);
  }

  static async updateAppointmentStatus(appointmentId: string, status: 'approved' | 'confirmed' | 'rejected', doctor_note = '') {
    return APIClient.put(`/appointment/${appointmentId}/status`, { status, doctor_note });
  }
}

export default AppointmentService;
