import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasRequiredRole } from '../utils/jwtUtils';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user needs to complete profile based on their role
  if (user && location.pathname !== '/complete-profile') {
    const isStudent = user.roles.includes('STUDENT');
    const isStaffOrAdmin = user.roles.includes('STAFF') || user.roles.includes('ADMIN');

    if (isStudent && !user.studentRegistrationNumber) {
      return <Navigate to="/complete-profile" replace />;
    }
    if (isStaffOrAdmin && !user.employeeId) {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  if (!hasRequiredRole(token, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
