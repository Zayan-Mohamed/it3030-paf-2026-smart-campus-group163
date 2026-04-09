import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CalendarDays, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  checkBookingConflicts,
  createBooking,
  formatDateTime,
  fromLocalDateTimeInputValue,
  getBooking,
  getFacilities,
  toLocalDateTimeInputValue,
  updateBooking,
} from '../lib/bookings';
import type { BookingConflictResult, Facility } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';

type FormState = {
  name: string;
  facilityType: string;
  location: string;
  startTime: string;
  endTime: string;
  purpose: string;
  numberOfAttendees: string;
};

const initialForm: FormState = {
  name: '',
  facilityType: '',
  location: '',
  startTime: '',
  endTime: '',
  purpose: '',
  numberOfAttendees: '',
};

export const BookingFormPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const isEditMode = Boolean(bookingId);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [conflictResult, setConflictResult] = useState<BookingConflictResult | null>(null);

  const selectedFacility = useMemo(() => (
    facilities.find((facility) =>
      facility.name === form.name
      && facility.facilityType === form.facilityType
      && facility.location === form.location
    ) ?? null
  ), [facilities, form.name, form.facilityType, form.location]);

  const nameOptions = useMemo(() => {
    const matchingFacilities = facilities.filter((facility) =>
      (!form.facilityType || facility.facilityType === form.facilityType)
      && (!form.location || facility.location === form.location)
    );

    return Array.from(new Set(matchingFacilities.map((facility) => facility.name))).sort((left, right) => left.localeCompare(right));
  }, [facilities, form.facilityType, form.location]);

  const typeOptions = useMemo(() => {
    const matchingFacilities = facilities.filter((facility) =>
      (!form.name || facility.name === form.name)
      && (!form.location || facility.location === form.location)
    );

    return Array.from(new Set(matchingFacilities.map((facility) => facility.facilityType))).sort((left, right) => left.localeCompare(right));
  }, [facilities, form.name, form.location]);

  const locationOptions = useMemo(() => {
    const matchingFacilities = facilities.filter((facility) =>
      (!form.name || facility.name === form.name)
      && (!form.facilityType || facility.facilityType === form.facilityType)
    );

    return Array.from(new Set(matchingFacilities.map((facility) => facility.location))).sort((left, right) => left.localeCompare(right));
  }, [facilities, form.name, form.facilityType]);

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
        const facilityData = await getFacilities(token);
        setFacilities(facilityData);

        if (bookingId) {
          const booking = await getBooking(token, bookingId);
          const bookedFacility = facilityData.find((facility) => facility.id === booking.facilityId);
          setForm({
            name: bookedFacility?.name ?? '',
            facilityType: bookedFacility?.facilityType ?? '',
            location: bookedFacility?.location ?? '',
            startTime: toLocalDateTimeInputValue(booking.startTime),
            endTime: toLocalDateTimeInputValue(booking.endTime),
            purpose: booking.purpose,
            numberOfAttendees: String(booking.numberOfAttendees),
          });
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
    const shouldCheck = selectedFacility && form.startTime && form.endTime;

    if (!token || !shouldCheck) {
      setConflictResult(null);
      return;
    }

    let active = true;
    setCheckingConflicts(true);

    void checkBookingConflicts(
      token,
      selectedFacility.id,
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
  }, [token, selectedFacility, form.startTime, form.endTime, bookingId]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    setError(null);
  };

  const handleNameChange = (value: string) => {
    setForm((previous) => ({
      ...previous,
      name: value,
      facilityType: value && previous.facilityType && facilities.some((facility) =>
        facility.name === value
        && facility.facilityType === previous.facilityType
        && (!previous.location || facility.location === previous.location)
      )
        ? previous.facilityType
        : '',
      location: value && previous.location && facilities.some((facility) =>
        facility.name === value
        && facility.location === previous.location
        && (!previous.facilityType || facility.facilityType === previous.facilityType)
      )
        ? previous.location
        : '',
    }));
    setFieldErrors((previous) => ({ ...previous, name: undefined, facilityType: undefined, location: undefined }));
    setError(null);
  };

  const handleTypeChange = (value: string) => {
    setForm((previous) => ({
      ...previous,
      facilityType: value,
      name: value && previous.name && facilities.some((facility) =>
        facility.facilityType === value
        && facility.name === previous.name
        && (!previous.location || facility.location === previous.location)
      )
        ? previous.name
        : '',
      location: value && previous.location && facilities.some((facility) =>
        facility.facilityType === value
        && facility.location === previous.location
        && (!previous.name || facility.name === previous.name)
      )
        ? previous.location
        : '',
    }));
    setFieldErrors((previous) => ({ ...previous, name: undefined, facilityType: undefined, location: undefined }));
    setError(null);
  };

  const handleLocationChange = (value: string) => {
    setForm((previous) => ({
      ...previous,
      location: value,
      name: value && previous.name && facilities.some((facility) =>
        facility.location === value
        && facility.name === previous.name
        && (!previous.facilityType || facility.facilityType === previous.facilityType)
      )
        ? previous.name
        : '',
      facilityType: value && previous.facilityType && facilities.some((facility) =>
        facility.location === value
        && facility.facilityType === previous.facilityType
        && (!previous.name || facility.name === previous.name)
      )
        ? previous.facilityType
        : '',
    }));
    setFieldErrors((previous) => ({ ...previous, name: undefined, facilityType: undefined, location: undefined }));
    setError(null);
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.name) {
      nextErrors.name = 'Name is required';
    }
    if (!form.facilityType) {
      nextErrors.facilityType = 'Type is required';
    }
    if (!form.location) {
      nextErrors.location = 'Location is required';
    }
    if (form.name && form.facilityType && form.location && !selectedFacility) {
      nextErrors.location = 'Select a valid name, type, and location combination';
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
        facilityId: selectedFacility!.id,
        startTime: fromLocalDateTimeInputValue(form.startTime),
        endTime: fromLocalDateTimeInputValue(form.endTime),
        purpose: form.purpose.trim(),
        numberOfAttendees: Number(form.numberOfAttendees),
      };

      const savedBooking = isEditMode && bookingId
        ? await updateBooking(token, bookingId, payload)
        : await createBooking(token, payload);

      navigate(`/bookings/${savedBooking.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card><CardContent className="py-12 text-center text-sm text-slate-500">Loading booking form...</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {isEditMode ? 'Update Booking' : 'New Booking'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isEditMode
              ? 'Adjust the booking details and re-run conflict validation before resubmitting.'
              : 'Create a booking request using the admin-added facility name, type, and location details.'}
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
          <CardDescription>Choose the facility name, type, and location from admin-added records, then complete the rest of the request.</CardDescription>
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
                <Label htmlFor="name">Name</Label>
                <Select id="name" value={form.name} onChange={(event) => handleNameChange(event.target.value)}>
                  <option value="">Select a name</option>
                  {nameOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
                {fieldErrors.name && <p className="text-xs text-red-600">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="facilityType">Type</Label>
                <Select id="facilityType" value={form.facilityType} onChange={(event) => handleTypeChange(event.target.value)}>
                  <option value="">Select a type</option>
                  {typeOptions.map((facilityType) => (
                    <option key={facilityType} value={facilityType}>
                      {facilityType.replaceAll('_', ' ')}
                    </option>
                  ))}
                </Select>
                {fieldErrors.facilityType && <p className="text-xs text-red-600">{fieldErrors.facilityType}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select id="location" value={form.location} onChange={(event) => handleLocationChange(event.target.value)}>
                  <option value="">Select a location</option>
                  {locationOptions.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </Select>
                {fieldErrors.location && <p className="text-xs text-red-600">{fieldErrors.location}</p>}
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

            {selectedFacility && (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 text-sm text-cyan-950">
                <p className="font-semibold">Selected facility details</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <p><span className="font-medium">Name:</span> {selectedFacility.name}</p>
                  <p><span className="font-medium">Type:</span> {selectedFacility.facilityType.replaceAll('_', ' ')}</p>
                  <p><span className="font-medium">Location:</span> {selectedFacility.location}</p>
                  <p><span className="font-medium">Capacity:</span> {selectedFacility.capacity}</p>
                </div>
              </div>
            )}

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

              {!selectedFacility || !form.startTime || !form.endTime ? (
                <p className="text-sm text-slate-500">Select name, type, location, start time, and end time to run conflict checking.</p>
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
    </div>
  );
};
