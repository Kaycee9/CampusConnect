import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MapPin, Navigation, ArrowRight, ArrowLeft, Wrench, FileText, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import './Auth.css';

const SERVICE_CATEGORIES = [
  'PLUMBING', 'ELECTRICAL', 'PAINTING', 'CARPENTRY', 'CLEANING',
  'TAILORING', 'BARBING', 'WELDING', 'MECHANICS', 'TECH_REPAIR', 'OTHER',
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'artisan' ? 'ARTISAN' : '';
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    category: '', bio: '', startingPrice: '', address: '',
    lat: null, lng: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const totalSteps = role === 'ARTISAN' ? 3 : 2;

  const validateStep = () => {
    const newErrors = {};
    if (step === 1 && !role) {
      newErrors.role = 'Please select a role';
    }

    if (step === 2) {
      if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!form.email.trim()) newErrors.email = 'Email is required';
      if (!form.password) newErrors.password = 'Password is required';
      else if (form.password.length < 8) newErrors.password = 'Must be at least 8 characters';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (form.lat == null || form.lng == null) newErrors.address = 'Please capture your current GPS location';
    }

    if (step === 3 && role === 'ARTISAN' && !form.category) {
      newErrors.category = 'Select a service category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, address: 'Geolocation is not supported on this browser' }));
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        }));
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        setErrors((prev) => ({ ...prev, address: 'Could not access your current location' }));
      }
    );
  };

  const nextStep = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);

    const payload = {
      role,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    if (form.address.trim()) payload.address = form.address.trim();
    if (form.lat != null && form.lng != null) {
      payload.lat = form.lat;
      payload.lng = form.lng;
    }

    if (role === 'ARTISAN') {
      payload.category = form.category;
      if (form.bio.trim()) payload.bio = form.bio.trim();
      if (form.startingPrice !== '') payload.startingPrice = form.startingPrice;
    }

    const { success } = await register(payload);
    setLoading(false);

    if (success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__left">
        <div className="auth-page__brand">
          <Link to="/" className="auth-page__logo">
            <span className="navbar__logo-mark">CC</span>
            <span>CampusConnect</span>
          </Link>
        </div>
        <div className="auth-page__hero-text">
          <h2>{role === 'ARTISAN' ? 'Grow your business' : 'Join the community'}</h2>
          <p>{role === 'ARTISAN'
            ? 'Create your professional profile and reach students right on campus.'
            : 'Find verified artisans and service providers near you.'}</p>
        </div>
      </div>

      <div className="auth-page__right">
        <div className="auth-form-container">
          <div className="auth-form__header">
            <h1 className="auth-form__title">Create account</h1>
            <p className="auth-form__subtitle">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>

          <div className="auth-form__progress">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`auth-form__progress-step ${i + 1 <= step ? 'auth-form__progress-step--active' : ''}`}
              />
            ))}
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="auth-form__step animate-fade-in">
                <p className="auth-form__step-label">I am a...</p>
                <div className="auth-form__role-grid">
                  <button
                    type="button"
                    className={`auth-form__role-card ${role === 'STUDENT' ? 'auth-form__role-card--active' : ''}`}
                    onClick={() => setRole('STUDENT')}
                  >
                    <User size={32} />
                    <span className="auth-form__role-name">Student</span>
                    <span className="auth-form__role-desc">I need services</span>
                  </button>
                  <button
                    type="button"
                    className={`auth-form__role-card ${role === 'ARTISAN' ? 'auth-form__role-card--active' : ''}`}
                    onClick={() => setRole('ARTISAN')}
                  >
                    <Wrench size={32} />
                    <span className="auth-form__role-name">Artisan</span>
                    <span className="auth-form__role-desc">I provide services</span>
                  </button>
                </div>
                {errors.role && <span className="input-group__error">{errors.role}</span>}
                <Button type="button" fullWidth size="lg" disabled={!role} onClick={nextStep} iconRight={ArrowRight}>
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="auth-form__step animate-fade-in">
                <div className="auth-form__row">
                  <Input
                    label="First name"
                    name="firstName"
                    icon={User}
                    placeholder="John"
                    value={form.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                    required
                  />
                  <Input
                    label="Last name"
                    name="lastName"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                    required
                  />
                </div>

                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  icon={Mail}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  icon={Lock}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
                  hint="At least 8 characters"
                  required
                />

                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  icon={Lock}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  required
                />

                <Input
                  label="Address (optional)"
                  name="address"
                  icon={MapPin}
                  placeholder="e.g. Hall of Residence"
                  value={form.address}
                  onChange={handleChange}
                  error={errors.address}
                />

                <div className="auth-form__step-actions" style={{ marginTop: 0 }}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleUseCurrentLocation}
                    loading={locationLoading}
                    icon={Navigation}
                  >
                    Use current GPS
                  </Button>
                  {form.lat != null && form.lng != null && (
                    <span className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
                      GPS captured: {form.lat}, {form.lng}
                    </span>
                  )}
                </div>

                <div className="auth-form__step-actions">
                  <Button type="button" variant="ghost" onClick={prevStep} icon={ArrowLeft}>
                    Back
                  </Button>
                  {role === 'ARTISAN' ? (
                    <Button type="button" onClick={nextStep} iconRight={ArrowRight}>
                      Continue
                    </Button>
                  ) : (
                    <Button type="submit" loading={loading} iconRight={ArrowRight}>
                      Create Account
                    </Button>
                  )}
                </div>
              </div>
            )}

            {step === 3 && role === 'ARTISAN' && (
              <div className="auth-form__step animate-fade-in">
                <div className="input-group">
                  <label className="input-group__label input-group__label--required">
                    Service Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="input-group__input"
                  >
                    <option value="">Select your service...</option>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ').charAt(0) + cat.replace('_', ' ').slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  {errors.category && <span className="input-group__error">{errors.category}</span>}
                </div>

                <Input
                  label="Service description"
                  name="bio"
                  textarea
                  icon={FileText}
                  placeholder="Describe your services, experience, and what makes you stand out..."
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                />

                <Input
                  label="Starting price (NGN)"
                  name="startingPrice"
                  type="number"
                  icon={DollarSign}
                  placeholder="e.g. 5000"
                  value={form.startingPrice}
                  onChange={handleChange}
                  hint="Your minimum service charge"
                />

                <div className="auth-form__step-actions">
                  <Button type="button" variant="ghost" onClick={prevStep} icon={ArrowLeft}>
                    Back
                  </Button>
                  <Button type="submit" loading={loading} iconRight={ArrowRight}>
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
