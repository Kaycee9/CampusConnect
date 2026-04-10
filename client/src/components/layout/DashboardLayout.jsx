import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import './DashboardLayout.css';

export default function DashboardLayout({ user, onLogout }) {
  return (
    <div className="dashboard-layout">
      <Navbar user={user} onLogout={onLogout} />
      <div className="dashboard-layout__body">
        <Sidebar role={user?.role} />
        <main className="dashboard-layout__main">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
