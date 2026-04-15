import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Dashboard.css';

type AdminFacilitiesLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

const navItems = [
  { to: '/dashboard/admin', label: 'Dashboard', icon: Home },
  { to: '/admin/users', label: 'User Management', icon: Users },
  { to: '/admin/facilities', label: 'Facilities', icon: Building2 },
  { to: '/admin/incidents', label: 'All Incidents', icon: AlertTriangle },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'System Settings', icon: Settings },
  { to: '/admin/audit', label: 'Audit Logs', icon: FileText },
];

export const AdminFacilitiesLayout = ({
  title,
  subtitle,
  children,
}: AdminFacilitiesLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{title}</h1>
            <p className="dashboard-subtitle">{subtitle}</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};
