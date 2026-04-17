import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatTime, getBookingCalendar, getFacilities } from '../lib/bookings';
import type { Booking, Facility } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select } from '../components/ui/select';
import '../styles/Dashboard.css';

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export const BookingCalendarPage = () => {
  const { token } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<number | ''>('');
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCalendar = async () => {
    if (!token) {
      setError('You must be logged in to view the booking calendar.');
      setLoading(false);
      return;
    }

    const start = startOfWeek(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    try {
      setLoading(true);
      setError(null);
      const [facilityData, bookingData] = await Promise.all([
        getFacilities(token),
        getBookingCalendar(token, selectedFacility, toIso(start), toIso(end)),
      ]);
      setFacilities(facilityData);
      setBookings(bookingData);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load booking calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalendar();
  }, [token, selectedFacility, weekStart]);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  return (
    <div className="dashboard-layout">

      <main className="dashboard-main">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Booking Calendar</h1>
              <p className="mt-2 text-sm text-slate-600">Check weekly availability and review your existing bookings by date.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/bookings">
                <Button variant="outline">Booking List</Button>
              </Link>
              <Link to="/bookings/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Booking
                </Button>
              </Link>
            </div>
          </div>

          <Card className="mb-6 border-slate-200/80 shadow-lg shadow-slate-900/5">
            <CardHeader>
              <CardTitle className="text-lg">Calendar Controls</CardTitle>
              <CardDescription>Switch weeks and filter the calendar for one facility when needed.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="space-y-2 md:w-80">
                  <label htmlFor="facilityCalendar" className="text-sm font-medium text-slate-700">Facility</label>
                  <Select
                    id="facilityCalendar"
                    value={selectedFacility === '' ? '' : String(selectedFacility)}
                    onChange={(event) => setSelectedFacility(event.target.value ? Number(event.target.value) : '')}
                  >
                    <option value="">All my facilities</option>
                    {facilities.map((facility) => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setWeekStart((previous) => {
                    const next = new Date(previous);
                    next.setDate(previous.getDate() - 7);
                    return startOfWeek(next);
                  })}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous Week
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setWeekStart((previous) => {
                    const next = new Date(previous);
                    next.setDate(previous.getDate() + 7);
                    return startOfWeek(next);
                  })}>
                    Next Week
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {loading ? (
              <Card className="md:col-span-2 xl:col-span-4">
                <CardContent className="py-12 text-center text-sm text-slate-500">Loading calendar...</CardContent>
              </Card>
            ) : (
              days.map((day) => {
                const dayBookings = bookings.filter((booking) => {
                  const bookingDate = new Date(booking.startTime);
                  return bookingDate.toDateString() === day.toDateString();
                });

                return (
                  <Card key={day.toISOString()} className="border-slate-200/80 shadow-lg shadow-slate-900/5">
                    <CardHeader>
                      <CardTitle className="text-lg">{formatDate(day.toISOString())}</CardTitle>
                      <CardDescription>{dayBookings.length} booking{dayBookings.length === 1 ? '' : 's'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dayBookings.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                          No bookings scheduled.
                        </div>
                      ) : (
                        dayBookings.map((booking) => (
                          <Link key={booking.id} to={`/bookings/${booking.id}`} className="block rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-cyan-300 hover:bg-cyan-50/50">
                            <p className="font-medium text-slate-900">{booking.facilityName}</p>
                            <p className="mt-1 text-xs text-slate-600">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                            <p className="mt-1 text-xs text-slate-500">{booking.status}</p>
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
