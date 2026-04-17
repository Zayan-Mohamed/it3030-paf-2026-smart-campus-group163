import {
  Users,
  AlertTriangle,
  Rocket,
  Calendar,
  BarChart3,
  Settings,
  User,
  CheckCircle,
  Shield,
  Clipboard,
} from 'lucide-react';
import '../styles/Dashboard.css';

export const AdminDashboard = () => {
  // TODO: Fetch real stats from API
  const stats = [
    { title: 'Total Users', value: '0', icon: Users, color: '#0891b2', change: 'Loading...' },
    { title: 'Active Incidents', value: '0', icon: AlertTriangle, color: '#f59e0b', change: 'Loading...' },
    { title: 'System Uptime', value: '-', icon: Rocket, color: '#10b981', change: 'Loading...' },
    { title: 'Total Bookings', value: '0', icon: Calendar, color: '#8b5cf6', change: 'Loading...' },
  ];

  const quickActions = [
    { title: 'User Management', icon: Users, desc: 'Manage users and roles', color: '#0891b2' },
    { title: 'System Settings', icon: Settings, desc: 'Configure system parameters', color: '#8b5cf6' },
    { title: 'View Reports', icon: BarChart3, desc: 'Analytics and insights', color: '#10b981' },
    { title: 'Audit Logs', icon: Clipboard, desc: 'Security and activity logs', color: '#f59e0b' },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <p className="dashboard-subtitle">Manage system operations, users, and monitor performance</p>
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
                <div key={index} className="action-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="action-icon" style={{ background: `${action.color}20`, color: action.color }}>
                    <IconComponent size={24} />
                  </div>
                  <h3 className="action-title">{action.title}</h3>
                  <p className="action-desc">{action.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {/* Recent Users */}
          <section className="section">
            <h2 className="section-title">Recent Users</h2>
            <div className="bookings-list">
              <div className="booking-item" style={{ 
                justifyContent: 'center', 
                textAlign: 'center', 
                padding: '3rem 2rem',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <User size={48} style={{ color: '#94a3b8', margin: '0 auto' }} />
                <div>
                  <h4 className="booking-facility" style={{ color: '#64748b' }}>No Users Yet</h4>
                  <p className="booking-date">User registrations will appear here</p>
                </div>
              </div>
            </div>
          </section>

          {/* System Metrics */}
          <section className="section">
            <h2 className="section-title">System Health</h2>
            <div className="bookings-list">
              <div className="booking-item" style={{ 
                justifyContent: 'center', 
                textAlign: 'center', 
                padding: '3rem 2rem',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <CheckCircle size={48} style={{ color: '#94a3b8', margin: '0 auto' }} />
                <div>
                  <h4 className="booking-facility" style={{ color: '#64748b' }}>No Metrics Available</h4>
                  <p className="booking-date">System health metrics will appear here</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Admin Tips */}
        <section className="section">
          <div className="tips-card">
            <div className="tips-icon"><Shield size={24} /></div>
            <div className="tips-content">
              <h3 className="tips-title">Security Reminder</h3>
              <p className="tips-text">
                Regularly review audit logs for suspicious activities. Enable two-factor authentication for all admin accounts.
                Schedule weekly database backups and test disaster recovery procedures monthly.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
