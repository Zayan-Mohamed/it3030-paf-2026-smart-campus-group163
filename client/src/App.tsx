import { LandingPage } from './pages/LandingPage';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { OAuthCallback } from './pages/OAuthCallback';
import { NewIncident } from './pages/NewIncident';
import { IncidentTicketsPage } from './pages/IncidentTicketsPage';
import { IncidentQueuePage } from './pages/IncidentQueuePage';
import { AdminIncidentsPage } from './pages/AdminIncidentsPage';
import { BookingListPage } from './pages/BookingListPage';
import { BookingDetailsPage } from './pages/BookingDetailsPage';
import { BookingFormPage } from './pages/BookingFormPage';
import { BookingCalendarPage } from './pages/BookingCalendarPage';
import { ManageBookingsPage } from './pages/ManageBookingsPage';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardRedirect } from './components/DashboardRedirect';

import { Unauthorized } from './pages/Unauthorized';
import { CompleteProfile } from './pages/CompleteProfile';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { FacilityList } from './pages/FacilityList';
import { AddFacility } from './pages/AddFacility';
import { EditFacility } from './pages/EditFacility';
import { MainLayout } from './layouts/MainLayout';
import { UsersListPage } from './pages/UsersListPage';
import { StudentSettingsPage } from './pages/StudentSettingsPage';
import './App.css';

/**
 * Main Application Router with Role-Based Access Control
 * 
 * Route Structure:
 * - /dashboard: Smart redirect to role-appropriate dashboard
 * - /dashboard/student: STUDENT, ADMIN access
 * - /dashboard/admin: ADMIN only
 * - /dashboard/staff: STAFF, ADMIN access
 * 
 * Security Note: These are client-side checks for UX only.
 * Backend MUST enforce the same authorization rules.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            
            {/* Public Routes with Navbar and constrained width */}
            <Route path="/login" element={
              <div className="min-h-screen bg-slate-50"><Navbar /><main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"><Login /></main></div>
            } />
            <Route path="/signup" element={
              <div className="min-h-screen bg-slate-50"><Navbar /><main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"><Signup /></main></div>
            } />
            <Route path="/auth/callback" element={
              <div className="min-h-screen bg-slate-50"><Navbar /><main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"><OAuthCallback /></main></div>
            } />
            <Route path="/complete-profile" element={
              <div className="min-h-screen bg-slate-50"><Navbar /><main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"><CompleteProfile /></main></div>
            } />
            <Route path="/unauthorized" element={
              <div className="min-h-screen bg-slate-50"><Navbar /><main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"><Unauthorized /></main></div>
            } />
            
            {/* Authenticated routes wrapped in MainLayout */}
            <Route element={<MainLayout />}>
              {/* Smart redirect to role-appropriate dashboard */}
              <Route path="/dashboard" element={<DashboardRedirect />} />

              {/* Protected incident routes */}
              <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'ADMIN']} />}>
ticket-flow
                <Route path="/incidents/new" element={
                  <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                    <NewIncident />
                  </main>
                } />
                <Route path="/incidents" element={
                  <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                    <IncidentTicketsPage />
                  </main>
                } />
       <Route path="/incidents/new" element={<NewIncident />} />
                <Route path="/settings" element={<StudentSettingsPage />} />
 main
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'STAFF']} />}>
                <Route path="/bookings" element={<BookingListPage />} />
                <Route path="/bookings/new" element={<BookingFormPage />} />
                <Route path="/bookings/calendar" element={<BookingCalendarPage />} />
                <Route path="/bookings/:bookingId" element={<BookingDetailsPage />} />
                <Route path="/bookings/:bookingId/edit" element={<BookingFormPage />} />
              </Route>

              {/* Protected Role-Based Dashboards */}
              <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']} />}>
                <Route path="/dashboard/student" element={<StudentDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
                <Route path="/admin/facilities" element={<FacilityList />} />
                <Route path="/admin/facilities/new" element={<AddFacility />} />
                <Route path="/admin/facilities/:facilityId/edit" element={<EditFacility />} />
 ticket-flow
                <Route path="/admin/incidents" element={
                  <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                    <AdminIncidentsPage />
                  </main>
                } />

                <Route path="/admin/bookings" element={<ManageBookingsPage />} />
 main
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']} />}>
                <Route path="/dashboard/staff" element={<StaffDashboard />} />
 ticket-flow
                <Route path="/incidents/queue" element={
                  <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                    <IncidentQueuePage />
                  </main>
                } />

                <Route path="/users" element={<UsersListPage />} />
 main
              </Route>
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
