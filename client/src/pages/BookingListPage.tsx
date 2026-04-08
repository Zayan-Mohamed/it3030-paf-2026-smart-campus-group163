import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarDays, Eye, Pencil, Plus, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { bookingStatusClasses, bookingStatusLabel, cancelBooking, deleteBooking, formatDateTime, getBookings, getFacilities } from '../lib/bookings';
import type { Booking, BookingStatus, Facility } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select } from '../components/ui/select';

const bookingStatuses: Array<{ value: BookingStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
];

export const BookingListPage = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [facilityFilter, setFacilityFilter] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!token) {
      setError('You must be logged in to view bookings.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [bookingData, facilityData] = await Promise.all([
        getBookings(token, { status: statusFilter, facilityId: facilityFilter }),
        getFacilities(token),
      ]);
      setBookings(bookingData);
      setFacilities(facilityData);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token, statusFilter, facilityFilter]);

  const handleDelete = async (bookingId: number) => {
    if (!token || !window.confirm('Delete this booking request?')) {
      return;
    }

    try {
      setActionId(bookingId);
      await deleteBooking(token, bookingId);
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to delete booking.');
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!token || !window.confirm('Cancel this booking?')) {
      return;
    }

    try {
      setActionId(bookingId);
      await cancelBooking(token, bookingId);
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to cancel booking.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Booking List</h1>
          <p className="mt-2 text-sm text-slate-600">View, track, update, cancel, and delete your booking requests.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/bookings/calendar">
            <Button variant="outline">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </Button>
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
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Use status and facility filters to narrow your booking list.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="statusFilter" className="text-sm font-medium text-slate-700">Status</label>
              <Select id="statusFilter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as BookingStatus | '')}>
                {bookingStatuses.map((status) => (
                  <option key={status.label} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="facilityFilter" className="text-sm font-medium text-slate-700">Facility</label>
              <Select
                id="facilityFilter"
                value={facilityFilter === '' ? '' : String(facilityFilter)}
                onChange={(event) => setFacilityFilter(event.target.value ? Number(event.target.value) : '')}
              >
                <option value="">All facilities</option>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={() => void loadData()} disabled={loading} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
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

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">Loading bookings...</CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium text-slate-900">No bookings found</p>
            <p className="mt-2 text-sm text-slate-500">Create your first booking request to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="border-slate-200/80 shadow-lg shadow-slate-900/5">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-slate-900">{booking.facilityName}</h2>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${bookingStatusClasses(booking.status)}`}>
                        {bookingStatusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <p><span className="font-medium text-slate-700">Location:</span> {booking.facilityLocation}</p>
                      <p><span className="font-medium text-slate-700">Attendees:</span> {booking.numberOfAttendees}</p>
                      <p><span className="font-medium text-slate-700">Start:</span> {formatDateTime(booking.startTime)}</p>
                      <p><span className="font-medium text-slate-700">End:</span> {formatDateTime(booking.endTime)}</p>
                    </div>

                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Purpose:</span> {booking.purpose}
                    </p>

                    {booking.staffComments && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <span className="font-medium">Review note:</span> {booking.staffComments}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-72 lg:justify-end">
                    <Link to={`/bookings/${booking.id}`}>
                      <Button variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                    </Link>

                    {booking.canEdit && (
                      <Link to={`/bookings/${booking.id}/edit`}>
                        <Button variant="outline">
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                    )}

                    {booking.canCancel && booking.status === 'APPROVED' && (
                      <Button type="button" variant="outline" onClick={() => void handleCancel(booking.id)} disabled={actionId === booking.id}>
                        <XCircle className="mr-2 h-4 w-4" />
                        {actionId === booking.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}

                    {booking.canDelete && (
                      <Button type="button" variant="destructive" onClick={() => void handleDelete(booking.id)} disabled={actionId === booking.id}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {actionId === booking.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
