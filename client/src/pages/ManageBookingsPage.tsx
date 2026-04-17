import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock3,
  RefreshCw,
  Check,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminCancelBooking, bookingStatusClasses, bookingStatusLabel, bookingStatusBackgroundColor, formatDateTime, formatDate, formatTime, getBookings, reviewBooking, getPublicHolidays, isPublicHoliday } from '../lib/bookings';
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());


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

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = formatDateKey(date);
    return bookings.filter((booking) => toLocalDateKey(booking.startTime) === dateStr);
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const prevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square border border-slate-200 bg-slate-50"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      const dateStr = formatDateKey(date);
      const dayBookings = getBookingsForDate(date);
      const holiday = isPublicHoliday(dateStr);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className={`aspect-square border-2 p-1.5 rounded-lg text-xs font-medium overflow-hidden flex flex-col ${
            holiday
              ? 'bg-gradient-to-br from-purple-300 to-purple-400 border-purple-600 shadow-lg'
              : isToday
                ? 'bg-blue-50 border-blue-400 shadow-md'
                : dayBookings.length > 0
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-white border-slate-200'
          }`}
        >
          <div className={`font-bold text-sm ${isToday ? 'text-blue-700' : holiday ? 'text-black' : 'text-slate-900'}`}>
            {day}
          </div>
          {holiday && (
            <div className="text-black text-xs font-bold whitespace-normal overflow-hidden mb-0.5 leading-tight">
              {holiday.name}
            </div>
          )}
          <div className="space-y-1 overflow-y-auto max-h-16 flex-1">
            {dayBookings.map((booking) => (
              <div
                key={booking.id}
                className={`px-1 py-0.5 rounded text-black text-xs font-bold ${bookingStatusBackgroundColor(booking.status)} shadow-sm leading-tight`}
                title={`${booking.facilityName} - ${booking.status}`}
              >
                <div className="truncate">{booking.status}</div>
                <div className="text-xs text-black font-semibold leading-tight">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

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
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant={showCalendar ? 'default' : 'outline'}
                onClick={() => setShowCalendar(!showCalendar)}
                className="self-start md:self-center"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {showCalendar ? 'List View' : 'Calendar View'}
              </Button>
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

          {/* Calendar View */}
          {showCalendar && (
            <Card className="mb-6 border-slate-200/80 shadow-lg shadow-slate-900/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Booking Calendar</CardTitle>
                    <CardDescription>View all bookings with color-coded statuses and public holidays.</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" size="sm" onClick={prevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-40 text-center font-semibold text-slate-900">
                      {calendarMonth.toLocaleDateString('en-LK', { month: 'long', year: 'numeric' })}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Legend */}
                  <div className="grid gap-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 p-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-purple-300 to-purple-400 border-2 border-purple-600 flex-shrink-0 shadow-sm"></div>
                      <div className="text-sm">
                        <p className="font-bold text-slate-900">Public Holiday</p>
                        <p className="text-xs text-slate-600">Holiday with full name displayed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded bg-amber-300 flex-shrink-0 shadow-sm"></div>
                      <div className="text-sm">
                        <p className="font-bold text-slate-900">PENDING</p>
                        <p className="text-xs text-slate-600">Awaiting approval</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded bg-emerald-300 flex-shrink-0 shadow-sm"></div>
                      <div className="text-sm">
                        <p className="font-bold text-slate-900">APPROVED</p>
                        <p className="text-xs text-slate-600">Booking approved</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded bg-red-300 flex-shrink-0 shadow-sm"></div>
                      <div className="text-sm">
                        <p className="font-bold text-slate-900">REJECTED</p>
                        <p className="text-xs text-slate-600">Booking rejected</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded bg-blue-300 flex-shrink-0 shadow-sm"></div>
                      <div className="text-sm">
                        <p className="font-bold text-slate-900">COMPLETED</p>
                        <p className="text-xs text-slate-600">Booking completed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded bg-gray-400 flex-shrink-0 shadow-sm"></div>
                      <div className="text-sm">
                        <p className="font-bold text-slate-900">CANCELLED</p>
                        <p className="text-xs text-slate-600">Booking cancelled</p>
                      </div>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-xs font-bold text-slate-700 py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Bookings List - Only show when calendar view is hidden */}
          {!showCalendar && (
            <>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
};
