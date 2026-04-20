import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  Save,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  checkBookingConflicts,
  createBooking,
  formatDateTime,
  fromLocalDateTimeInputValue,
  getBooking,
  toLocalDateTimeInputValue,
  updateBooking,
} from '../lib/bookings';
import type { BookingAlternativeFacility, BookingAlternativeTimeSlot, BookingConflictResult, Facility } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import '../styles/Dashboard.css';

type FormState = {
  facilityId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  numberOfAttendees: string;
};

const initialForm: FormState = {
  facilityId: '',
  startTime: '',
  endTime: '',
  purpose: '',
  numberOfAttendees: '',
};

const API_BASE_URL = 'http://localhost:8080';

const STAFF_BOOKING_FACILITY_TYPES = new Set([
  'LECTURE_HALL',
  'CONFERENCE_ROOM',
  'COMPUTER_LAB',
  'STAFF_ROOM',
  'MEETING_ROOM',
  'OTHER',
]);

const STUDENT_BOOKING_FACILITY_TYPES = new Set([
  'CONFERENCE_ROOM',
  'SPORTS_HALL',
  'AUDITORIUM',
  'STUDY_ROOM',
  'BYOD_COMPUTER_LAB',
  'PRACTICAL_ROOM',
  'OTHER',
]);

const optionLabel = (value: string) => value.replaceAll('_', ' ');

const uniqueOptions = (values: string[]) => [...new Set(values)].sort((first, second) => first.localeCompare(second));

const mapFacilityResponse = (value: unknown): Facility[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as Facility[];
};

async function fetchFacilities(token: string): Promise<Facility[]> {
  const response = await fetch(`${API_BASE_URL}/api/facilities`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    return mapFacilityResponse(await response.json());
  }

  const error = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
  throw new Error(error?.message ?? error?.error ?? 'Failed to load facilities');
}

