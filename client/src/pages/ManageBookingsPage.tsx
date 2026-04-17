import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock3,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminCancelBooking, bookingStatusClasses, bookingStatusLabel, formatDateTime, getBookings, reviewBooking } from '../lib/bookings';
import type { Booking, BookingStatus } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import '../styles/Dashboard.css';

const bookingStatuses: Array<{ value: BookingStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
];

const toLocalDateKey = (value: string) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateFilterLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium' }).format(date);
};

export const ManageBookingsPage = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [bookedDateFilter, setBookedDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  const loadBookings = async () => {
    if (!token) {
      setError('You must be logged in to manage bookings.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const bookingData = await getBookings(token, { status: statusFilter });
      setBookings(bookingData);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, [token, statusFilter]);

  const handleApprove = async (bookingId: number) => {
    if (!token || !window.confirm('Approve this booking?')) {
      return;
    }

    const isReviewingCurrentBooking = reviewingId === bookingId;
    const commentForBooking = isReviewingCurrentBooking ? reviewComment : '';

    try {
      setActionId(bookingId);
      await reviewBooking(token, bookingId, 'APPROVED', commentForBooking);
      setSuccessMessage('Booking approved successfully.');
      if (isReviewingCurrentBooking) {
        setReviewComment('');
        setReviewingId(null);
      }
      await loadBookings();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to approve booking.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (bookingId: number) => {
    if (!token || !window.confirm('Reject this booking?')) {
      return;
    }

    try {
      setActionId(bookingId);
      await reviewBooking(token, bookingId, 'REJECTED', reviewComment);
      setSuccessMessage('Booking rejected successfully.');
      setReviewComment('');
      setReviewingId(null);
      await loadBookings();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to reject booking.');
    } finally {
      setActionId(null);
    }
  };

  const isCancellationWindowOpen = (booking: Booking) => {
    if (!booking.reviewedAt) {
      return false;
    }

    const reviewedAt = new Date(booking.reviewedAt).getTime();
    return Number.isFinite(reviewedAt) && Date.now() <= reviewedAt + (2 * 60 * 60 * 1000);
  };

  const handleAdminCancel = async (booking: Booking) => {
    if (!token) {
      return;
    }

    if (!isCancellationWindowOpen(booking)) {
      setError('Approved bookings can only be cancelled within 2 hours of approval.');
      return;
    }

    if (cancelReason.trim().length < 5) {
      setError('Cancellation reason is required and must be at least 5 characters.');
      return;
    }

    if (!window.confirm('Cancel this approved booking?')) {
      return;
    }

    try {
      setActionId(booking.id);
      await adminCancelBooking(token, booking.id, cancelReason.trim());
      setSuccessMessage('Approved booking cancelled successfully.');
      setCancelReason('');
      setCancellingId(null);
      await loadBookings();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to cancel booking.');
    } finally {
      setActionId(null);
    }
  };

  const bookedDateOptions = [...new Set(bookings.map((booking) => toLocalDateKey(booking.startTime)))].sort((first, second) => first.localeCompare(second));
  const locationOptions = [...new Set(bookings.map((booking) => booking.facilityLocation))].sort((first, second) => first.localeCompare(second));

  const filteredBookings = bookings.filter((booking) => {
    const dateMatched = !bookedDateFilter || toLocalDateKey(booking.startTime) === bookedDateFilter;
    const locationMatched = !locationFilter || booking.facilityLocation === locationFilter;
    return dateMatched && locationMatched;
  }).sort((first, second) => {
    const firstUpdatedAt = new Date(first.updatedAt).getTime();
    const secondUpdatedAt = new Date(second.updatedAt).getTime();

    if (Number.isNaN(firstUpdatedAt) || Number.isNaN(secondUpdatedAt)) {
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    }

    return secondUpdatedAt - firstUpdatedAt;
  });

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Manage Bookings</h1>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadBookings()}
              disabled={loading}
              className="self-start md:self-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Status Filter */}
          <Card className="mb-6 border-slate-200/80 shadow-lg shadow-slate-900/5">
            <CardHeader>
              <CardTitle className="text-lg">Filter Bookings</CardTitle>
              <CardDescription>Filter bookings by status to review them systematically.</CardDescription>
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
                  <label htmlFor="bookedDateFilter" className="text-sm font-medium text-slate-700">Booked Date</label>
                  <Select id="bookedDateFilter" value={bookedDateFilter} onChange={(event) => setBookedDateFilter(event.target.value)}>
                    <option value="">All booked dates</option>
                    {bookedDateOptions.map((dateValue) => (
                      <option key={dateValue} value={dateValue}>
                        {dateFilterLabel(dateValue)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="locationFilter" className="text-sm font-medium text-slate-700">Location</label>
                  <Select id="locationFilter" value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
                    <option value="">All locations</option>
                    {locationOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle className="mt-0.5 h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Bookings List */}
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-slate-500">Loading bookings...</CardContent>
            </Card>
          ) : filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-lg font-medium text-slate-900">No bookings found</p>
                <p className="mt-2 text-sm text-slate-500">Try changing the status filter or check back later.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="border-slate-200/80 shadow-lg shadow-slate-900/5">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-semibold text-slate-900">{booking.facilityName}</h2>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${bookingStatusClasses(booking.status)}`}>
                              {bookingStatusLabel(booking.status)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            <span className="font-medium text-slate-700">Student:</span> {booking.userName}
                          </p>
                          <p className="text-sm text-slate-600">
                            <span className="font-medium text-slate-700">Email:</span> {booking.userEmail}
                          </p>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase text-slate-600">Type</p>
                          <p className="mt-1 text-sm text-slate-900">{booking.facilityType.replaceAll('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-slate-600">Location</p>
                          <p className="mt-1 text-sm text-slate-900">{booking.facilityLocation}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-slate-600">Start Time</p>
                          <p className="mt-1 text-sm text-slate-900">{formatDateTime(booking.startTime)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-slate-600">End Time</p>
                          <p className="mt-1 text-sm text-slate-900">{formatDateTime(booking.endTime)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-slate-600">Attendees</p>
                          <p className="mt-1 text-sm text-slate-900">{booking.numberOfAttendees} / {booking.facilityCapacity}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-slate-600">Requested On</p>
                          <p className="mt-1 text-sm text-slate-900">{formatDateTime(booking.createdAt)}</p>
                        </div>
                      </div>

                      {/* Purpose */}
                      <div>
                        <p className="mb-2 text-sm font-semibold text-slate-700">Purpose</p>
                        <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{booking.purpose}</p>
                      </div>

                      {/* Staff Comments */}
                      {booking.staffComments && (
                        <div>
                          <p className="mb-2 text-sm font-semibold text-slate-700">Review Note</p>
                          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{booking.staffComments}</p>
                        </div>
                      )}

                      {/* Review Info */}
                      {booking.reviewedByName && booking.reviewedAt && (
                        <div className="rounded-lg border border-slate-200 bg-blue-50 p-3 text-sm text-blue-700">
                          <p><span className="font-medium">Reviewed by:</span> {booking.reviewedByName}</p>
                          <p><span className="font-medium">Reviewed at:</span> {formatDateTime(booking.reviewedAt)}</p>
                        </div>
                      )}

                      {/* Review Actions - Only for PENDING bookings */}
                      {booking.status === 'PENDING' && (
                        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                          <div>
                            <label htmlFor={`comment-${booking.id}`} className="mb-2 block text-sm font-medium text-slate-700">
                              Review Comment (Optional)
                            </label>
                            <Textarea
                              id={`comment-${booking.id}`}
                              value={reviewingId === booking.id ? reviewComment : ''}
                              onChange={(e) => {
                                setReviewingId(booking.id);
                                setReviewComment(e.target.value);
                              }}
                              placeholder="Add a note for the student (optional)"
                              className="min-h-20"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => void handleApprove(booking.id)}
                              disabled={actionId === booking.id}
                              className="flex-1 md:flex-none"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              {actionId === booking.id ? 'Processing...' : 'Approve'}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => void handleReject(booking.id)}
                              disabled={actionId === booking.id}
                              className="flex-1 md:flex-none"
                            >
                              <X className="mr-2 h-4 w-4" />
                              {actionId === booking.id ? 'Processing...' : 'Reject'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {booking.status === 'APPROVED' && (
                        <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
                          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
                            <Clock3 className="h-4 w-4" />
                            Approved bookings can be cancelled within 2 hours of approval.
                          </div>

                          {isCancellationWindowOpen(booking) ? (
                            <>
                              <div>
                                <label htmlFor={`cancel-${booking.id}`} className="mb-2 block text-sm font-medium text-slate-700">
                                  Cancellation Reason
                                </label>
                                <Textarea
                                  id={`cancel-${booking.id}`}
                                  value={cancellingId === booking.id ? cancelReason : ''}
                                  onChange={(event) => {
                                    setCancellingId(booking.id);
                                    setCancelReason(event.target.value);
                                  }}
                                  placeholder="Enter a valid reason for cancellation"
                                  className="min-h-20"
                                />
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => void handleAdminCancel(booking)}
                                  disabled={actionId === booking.id}
                                  className="flex-1 md:flex-none"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  {actionId === booking.id ? 'Processing...' : 'Cancel Booking'}
                                </Button>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-rose-700">The 2-hour cancellation window has expired.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
