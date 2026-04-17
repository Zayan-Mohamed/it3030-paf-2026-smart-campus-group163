import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { getRolesFromToken, getStoredToken } from '../utils/jwtUtils';
import { API_BASE_URL, getGoogleAuthUrl, loginRequest } from '../lib/authService';

export const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  // Redirect authenticated users to their role-specific dashboard
  if (user) {
    const token = getStoredToken();
    if (token) {
      const roles = getRolesFromToken(token);
      
      // Redirect based on highest privilege role
      if (roles.includes('ADMIN')) {
        return <Navigate to="/dashboard/admin" replace />;
      } else if (roles.includes('STAFF')) {
        return <Navigate to="/dashboard/staff" replace />;
      } else if (roles.includes('STUDENT')) {
        return <Navigate to="/dashboard/student" replace />;
      }
    }
    // Fallback to generic dashboard if role detection fails
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = () => {
    window.location.href = getGoogleAuthUrl();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const data = await loginRequest(formData);

      if (data?.token) {
        login(data.token);
        
        // Redirect based on user role from JWT token
        const roles = getRolesFromToken(data.token);
        
        if (roles.includes('ADMIN')) {
          navigate('/dashboard/admin', { replace: true });
        } else if (roles.includes('STAFF')) {
          navigate('/dashboard/staff', { replace: true });
        } else if (roles.includes('STUDENT')) {
          navigate('/dashboard/student', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(data?.message || data?.error || 'Login failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message || `Unable to reach backend at ${API_BASE_URL}.`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Sign In</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          <button type="submit" className="btn-primary">Sign In</button>
        </form>
        <div className="divider">or</div>
        <button onClick={handleGoogleLogin} className="google-btn">
          Sign in with Google
        </button>
        <p className="mt-4">Don't have an account? <Link to="/signup">Sign up</Link></p>
      </div>
    </div>
  );
};
