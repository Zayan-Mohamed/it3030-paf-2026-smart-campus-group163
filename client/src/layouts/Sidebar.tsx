import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import {
  Home, Users, Building2, AlertTriangle, Calendar, BarChart3, Settings, FileText,
  LogOut, ChevronLeft, ChevronRight, Map, PartyPopper, Wrench, Sparkles
} from 'lucide-react';
import '../styles/Dashboard.css';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  if (!user) return null;

  const isAdmin = user.roles.includes('ADMIN');
  const isStaff = user.roles.includes('STAFF');
  const isStudent = user.roles.includes('STUDENT') || (!isAdmin && !isStaff);

  let panelTitle = 'User Portal';
  let roleTitle = 'User';
  if (isAdmin) {
    panelTitle = 'Admin Panel';
    roleTitle = 'Administrator';
  } else if (isStaff) {
    panelTitle = 'Staff Portal';
    roleTitle = 'Staff Member';
  } else if (isStudent) {
    panelTitle = 'Student Portal';
    roleTitle = 'Student';
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const checkActive = (path: string) => {
    if (path === '/dashboard/admin' || path === '/dashboard/staff' || path === '/dashboard/student' || path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''} shrink-0 z-10`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        {sidebarOpen && <h2 className="sidebar-title">{panelTitle}</h2>}
      </div>

      <nav className="sidebar-nav">
        {isAdmin && (
          <>
            <Link to="/dashboard/admin" className={cn("nav-item", checkActive('/dashboard/admin') && "active")}>
              <span className="nav-icon"><Home size={20} /></span>
              {sidebarOpen && <span>Dashboard</span>}
            </Link>
            <Link to="/ai-assistant" className={cn("nav-item", checkActive('/ai-assistant') && "active")}>
              <span className="nav-icon"><Sparkles size={20} /></span>
              {sidebarOpen && <span>AI Assistant</span>}
            </Link>
            <Link to="/admin/users" className={cn("nav-item", checkActive('/admin/users') && "active")}>
              <span className="nav-icon"><Users size={20} /></span>
              {sidebarOpen && <span>User Management</span>}
            </Link>
            <Link to="/admin/facilities" className={cn("nav-item", checkActive('/admin/facilities') && "active")}>
              <span className="nav-icon"><Building2 size={20} /></span>
              {sidebarOpen && <span>Facilities</span>}
            </Link>
            <Link to="/admin/incidents" className={cn("nav-item", checkActive('/admin/incidents') && "active")}>
              <span className="nav-icon"><AlertTriangle size={20} /></span>
              {sidebarOpen && <span>All Incidents</span>}
            </Link>
            <Link to="/admin/bookings" className={cn("nav-item", checkActive('/admin/bookings') && "active")}>
              <span className="nav-icon"><Calendar size={20} /></span>
              {sidebarOpen && <span>Manage Bookings</span>}
            </Link>
            <Link to="/admin/analytics" className={cn("nav-item", checkActive('/admin/analytics') && "active")}>
              <span className="nav-icon"><BarChart3 size={20} /></span>
              {sidebarOpen && <span>Analytics</span>}
            </Link>
            <Link to="/admin/settings" className={cn("nav-item", checkActive('/admin/settings') && "active")}>
              <span className="nav-icon"><Settings size={20} /></span>
              {sidebarOpen && <span>System Settings</span>}
            </Link>
            <Link to="/admin/audit" className={cn("nav-item", checkActive('/admin/audit') && "active")}>
              <span className="nav-icon"><FileText size={20} /></span>
              {sidebarOpen && <span>Audit Logs</span>}
            </Link>
          </>
        )}

        {isStaff && (
          <>
            <Link to="/dashboard/staff" className={cn("nav-item", checkActive('/dashboard/staff') && "active")}>
              <span className="nav-icon"><Home size={20} /></span>
              {sidebarOpen && <span>Dashboard</span>}
            </Link>
            <Link to="/ai-assistant" className={cn("nav-item", checkActive('/ai-assistant') && "active")}>
              <span className="nav-icon"><Sparkles size={20} /></span>
              {sidebarOpen && <span>AI Assistant</span>}
            </Link>
            <Link to="/incidents/queue" className={cn("nav-item", checkActive('/incidents/queue') && "active")}>
              <span className="nav-icon"><AlertTriangle size={20} /></span>
              {sidebarOpen && <span>Incident Queue</span>}
            </Link>
            <Link to="/maintenance" className={cn("nav-item", checkActive('/maintenance') && "active")}>
              <span className="nav-icon"><Wrench size={20} /></span>
              {sidebarOpen && <span>Maintenance</span>}
            </Link>
            <Link to="/schedule" className={cn("nav-item", checkActive('/schedule') && "active")}>
              <span className="nav-icon"><Calendar size={20} /></span>
              {sidebarOpen && <span>My Schedule</span>}
            </Link>
            <Link to="/reports" className={cn("nav-item", checkActive('/reports') && "active")}>
              <span className="nav-icon"><BarChart3 size={20} /></span>
              {sidebarOpen && <span>Reports</span>}
            </Link>
            <Link to="/dashboard/staff/facilities" className={cn("nav-item", checkActive('/dashboard/staff/facilities') && "active")}>
              <span className="nav-icon"><Building2 size={20} /></span>
              {sidebarOpen && <span>Facilities</span>}
            </Link>
          </>
        )}

        {isStudent && (
          <>
            <Link to="/dashboard/student" className={cn("nav-item", checkActive('/dashboard/student') && "active")}>
              <span className="nav-icon"><Home size={20} /></span>
              {sidebarOpen && <span>Dashboard</span>}
            </Link>
            <Link to="/ai-assistant" className={cn("nav-item", checkActive('/ai-assistant') && "active")}>
              <span className="nav-icon"><Sparkles size={20} /></span>
              {sidebarOpen && <span>AI Assistant</span>}
            </Link>
            <Link to="/bookings" className={cn("nav-item", checkActive('/bookings') && "active")}>
              <span className="nav-icon"><Calendar size={20} /></span>
              {sidebarOpen && <span>My Bookings</span>}
            </Link>
            <Link to="/incidents" className={cn("nav-item", checkActive('/incidents') && "active")}>
              <span className="nav-icon"><AlertTriangle size={20} /></span>
              {sidebarOpen && <span>My Incidents</span>}
            </Link>
            <Link to="/dashboard/student/facilities" className={cn("nav-item", checkActive('/dashboard/student/facilities') && "active")}>
              <span className="nav-icon"><Building2 size={20} /></span>
              {sidebarOpen && <span>Browse Facilities</span>}
            </Link>
            <Link to="/events" className={cn("nav-item", checkActive('/events') && "active")}>
              <span className="nav-icon"><PartyPopper size={20} /></span>
              {sidebarOpen && <span>Campus Events</span>}
            </Link>
            <Link to="/map" className={cn("nav-item", checkActive('/map') && "active")}>
              <span className="nav-icon"><Map size={20} /></span>
              {sidebarOpen && <span>Campus Map</span>}
            </Link>
          </>
        )}
        
      </nav>

      <div className={cn("mt-auto", sidebarOpen ? "sidebar-footer" : "flex flex-col items-center gap-4 py-6 border-t border-slate-200")}>
        <div className={cn(sidebarOpen ? "user-info" : "flex items-center justify-center")}>
          {user?.pictureUrl ? (
            <img 
              src={user.pictureUrl} 
              alt="Profile" 
              className={cn("rounded-full", sidebarOpen ? "user-avatar" : "w-10 h-10 ring-2 ring-white shadow-sm")} 
              style={{ cursor: 'pointer' }} 
              onClick={() => navigate('/settings')} 
              title="Account Settings" 
            />
          ) : (
            <div 
              className={cn("flex items-center justify-center bg-cyan-100 text-cyan-800 font-bold rounded-full shrink-0 ring-2 ring-white shadow-sm", sidebarOpen ? "w-10 h-10" : "w-10 h-10")}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/settings')} 
              title="Account Settings"
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          {sidebarOpen && (
            <div className="user-details flex-1 min-w-0" style={{ cursor: 'pointer' }} onClick={() => navigate('/settings')} title="Account Settings">
              <p className="user-name truncate text-sm font-semibold">{user?.name}</p>
              <p className="user-role truncate text-xs text-slate-500">{roleTitle}</p>
            </div>
          )}
        </div>
        
        {sidebarOpen ? (
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <LogOut size={20} /> <span>Logout</span>
          </button>
        ) : (
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" 
            title="Logout"
          >
            <LogOut size={20} />
            <span className="sr-only">Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
};
