import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
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
import '../styles/Dashboard.css';

export const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // TODO: Fetch real stats from API
  const stats = [
    { title: 'Active Bookings', value: '0', icon: Calendar, color: '#0891b2', change: 'Loading...' },
    { title: 'Open Incidents', value: '0', icon: AlertTriangle, color: '#f59e0b', change: 'Loading...' },
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
          <div className="bookings-list">
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
