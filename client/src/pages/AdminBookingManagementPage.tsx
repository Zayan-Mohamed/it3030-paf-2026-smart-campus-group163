import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  FileText,
  Home,
  LogOut,
  RefreshCw,
  Settings,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  bookingStatusClasses,
  bookingStatusLabel,
  cancelBooking,
  formatDateTime,
  getApprovedCancellationDeadline,
  getBookings,
  getFacilities,
  isApprovalCancellationWindowOpen,
  reviewBooking,
} from '../lib/bookings';
import type { Booking, BookingStatus, Facility } from '../types';
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

export const AdminBookingManagementPage = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [facilityFilter, setFacilityFilter] = useState<number | ''>('');
  const [bookedDateFilter, setBookedDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});

  const getBookingDateKey = (dateTime: string) => dateTime.slice(0, 10);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadData = async () => {
    if (!token) {
      setError('You must be logged in to manage bookings.');
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

      const sortedBookings = [...bookingData].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );

      setBookings(sortedBookings);
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

  const bookedDateOptions = useMemo(() => {
    const dateSet = new Set(bookings.map((booking) => getBookingDateKey(booking.startTime)));
    return Array.from(dateSet).sort((left, right) => right.localeCompare(left));
  }, [bookings]);

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => !bookedDateFilter || getBookingDateKey(booking.startTime) === bookedDateFilter),
    [bookings, bookedDateFilter]
  );

  const summary = useMemo(() => ({
    total: visibleBookings.length,
    pending: visibleBookings.filter((booking) => booking.status === 'PENDING').length,
    approved: visibleBookings.filter((booking) => booking.status === 'APPROVED').length,
    reviewNotes: visibleBookings.filter((booking) => booking.staffComments).length,
  }), [visibleBookings]);

  const handleReview = async (bookingId: number, status: 'APPROVED' | 'REJECTED') => {
    if (!token) {
      return;
    }

    try {
      setActionId(bookingId);
      setError(null);
      await reviewBooking(token, bookingId, {
        status,
        staffComments: reviewNotes[bookingId]?.trim() || undefined,
      });
      setReviewNotes((current) => ({ ...current, [bookingId]: '' }));
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Failed to ${status.toLowerCase()} booking.`);
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!token || !window.confirm('Cancel this approved booking?')) {
      return;
    }

    try {
      setActionId(bookingId);
      setError(null);
      await cancelBooking(token, bookingId);
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to cancel booking.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          {sidebarOpen && <h2 className="sidebar-title">Admin Panel</h2>}
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard/admin" className="nav-item">
            <span className="nav-icon"><Home size={20} /></span>
            {sidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link to="/dashboard/admin/bookings" className="nav-item active">
            <span className="nav-icon"><Calendar size={20} /></span>
            {sidebarOpen && <span>Manage Bookings</span>}
          </Link>
          <Link to="/admin/users" className="nav-item">
            <span className="nav-icon"><Users size={20} /></span>
            {sidebarOpen && <span>User Management</span>}
          </Link>
          <Link to="/dashboard/admin/facilities" className="nav-item">
            <span className="nav-icon"><Building2 size={20} /></span>
            {sidebarOpen && <span>Facilities</span>}
          </Link>
          <Link to="/admin/incidents" className="nav-item">
            <span className="nav-icon"><AlertTriangle size={20} /></span>
            {sidebarOpen && <span>All Incidents</span>}
          </Link>
          <Link to="/admin/analytics" className="nav-item">
            <span className="nav-icon"><BarChart3 size={20} /></span>
            {sidebarOpen && <span>Analytics</span>}
          </Link>
          <Link to="/admin/settings" className="nav-item">
            <span className="nav-icon"><Settings size={20} /></span>
            {sidebarOpen && <span>System Settings</span>}
          </Link>
          <Link to="/admin/audit" className="nav-item">
            <span className="nav-icon"><FileText size={20} /></span>
            {sidebarOpen && <span>Audit Logs</span>}
          </Link>
        </nav>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="user-info">
              {user?.pictureUrl && (
                <img src={user.pictureUrl} alt="Profile" className="user-avatar" />
              )}
              <div className="user-details">
                <p className="user-name">{user?.name}</p>
                <p className="user-role">Administrator</p>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={20} /> Logout
            </button>
          </div>
        )}
      </aside>

      <main className="dashboard-main">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="dashboard-title">Manage Bookings</h1>
            <p className="dashboard-subtitle">
              Review pending requests, publish approval or rejection decisions, and cancel approved bookings within 2 hours.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#0891b220', color: '#0891b2' }}>
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-title">Total Bookings</p>
              <p className="stat-value">{summary.total}</p>
              <p className="stat-change">All visible bookings</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f59e0b20', color: '#f59e0b' }}>
              <Clipboard size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-title">Pending Review</p>
              <p className="stat-value">{summary.pending}</p>
              <p className="stat-change">Awaiting admin decision</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#10b98120', color: '#10b981' }}>
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-title">Approved</p>
              <p className="stat-value">{summary.approved}</p>
              <p className="stat-change">Live approved requests</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>
              <Shield size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-title">Review Notes</p>
              <p className="stat-value">{summary.reviewNotes}</p>
              <p className="stat-change">Bookings with admin comments</p>
            </div>
          </div>
        </div>

        <Card className="mb-6 border-slate-200/80 shadow-lg shadow-slate-900/5">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Filter by workflow status, facility, or booked date to focus on the requests you need to process.</CardDescription>
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

              <div className="space-y-2">
                <label htmlFor="bookedDateFilter" className="text-sm font-medium text-slate-700">Date</label>
                <Select
                  id="bookedDateFilter"
                  value={bookedDateFilter}
                  onChange={(event) => setBookedDateFilter(event.target.value)}
                >
                  <option value="">All booked dates</option>
                  {bookedDateOptions.map((dateValue) => (
                    <option key={dateValue} value={dateValue}>
                      {new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium' }).format(new Date(`${dateValue}T00:00:00`))}
                    </option>
                  ))}
                </Select>
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
            <CardContent className="py-12 text-center text-sm text-slate-500">Loading booking requests...</CardContent>
          </Card>
        ) : visibleBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">No bookings matched the current filters.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {visibleBookings.map((booking) => {
              const cancellationDeadline = getApprovedCancellationDeadline(booking.reviewedAt);
              const canStillCancel = isApprovalCancellationWindowOpen(booking.reviewedAt);

              return (
                <Card key={booking.id} className="border-slate-200/80 shadow-lg shadow-slate-900/5">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-4 xl:min-w-0 xl:flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-semibold text-slate-900">{booking.facilityName}</h2>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${bookingStatusClasses(booking.status)}`}>
                            {bookingStatusLabel(booking.status)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                            Student: {booking.userName}{booking.userEmail ? ` (${booking.userEmail})` : ''}
                          </span>
                        </div>

                        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <p><span className="font-medium text-slate-700">Location:</span> {booking.facilityLocation}</p>
                          <p><span className="font-medium text-slate-700">Attendees:</span> {booking.numberOfAttendees}</p>
                          <p><span className="font-medium text-slate-700">Start:</span> {formatDateTime(booking.startTime)}</p>
                          <p><span className="font-medium text-slate-700">End:</span> {formatDateTime(booking.endTime)}</p>
                          <p><span className="font-medium text-slate-700">Requested:</span> {formatDateTime(booking.createdAt)}</p>
                          {booking.reviewedAt && (
                            <p><span className="font-medium text-slate-700">Reviewed:</span> {formatDateTime(booking.reviewedAt)}</p>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                          <p className="font-medium text-slate-800">Purpose</p>
                          <p className="mt-2 leading-6">{booking.purpose}</p>
                        </div>

                        {booking.staffComments ? (
                          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
                            <p className="font-medium">Admin note</p>
                            <p className="mt-2 leading-6">{booking.staffComments}</p>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                            No admin note has been added yet.
                          </div>
                        )}

                        {booking.status === 'APPROVED' && cancellationDeadline && (
                          <div className={`rounded-xl border p-4 text-sm ${canStillCancel ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                            Approved bookings can be cancelled only within 2 hours of approval.
                            {' '}Deadline: {formatDateTime(cancellationDeadline)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 xl:w-[340px]">

                        {booking.status === 'PENDING' && (
                          <>
                            <div className="space-y-2">
                              <label htmlFor={`review-note-${booking.id}`} className="text-sm font-medium text-slate-700">
                                Admin note
                              </label>
                              <Textarea
                                id={`review-note-${booking.id}`}
                                value={reviewNotes[booking.id] ?? booking.staffComments ?? ''}
                                onChange={(event) => setReviewNotes((current) => ({ ...current, [booking.id]: event.target.value }))}
                                placeholder="Add approval or rejection reason for the student..."
                                className="min-h-[120px]"
                              />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <Button
                                type="button"
                                onClick={() => void handleReview(booking.id, 'APPROVED')}
                                disabled={actionId === booking.id}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {actionId === booking.id ? 'Saving...' : 'Approve'}
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => void handleReview(booking.id, 'REJECTED')}
                                disabled={actionId === booking.id}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                {actionId === booking.id ? 'Saving...' : 'Reject'}
                              </Button>
                            </div>
                          </>
                        )}

                        {booking.status === 'APPROVED' && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleCancel(booking.id)}
                            disabled={actionId === booking.id || !booking.canCancel}
                            className="w-full"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            {actionId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
