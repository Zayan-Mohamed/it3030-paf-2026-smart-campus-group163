import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 text-sm font-bold text-white shadow-lg shadow-cyan-800/25">
            SC
          </span>
          <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
            Smart Campus Hub
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-semibold text-slate-700 transition hover:text-slate-900">
                Dashboard
              </Link>
              <Link to="/bookings" className="text-sm font-semibold text-slate-700 transition hover:text-slate-900">
                Bookings
              </Link>
              <Link to="/incidents/new" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800">
                Report Incident
              </Link>
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 sm:inline">{user.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
