import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import Profile from './pages/dashboard/Profile.jsx';
import Browse from './pages/dashboard/Browse.jsx';
import ArtisanPublicProfile from './pages/artisan/ArtisanPublicProfile.jsx';
import Bookings from './pages/bookings/Bookings.jsx';
import BookingRequest from './pages/bookings/BookingRequest.jsx';
import BookingDetail from './pages/bookings/BookingDetail.jsx';
import Messages from './pages/messages/Messages.jsx';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/artisan/:id" element={<ArtisanPublicProfile />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/:id" element={<BookingDetail />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/earnings" element={<Placeholder title="Earnings" />} />
            <Route path="/settings" element={<Placeholder title="Settings" />} />
            <Route path="/reviews" element={<Placeholder title="My Reviews" />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/browse" element={<Browse />} />
            <Route path="/bookings/new" element={<BookingRequest />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
      <h1 style={{ fontSize: 'var(--text-5xl)', fontWeight: 'var(--font-extrabold)', color: 'var(--color-neutral-300)' }}>
        404
      </h1>
      <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
        Page not found
      </p>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold' }}>{title}</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
        This page is under construction.
      </p>
    </div>
  );
}

export default App;
