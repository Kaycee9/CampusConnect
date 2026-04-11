import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { success } = await login(form);
    setLoading(false);
    
    if (success) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
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
          <h2>Welcome back</h2>
          <p>Your campus. Your crew. Trusted services, right where you are.</p>
        </div>
      </div>

      <div className="auth-page__right">
        <div className="auth-form-container">
          <div className="auth-form__header">
            <h1 className="auth-form__title">Log in</h1>
            <p className="auth-form__subtitle">
              Don&apos;t have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required
            />

            <div className="auth-form__options">
              <label className="auth-form__checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="auth-form__forgot">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              iconRight={ArrowRight}
            >
              Log in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
