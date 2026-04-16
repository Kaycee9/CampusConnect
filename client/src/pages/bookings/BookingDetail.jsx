import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, CreditCard, MapPin, MessageSquare, ShieldCheck, XCircle } from 'lucide-react';
import api from '../../lib/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Modal from '../../components/ui/Modal.jsx';
import './Bookings.css';

const formatBookingTitle = (title = '') => {
  if (!title) return 'Service request';
  const isMostlyUppercase = title === title.toUpperCase();
  if (!isMostlyUppercase) return title;
  return title
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [negotiationHistory, setNegotiationHistory] = useState([]);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [payment, setPayment] = useState(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingRes, paymentRes] = await Promise.all([
        api.get(`/bookings/${id}`),
        api.get(`/payments/bookings/${id}`),
      ]);
      setBooking(bookingRes.data.booking);
      setNegotiationHistory(bookingRes.data.negotiationHistory || []);
      setCounterPrice(bookingRes.data.booking?.agreedPrice ?? '');
      setPayment(paymentRes.data.payment || null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to load this booking right now.');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const action = async (name) => {
    setBusy(true);
    try {
      await api.patch(`/bookings/${id}/${name}`, name === 'reject' ? { rejectionReason: 'I cannot take this job at the requested time.' } : {});
      const successMap = {
        cancel: 'Booking cancelled.',
        reject: 'Booking rejected.',
        start: 'Job marked as in progress.',
        complete: 'Job marked as completed.',
      };
      toast.success(successMap[name] || 'Booking updated successfully.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to update booking status.');
    } finally {
      setBusy(false);
    }
  };

  const submitCounterOffer = async () => {
    if (!counterPrice || Number(counterPrice) <= 0) {
      toast.error('Enter a valid positive price');
      return;
    }

    setBusy(true);
    try {
      await api.patch(`/bookings/${id}/price`, {
        agreedPrice: Number(counterPrice),
        note: counterNote.trim() || undefined,
      });
      toast.success('Price offer sent.');
      setCounterNote('');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to send price offer.');
    } finally {
      setBusy(false);
    }
  };

  const acceptAtPrice = async () => {
    if (counterPrice !== '' && Number(counterPrice) <= 0) {
      toast.error('Enter a valid positive price');
      return;
    }

    setBusy(true);
    try {
      const payload = counterPrice === '' ? {} : { agreedPrice: Number(counterPrice) };
      await api.patch(`/bookings/${id}/accept`, payload);
      toast.success('Booking accepted.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to accept this booking.');
    } finally {
      setBusy(false);
    }
  };

  const initiatePayment = async () => {
    setPaymentBusy(true);
    try {
      const { data } = await api.post(`/payments/bookings/${id}/initiate`);
      setPayment(data.payment);
      setPaymentModalOpen(true);
      toast.success('Simulation payment session started.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to initiate payment.');
    } finally {
      setPaymentBusy(false);
    }
  };

  const simulateOutcome = async (outcome) => {
    if (!payment?.id) return;

    setPaymentBusy(true);
    try {
      const { data } = await api.post(`/payments/${payment.id}/simulate`, { outcome });
      setPayment(data.payment);
      setPaymentModalOpen(false);
      const textMap = {
        success: 'Payment simulated successfully.',
        failed: 'Payment simulated as failed.',
        cancelled: 'Payment simulation cancelled.',
      };
      toast.success(textMap[outcome] || 'Simulation complete.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to simulate payment outcome.');
    } finally {
      setPaymentBusy(false);
    }
  };

  const retryPayment = async () => {
    if (!payment?.id) return;
    setPaymentBusy(true);
    try {
      const { data } = await api.post(`/payments/${payment.id}/retry`);
      setPayment(data.payment);
      setPaymentModalOpen(true);
      toast.success('Simulation reset. Choose an outcome.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to retry payment simulation.');
    } finally {
      setPaymentBusy(false);
    }
  };

  const refundPayment = async () => {
    if (!payment?.id) return;
    setPaymentBusy(true);
    try {
      const { data } = await api.post(`/payments/${payment.id}/refund`, {
        reason: 'User requested simulation refund',
      });
      setPayment(data.payment);
      toast.success('Simulation refund completed.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to refund payment.');
    } finally {
      setPaymentBusy(false);
    }
  };

  const requestCompletion = async () => {
    setBusy(true);
    try {
      await api.patch(`/bookings/${id}/request-completion`);
      toast.success('Completion request sent. Waiting for student confirmation.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to request completion.');
    } finally {
      setBusy(false);
    }
  };

  const confirmCompletion = async () => {
    setBusy(true);
    try {
      await api.patch(`/bookings/${id}/confirm-completion`);
      toast.success('Booking confirmed as completed. You can now leave a review.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to confirm completion.');
    } finally {
      setBusy(false);
    }
  };

  const declineCompletion = async () => {
    setBusy(true);
    try {
      await api.patch(`/bookings/${id}/decline-completion`, {
        reason: 'Please resolve remaining issues before completion confirmation.',
      });
      toast.info('Requested adjustments before confirming completion.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to decline completion request.');
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async () => {
    if (Number(reviewRating) < 1 || Number(reviewRating) > 5) {
      toast.error('Rating must be between 1 and 5.');
      return;
    }

    setBusy(true);
    try {
      await api.post(`/reviews/bookings/${id}`, {
        rating: Number(reviewRating),
        comment: reviewComment.trim() || undefined,
      });
      toast.success('Review submitted. Thank you!');
      setReviewComment('');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to submit review.');
    } finally {
      setBusy(false);
    }
  };

  const isStudent = user?.role === 'STUDENT';
  const isArtisan = user?.role === 'ARTISAN';
  const formatMoney = (value) => `NGN ${Number(value || 0).toLocaleString()}`;
  const paymentUnlocked = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(booking?.status || '');
  const paymentStatus = paymentUnlocked ? (payment?.status || 'PENDING') : 'UNAVAILABLE';
  const canStartJob = payment?.status === 'SUCCESS';
  const canStudentPay = isStudent && booking?.status === 'ACCEPTED';
  const canStudentRefund = isStudent && payment?.status === 'SUCCESS';
  const canShowPrimaryPay = canStudentPay && (!payment || payment.status === 'PENDING' || payment.status === 'FAILED');
  const hasPaymentTimeline = Boolean(payment?.events?.length);
  const latestPaymentEvent = hasPaymentTimeline ? payment.events[0] : null;
  const completionPending = Boolean(booking?.completionRequestedAt);
  const canStudentConfirmCompletion = isStudent && booking?.status === 'IN_PROGRESS' && completionPending;
  const canStudentReview = isStudent && booking?.status === 'COMPLETED' && !booking?.review;

  const handlePrimaryPay = async () => {
    if (!payment) {
      await initiatePayment();
      return;
    }

    if (payment.status === 'PENDING') {
      setPaymentModalOpen(true);
      return;
    }

    if (payment.status === 'FAILED') {
      await retryPayment();
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-8)' }}>Loading booking...</div>;
  }

  if (!booking) {
    return <div style={{ padding: 'var(--space-8)' }}>Booking not found.</div>;
  }

  const displayTitle = formatBookingTitle(booking.title);
  const chatParticipantId = isStudent ? booking.artisan?.user?.id : booking.student?.id;

  return (
    <section className="booking-detail-page animate-fade-in">
      <div className="booking-detail-toolbar">
        <Button variant="ghost" onClick={() => navigate('/bookings')}>
          Back to bookings
        </Button>
      </div>

      <div className="booking-detail card">

      <div className="booking-detail__header">
          <div className="booking-detail__headline">
            <small className="booking-detail__eyebrow">Service booking</small>
            <h1>{displayTitle}</h1>
            <p>Review service details, update status, and manage price offers.</p>
          </div>
          <Badge status={booking.status} dot>
            {booking.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="booking-detail__meta">
          <span><CalendarCheck size={16} /> {new Date(booking.scheduledAt).toLocaleString()}</span>
          <span><MapPin size={16} /> {booking.address}</span>
        </div>

        <div className="booking-detail__brief">
          <h3>Service brief</h3>
          <p>{booking.description}</p>
        </div>

        <div className="booking-detail__people">
          <div className="booking-detail__person-card">
            <h3>Artisan</h3>
            <div className="booking-detail__person">
              <Avatar src={booking.artisan?.avatarUrl} name={booking.artisan?.fullName} size="sm" />
              <span>{booking.artisan?.fullName}</span>
            </div>
          </div>
          <div className="booking-detail__person-card">
            <h3>Student</h3>
            <div className="booking-detail__person">
              <Avatar name={`${booking.student?.studentProfile?.firstName || ''} ${booking.student?.studentProfile?.lastName || ''}`} size="sm" />
              <span>{booking.student?.studentProfile?.firstName} {booking.student?.studentProfile?.lastName}</span>
            </div>
          </div>
        </div>

        <div className="booking-detail__footer">
          <div className="booking-detail__price">
            <small>Current offer</small>
            <strong>{booking.agreedPrice == null ? 'Price pending' : `NGN ${Number(booking.agreedPrice).toLocaleString()}`}</strong>
          </div>
          <div className="booking-detail__actions">
            {isStudent && booking.status === 'PENDING' && (
              <>
                <Button variant="ghost" loading={busy} onClick={() => action('cancel')}>
                  Cancel booking
                </Button>
                <Button variant="ghost" loading={busy} onClick={submitCounterOffer}>
                  Send price offer
                </Button>
              </>
            )}
            {isArtisan && booking.status === 'PENDING' && (
              <>
                <Button variant="ghost" loading={busy} onClick={() => action('reject')}>
                  Reject
                </Button>
                <Button loading={busy} onClick={acceptAtPrice}>
                  Accept request
                </Button>
                <Button variant="ghost" loading={busy} onClick={submitCounterOffer}>
                  Send counter-offer
                </Button>
              </>
            )}
            {isArtisan && booking.status === 'ACCEPTED' && (
              <Button loading={busy} onClick={() => action('start')} disabled={!canStartJob}>
                Mark in progress
              </Button>
            )}
            {isArtisan && booking.status === 'IN_PROGRESS' && (
              completionPending ? (
                <Button variant="ghost" disabled icon={ShieldCheck}>
                  Awaiting student confirmation
                </Button>
              ) : (
                <Button loading={busy} onClick={requestCompletion}>
                  Request completion confirmation
                </Button>
              )
            )}
            {canStudentConfirmCompletion && (
              <>
                <Button loading={busy} onClick={confirmCompletion} icon={ShieldCheck}>
                  Confirm completion
                </Button>
                <Button variant="ghost" loading={busy} onClick={declineCompletion}>
                  Request adjustments
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              icon={MessageSquare}
              onClick={() => navigate(chatParticipantId ? `/messages?bookingId=${booking.id}` : '/messages')}
            >
              Open chat
            </Button>
          </div>
        </div>

        <div className="booking-payment card">
          <div className="booking-payment__head">
            <div>
              <h3>Payment</h3>
              <p className="booking-payment__text">
                {!paymentUnlocked
                  ? 'Payment unlocks only after the artisan accepts this booking.'
                  : payment?.status === 'SUCCESS'
                    ? 'Payment confirmed. Job can be started.'
                    : 'No real card details required. One click is enough.'}
              </p>
            </div>
            <div className="booking-payment__head-right">
              {paymentStatus === 'UNAVAILABLE' ? (
                <Badge variant="neutral">Unavailable</Badge>
              ) : (
                <Badge status={paymentStatus}>
                  {paymentStatus.replace('_', ' ')}
                </Badge>
              )}
              {canShowPrimaryPay && (
                <Button loading={paymentBusy} onClick={handlePrimaryPay} icon={CreditCard}>
                  {payment?.status === 'FAILED' ? 'Retry payment' : 'Pay now'}
                </Button>
              )}
              {isStudent && !paymentUnlocked && (
                <Button variant="ghost" disabled>
                  Awaiting acceptance
                </Button>
              )}
            </div>
          </div>

          {paymentUnlocked && (
            <div className="booking-payment__summary">
              <div>
                <small>Total payable</small>
                <strong>{formatMoney(payment?.amount ?? booking.agreedPrice)}</strong>
                {payment?.paidAt && <p>Paid on {new Date(payment.paidAt).toLocaleString()}</p>}
              </div>
              <div>
                <small>Net to artisan</small>
                <strong>{formatMoney(payment?.artisanAmount ?? Number(booking.agreedPrice || 0) * 0.9)}</strong>
                <p>Platform fee {formatMoney(payment?.platformFee ?? Number(booking.agreedPrice || 0) * 0.1)}</p>
              </div>
            </div>
          )}

          {payment?.reference && (
            <div className="booking-payment__meta-row">
              <p className="booking-payment__ref">Reference: {payment.reference}</p>
              {latestPaymentEvent && (
                <p className="booking-payment__last-event">
                  Last update: {latestPaymentEvent.action.replaceAll('_', ' ')} · {new Date(latestPaymentEvent.createdAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="booking-payment__actions">
            {isStudent && booking.status === 'PENDING' && (
              <p className="booking-payment__hint">Payment unlocks once the artisan accepts this booking.</p>
            )}

            {canStudentRefund && (
              <Button variant="ghost" loading={paymentBusy} onClick={refundPayment}>
                Refund (simulate)
              </Button>
            )}

            {isArtisan && booking.status === 'ACCEPTED' && !canStartJob && (
              <p className="booking-payment__hint">Waiting for student payment before starting this job.</p>
            )}
          </div>

          {payment?.events?.length > 0 && (
            <details className="booking-payment__timeline">
              <summary>
                <span>Transaction timeline</span>
                <small>{payment.events.length} event{payment.events.length > 1 ? 's' : ''}</small>
              </summary>
              <ul>
                {payment.events.slice(0, 6).map((event) => (
                  <li key={event.id}>
                    <div>
                      <strong>{event.action.replaceAll('_', ' ')}</strong>
                      <p>{event.note || 'Payment event recorded'}</p>
                    </div>
                    <span>{new Date(event.createdAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {booking.status === 'IN_PROGRESS' && completionPending && (
          <div className="booking-completion card">
            <h3>Completion verification in progress</h3>
            <p>
              {isStudent
                ? 'The artisan requested completion confirmation. Verify the work and confirm, or request adjustments.'
                : 'Completion request sent to student. Waiting for student confirmation before the booking becomes completed.'}
            </p>
          </div>
        )}

        {booking.review && (
          <div className="booking-review card">
            <h3>Student review</h3>
            <p className="booking-review__rating">Rating: {booking.review.rating}/5</p>
            {booking.review.comment && <p>{booking.review.comment}</p>}
          </div>
        )}

        {canStudentReview && (
          <div className="booking-review card">
            <h3>Leave a review</h3>
            <p>Share feedback on this completed booking.</p>
            <div className="booking-counter__row">
              <div className="booking-filters__field">
                <label>Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="booking-filters__search"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(e.target.value)}
                />
              </div>
              <div className="booking-filters__field">
                <label>Comment</label>
                <input
                  type="text"
                  className="booking-filters__search"
                  maxLength={500}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the service quality, communication, and timeliness?"
                />
              </div>
            </div>
            <div className="booking-detail__actions">
              <Button loading={busy} onClick={submitReview}>Submit review</Button>
            </div>
          </div>
        )}

        {['PENDING', 'ACCEPTED'].includes(booking.status) && (
          <div className="booking-counter card">
            <h3>Price negotiation</h3>
            <p>Use this when scope or material costs change. Both sides can send offers while the booking is pending or accepted.</p>
            <div className="booking-counter__row">
              <div className="booking-filters__field">
                <label>Proposed price</label>
                <input
                  type="number"
                  className="booking-filters__search"
                  value={counterPrice}
                  min="1"
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="Enter new proposed price"
                />
              </div>
              <div className="booking-filters__field">
                <label>Negotiation note</label>
                <input
                  type="text"
                  className="booking-filters__search"
                  value={counterNote}
                  maxLength={250}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="Optional note (materials, timeline, scope updates)"
                />
              </div>
            </div>
          </div>
        )}

        {negotiationHistory.length > 0 && (
          <div className="booking-negotiation-history card">
            <h3>Negotiation history</h3>
            <p>Latest offer appears first.</p>
            <ul>
              {negotiationHistory.map((entry) => {
                const actorLabel = entry.by === 'artisan' ? 'Artisan' : entry.by === 'student' ? 'Student' : 'Participant';
                return (
                  <li key={entry.id} className="booking-negotiation-history__item">
                    <div className="booking-negotiation-history__top">
                      <strong>{entry.actorName || actorLabel}</strong>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="booking-negotiation-history__amount">
                      {entry.proposedPrice == null ? 'No price set' : `NGN ${Number(entry.proposedPrice).toLocaleString()}`}
                    </div>
                    {entry.note && <p>{entry.note}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <Modal
        isOpen={paymentModalOpen}
        onClose={() => !paymentBusy && setPaymentModalOpen(false)}
        title="Simulate payment"
        size="md"
      >
        <div className="payment-sim">
          <div className="payment-sim__card">
            <small>Mock Card (Auto-provided)</small>
            <strong>4242 4242 4242 4242</strong>
            <p>Exp 12/34 · CVV 123 · Name CampusConnect Test</p>
          </div>

          <div className="payment-sim__amount">
            <small>Charge amount</small>
            <strong>{formatMoney(payment?.amount ?? booking?.agreedPrice)}</strong>
          </div>

          <p className="payment-sim__caption">
            Pick any outcome below. This is a sandbox simulation and stores the transaction record in your database.
          </p>

          <div className="payment-sim__actions">
            <Button loading={paymentBusy} onClick={() => simulateOutcome('success')} icon={CheckCircle2}>
              Simulate success
            </Button>
            <Button variant="ghost" loading={paymentBusy} onClick={() => simulateOutcome('failed')} icon={XCircle}>
              Simulate failure
            </Button>
            <Button variant="ghost" loading={paymentBusy} onClick={() => simulateOutcome('cancelled')}>
              Cancel simulation
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
