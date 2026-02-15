/**
 * API Client Configuration and Utilities
 * 
 * This module provides centralized API client configuration and helper functions
 * for all API calls throughout the frontend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export class APIClient {
  /**
   * Centralized fetch wrapper with error handling
   */
  static async request(
    endpoint: string,
    options: RequestInit & { method?: string } = {}
  ) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');

    const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: HeadersInit = {
      ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const hasToken = !!token;
        const isAuthEndpoint =
          endpoint.startsWith('/auth/login') ||
          endpoint.startsWith('/auth/patient-login') ||
          endpoint.startsWith('/auth/hospitals');
        const jwtErrorMessage = String(errorData.msg || errorData.error || '').toLowerCase();
        const tokenLooksInvalid =
          jwtErrorMessage.includes('expired') ||
          jwtErrorMessage.includes('signature') ||
          jwtErrorMessage.includes('token');

        // Clear stale auth only for protected API calls, not login attempts.
        if ((response.status === 401 || response.status === 422) && hasToken && !isAuthEndpoint && tokenLooksInvalid) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          throw new Error('Session expired. Please login again.');
        }

        let detailsMessage = '';
        if (errorData.details && typeof errorData.details === 'object') {
          const firstKey = Object.keys(errorData.details)[0];
          const firstValue = firstKey ? errorData.details[firstKey] : null;
          if (firstKey && Array.isArray(firstValue) && firstValue.length > 0) {
            detailsMessage = `${firstKey}: ${firstValue[0]}`;
          }
        }

        throw new Error(
          detailsMessage ||
          errorData.error ||
          errorData.msg ||
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Return JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  static get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  static post(endpoint: string, data?: Record<string, unknown>) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * POST multipart/form-data request
   */
  static postForm(endpoint: string, data: FormData) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
      headers: {},
    });
  }

  /**
   * PUT request
   */
  static put(endpoint: string, data?: Record<string, unknown>) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  static delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default APIClient;
