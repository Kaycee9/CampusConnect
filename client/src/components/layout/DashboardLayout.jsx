import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import './DashboardLayout.css';

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-layout__body">
        <Sidebar />
        <main className="dashboard-layout__content">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
