import { Link } from 'react-router-dom';
import {
  Search, ShieldCheck, Star, MessageSquare,
  CreditCard, MapPin, ArrowRight, Wrench,
  Zap, Paintbrush, Hammer,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import './Landing.css';

const FEATURES = [
  { icon: Search, title: 'Find Instantly', desc: 'Browse verified artisans near you by service type and proximity.' },
  { icon: ShieldCheck, title: 'Trusted Profiles', desc: 'Every artisan has reviews, ratings, and a verified profile.' },
  { icon: MessageSquare, title: 'Chat First', desc: 'Discuss details directly with artisans before booking.' },
  { icon: CreditCard, title: 'Pay Securely', desc: 'In-app payments with Paystack — safe, fast, and tracked.' },
  { icon: MapPin, title: 'GPS Location', desc: 'Automatic location detection matches you with nearby providers.' },
  { icon: Star, title: 'Rate & Review', desc: 'Leave honest reviews to help the community find quality service.' },
];

const CATEGORIES = [
  { icon: Wrench, name: 'Plumbing' },
  { icon: Zap, name: 'Electrical' },
  { icon: Paintbrush, name: 'Painting' },
  { icon: Hammer, name: 'Carpentry' },
];

export default function Landing() {
  return (
    <div className="landing">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__inner container">
          <div className="hero__content">
            <span className="hero__badge">Trusted by campus communities</span>
            <h1 className="hero__title">
              Your campus.<br />
              <span className="hero__title-accent">Your crew.</span>
            </h1>
            <p className="hero__subtitle">
              Find skilled artisans near you — plumbers, electricians, painters, and more.
              Book, chat, and pay securely, all in one place.
            </p>
            <div className="hero__cta">
              <Link to="/register" className="btn btn--primary btn--lg">
                Get Started
                <ArrowRight size={18} />
              </Link>
              <Link to="/register?role=artisan" className="btn btn--secondary btn--lg">
                Join as an Artisan
              </Link>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-number">500+</span>
                <span className="hero__stat-label">Artisans</span>
              </div>
              <div className="hero__stat-divider" />
              <div className="hero__stat">
                <span className="hero__stat-number">2k+</span>
                <span className="hero__stat-label">Students</span>
              </div>
              <div className="hero__stat-divider" />
              <div className="hero__stat">
                <span className="hero__stat-number">4.8</span>
                <span className="hero__stat-label">Avg Rating</span>
              </div>
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__card hero__card--1">
              <div className="hero__card-avatar" style={{ background: '#2563EB' }}>KO</div>
              <div>
                <div className="hero__card-name">Kwame Ofori</div>
                <div className="hero__card-role">Electrician · 4.9 ★</div>
              </div>
            </div>
            <div className="hero__card hero__card--2">
              <div className="hero__card-avatar" style={{ background: '#059669' }}>AB</div>
              <div>
                <div className="hero__card-name">Adaeze Bello</div>
                <div className="hero__card-role">Plumber · 4.7 ★</div>
              </div>
            </div>
            <div className="hero__card hero__card--3">
              <div className="hero__card-avatar" style={{ background: '#7C3AED' }}>TM</div>
              <div>
                <div className="hero__card-name">Tunde Makinde</div>
                <div className="hero__card-role">Painter · 5.0 ★</div>
              </div>
            </div>
            <div className="hero__glow" />
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────── */}
      <section className="categories">
        <div className="container">
          <div className="categories__grid">
            {CATEGORIES.map(({ icon: Icon, name }) => (
              <div key={name} className="categories__item">
                <div className="categories__icon">
                  <Icon size={24} />
                </div>
                <span className="categories__name">{name}</span>
              </div>
            ))}
            <div className="categories__item categories__item--more">
              <span className="categories__name">+6 more</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="features">
        <div className="container">
          <div className="features__header">
            <h2 className="features__title">Everything you need,<br />all in one place</h2>
            <p className="features__subtitle">
              CampusConnect removes the friction between needing help and getting it.
            </p>
          </div>
          <div className="features__grid">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="features__card">
                <div className="features__card-icon">
                  <Icon size={22} />
                </div>
                <h3 className="features__card-title">{title}</h3>
                <p className="features__card-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-section__box">
            <h2 className="cta-section__title">Ready to connect?</h2>
            <p className="cta-section__desc">
              Whether you need help or you are the help — CampusConnect is where it starts.
            </p>
            <div className="cta-section__buttons">
              <Link to="/register" className="btn btn--primary btn--lg">
                Sign Up Free
              </Link>
              <Link to="/register?role=artisan" className="btn btn--secondary btn--lg">
                Register as Artisan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer__inner">
            <div className="footer__brand">
              <span className="navbar__logo-mark">CC</span>
              <span>CampusConnect</span>
            </div>
            <p className="footer__copy">
              &copy; {new Date().getFullYear()} CampusConnect. Built with care.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
