import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  MessageSquare,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../lib/api.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import './Dashboard.css';

const statusLabel = (status = '') => status.replace('_', ' ');

const formatDate = (value) => {
  if (!value) return 'No date set';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getDisplayName = (user) => {
  if (!user) return 'there';
  const profile = user.role === 'ARTISAN' ? user.artisanProfile : user.studentProfile;
  return profile?.firstName || user.email?.split('@')?.[0] || 'there';
};

const getOtherPartyName = (booking, role) => {
  if (role === 'STUDENT') {
    return booking?.artisan?.fullName || 'Artisan';
  }

  const first = booking?.student?.studentProfile?.firstName || '';
  const last = booking?.student?.studentProfile?.lastName || '';
  const fullName = `${first} ${last}`.trim();
  return fullName || booking?.student?.email || 'Student';
};

const getRoleSections = (role) => {
  if (role === 'ARTISAN') {
    return [
      {
        key: 'requests',
        title: 'New booking requests',
        statuses: ['PENDING'],
        empty: 'No pending requests right now.',
      },
      {
        key: 'ready',
        title: 'Ready to start',
        statuses: ['ACCEPTED'],
        empty: 'No accepted bookings waiting to start.',
      },
      {
        key: 'active',
        title: 'Jobs in progress',
        statuses: ['IN_PROGRESS'],
        empty: 'No active jobs currently.',
      },
    ];
  }

  return [
    {
      key: 'response',
      title: 'Needs response',
      statuses: ['PENDING'],
      empty: 'No pending booking requests.',
    },
    {
      key: 'upcoming',
      title: 'Upcoming bookings',
      statuses: ['ACCEPTED'],
      empty: 'No upcoming accepted bookings.',
    },
    {
      key: 'progress',
      title: 'In progress',
      statuses: ['IN_PROGRESS'],
      empty: 'No active bookings in progress.',
    },
  ];
};

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      const [bookingsRes, conversationsRes] = await Promise.allSettled([
        api.get('/bookings'),
        api.get('/messages/conversations'),
      ]);

      if (!active) return;

      if (bookingsRes.status === 'fulfilled') {
        setBookings(bookingsRes.value.data.bookings || []);
      } else {
        toast.error('Could not load bookings overview');
      }

      if (conversationsRes.status === 'fulfilled') {
        setConversations(conversationsRes.value.data.conversations || []);
      } else {
        toast.error('Could not load conversation overview');
      }

      setLoading(false);
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [toast]);

  const role = user?.role || 'STUDENT';
  const displayName = getDisplayName(user);
  const sections = getRoleSections(role);

  const kpis = useMemo(() => {
    const pending = bookings.filter((booking) => booking.status === 'PENDING').length;
    const accepted = bookings.filter((booking) => booking.status === 'ACCEPTED').length;
    const inProgress = bookings.filter((booking) => booking.status === 'IN_PROGRESS').length;
    const unread = conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);

    if (role === 'ARTISAN') {
      return [
        { label: 'New requests', value: pending, icon: ClipboardCheck },
        { label: 'Jobs in progress', value: inProgress, icon: Timer },
        { label: 'Unread messages', value: unread, icon: MessageSquare },
      ];
    }

    return [
      { label: 'Active bookings', value: accepted + inProgress, icon: CalendarClock },
      { label: 'Pending requests', value: pending, icon: ClipboardCheck },
      { label: 'Unread messages', value: unread, icon: MessageSquare },
    ];
  }, [bookings, conversations, role]);

  const grouped = useMemo(() => {
    return sections.map((section) => {
      const items = bookings
        .filter((booking) => section.statuses.includes(booking.status))
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
        .slice(0, 4);

      return { ...section, items };
    });
  }, [bookings, sections]);

  const recentConversations = useMemo(() => conversations.slice(0, 3), [conversations]);

  return (
    <section className="dashboard-page animate-fade-in">
      <div className="dashboard-page__hero card">
        <div>
          <small>{role === 'ARTISAN' ? 'Artisan workspace' : 'Student workspace'}</small>
          <h1>Welcome back, {displayName}</h1>
          <p>
            {role === 'ARTISAN'
              ? 'Track requests, move active jobs forward, and keep replies tight.'
              : 'See what needs attention, what is coming up, and what is already in motion.'}
          </p>
        </div>
        <div className="dashboard-page__hero-actions">
          {role === 'STUDENT' ? (
            <Button onClick={() => navigate('/browse')} icon={Sparkles}>
              Browse artisans
            </Button>
          ) : (
            <Button onClick={() => navigate('/bookings')} icon={CalendarClock}>
              Review requests
            </Button>
          )}
        </div>
      </div>

      <div className="dashboard-page__kpis">
        {kpis.map(({ label, value, icon: Icon }) => (
          <article className="dashboard-kpi card" key={label}>
            <span className="dashboard-kpi__icon"><Icon size={16} /></span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-page__grid">
        <div className="dashboard-feed card">
          <div className="dashboard-feed__head">
            <h2>{role === 'ARTISAN' ? 'Work queue' : 'Booking timeline'}</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')} iconRight={ArrowRight}>
              View all bookings
            </Button>
          </div>

          {loading ? (
            <div className="dashboard-feed__empty">Loading dashboard summary...</div>
          ) : (
            <div className="dashboard-feed__sections">
              {grouped.map((section) => (
                <div className="dashboard-section" key={section.key}>
                  <div className="dashboard-section__title-row">
                    <h3>{section.title}</h3>
                    <span>{section.items.length}</span>
                  </div>

                  {section.items.length === 0 ? (
                    <p className="dashboard-section__empty">{section.empty}</p>
                  ) : (
                    <div className="dashboard-section__list">
                      {section.items.map((booking) => (
                        <article className="dashboard-booking" key={booking.id}>
                          <div className="dashboard-booking__main">
                            <Avatar
                              src={role === 'STUDENT' ? booking.artisan?.avatarUrl : null}
                              name={getOtherPartyName(booking, role)}
                              size="sm"
                            />
                            <div>
                              <h4>{booking.title}</h4>
                              <p>{getOtherPartyName(booking, role)} · {formatDate(booking.scheduledAt)}</p>
                            </div>
                          </div>
                          <div className="dashboard-booking__meta">
                            <Badge status={booking.status}>{statusLabel(booking.status)}</Badge>
                            <div className="dashboard-booking__actions">
                              <Button
                                size="sm"
                                onClick={() => navigate(`/messages?bookingId=${booking.id}`)}
                              >
                                Open chat
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/bookings/${booking.id}`)}>
                                View
                              </Button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="dashboard-side">
          <div className="dashboard-side__card card">
            <h3>Quick actions</h3>
            <div className="dashboard-side__actions">
              <Button variant="ghost" onClick={() => navigate('/messages')}>
                Continue conversations
              </Button>
              <Button variant="ghost" onClick={() => navigate('/profile')}>
                Update profile
              </Button>
            </div>
          </div>

          <div className="dashboard-side__card card">
            <h3>Recent conversations</h3>
            {loading ? (
              <p className="dashboard-side__empty">Loading conversations...</p>
            ) : recentConversations.length === 0 ? (
              <p className="dashboard-side__empty">No conversations yet.</p>
            ) : (
              <div className="dashboard-convos">
                {recentConversations.map((conversation) => (
                  <button
                    type="button"
                    key={conversation.id}
                    className="dashboard-convo"
                    onClick={() => navigate(`/messages/${conversation.id}`)}
                  >
                    <Avatar
                      src={conversation.otherUser?.avatarUrl}
                      name={conversation.otherUser?.fullName || conversation.booking?.title || 'Conversation'}
                      size="sm"
                    />
                    <div>
                      <h4>{conversation.booking?.title || conversation.otherUser?.fullName || 'Conversation'}</h4>
                      <p>{conversation.lastMessage?.content || 'No messages yet'}</p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge status="warning" size="sm">{conversation.unreadCount}</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
