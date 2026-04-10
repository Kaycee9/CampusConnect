import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, CalendarCheck, MessageSquare, User } from 'lucide-react';
import './BottomNav.css';

const LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/browse', icon: Search, label: 'Browse' },
  { to: '/bookings', icon: CalendarCheck, label: 'Bookings' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {LINKS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
