import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, CalendarCheck, CreditCard, User, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './BottomNav.css';

const STUDENT_LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/browse', icon: Search, label: 'Browse' },
  { to: '/bookings', icon: CalendarCheck, label: 'Bookings' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/reviews', icon: Star, label: 'Reviews' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const ARTISAN_LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/bookings', icon: CalendarCheck, label: 'Bookings' },
  { to: '/payments', icon: CreditCard, label: 'Earnings' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const { user } = useAuth();
  const links = user?.role === 'ARTISAN' ? ARTISAN_LINKS : STUDENT_LINKS;

  return (
    <nav className="bottom-nav">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
          }
        >
          <link.icon size={20} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
