import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Avatar from '../ui/Avatar.jsx';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuth = !!user;

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-mark">CC</span>
          <span className="navbar__logo-text">CampusConnect</span>
        </Link>

        {!isAuth ? (
          <nav className="navbar__auth-links">
            <Link to="/login" className={`navbar__link ${location.pathname === '/login' ? 'navbar__link--active' : ''}`}>
              Log in
            </Link>
            <Link to="/register" className="btn btn--primary btn--sm">
              Sign up
            </Link>
          </nav>
        ) : (
          <>
            <nav className="navbar__actions">
              <button className="navbar__icon-btn" onClick={() => navigate('/messages')} aria-label="Messages">
                <MessageSquare size={20} />
              </button>
              <button className="navbar__icon-btn" aria-label="Notifications">
                <Bell size={20} />
              </button>
              <div className="navbar__user" onClick={() => setMenuOpen(!menuOpen)}>
                <Avatar
                  src={user.avatarUrl}
                  name={`${user.firstName} ${user.lastName}`}
                  size="sm"
                />
                <span className="navbar__user-name">{user.firstName}</span>
              </div>
            </nav>

            {menuOpen && (
              <div
                className="navbar__dropdown"
                onClick={() => setMenuOpen(false)}
              >
                <Link to="/profile" className="navbar__dropdown-item">My Profile</Link>
                <Link to="/bookings" className="navbar__dropdown-item">My Bookings</Link>
                {user.role === 'ARTISAN' && (
                  <Link to="/earnings" className="navbar__dropdown-item">Earnings</Link>
                )}
                <div className="navbar__dropdown-divider" />
                <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={logout}>
                  Log out
                </button>
              </div>
            )}
          </>
        )}

        {/* Mobile menu toggle */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
