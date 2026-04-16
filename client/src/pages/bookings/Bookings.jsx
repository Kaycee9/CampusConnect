import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, MapPin, PencilLine, Ban, Check, CircleSlash, Play, CheckCheck, Sparkles } from 'lucide-react';
import api from '../../lib/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import './Bookings.css';

const statusLabel = (status) => status?.replace('_', ' ');
const statusFilters = ['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'];

const formatBookingTitle = (title = '') => {
  if (!title) return 'Service request';
  const isMostlyUppercase = title === title.toUpperCase();
  if (!isMostlyUppercase) return title;
  return title
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

function BookingCard({ booking, userRole, onOpen, onAction, busy }) {
  const artisan = booking.artisan;
  const displayTitle = formatBookingTitle(booking.title);
  const canStudentCancel = userRole === 'STUDENT' && booking.status === 'PENDING';
  const canArtisanRespond = userRole === 'ARTISAN' && booking.status === 'PENDING';
  const canArtisanStart = userRole === 'ARTISAN' && booking.status === 'ACCEPTED';
  const canArtisanComplete = userRole === 'ARTISAN' && booking.status === 'IN_PROGRESS';
  const completionPending = Boolean(booking.completionRequestedAt);

  return (
    <article className="booking-card card">
      <button className="booking-card__main" onClick={onOpen}>
        <div className="booking-card__top">
          <div className="booking-card__person">
            <Avatar src={artisan?.avatarUrl} name={artisan?.fullName || booking.title} size="sm" />
            <div className="booking-card__identity">
              <h3 className="booking-card__title">{displayTitle}</h3>
              <p className="booking-card__subtitle">{artisan?.fullName || 'Artisan'}</p>
            </div>
          </div>
          <Badge status={booking.status} dot>
            {statusLabel(booking.status)}
          </Badge>
        </div>

        <div className="booking-card__meta">
          <span><CalendarCheck size={14} /> {new Date(booking.scheduledAt).toLocaleString()}</span>
          <span><MapPin size={14} /> {booking.address}</span>
        </div>
      </button>

      <div className="booking-card__footer">
        <div className="booking-card__price">
          <small>Current offer</small>
          <strong>
            {booking.agreedPrice == null ? 'Price pending' : `NGN ${Number(booking.agreedPrice).toLocaleString()}`}
          </strong>
        </div>
        <div className="booking-card__actions">
          {canStudentCancel && (
            <Button size="sm" variant="ghost" onClick={() => onAction('cancel')} loading={busy} icon={Ban}>
              Cancel
            </Button>
          )}
          {canArtisanRespond && (
            <>
              <Button size="sm" variant="ghost" onClick={() => onAction('reject')} loading={busy} icon={CircleSlash}>
                Reject
              </Button>
              <Button size="sm" onClick={() => onAction('accept')} loading={busy} icon={Check}>
                Accept
              </Button>
            </>
          )}
          {canArtisanStart && (
            <Button size="sm" onClick={() => onAction('start')} loading={busy} icon={Play}>
              Start
            </Button>
          )}
          {canArtisanComplete && (
            completionPending ? (
              <Button size="sm" variant="ghost" disabled icon={CheckCheck}>
                Awaiting student confirmation
              </Button>
            ) : (
              <Button size="sm" onClick={() => onAction('complete')} loading={busy} icon={CheckCheck}>
                Request completion
              </Button>
            )
          )}
          <Button size="sm" variant="ghost" onClick={onOpen} icon={PencilLine}>
            Details
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function Bookings() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings');
      setBookings(data.bookings || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not load bookings');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const grouped = useMemo(() => {
    const byStatus = bookings.reduce((acc, booking) => {
      const key = booking.status || 'PENDING';
      if (!acc[key]) acc[key] = [];
      acc[key].push(booking);
      return acc;
    }, {});

    return byStatus;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let next = bookings.filter((booking) => {
      if (statusFilter !== 'ALL' && booking.status !== statusFilter) return false;
      if (!normalizedSearch) return true;

      const artisanName = booking.artisan?.fullName?.toLowerCase() || '';
      return (
        booking.title.toLowerCase().includes(normalizedSearch)
        || booking.description.toLowerCase().includes(normalizedSearch)
        || booking.address.toLowerCase().includes(normalizedSearch)
        || artisanName.includes(normalizedSearch)
      );
    });

    if (sortBy === 'oldest') {
      next = next.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'scheduled-soonest') {
      next = next.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    } else if (sortBy === 'scheduled-latest') {
      next = next.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
    } else {
      next = next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return next;
  }, [bookings, search, statusFilter, sortBy]);

  const activeJobs = (grouped.ACCEPTED?.length || 0) + (grouped.IN_PROGRESS?.length || 0);

  const runAction = async (bookingId, action) => {
    setBusyId(bookingId);
    try {
      const extra = action === 'reject' ? { rejectionReason: 'I am unavailable for the requested schedule.' } : {};
      const endpoint = action === 'complete' ? 'request-completion' : action;
      await api.patch(`/bookings/${bookingId}/${endpoint}`, extra);
      const successMap = {
        accept: 'Booking accepted.',
        reject: 'Booking rejected.',
        start: 'Job marked as in progress.',
        complete: 'Completion request sent. Waiting for student confirmation.',
        cancel: 'Booking cancelled.',
      };
      toast.success(successMap[action] || 'Booking updated successfully.');
      await fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to update this booking.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-8)' }}>Loading bookings...</div>;
  }

  return (
    <section className="booking-page animate-fade-in">
      <div className="booking-page__hero card">
        <div className="booking-page__header">
          <div className="booking-page__title-wrap">
            <h1>{user?.role === 'ARTISAN' ? 'Booking requests' : 'My bookings'}</h1>
            <p>{user?.role === 'ARTISAN' ? 'Manage incoming requests and active jobs.' : 'Track requests from pending to completed.'}</p>
          </div>
          {user?.role === 'STUDENT' && (
            <Button onClick={() => navigate('/browse')}>
              Find an artisan
            </Button>
          )}
        </div>
        <div className="booking-page__kpis">
          <div>
            <small>Total bookings</small>
            <strong>{bookings.length}</strong>
          </div>
          <div>
            <small>Active jobs</small>
            <strong>{activeJobs}</strong>
          </div>
          <div>
            <small>Pending requests</small>
            <strong>{grouped.PENDING?.length || 0}</strong>
          </div>
        </div>
      </div>

      <div className="booking-filters card">
        <div className="booking-filters__row">
          <div className="booking-filters__field">
            <label>Search</label>
            <input
              className="booking-filters__search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, artisan, address"
              aria-label="Search bookings"
            />
          </div>
          <div className="booking-filters__field">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="booking-filters__select" aria-label="Filter by status">
              {statusFilters.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All statuses' : statusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="booking-filters__field">
            <label>Sort</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="booking-filters__select" aria-label="Sort bookings">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="scheduled-soonest">Scheduled soonest</option>
              <option value="scheduled-latest">Scheduled latest</option>
            </select>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setSortBy('newest');
            }}
          >
            Reset
          </Button>
        </div>
        <div className="booking-results-bar">
          <span><Sparkles size={14} /> {filteredBookings.length} matching booking{filteredBookings.length === 1 ? '' : 's'}</span>
          {statusFilter !== 'ALL' && <Badge status={statusFilter}>{statusLabel(statusFilter)}</Badge>}
        </div>
        <div className="booking-filters__chips">
          {statusFilters.filter((status) => status !== 'ALL').map((status) => (
            <button
              type="button"
              key={status}
              className={`booking-chip ${statusFilter === status ? 'booking-chip--active' : ''}`}
              onClick={() => setStatusFilter(statusFilter === status ? 'ALL' : status)}
            >
              {statusLabel(status)} ({grouped[status]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="booking-empty card">
          <h3>No bookings yet</h3>
          <p>{user?.role === 'ARTISAN' ? 'You will see requests here when students book you.' : 'Your booking history will appear here once you send a request.'}</p>
          {user?.role === 'STUDENT' && (
            <Button onClick={() => navigate('/browse')}>Browse artisans</Button>
          )}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="booking-empty card">
          <h3>No results for current filters</h3>
          <p>Try clearing search terms or choosing a different status.</p>
        </div>
      ) : (
        <div className="booking-list">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              userRole={user?.role}
              busy={busyId === booking.id}
              onOpen={() => navigate(`/bookings/${booking.id}`)}
              onAction={(action) => runAction(booking.id, action)}
            />
          ))}
        </div>
      )}

    </section>
  );
}
