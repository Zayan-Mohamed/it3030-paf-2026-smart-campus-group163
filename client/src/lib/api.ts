import { getStoredToken } from '../utils/jwtUtils';
import { API_BASE_URL } from './authService';

const getHeaders = () => {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  get: async (url: string) => {
    const response = await fetch(`${API_BASE_URL}${url}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('API Request failed');
    try { return { data: await response.json() }; } catch { return { data: null }; }
  },
  post: async (url: string, data?: any) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    if (!response.ok) throw new Error('API Request failed');
    try { return { data: await response.json() }; } catch { return { data: null }; }
  },
  put: async (url: string, data?: any) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(),
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    if (!response.ok) throw new Error('API Request failed');
    try { return { data: await response.json() }; } catch { return { data: null }; }
  },
  delete: async (url: string) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('API Request failed');
    try { return { data: await response.json() }; } catch { return { data: null }; }
  }
};

export default api;
