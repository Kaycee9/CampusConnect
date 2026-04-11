import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Search, CalendarCheck, MessageSquare,
  User, Settings, Wallet, Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './Sidebar.css';

const STUDENT_LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/browse', icon: Search, label: 'Browse Artisans' },
  { to: '/bookings', icon: CalendarCheck, label: 'My Bookings' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/reviews', icon: Star, label: 'My Reviews' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const ARTISAN_LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/bookings', icon: CalendarCheck, label: 'Bookings' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/earnings', icon: Wallet, label: 'Earnings' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';
  const links = role === 'ARTISAN' ? ARTISAN_LINKS : STUDENT_LINKS;

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
