import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { NotificationBell } from './NotificationBell';
import { LayoutDashboard, PlusCircle, LogOut, Code2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-sm transition-all">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side - Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(34,211,238,0.5)]">
            <Code2 size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-grey-900">
            SmartCampus<span className="text-cyan-400">Core</span>
          </span>
        </div>
        </Link>

        {/* Right Side - Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-semibold text-slate-700 transition hover:text-slate-900">
                Dashboard
              </Link>
            
              <Link to="/incidents/new" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800">
                Report Incident
              </Link>
              <Link to="/incidents" className="text-sm font-semibold text-blue-700 transition hover:text-blue-800">
                My Incidents
              </Link>
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 sm:inline">{user.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>

              {/* Quick Links */}
              <div className="hidden md:flex items-center gap-2 mr-2">
                <Link to="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80",
                      location.pathname === '/dashboard' && "bg-slate-100 text-slate-900 font-medium"
                    )}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              
                <Link to="/incidents/new">
                  <Button 
                    size="sm" 
                    className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20 transition-all"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Report Incident
                  </Button>
                </Link>
              </div>

              {/* Mobile Quick Link (Icon Only) */}
              <div className="flex md:hidden items-center gap-1">
                <Link to="/incidents/new">
                  <Button size="icon" variant="ghost" className="text-cyan-600 hover:bg-cyan-50">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Vertical Divider */}
              <div className="h-8 w-px bg-slate-200 hidden sm:block mx-1"></div>

              {/* Notifications */}
              <div className="flex items-center justify-center px-1">
                <NotificationBell />
              </div>

              {/* Vertical Divider */}
              <div className="h-8 w-px bg-slate-200 hidden sm:block mx-1"></div>

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-1">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-800 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-xs text-slate-500 font-medium leading-tight">
                    {user.roles?.[0] || 'User'}
                  </span>
                </div>
                
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-cyan-800 ring-2 ring-white">
                  {user.pictureUrl ? (
                    <img 
                      src={user.pictureUrl} 
                      alt={user.name} 
                      className="h-full w-full rounded-full object-cover" 
                    />
                  ) : (
                    <span className="text-xs font-bold">
                      {getInitials(user.name)}
                    </span>
                  )}
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"></div>
                </div>

                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 ml-1 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </div>
 main
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20 font-medium">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
