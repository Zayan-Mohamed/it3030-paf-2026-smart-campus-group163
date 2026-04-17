import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { getRolesFromToken, getStoredToken } from '../utils/jwtUtils';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export const Signup = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', studentRegistrationNumber: '', faculty: '', major: '', phoneNumber: '' });
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => null) as { token?: string; message?: string } | null;

      if (response.ok) {
        setOtpSent(true);
      } else {
        setError(data?.message || `Signup failed (HTTP ${response.status})`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown network error';
      setError(`Network error: ${message}. Check backend at ${API_BASE_URL}.`);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otpCode }),
      });

      const data = await response.json().catch(() => null) as { token?: string; message?: string } | null;

      if (response.ok && data?.token) {
        login(data.token);
        
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
        setError(data?.message || 'Invalid OTP code');
      }
    } catch (err) {
      console.error('OTP verification failed:', err instanceof Error ? err.message : 'Unknown error');
      setError('Network error during verification.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      alert('OTP resent to your email.');
    } catch (err) {
      console.error('Failed to resend OTP:', err instanceof Error ? err.message : 'Unknown error');
      setError('Failed to resend OTP. Please try again.');
      alert('Failed to resend OTP.');
      
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '600px' }}>
        <h2>{otpSent ? 'Verify Email' : 'Create an Account'}</h2>
        
        {otpSent ? (
          <form onSubmit={handleOtpVerify} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
              We've sent a 6-digit verification code to <strong>{formData.email}</strong>.
            </p>
            <input 
              type="text" 
              placeholder="Enter 6-digit OTP" 
              value={otpCode} 
              onChange={(e) => setOtpCode(e.target.value)} 
              required 
              maxLength={6} 
              style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.2rem' }}
            />
            <button type="submit" className="btn-primary mt-4" disabled={verifying}>
              {verifying ? 'Verifying...' : 'Verify Email'}
            </button>
            <button type="button" onClick={handleResendOtp} className="btn-outline mt-2" style={{ width: '100%' }}>
              Resend Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
              <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required minLength={6} />
              <input type="text" name="studentRegistrationNumber" placeholder="Reg Number" value={formData.studentRegistrationNumber} onChange={handleChange} required />
              <input type="text" name="faculty" placeholder="Faculty" value={formData.faculty} onChange={handleChange} required />
              <input type="text" name="major" placeholder="Major" value={formData.major} onChange={handleChange} required />
            </div>
            
            <input type="tel" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required style={{ width: '100%' }} />
            
            <button type="submit" className="btn-primary mt-2">Sign Up</button>
          </form>
        )}
        
        {!otpSent && <p className="mt-4">Already have an account? <Link to="/login">Sign in</Link></p>}
      </div>
    </div>
  );
};
