import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  AlertCircle,
  Calendar, 
  AlertTriangle, 
  Building2, 
  PartyPopper, 
  Home, 
  Map, 
  User, 
  LogOut, 
  FileText, 
  Lightbulb,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { bookingStatusClasses, bookingStatusLabel, formatDateTime, getBookings } from '../lib/bookings';
import type { Booking } from '../types';
import '../styles/Dashboard.css';

export const StudentDashboard = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const loadBookings = async () => {
      if (!token) {
        setBookingError('You must be logged in to view your bookings.');
        setLoadingBookings(false);
        return;
      }

      try {
        setLoadingBookings(true);
        setBookingError(null);
        const bookingData = await getBookings(token);
        const sortedBookings = [...bookingData].sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
        setRecentBookings(sortedBookings.slice(0, 5));
      } catch (fetchError) {
        setBookingError(fetchError instanceof Error ? fetchError.message : 'Failed to load recent bookings.');
      } finally {
        setLoadingBookings(false);
      }
    };

    void loadBookings();
  }, [token]);

  const bookingStats = useMemo(() => ({
    active: recentBookings.filter((booking) => booking.status === 'PENDING' || booking.status === 'APPROVED').length,
    pending: recentBookings.filter((booking) => booking.status === 'PENDING').length,
  }), [recentBookings]);

  const stats = [
    { title: 'Active Bookings', value: String(bookingStats.active), icon: Calendar, color: '#0891b2', change: 'Pending or approved bookings' },
    { title: 'Pending Reviews', value: String(bookingStats.pending), icon: Calendar, color: '#f59e0b', change: 'Waiting for admin decision' },
    { title: 'Available Facilities', value: '0', icon: Building2, color: '#10b981', change: 'Loading...' },
    { title: 'Campus Events', value: '0', icon: PartyPopper, color: '#8b5cf6', change: 'Loading...' },
  ];

  const quickActions = [
    { title: 'Book Facility', icon: Building2, desc: 'Reserve study rooms, labs, and more', color: '#0891b2', link: '/bookings/new' },
    { title: 'Report Issue', icon: FileText, desc: 'Submit maintenance requests', color: '#f59e0b' },
    { title: 'Campus Map', icon: Map, desc: 'Navigate campus buildings', color: '#10b981' },
    { title: 'My Profile', icon: User, desc: 'Update your information', color: '#8b5cf6' },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          {sidebarOpen && <h2 className="sidebar-title">Student Portal</h2>}
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard/student" className="nav-item active">
            <span className="nav-icon"><Home size={20} /></span>
            {sidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link to="/bookings" className="nav-item">
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
              {user?.pictureUrl && (
                <img src={user.pictureUrl} alt="Profile" className="user-avatar" />
              )}
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

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="dashboard-subtitle">Here's what's happening with your campus activities</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                  <IconComponent size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-title">{stat.title}</p>
                  <p className="stat-value">{stat.value}</p>
                  <p className="stat-change">{stat.change}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <section className="section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid-modern">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link ?? '/dashboard/student'}
                  className="action-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="action-icon" style={{ background: `${action.color}20`, color: action.color }}>
                    <IconComponent size={24} />
                  </div>
                  <h3 className="action-title">{action.title}</h3>
                  <p className="action-desc">{action.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent Bookings */}
        <section className="section">
          <h2 className="section-title">Recent Bookings</h2>
          {bookingError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} style={{ marginTop: '2px' }} />
              <span>{bookingError}</span>
            </div>
          )}
          <div className="bookings-list">
            {loadingBookings ? (
              <div className="booking-item" style={{ 
                justifyContent: 'center', 
                textAlign: 'center', 
                padding: '3rem 2rem',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <Building2 size={48} style={{ color: '#94a3b8', margin: '0 auto' }} />
                <div>
                  <h4 className="booking-facility" style={{ color: '#64748b' }}>Loading Bookings</h4>
                  <p className="booking-date">Checking your latest booking statuses</p>
                </div>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="booking-item" style={{ 
                justifyContent: 'center', 
                textAlign: 'center', 
                padding: '3rem 2rem',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <Building2 size={48} style={{ color: '#94a3b8', margin: '0 auto' }} />
                <div>
                  <h4 className="booking-facility" style={{ color: '#64748b' }}>No Bookings Yet</h4>
                  <p className="booking-date">Your facility bookings will appear here</p>
                </div>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <Link key={booking.id} to={`/bookings/${booking.id}`} className="booking-item" style={{ textDecoration: 'none' }}>
                  <div className="booking-icon">
                    <Calendar size={20} />
                  </div>
                  <div className="booking-details">
                    <h4 className="booking-facility">{booking.facilityName}</h4>
                    <p className="booking-date">{formatDateTime(booking.startTime)}</p>
                    {booking.staffComments && (
                      <p className="booking-date" style={{ marginTop: '0.35rem' }}>
                        Note: {booking.staffComments}
                      </p>
                    )}
                  </div>
                  <div className={`booking-status ${bookingStatusClasses(booking.status)}`}>
                    {bookingStatusLabel(booking.status)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Tips Section */}
        <section className="section">
          <div className="tips-card">
            <div className="tips-icon"><Lightbulb size={24} /></div>
            <div className="tips-content">
              <h3 className="tips-title">Pro Tip</h3>
              <p className="tips-text">
                Book popular facilities early! Study rooms fill up quickly during exam season.
                Set up notifications to get reminded about your bookings.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
