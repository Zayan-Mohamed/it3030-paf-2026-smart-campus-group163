import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Map,
  PartyPopper,
  MapPin,
  Pencil,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { bookingStatusClasses, bookingStatusLabel, cancelBooking, deleteBooking, formatDateTime, getBooking } from '../lib/bookings';
import type { Booking } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import '../styles/Dashboard.css';

export const BookingDetailsPage = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadBooking = async () => {
    if (!token || !bookingId) {
      setError('Booking could not be loaded.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setBooking(await getBooking(token, bookingId));
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBooking();
  }, [token, bookingId]);

  const handleDelete = async () => {
    if (!token || !booking || !window.confirm('Delete this booking request?')) {
      return;
    }

    try {
      setSubmitting(true);
      await deleteBooking(token, booking.id);
      navigate('/bookings');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to delete booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!token || !booking || !window.confirm('Cancel this booking?')) {
      return;
    }

    try {
      setSubmitting(true);
      const updated = await cancelBooking(token, booking.id);
      setBooking(updated);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to cancel booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            {sidebarOpen && <h2 className="sidebar-title">Student Portal</h2>}
          </div>

          <nav className="sidebar-nav">
            <Link to="/dashboard/student" className="nav-item">
              <span className="nav-icon"><Home size={20} /></span>
              {sidebarOpen && <span>Dashboard</span>}
            </Link>
            <Link to="/bookings" className="nav-item active">
              <span className="nav-icon"><Calendar size={20} /></span>
              {sidebarOpen && <span>My Bookings</span>}
            </Link>
            <Link to="/incidents" className="nav-item">
              <span className="nav-icon"><AlertTriangle size={20} /></span>
              {sidebarOpen && <span>My Incidents</span>}
            </Link>
            <Link to="/facilities" className="nav-item">
              <span className="nav-icon"><Building2 size={20} /></span>
              {sidebarOpen && <span>Browse Facilities</span>}
            </Link>
            <Link to="/events" className="nav-item">
              <span className="nav-icon"><PartyPopper size={20} /></span>
              {sidebarOpen && <span>Campus Events</span>}
            </Link>
            <Link to="/map" className="nav-item">
              <span className="nav-icon"><Map size={20} /></span>
              {sidebarOpen && <span>Campus Map</span>}
            </Link>
          </nav>

          {sidebarOpen && (
            <div className="sidebar-footer">
              <div className="user-info">
                {user?.pictureUrl && <img src={user.pictureUrl} alt="Profile" className="user-avatar" />}
                <div className="user-details">
                  <p className="user-name">{user?.name}</p>
                  <p className="user-role">Student</p>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={20} /> Logout
              </button>
            </div>
          )}
        </aside>

        <main className="dashboard-main">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Card><CardContent className="py-12 text-center text-sm text-slate-500">Loading booking details...</CardContent></Card>
          </div>
        </main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="dashboard-layout">
        <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            {sidebarOpen && <h2 className="sidebar-title">Student Portal</h2>}
          </div>

          <nav className="sidebar-nav">
            <Link to="/dashboard/student" className="nav-item">
              <span className="nav-icon"><Home size={20} /></span>
              {sidebarOpen && <span>Dashboard</span>}
            </Link>
            <Link to="/bookings" className="nav-item active">
              <span className="nav-icon"><Calendar size={20} /></span>
              {sidebarOpen && <span>My Bookings</span>}
            </Link>
            <Link to="/incidents" className="nav-item">
              <span className="nav-icon"><AlertTriangle size={20} /></span>
              {sidebarOpen && <span>My Incidents</span>}
            </Link>
            <Link to="/facilities" className="nav-item">
              <span className="nav-icon"><Building2 size={20} /></span>
              {sidebarOpen && <span>Browse Facilities</span>}
            </Link>
            <Link to="/events" className="nav-item">
              <span className="nav-icon"><PartyPopper size={20} /></span>
              {sidebarOpen && <span>Campus Events</span>}
            </Link>
            <Link to="/map" className="nav-item">
              <span className="nav-icon"><Map size={20} /></span>
              {sidebarOpen && <span>Campus Map</span>}
            </Link>
          </nav>

          {sidebarOpen && (
            <div className="sidebar-footer">
              <div className="user-info">
                {user?.pictureUrl && <img src={user.pictureUrl} alt="Profile" className="user-avatar" />}
                <div className="user-details">
                  <p className="user-name">{user?.name}</p>
                  <p className="user-role">Student</p>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={20} /> Logout
              </button>
            </div>
          )}
        </aside>

        <main className="dashboard-main">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Card><CardContent className="py-12 text-center text-sm text-slate-500">{error ?? 'Booking not found.'}</CardContent></Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          {sidebarOpen && <h2 className="sidebar-title">Student Portal</h2>}
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard/student" className="nav-item">
            <span className="nav-icon"><Home size={20} /></span>
            {sidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link to="/bookings" className="nav-item active">
            <span className="nav-icon"><Calendar size={20} /></span>
            {sidebarOpen && <span>My Bookings</span>}
          </Link>
          <Link to="/incidents" className="nav-item">
            <span className="nav-icon"><AlertTriangle size={20} /></span>
            {sidebarOpen && <span>My Incidents</span>}
          </Link>
          <Link to="/facilities" className="nav-item">
            <span className="nav-icon"><Building2 size={20} /></span>
            {sidebarOpen && <span>Browse Facilities</span>}
          </Link>
          <Link to="/events" className="nav-item">
            <span className="nav-icon"><PartyPopper size={20} /></span>
            {sidebarOpen && <span>Campus Events</span>}
          </Link>
          <Link to="/map" className="nav-item">
            <span className="nav-icon"><Map size={20} /></span>
            {sidebarOpen && <span>Campus Map</span>}
          </Link>
        </nav>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="user-info">
              {user?.pictureUrl && <img src={user.pictureUrl} alt="Profile" className="user-avatar" />}
              <div className="user-details">
                <p className="user-name">{user?.name}</p>
                <p className="user-role">Student</p>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={20} /> Logout
            </button>
          </div>
        )}
      </aside>

      <main className="dashboard-main">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Link to="/bookings" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800">
                <ArrowLeft className="h-4 w-4" />
                Back to bookings
              </Link>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Booking Details</h1>
              <p className="mt-2 text-sm text-slate-600">Review the full booking request, status, and facility information.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {booking.canEdit && (
                <Link to={`/bookings/${booking.id}/edit`}>
                  <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
              )}

              {booking.canCancel && booking.status === 'APPROVED' && (
                <Button type="button" variant="outline" onClick={() => void handleCancel()} disabled={submitting}>
                  <XCircle className="mr-2 h-4 w-4" />
                  {submitting ? 'Cancelling...' : 'Cancel Booking'}
                </Button>
              )}

              {booking.canDelete && (
                <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={submitting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {submitting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Card className="border-slate-200/80 shadow-lg shadow-slate-900/5">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle>{booking.facilityName}</CardTitle>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${bookingStatusClasses(booking.status)}`}>
                    {bookingStatusLabel(booking.status)}
                  </span>
                </div>
                <CardDescription>{booking.facilityType.replaceAll('_', ' ')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <CalendarClock className="h-4 w-4" />
                      Schedule
                    </div>
                    <p className="text-sm text-slate-600">Start: {formatDateTime(booking.startTime)}</p>
                    <p className="text-sm text-slate-600">End: {formatDateTime(booking.endTime)}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Users className="h-4 w-4" />
                      Attendance
                    </div>
                    <p className="text-sm text-slate-600">Expected attendees: {booking.numberOfAttendees}</p>
                    <p className="text-sm text-slate-600">Capacity: {booking.facilityCapacity}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin className="h-4 w-4" />
                    Facility location
                  </div>
                  <p className="text-sm text-slate-600">{booking.facilityLocation}</p>
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Purpose</h2>
                  <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">{booking.purpose}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-lg shadow-slate-900/5">
              <CardHeader>
                <CardTitle className="text-lg">Workflow Status</CardTitle>
                <CardDescription>Track the booking review progress and any admin/staff notes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <p><span className="font-medium text-slate-700">Current status:</span> {bookingStatusLabel(booking.status)}</p>
                <p><span className="font-medium text-slate-700">Requested on:</span> {formatDateTime(booking.createdAt)}</p>
                <p><span className="font-medium text-slate-700">Last updated:</span> {formatDateTime(booking.updatedAt)}</p>

                {booking.reviewedByName && booking.reviewedAt && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p><span className="font-medium text-slate-700">Reviewed by:</span> {booking.reviewedByName}</p>
                    <p><span className="font-medium text-slate-700">Reviewed at:</span> {formatDateTime(booking.reviewedAt)}</p>
                  </div>
                )}

                {booking.staffComments ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 font-medium text-slate-700">Review note</p>
                    <p>{booking.staffComments}</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500">
                    No review note has been added yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
