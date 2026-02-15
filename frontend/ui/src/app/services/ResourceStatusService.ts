import APIClient from '../utils/apiClient';

export interface ResourceBucket {
  available: number;
  total: number;
}

export interface ResourceStatusPayload {
  resources: {
    doctors: ResourceBucket;
    machines: ResourceBucket;
    rooms: ResourceBucket;
  };
  notes?: string;
}

export class ResourceStatusService {
  static async getResourceStatus() {
    return APIClient.get('/nurse/resources');
  }

  static async updateResourceStatus(payload: ResourceStatusPayload) {
    return APIClient.put('/nurse/resources', payload);
  }
}

export default ResourceStatusService;
