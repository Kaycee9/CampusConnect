import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard routes — wired in Stage 2 with auth guard */}
        {/* <Route element={<DashboardLayout user={user} onLogout={logout} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
        </Route> */}

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
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

export default App;
