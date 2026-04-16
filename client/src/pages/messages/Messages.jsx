import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, Inbox, BadgeCheck, MessagesSquare, Mail, Clock3, Users } from 'lucide-react';
import api from '../../lib/api.js';
import { createMessageSocket } from '../../lib/socket.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import './Messages.css';

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getConversationLabel = (conversation) => conversation?.booking?.title || conversation?.otherUser?.fullName || 'Conversation';

const getConversationSubtitle = (conversation) => {
  if (conversation?.booking?.title) {
    return conversation?.otherUser?.fullName ? `with ${conversation.otherUser.fullName}` : 'Booking chat';
  }

  return conversation?.otherUser?.role || '';
};

export default function Messages() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const participantId = searchParams.get('with');
  const bookingId = searchParams.get('bookingId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const socketRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [finalizePrice, setFinalizePrice] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);

  const activeConversationId = id || activeConversation?.id || null;

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data.conversations || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not load messages');
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  const loadThread = useCallback(async (conversationId) => {
    if (!conversationId) return;

    setLoadingThread(true);
    try {
      const { data } = await api.get(`/messages/conversations/${conversationId}`);
      setActiveConversation(data.conversation);
      setMessages(data.messages || []);
      setDraft('');
      setFinalizePrice(data.conversation?.booking?.agreedPrice ?? '');
      await api.patch(`/messages/conversations/${conversationId}/read`);
      await loadConversations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not load conversation');
      navigate('/messages', { replace: true });
    } finally {
      setLoadingThread(false);
    }
  }, [loadConversations, navigate, toast]);

  const openConversation = useCallback((conversationId) => {
    navigate(`/messages/${conversationId}`);
  }, [navigate]);

  const startConversationFromQuery = useCallback(async () => {
    if (!participantId && !bookingId) return;

    setStartingConversation(true);
    try {
      const payload = bookingId ? { bookingId } : { participantId };
      const { data } = await api.post('/messages/conversations', payload);
      setSearchParams({}, { replace: true });
      navigate(`/messages/${data.conversation.id}`, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not start conversation');
    } finally {
      setStartingConversation(false);
    }
  }, [bookingId, navigate, participantId, setSearchParams, toast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (participantId || bookingId) {
      startConversationFromQuery();
    }
  }, [bookingId, participantId, startConversationFromQuery]);

  useEffect(() => {
    if (!activeConversationId) {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (activeConversationId) {
      loadThread(activeConversationId);
    }
  }, [activeConversationId, loadThread]);

  useEffect(() => {
    if (!user) return undefined;

    const socket = createMessageSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on('connect_error', (error) => {
      console.error('Message socket error:', error.message);
    });

    socket.on('message:new', ({ conversationId, message, conversation }) => {
      if (conversationId === activeConversationId) {
        setMessages((current) => (
          current.some((entry) => entry.id === message.id) ? current : [...current, message]
        ));
        if (conversation) {
          setActiveConversation(conversation);
        }
      } else {
        loadConversations();
      }
    });

    return () => {
      socket.disconnect();
      socket.off('message:new');
      socket.off('connect_error');
      socketRef.current = null;
    };
  }, [activeConversationId, loadConversations, user]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConversationId) return undefined;

    socket.emit('conversation:join', { conversationId: activeConversationId });

    return () => {
      socket.emit('conversation:leave', { conversationId: activeConversationId });
    };
  }, [activeConversationId]);

  const unreadTotal = useMemo(
    () => conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0),
    [conversations]
  );

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!activeConversationId || !draft.trim()) {
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post(`/messages/conversations/${activeConversationId}`, {
        content: draft.trim(),
      });
      setMessages((current) => (
        current.some((entry) => entry.id === data.message.id) ? current : [...current, data.message]
      ));
      setDraft('');
      setActiveConversation(data.conversation);
      loadConversations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const finalizeNegotiation = async (event) => {
    event.preventDefault();

    if (!activeConversationId || !activeConversation?.bookingId) {
      return;
    }

    const agreedPrice = Number(finalizePrice);
    if (!Number.isFinite(agreedPrice) || agreedPrice <= 0) {
      toast.error('Enter a valid final price');
      return;
    }

    setSending(true);
    try {
      const { data } = await api.patch(`/messages/conversations/${activeConversationId}/finalize`, {
        agreedPrice,
      });

      if (data.message) {
        setMessages((current) => (
          current.some((entry) => entry.id === data.message.id) ? current : [...current, data.message]
        ));
      }

      if (data.conversation) {
        setActiveConversation(data.conversation);
      }

      if (data.booking?.agreedPrice != null) {
        setFinalizePrice(data.booking.agreedPrice);
      }

      if (data.pendingConfirmation) {
        toast.success('Final price proposal sent. Waiting for the other participant to confirm.');
      } else {
        toast.success('Negotiation finalized by both participants.');
      }

      loadConversations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not finalize negotiation');
    } finally {
      setSending(false);
    }
  };

  const activeLabel = activeConversation ? getConversationLabel(activeConversation) : 'Messages';
  const bookingSummary = activeConversation?.booking;
  const showFinalizedState = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(bookingSummary?.status);
  const finalizedLabel = bookingSummary?.status === 'COMPLETED'
    ? 'Negotiation finalized. Booking completed.'
    : bookingSummary?.status === 'IN_PROGRESS'
      ? 'Negotiation finalized. Work is currently in progress.'
      : `Negotiation finalized at NGN ${Number(bookingSummary?.agreedPrice || 0).toLocaleString()}.`;
  const messageStats = [
    { label: 'Conversations', value: conversations.length, iconNode: <MessagesSquare size={16} /> },
    { label: 'Unread', value: unreadTotal, iconNode: <Mail size={16} /> },
    { label: 'Status', value: 'Live', iconNode: <BadgeCheck size={16} /> },
  ];

  return (
    <section className={`messages-page animate-fade-in ${activeConversationId ? 'messages-page--thread-open' : ''}`}>
      <div className="messages-page__hero card">
        <div>
          <small className="messages-page__eyebrow">Direct messages</small>
          <h1>Inbox</h1>
          <p>Keep booking follow-ups, scope changes, and quick questions in one place.</p>
        </div>
        <div className="messages-page__stats">
          {messageStats.map(({ label, value, iconNode }) => (
            <div key={label} className="messages-page__stat">
              <span className="messages-page__stat-icon">{iconNode}</span>
              <div>
                <small>{label}</small>
                <strong>{label === 'Status' ? (startingConversation ? 'Opening' : value) : value}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`messages-shell card ${activeConversationId ? 'messages-shell--thread-open' : ''}`}>
        <aside className="messages-sidebar">
          <div className="messages-sidebar__header">
            <div>
              <h2>Conversations</h2>
              <p>{loadingList ? 'Loading inbox...' : 'Pick a thread to reply.'}</p>
            </div>
            <Badge status="info">{conversations.length}</Badge>
          </div>

          <div className="messages-list">
            {conversations.length === 0 ? (
              <div className="messages-empty-state">
                <Inbox size={28} />
                <h3>No conversations yet</h3>
                <p>Start from a booking detail page when you need to talk to an artisan or student.</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`messages-list__item ${isActive ? 'messages-list__item--active' : ''}`}
                    onClick={() => openConversation(conversation.id)}
                  >
                    <Avatar
                      src={conversation.otherUser?.avatarUrl}
                      name={conversation.otherUser?.fullName || 'Conversation'}
                      size="md"
                    />
                    <div className="messages-list__copy">
                      <div className="messages-list__topline">
                        <strong>{getConversationLabel(conversation)}</strong>
                        <span>{conversation.lastMessage?.createdAt ? formatTime(conversation.lastMessage.createdAt) : ''}</span>
                      </div>
                      <div className="messages-list__context">{getConversationSubtitle(conversation)}</div>
                      <p>{conversation.lastMessage?.content || 'No messages yet'}</p>
                    </div>
                    <div className="messages-list__meta">
                      {conversation.unreadCount > 0 && <Badge status="warning">{conversation.unreadCount}</Badge>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="messages-thread">
          {loadingThread && (
            <div className="messages-thread__loading">
              <Clock3 size={20} />
              Loading thread...
            </div>
          )}

          {!loadingThread && !activeConversation ? (
            <div className="messages-thread__empty">
              <MessageSquare size={42} />
              <h2>Open a conversation</h2>
              <p>{conversations.length > 0 ? 'Select a conversation on the left to read and reply.' : 'Use a booking to start the first conversation.'}</p>
            </div>
          ) : (
            <>
              <div className="messages-thread__header">
                <div className="messages-thread__identity">
                  <Avatar
                    src={activeConversation?.otherUser?.avatarUrl}
                    name={activeConversation?.otherUser?.fullName || activeLabel}
                    size="md"
                  />
                  <div>
                    <small className="messages-thread__eyebrow">{bookingSummary?.title ? 'Booking chat' : 'Direct message'}</small>
                    <h2>{activeConversation?.otherUser?.fullName || activeLabel}</h2>
                    <p>{bookingSummary?.title ? `${bookingSummary.title} · ${activeConversation?.otherUser?.role || ''}` : (activeConversation?.otherUser?.role || '')}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="messages-thread__back"
                  onClick={() => navigate('/messages')}
                >
                  Back to inbox
                </Button>
                <Button variant="ghost" onClick={() => navigate('/bookings')}>
                  View bookings
                </Button>
              </div>

              {bookingSummary && (
                <div className="messages-booking card">
                  <div className="messages-booking__top">
                    <div>
                      <small>Booking context</small>
                      <h3>{bookingSummary.title}</h3>
                    </div>
                    <Badge status={bookingSummary.status} dot>
                      {bookingSummary.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="messages-booking__meta">
                    <span>{bookingSummary.agreedPrice == null ? 'Price pending' : `NGN ${Number(bookingSummary.agreedPrice).toLocaleString()}`}</span>
                    <span>{new Date(bookingSummary.scheduledAt).toLocaleString()}</span>
                  </div>

                  {bookingSummary.status === 'PENDING' && (
                    <form className="messages-booking__finalize" onSubmit={finalizeNegotiation}>
                      <input
                        type="number"
                        min="1"
                        value={finalizePrice}
                        onChange={(e) => setFinalizePrice(e.target.value)}
                        placeholder="Final agreed price"
                        aria-label="Final agreed price"
                      />
                      <Button type="submit" loading={sending}>
                        Finalize negotiation
                      </Button>
                    </form>
                  )}

                  {showFinalizedState && (
                    <div className="messages-booking__finalized" role="status" aria-live="polite">
                      {finalizedLabel}
                    </div>
                  )}
                </div>
              )}

              <div className="messages-thread__body">
                {messages.length === 0 ? (
                  <div className="messages-thread__empty-inline">
                    <Users size={32} />
                    <p>Say hello to get the conversation moving.</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId === user?.id;
                    return (
                      <article key={message.id} className={`message-bubble ${mine ? 'message-bubble--mine' : ''}`}>
                        <div className="message-bubble__meta">
                          <strong>{mine ? 'You' : message.sender?.fullName || 'Message'}</strong>
                          <span>{formatTime(message.createdAt)}</span>
                        </div>
                        <p>{message.content}</p>
                      </article>
                    );
                  })
                )}
              </div>

              <form className="messages-thread__composer" onSubmit={sendMessage}>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message..."
                  aria-label="Message text"
                />
                <Button type="submit" loading={sending} icon={Send}>
                  Send
                </Button>
              </form>
            </>
          )}
        </main>
      </div>
    </section>
  );
}