export const BookingFormPage = () => {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const isEditMode = Boolean(bookingId);
  const isStaffDashboardRoute = location.pathname.startsWith('/dashboard/staff/bookings');
  const isStudentDashboardRoute = location.pathname.startsWith('/dashboard/student/bookings');
  const isSharedBookingRoute = location.pathname.startsWith('/bookings');
  const hasStaffRole = Boolean(user?.roles.includes('STAFF'));
  const hasStudentRole = Boolean(user?.roles.includes('STUDENT'));
  const isStaffBookingContext = isStaffDashboardRoute || (isSharedBookingRoute && hasStaffRole && !hasStudentRole);
  const isStudentBookingContext = isStudentDashboardRoute || (isSharedBookingRoute && !isStaffBookingContext);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [conflictResult, setConflictResult] = useState<BookingConflictResult | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    const loadPage = async () => {
      if (!token) {
        setError('You must be logged in to manage bookings.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const facilityData = await fetchFacilities(token);
        setFacilities(facilityData);

        if (bookingId) {
          const booking = await getBooking(token, bookingId);
          setForm({
            facilityId: String(booking.facilityId),
            startTime: toLocalDateTimeInputValue(booking.startTime),
            endTime: toLocalDateTimeInputValue(booking.endTime),
            purpose: booking.purpose,
            numberOfAttendees: String(booking.numberOfAttendees),
          });
          setSelectedName(booking.facilityName);
          setSelectedType(booking.facilityType);
          setSelectedLocation(booking.facilityLocation);
        }
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load booking form.');
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [token, bookingId]);

  useEffect(() => {
    const shouldCheck = form.facilityId && form.startTime && form.endTime;

    if (!token || !shouldCheck) {
      setConflictResult(null);
      return;
    }

    let active = true;
    setCheckingConflicts(true);

    void checkBookingConflicts(
      token,
      Number(form.facilityId),
      fromLocalDateTimeInputValue(form.startTime),
      fromLocalDateTimeInputValue(form.endTime),
      bookingId
    )
      .then((result) => {
        if (active) {
          setConflictResult(result);
        }
      })
      .catch((conflictError) => {
        if (active) {
          setConflictResult(null);
          setError(conflictError instanceof Error ? conflictError.message : 'Failed to check booking conflicts.');
        }
      })
      .finally(() => {
        if (active) {
          setCheckingConflicts(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token, form.facilityId, form.startTime, form.endTime, bookingId]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    setError(null);
  };

  const facilitiesForRoute = isStaffBookingContext
    ? facilities.filter((facility) => STAFF_BOOKING_FACILITY_TYPES.has(facility.facilityType))
    : isStudentBookingContext
      ? facilities.filter((facility) => STUDENT_BOOKING_FACILITY_TYPES.has(facility.facilityType))
    : facilities;

  const selectedFacility = isEditMode && form.facilityId
    ? facilities.find((facility) => String(facility.id) === form.facilityId)
    : null;

  const facilitiesForDropdowns = selectedFacility && !facilitiesForRoute.some((facility) => facility.id === selectedFacility.id)
    ? [...facilitiesForRoute, selectedFacility]
    : facilitiesForRoute;

  const facilitiesForSelectedName = selectedName
    ? facilitiesForDropdowns.filter((facility) => facility.name === selectedName)
    : facilitiesForDropdowns;

  const facilitiesForSelectedType = selectedType
    ? facilitiesForSelectedName.filter((facility) => facility.facilityType === selectedType)
    : facilitiesForSelectedName;

  const nameOptions = uniqueOptions(
    (selectedType
      ? facilitiesForDropdowns.filter((facility) => facility.facilityType === selectedType)
      : [])
      .map((facility) => facility.name)
  );
  const typeOptions = uniqueOptions(facilitiesForSelectedName.map((facility) => facility.facilityType));
  const locationOptions = uniqueOptions(facilitiesForSelectedType.map((facility) => facility.location));

  const resolveFacilityId = (name: string, type: string, location: string) => {
    if (!name || !type || !location) {
      updateField('facilityId', '');
      return;
    }

    const match = facilitiesForDropdowns.find(
      (facility) => facility.name === name && facility.facilityType === type && facility.location === location
    );

    updateField('facilityId', match ? String(match.id) : '');
  };

  const handleNameChange = (name: string) => {
    setSelectedName(name);
    setSelectedLocation('');
    updateField('facilityId', '');
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setSelectedLocation('');
    resolveFacilityId(selectedName, type, '');
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    resolveFacilityId(selectedName, selectedType, location);
  };

  const applyAlternativeTimeSlot = (slot: BookingAlternativeTimeSlot) => {
    updateField('startTime', toLocalDateTimeInputValue(slot.startTime));
    updateField('endTime', toLocalDateTimeInputValue(slot.endTime));
  };

  const applyAlternativeFacility = (facility: BookingAlternativeFacility) => {
    setSelectedType(facility.facilityType);
    setSelectedName(facility.name);
    setSelectedLocation(facility.location);
    updateField('facilityId', String(facility.id));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.facilityId) {
      nextErrors.facilityId = 'Facility is required';
    }
    if (!form.startTime) {
      nextErrors.startTime = 'Start time is required';
    }
    if (!form.endTime) {
      nextErrors.endTime = 'End time is required';
    }
    if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
      nextErrors.endTime = 'End time must be after the start time';
    }
    if (!form.purpose.trim()) {
      nextErrors.purpose = 'Purpose is required';
    }
    if (!form.numberOfAttendees || Number(form.numberOfAttendees) < 1) {
      nextErrors.numberOfAttendees = 'Expected attendees must be at least 1';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token || !validate()) {
      return;
    }

    if (conflictResult?.hasConflict) {
      setError('Resolve the booking conflict before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        facilityId: Number(form.facilityId),
        startTime: fromLocalDateTimeInputValue(form.startTime),
        endTime: fromLocalDateTimeInputValue(form.endTime),
        purpose: form.purpose.trim(),
        numberOfAttendees: Number(form.numberOfAttendees),
      };

      const savedBooking = isEditMode && bookingId
        ? await updateBooking(token, bookingId, payload)
        : await createBooking(token, payload);

      window.alert(isEditMode ? 'Booking updated successfully' : 'Booking created successfully');

      navigate(`/bookings/${savedBooking.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">Loading booking form...</CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {isEditMode ? 'Update Booking' : 'New Booking'}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {isEditMode
                  ? 'Adjust the booking details and re-run conflict validation before resubmitting.'
                  : 'Create a booking request with date, time, purpose, and expected attendees.'}
              </p>
            </div>

            <Link to="/bookings/calendar">
              <Button variant="outline">
                <CalendarDays className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
            </Link>
          </div>

          <Card className="border-slate-200/80 shadow-lg shadow-slate-900/5">
            <CardHeader>
              <CardTitle className="text-xl">{isEditMode ? 'Edit booking request' : 'Booking request form'}</CardTitle>
              <CardDescription>Conflict checking runs automatically when you choose the facility and time range.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
             
                  <div className="space-y-2">
                    <Label htmlFor="facilityType">Type</Label>
                    <Select id="facilityType" value={selectedType} onChange={(event) => handleTypeChange(event.target.value)}>
                      <option value="">Select a type</option>
                      {typeOptions.map((type) => (
                        <option key={type} value={type}>
                          {optionLabel(type)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facilityName">Name</Label>
                    <Select id="facilityName" value={selectedName} onChange={(event) => handleNameChange(event.target.value)}>
                      <option value="">Select a name</option>
                      {nameOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </Select>
                    {fieldErrors.facilityId && <p className="text-xs text-red-600">Select Name, Type, and Location</p>}
                   </div>

                  <div className="space-y-2">
                    <Label htmlFor="facilityLocation">Location</Label>
                    <Select id="facilityLocation" value={selectedLocation} onChange={(event) => handleLocationChange(event.target.value)}>
                      <option value="">Select a location</option>
                      {locationOptions.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfAttendees">Expected Attendees</Label>
                    <Input
                      id="numberOfAttendees"
                      type="number"
                      min="1"
                      value={form.numberOfAttendees}
                      onChange={(event) => updateField('numberOfAttendees', event.target.value)}
                      placeholder="25"
                    />
                    {fieldErrors.numberOfAttendees && <p className="text-xs text-red-600">{fieldErrors.numberOfAttendees}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input id="startTime" type="datetime-local" value={form.startTime} onChange={(event) => updateField('startTime', event.target.value)} />
                    {fieldErrors.startTime && <p className="text-xs text-red-600">{fieldErrors.startTime}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input id="endTime" type="datetime-local" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} />
                    {fieldErrors.endTime && <p className="text-xs text-red-600">{fieldErrors.endTime}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Textarea
                    id="purpose"
                    value={form.purpose}
                    onChange={(event) => updateField('purpose', event.target.value)}
                    placeholder="Explain why you need this facility and what activity will happen."
                    className="min-h-32"
                  />
                  {fieldErrors.purpose && <p className="text-xs text-red-600">{fieldErrors.purpose}</p>}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Conflict Checking</p>
                      <p className="text-xs text-slate-500">The system checks overlapping bookings for the same resource.</p>
                    </div>
                    {checkingConflicts && <span className="text-xs font-medium text-slate-500">Checking...</span>}
                  </div>

                  {!form.facilityId || !form.startTime || !form.endTime ? (
                    <p className="text-sm text-slate-500">Select a facility, start time, and end time to run conflict checking.</p>
                  ) : conflictResult?.hasConflict ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {conflictResult.message}
                      </div>
                      <div className="space-y-2">
                        {conflictResult.conflictingBookings.map((conflict) => (
                          <div key={conflict.id} className="rounded-lg border border-red-100 bg-white p-3 text-sm text-slate-700">
                            <p className="font-medium text-slate-900">{conflict.facilityName}</p>
                            <p>{formatDateTime(conflict.startTime)} to {formatDateTime(conflict.endTime)}</p>
                            <p>Status: {conflict.status}</p>
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="mb-2 text-sm font-semibold text-amber-900">Suggested Alternative Time Slots</p>
                          {conflictResult.alternativeTimeSlots.length === 0 ? (
                            <p className="text-xs text-amber-800">No nearby time slots found for this facility.</p>
                          ) : (
                            <div className="space-y-2">
                              {conflictResult.alternativeTimeSlots.map((slot) => (
                                <div key={`${slot.startTime}-${slot.endTime}`} className="rounded-md border border-amber-200 bg-white p-2">
                                  <p className="text-xs text-slate-700">{formatDateTime(slot.startTime)} to {formatDateTime(slot.endTime)}</p>
                                  <Button type="button" variant="outline" className="mt-2 h-8 px-2 text-xs" onClick={() => applyAlternativeTimeSlot(slot)}>
                                    Use This Slot
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                          <p className="mb-2 text-sm font-semibold text-cyan-900">Recommended Similar Resources</p>
                          {conflictResult.alternativeFacilities.length === 0 ? (
                            <p className="text-xs text-cyan-800">No similar available resources found at this time.</p>
                          ) : (
                            <div className="space-y-2">
                              {conflictResult.alternativeFacilities.map((facility) => (
                                <div key={facility.id} className="rounded-md border border-cyan-200 bg-white p-2">
                                  <p className="text-xs font-medium text-slate-900">{facility.name}</p>
                                  <p className="text-xs text-slate-700">{optionLabel(facility.facilityType)} · {facility.location} · Capacity {facility.capacity}</p>
                                  <Button type="button" variant="outline" className="mt-2 h-8 px-2 text-xs" onClick={() => applyAlternativeFacility(facility)}>
                                    Use This Resource
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : conflictResult ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                      {conflictResult.message}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Conflict result will appear here.</p>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <Link to={isEditMode && bookingId ? `/bookings/${bookingId}` : '/bookings'}>
                    <Button type="button" variant="outline">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={submitting || checkingConflicts}>
                    <Save className="mr-2 h-4 w-4" />
                    {submitting ? 'Saving...' : isEditMode ? 'Update Booking' : 'Create Booking'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <div className="dashboard-layout">

      <main className="dashboard-main">{formContent}</main>
    </div>
  );
};
