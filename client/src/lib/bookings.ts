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

export function bookingStatusBackgroundColor(status: BookingStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-200';
    case 'REJECTED':
      return 'bg-red-200';
    case 'CANCELLED':
      return 'bg-gray-300';
    case 'COMPLETED':
      return 'bg-blue-200';
    case 'PENDING':
    default:
      return 'bg-amber-200';
  }
}

export function bookingStatusBgTailwind(status: BookingStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-300';
    case 'REJECTED':
      return 'bg-red-300';
    case 'CANCELLED':
      return 'bg-gray-400';
    case 'COMPLETED':
      return 'bg-blue-300';
    case 'PENDING':
    default:
      return 'bg-amber-300';
  }
}

// Public Holidays for Sri Lanka (2025, 2026, 2027) - Official Government Holidays
export interface PublicHoliday {
  date: string; // YYYY-MM-DD format
  name: string;
}

const PUBLIC_HOLIDAYS_2025: PublicHoliday[] = [
  { date: '2025-01-14', name: 'Thai Pongal Day' },
  { date: '2025-02-04', name: 'Independence Day' },
  { date: '2025-03-04', name: 'Maha Shivaratri' },
  { date: '2025-02-28', name: 'Eid-ul-Fitr' },
  { date: '2025-04-18', name: 'Good Friday' },
  { date: '2025-04-19', name: 'Easter Monday' },
  { date: '2025-04-13', name: 'Sinhala & Tamil New Year' },
  { date: '2025-04-14', name: 'Sinhala & Tamil New Year Holiday' },
  { date: '2025-05-01', name: 'May Day / Labour Day' },
  { date: '2025-05-05', name: 'Vesak Full Moon Poya Day' },
  { date: '2025-05-06', name: 'Vesak Holiday' },
  { date: '2025-05-29', name: 'Poson Full Moon Poya Day' },
  { date: '2025-05-30', name: 'Poson Holiday' },
  { date: '2025-06-11', name: 'Western Teachers Day' },
  { date: '2025-07-01', name: 'Esala Full Moon Poya Day' },
  { date: '2025-07-02', name: 'Esala Holiday' },
  { date: '2025-08-08', name: 'Eid-ul-Adha' },
  { date: '2025-08-20', name: 'Nikini Full Moon Poya Day' },
  { date: '2025-08-21', name: 'Nikini Holiday' },
  { date: '2025-09-19', name: 'Il Full Moon Poya Day' },
  { date: '2025-09-20', name: 'Il Holiday' },
  { date: '2025-11-01', name: 'Deepavali' },
  { date: '2025-11-20', name: 'Unduvap Full Moon Poya Day' },
  { date: '2025-11-21', name: 'Unduvap Holiday' },
  { date: '2025-12-25', name: 'Christmas Day' },
];

const PUBLIC_HOLIDAYS_2026: PublicHoliday[] = [
  { date: '2026-01-14', name: 'Thai Pongal Day' },
  { date: '2026-02-04', name: 'Independence Day' },
  { date: '2026-03-04', name: 'Maha Shivaratri' },
  { date: '2026-03-10', name: 'Eid-ul-Fitr' },
  { date: '2026-03-30', name: 'Good Friday' },
  { date: '2026-03-31', name: 'Easter Monday' },
  { date: '2026-04-13', name: 'Sinhala & Tamil New Year' },
  { date: '2026-04-14', name: 'Sinhala & Tamil New Year Holiday' },
  { date: '2026-05-01', name: 'May Day / Labour Day' },
  { date: '2026-05-15', name: 'Vesak Full Moon Poya Day' },
  { date: '2026-05-16', name: 'Vesak Holiday' },
  { date: '2026-06-09', name: 'Poson Full Moon Poya Day' },
  { date: '2026-06-10', name: 'Poson Holiday' },
  { date: '2026-06-11', name: 'Western Teachers Day' },
  { date: '2026-07-11', name: 'Esala Full Moon Poya Day' },
  { date: '2026-07-12', name: 'Esala Holiday' },
  { date: '2026-08-19', name: 'Eid-ul-Adha' },
  { date: '2026-08-31', name: 'Nikini Full Moon Poya Day' },
  { date: '2026-09-01', name: 'Nikini Holiday' },
  { date: '2026-10-02', name: 'Il Full Moon Poya Day' },
  { date: '2026-10-03', name: 'Il Holiday' },
  { date: '2026-11-01', name: 'Deepavali' },
  { date: '2026-12-01', name: 'Unduvap Full Moon Poya Day' },
  { date: '2026-12-02', name: 'Unduvap Holiday' },
  { date: '2026-12-25', name: 'Christmas Day' },
];

const PUBLIC_HOLIDAYS_2027: PublicHoliday[] = [
  { date: '2027-01-14', name: 'Thai Pongal Day' },
  { date: '2027-02-04', name: 'Independence Day' },
  { date: '2027-03-04', name: 'Maha Shivaratri' },
  { date: '2027-02-17', name: 'Eid-ul-Fitr' },
  { date: '2027-04-02', name: 'Good Friday' },
  { date: '2027-04-03', name: 'Easter Monday' },
  { date: '2027-04-13', name: 'Sinhala & Tamil New Year' },
  { date: '2027-04-14', name: 'Sinhala & Tamil New Year Holiday' },
  { date: '2027-05-01', name: 'May Day / Labour Day' },
  { date: '2027-05-24', name: 'Vesak Full Moon Poya Day' },
  { date: '2027-05-25', name: 'Vesak Holiday' },
  { date: '2027-06-18', name: 'Poson Full Moon Poya Day' },
  { date: '2027-06-19', name: 'Poson Holiday' },
  { date: '2027-06-11', name: 'Western Teachers Day' },
  { date: '2027-07-20', name: 'Esala Full Moon Poya Day' },
  { date: '2027-07-21', name: 'Esala Holiday' },
  { date: '2027-07-29', name: 'Eid-ul-Adha' },
  { date: '2027-09-09', name: 'Nikini Full Moon Poya Day' },
  { date: '2027-09-10', name: 'Nikini Holiday' },
  { date: '2027-10-09', name: 'Il Full Moon Poya Day' },
  { date: '2027-10-10', name: 'Il Holiday' },
  { date: '2027-11-01', name: 'Deepavali' },
  { date: '2027-12-09', name: 'Unduvap Full Moon Poya Day' },
  { date: '2027-12-10', name: 'Unduvap Holiday' },
  { date: '2027-12-25', name: 'Christmas Day' },
];

const ALL_PUBLIC_HOLIDAYS = [...PUBLIC_HOLIDAYS_2025, ...PUBLIC_HOLIDAYS_2026, ...PUBLIC_HOLIDAYS_2027];

export function getPublicHolidays(): PublicHoliday[] {
  return ALL_PUBLIC_HOLIDAYS;
}

export function isPublicHoliday(dateString: string): PublicHoliday | undefined {
  const dateKey = dateString.slice(0, 10); // Get YYYY-MM-DD format
  return ALL_PUBLIC_HOLIDAYS.find((holiday) => holiday.date === dateKey);
}
