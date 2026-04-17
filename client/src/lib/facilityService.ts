import type { Facility, FacilityStatus, FacilityType } from '../types';

const API_BASE_URL = 'http://localhost:8080';

export type FacilityFilters = {
  name?: string;
  location?: string;
  facilityType?: FacilityType | '';
  status?: FacilityStatus | '';
  minCapacity?: number | '';
};

export type FacilityPayload = {
  name: string;
  description: string;
  facilityType: FacilityType;
  location: string;
  capacity: number;
  status: FacilityStatus;
  imageUrl: string;
  amenities: string;
  availableFrom: string;
  availableTo: string;
};

type ApiError = {
  message?: string;
  error?: string;
  details?: Record<string, string>;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  token?: string | null;
  body?: string;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Request failed');
    }
    return data as T;
  }
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || 'Request failed');
  }
  return text as T;
};

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /(failed to fetch|networkerror|network error|connection refused|load failed)/i.test(error.message);
}

async function facilityRequest<T>(path: string, options: RequestOptions = {}) {
  const { method = 'GET', token, body } = options;
  const headers: Record<string, string> = {};

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body,
    });

    return parseResponse<T>(response);
  } catch (error) {
    if (error instanceof TypeError || isNetworkError(error)) {
      throw new Error(`Network error while calling ${API_BASE_URL}${path}`);
    }

    throw error;
  }
}

function buildFacilityQuery(filters: FacilityFilters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getFacilities(token?: string | null, filters: FacilityFilters = {}) {
  return facilityRequest<Facility[]>(`/api/facilities${buildFacilityQuery(filters)}`, {
    method: 'GET',
    token,
  });
}

export async function getFacility(id: string, token?: string | null) {
  return facilityRequest<Facility>(`/api/facilities/${id}`, {
    method: 'GET',
    token,
  });
}

export async function createFacility(token: string, payload: FacilityPayload) {
  return facilityRequest<Facility>('/api/facilities', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateFacility(token: string, id: string, payload: FacilityPayload) {
  return facilityRequest<Facility>(`/api/facilities/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteFacility(token: string, id: number) {
  await facilityRequest<void>(`/api/facilities/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function normalizeFacilityTime(value: string) {
  if (!value) {
    return value;
  }

  return value.length === 5 ? `${value}:00` : value;
}

export function toTimeInputValue(value?: string | null) {
  if (!value) {
    return '';
  }

  return value.slice(0, 5);
}

export function facilityTypeLabel(value: FacilityType) {
  return value.replaceAll('_', ' ');
}

export function facilityStatusLabel(value: FacilityStatus) {
  return value.replaceAll('_', ' ');
}
