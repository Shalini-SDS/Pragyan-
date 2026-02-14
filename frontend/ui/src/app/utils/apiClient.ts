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

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
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

      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
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
