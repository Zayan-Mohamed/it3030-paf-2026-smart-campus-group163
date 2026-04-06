import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const token = searchParams.get('token');
  const errorParam = searchParams.get('error');
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    if (token) {
      login(token);
      navigate('/dashboard', { replace: true });
    } else {
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }
  }, [token, login, navigate]);

  if (!token) {
    return (
      <div className="callback-container error">
        <h2>Authentication Error</h2>
        <p>{errorParam || 'Failed to authenticate'}</p>
        <p>Redirecting back to login...</p>
      </div>
    );
  }

  return (
    <div className="callback-container">
      <div className="loading-spinner"></div>
      <p>Completing authentication...</p>
    </div>
  );
};
