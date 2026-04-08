import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';
import FacilityListPage from '../pages/facilities/FacilityListPage';
import AddFacilityPage from '../pages/facilities/AddFacilityPage';
import EditFacilityPage from '../pages/EditFacilityPage';
import FacilityDetailsPage from '../pages/FacilityDetailsPage';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import OAuthCallback from '../pages/OAuthCallback';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* Main Application Routes */}
      <Route path="/" element={<Navigate to="/facilities" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Facilities Management Routes */}
      <Route
        path="/facilities"
        element={
          <ProtectedRoute>
            <FacilityListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilities/new"
        element={
          <ProtectedRoute>
            <AddFacilityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilities/:id"
        element={
          <ProtectedRoute>
            <FacilityDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilities/:id/edit"
        element={
          <ProtectedRoute>
            <EditFacilityPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route for 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
