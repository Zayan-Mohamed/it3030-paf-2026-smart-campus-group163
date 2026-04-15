import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { getRolesFromToken, getStoredToken } from '../utils/jwtUtils';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export const CompleteProfile = () => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({ 
    studentRegistrationNumber: '', faculty: '', major: '', 
    employeeId: '', department: '', phoneNumber: '' 
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const isStudent = user.roles.includes('STUDENT');
  const isStaffOrAdmin = user.roles.includes('STAFF') || user.roles.includes('ADMIN');

  if ((isStudent && user.studentRegistrationNumber) || (isStaffOrAdmin && user.employeeId)) {
    const storedToken = getStoredToken();
    if (storedToken) {
      const roles = getRolesFromToken(storedToken);
      if (roles.includes('ADMIN')) return <Navigate to="/dashboard/admin" replace />;
      if (roles.includes('STAFF')) return <Navigate to="/dashboard/staff" replace />;
      if (roles.includes('STUDENT')) return <Navigate to="/dashboard/student" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${user.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        window.location.href = '/dashboard';
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.message || `Failed to update profile (HTTP ${response.status})`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown network error';
      setError(`Network error: ${message}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '500px' }}>
        <h2>Complete Your Profile</h2>
        <p className="mt-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
          Welcome, {user.name}! Since you signed in via Google, we need a few more details before you can access the application.
        </p>
        <form onSubmit={handleSubmit} className="auth-form mt-4">
          {error && <div className="error-message">{error}</div>}
          
          {isStudent && (
            <>
              <input type="text" name="studentRegistrationNumber" placeholder="Student Registration Number" value={formData.studentRegistrationNumber} onChange={handleChange} required />
              <input type="text" name="faculty" placeholder="Faculty" value={formData.faculty} onChange={handleChange} required />
              <input type="text" name="major" placeholder="Major" value={formData.major} onChange={handleChange} required />
            </>
          )}

          {isStaffOrAdmin && (
            <>
              <input type="text" name="employeeId" placeholder="Employee ID" value={formData.employeeId} onChange={handleChange} required />
              <input type="text" name="department" placeholder="Department" value={formData.department} onChange={handleChange} required />
            </>
          )}

          <input type="tel" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required />
          
          <button type="submit" className="btn-primary mt-4" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};
