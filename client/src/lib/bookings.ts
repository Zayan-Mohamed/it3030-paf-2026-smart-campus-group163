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
  { date: '2025-01-13', name: 'Duruthu Full Moon Poya Day' },
  { date: '2025-01-14', name: 'Tamil Thai Pongal Day' },
  { date: '2025-02-04', name: 'National Day' },
  { date: '2025-02-12', name: 'Navam Full Moon Poya Day' },
  { date: '2025-02-26', name: 'Mahasivarathri Day' },
  { date: '2025-03-13', name: 'Madin Full Moon Poya Day' },
  { date: '2025-03-31', name: 'Eid al-Fitr' },
  { date: '2025-04-12', name: 'Bak Full Moon Poya Day' },
  { date: '2025-04-13', name: "Sinhala and Tamil New Year's Eve" },
  { date: '2025-04-14', name: "Sinhala and Tamil New Year's Day" },
  { date: '2025-04-18', name: 'Good Friday' },
  { date: '2025-05-01', name: 'May Day' },
  { date: '2025-05-12', name: 'Vesak Full Moon Poya Day' },
  { date: '2025-05-13', name: 'Day after Vesak Full Moon Poya Day' },
  { date: '2025-06-07', name: 'Eid al-Adha' },
  { date: '2025-06-10', name: 'Poson Full Moon Poya Day' },
  { date: '2025-07-10', name: 'Esala Full Moon Poya Day' },
  { date: '2025-08-08', name: 'Nikini Full Moon Poya Day' },
  { date: '2025-09-05', name: 'Milad-Un-Nabi' },
  { date: '2025-09-07', name: 'Binara Full Moon Poya Day' },
  { date: '2025-10-06', name: 'Vap Full Moon Poya Day' },
  { date: '2025-10-20', name: 'Deepavali' },
  { date: '2025-11-05', name: 'Il Full Moon Poya Day' },
  { date: '2025-11-28', name: 'Bad Weather Holiday' },
  { date: '2025-12-04', name: 'Unduvap Full Moon Poya Day' },
  { date: '2025-12-25', name: 'Christmas Day' },
];

const PUBLIC_HOLIDAYS_2026: PublicHoliday[] = [
  { date: '2026-01-03', name: 'Duruthu Full Moon Poya Day' },
  { date: '2026-01-15', name: 'Tamil Thai Pongal Day' },
  { date: '2026-02-01', name: 'Navam Full Moon Poya Day' },
  { date: '2026-02-04', name: 'National Day' },
  { date: '2026-02-15', name: 'Mahasivarathri Day' },
  { date: '2026-03-02', name: 'Madin Full Moon Poya Day' },
  { date: '2026-03-18', name: 'Fuel Conservation Holiday' },
  { date: '2026-03-21', name: 'Eid al-Fitr' },
  { date: '2026-03-25', name: 'Fuel Conservation Holiday' },
  { date: '2026-04-01', name: 'Bak Full Moon Poya Day' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-04-13', name: "Sinhala and Tamil New Year's Eve" },
  { date: '2026-04-14', name: "Sinhala and Tamil New Year's Day" },
  { date: '2026-05-01', name: 'May Day' },
  { date: '2026-05-01', name: 'Vesak Full Moon Poya Day' },
  { date: '2026-05-02', name: 'Day after Vesak Full Moon Poya Day' },
  { date: '2026-05-28', name: 'Eid al-Adha (tentative)' },
  { date: '2026-05-30', name: 'Adhi Poson Full Moon Poya Day' },
  { date: '2026-06-29', name: 'Poson Full Moon Poya Day' },
  { date: '2026-07-29', name: 'Esala Full Moon Poya Day' },
  { date: '2026-08-26', name: 'Milad-Un-Nabi (tentative)' },
  { date: '2026-08-27', name: 'Nikini Full Moon Poya Day' },
  { date: '2026-09-26', name: 'Binara Full Moon Poya Day' },
  { date: '2026-10-25', name: 'Vap Full Moon Poya Day' },
  { date: '2026-11-08', name: 'Deepavali' },
  { date: '2026-11-24', name: 'Il Full Moon Poya Day' },
  { date: '2026-12-23', name: 'Unduvap Full Moon Poya Day' },
  { date: '2026-12-25', name: 'Christmas Day' },
];

// Google holiday feed currently publishes this calendar only up to 2026.
const PUBLIC_HOLIDAYS_2027: PublicHoliday[] = [];

const ALL_PUBLIC_HOLIDAYS = [...PUBLIC_HOLIDAYS_2025, ...PUBLIC_HOLIDAYS_2026, ...PUBLIC_HOLIDAYS_2027];

export function getPublicHolidays(): PublicHoliday[] {
  return ALL_PUBLIC_HOLIDAYS;
}

export function isPublicHoliday(dateString: string): PublicHoliday | undefined {
  const dateKey = dateString.slice(0, 10); // Get YYYY-MM-DD format
  return ALL_PUBLIC_HOLIDAYS.find((holiday) => holiday.date === dateKey);
}
