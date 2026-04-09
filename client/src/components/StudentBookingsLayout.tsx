import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  PartyPopper,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

type NavItemKey = 'dashboard' | 'bookings' | 'newBooking' | 'calendar';

type StudentBookingsLayoutProps = {
  activeItem: NavItemKey;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
};

const navItems: Array<{ key: NavItemKey; label: string; to: string; icon: typeof Home }> = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard/student', icon: Home },
  { key: 'bookings', label: 'My Bookings', to: '/bookings', icon: Calendar },
  { key: 'newBooking', label: 'New Booking', to: '/bookings/new', icon: Building2 },
  { key: 'calendar', label: 'Booking Calendar', to: '/bookings/calendar', icon: PartyPopper },
];

export const StudentBookingsLayout = ({ activeItem, title, subtitle, actions, children }: StudentBookingsLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          {sidebarOpen && <h2 className="sidebar-title">Student Portal</h2>}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const IconComponent = item.icon;

            return (
              <Link key={item.key} to={item.to} className={`nav-item ${activeItem === item.key ? 'active' : ''}`}>
                <span className="nav-icon">
                  <IconComponent size={20} />
                </span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
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
            <button type="button" onClick={handleLogout} className="logout-btn">
              <LogOut size={20} /> Logout
            </button>
          </div>
        )}
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Student Booking Center</p>
            <h1 className="dashboard-title">{title}</h1>
            <p className="dashboard-subtitle">{subtitle}</p>
          </div>

          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>

        {children}
      </main>
    </div>
  );
};
