import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import DashboardLayout from './DashboardLayout.jsx';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // AuthContext handles loading state by not rendering children until determined,
    // so this is technically a fallback guard.
    return <div className="spinner-page">Loading...</div>;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role-based protection
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout user={user}>
      <Outlet />
    </DashboardLayout>
  );
}
