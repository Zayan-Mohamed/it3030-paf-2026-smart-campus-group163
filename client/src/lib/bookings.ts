import type { Booking, BookingConflictResult, BookingStatus, Facility } from '../types';

const API_BASE_URL = 'http://localhost:8080';

type BookingPayload = {
  facilityId: number;
  startTime: string;
  endTime: string;
  purpose: string;
  numberOfAttendees: number;
};

type BookingFilters = {
  status?: BookingStatus | '';
  facilityId?: number | '';
  from?: string;
  to?: string;
};

const buildHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  const error = (await response.json().catch(() => null)) as { message?: string } | null;
  throw new Error(error?.message ?? 'Request failed');
}

function buildQuery(filters: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getFacilities(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/facilities`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonOrThrow<Facility[]>(response);
}

export async function getBookings(token: string, filters: BookingFilters = {}) {
  const query = buildQuery({
    status: filters.status,
    facilityId: filters.facilityId,
    from: filters.from,
    to: filters.to,
  });

  const response = await fetch(`${API_BASE_URL}/api/v1/bookings${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonOrThrow<Booking[]>(response);
}

export async function getBooking(token: string, bookingId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonOrThrow<Booking>(response);
}

export async function createBooking(token: string, payload: BookingPayload) {
  const response = await fetch(`${API_BASE_URL}/api/v1/bookings`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });

  return parseJsonOrThrow<Booking>(response);
}

export async function updateBooking(token: string, bookingId: string, payload: BookingPayload) {
  const response = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}`, {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });

  return parseJsonOrThrow<Booking>(response);
}

export async function deleteBooking(token: string, bookingId: number) {
  const response = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? 'Failed to delete booking');
  }
}

export async function cancelBooking(token: string, bookingId: number) {
  const response = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonOrThrow<Booking>(response);
}

export async function reviewBooking(
  token: string,
  bookingId: number,
  status: 'APPROVED' | 'REJECTED',
  comment?: string
) {
  const response = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/review`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({
      status,
      staffComments: comment || null,
    }),
  });

  return parseJsonOrThrow<Booking>(response);
}

export async function adminCancelBooking(token: string, bookingId: number, reason: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/admin-cancel`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({ reason }),
  });

  return parseJsonOrThrow<Booking>(response);
}

export async function getBookingCalendar(
  token: string,
  facilityId: number | '',
  from: string,
  to: string
) {
  const query = buildQuery({
    facilityId: facilityId === '' ? undefined : facilityId,
    from,
    to,
  });

  const response = await fetch(`${API_BASE_URL}/api/v1/bookings/calendar${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonOrThrow<Booking[]>(response);
}

export async function checkBookingConflicts(
  token: string,
  facilityId: number,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
) {
  const query = buildQuery({
    facilityId,
    startTime,
    endTime,
    excludeBookingId,
  });

  const response = await fetch(`${API_BASE_URL}/api/v1/bookings/conflicts${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonOrThrow<BookingConflictResult>(response);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    timeStyle: 'short',
  }).format(new Date(value));
}

export function toLocalDateTimeInputValue(value: string) {
  return value.slice(0, 16);
}

export function fromLocalDateTimeInputValue(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}

export function bookingStatusLabel(status: BookingStatus) {
  return status.replace('_', ' ');
}

export function bookingStatusClasses(status: BookingStatus) {
  switch (status) {
    case 'APPROVED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'REJECTED':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'CANCELLED':
      return 'border-slate-200 bg-slate-100 text-slate-600';
    case 'COMPLETED':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'PENDING':
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
}
