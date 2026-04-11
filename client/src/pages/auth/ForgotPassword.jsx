import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import api from '../../lib/api.js';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import './Auth.css';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success(data.message || 'If that email exists, a reset link has been sent');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not process request');
    } finally {
      setLoading(false);
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
          <h2>Reset your password</h2>
          <p>Enter your email and we will send a secure reset link.</p>
        </div>
      </div>

      <div className="auth-page__right">
        <div className="auth-form-container">
          <div className="auth-form__header">
            <h1 className="auth-form__title">Forgot password</h1>
            <p className="auth-form__subtitle">
              Remembered it? <Link to="/login">Back to login</Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              name="email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              iconRight={ArrowRight}
            >
              Send reset link
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
