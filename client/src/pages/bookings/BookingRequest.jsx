import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Clock3, CalendarDays, ReceiptText, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../lib/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import './Bookings.css';

export default function BookingRequest() {
  const [params] = useSearchParams();
  const artisanId = params.get('artisan');
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [artisan, setArtisan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: user?.studentProfile?.address || '',
    scheduledAt: '',
    agreedPrice: '',
    lat: user?.studentProfile?.lat ?? '',
    lng: user?.studentProfile?.lng ?? '',
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        if (!artisanId) {
          toast.error('Select an artisan to continue');
          navigate('/browse');
          return;
        }

        const { data } = await api.get(`/artisans/${artisanId}`);
        if (!active) return;
        setArtisan(data.artisan);
        setForm((prev) => ({
          ...prev,
          agreedPrice: data.artisan.startingPrice ?? '',
          title: data.artisan.category?.replace('_', ' ') || '',
        }));
      } catch (error) {
        if (!active) return;
        toast.error(error.response?.data?.error || 'Could not load artisan');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [artisanId, navigate, toast]);

  const summary = useMemo(() => {
    if (!artisan) return null;
    return {
      name: `${artisan.firstName} ${artisan.lastName}`.trim(),
      price: artisan.startingPrice,
      category: artisan.category?.replace('_', ' '),
    };
  }, [artisan]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this browser');
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
        toast.error('Could not access your location');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!artisan) return;

    if (!form.title.trim() || !form.description.trim() || !form.address.trim() || !form.scheduledAt) {
      toast.error('Fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        artisanId: artisan.id,
        title: form.title.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      };

      if (form.agreedPrice !== '') payload.agreedPrice = Number(form.agreedPrice);
      if (form.lat !== '' && form.lng !== '') {
        payload.lat = Number(form.lat);
        payload.lng = Number(form.lng);
      }

      const { data } = await api.post('/bookings', payload);
      toast.success('Booking request sent');
      navigate(`/bookings/${data.booking.id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ paddingTop: 'var(--space-10)' }}>Loading booking form...</div>;
  }

  if (!artisan || !summary) {
    return <div className="container" style={{ paddingTop: 'var(--space-10)' }}>Artisan not found.</div>;
  }

  return (
    <div className="booking-page booking-page--request container animate-fade-in">
      <div className="booking-page__hero booking-page__hero--request card">
        <div className="booking-page__artisan">
          <Avatar src={artisan.avatarUrl} name={summary.name} size="lg" status={artisan.isAvailable ? 'online' : 'busy'} />
          <div>
            <h1>Request a booking</h1>
            <p>Send details directly to {summary.name} and track the request from your dashboard.</p>
            <div className="booking-page__artisan-meta">
              <Badge status={artisan.isAvailable ? 'available' : 'busy'} dot>
                {artisan.isAvailable ? 'Available now' : 'Busy'}
              </Badge>
              <span>{summary.category}</span>
            </div>
          </div>
        </div>
        <div className="booking-page__summary">
          <div>
            <small>Starting price</small>
            <strong>{summary.price == null ? 'Flexible' : `NGN ${Number(summary.price).toLocaleString()}`}</strong>
          </div>
          <div>
            <small>Status</small>
            <strong>{artisan.isAvailable ? 'Ready for requests' : 'May reply later'}</strong>
          </div>
        </div>
      </div>

      <form className="booking-form card" onSubmit={handleSubmit}>
        <h2>Booking details</h2>
        <div className="booking-form__grid">
          <Input
            label="Service title"
            name="title"
            icon={ReceiptText}
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Fix my room sink"
            required
          />
          <Input
            label="Preferred date & time"
            name="scheduledAt"
            type="datetime-local"
            icon={CalendarDays}
            value={form.scheduledAt}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="What needs to be done?"
          name="description"
          textarea
          rows={5}
          icon={MessageSquare}
          value={form.description}
          onChange={handleChange}
          placeholder="Explain the issue clearly so the artisan can prepare."
          required
        />

        <div className="booking-form__grid">
          <Input
            label="Service address"
            name="address"
            icon={MapPin}
            value={form.address}
            onChange={handleChange}
            placeholder="Where should the artisan come?"
            required
          />
          <Input
            label="Proposed Price (optional)"
            name="agreedPrice"
            type="number"
            icon={Clock3}
            value={form.agreedPrice}
            onChange={handleChange}
            placeholder="Use artisan price if omitted"
          />
        </div>

        <div className="booking-form__actions">
          <Button type="button" variant="ghost" onClick={handleUseCurrentLocation} loading={locationLoading}>
            Use current GPS
          </Button>
          <Button type="submit" loading={submitting}>
            Send request
          </Button>
        </div>
      </form>
    </div>
  );
}
