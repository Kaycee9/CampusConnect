import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText, Star } from 'lucide-react';
import api from '../../lib/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import StarRating from '../../components/ui/StarRating.jsx';
import './Reviews.css';

const toMoney = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

function Stars({ value }) {
  const count = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <div className="reviews-stars" aria-label={`Rating ${count} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={14} className={index < count ? 'reviews-stars__active' : ''} />
      ))}
    </div>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const load = useCallback(async (active = true) => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings');
      if (!active) return;
      setBookings(data.bookings || []);
    } catch (error) {
      if (!active) return;
      toast.error(error.response?.data?.error || 'Unable to load reviews.');
    } finally {
      if (active) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    load(active);

    return () => {
      active = false;
    };
  }, [load]);

  const isStudent = user?.role === 'STUDENT';

  const reviewRows = useMemo(() => {
    return bookings
      .filter((booking) => booking.review)
      .map((booking) => ({
        bookingId: booking.id,
        title: booking.title,
        rating: booking.review.rating,
        comment: booking.review.comment,
        createdAt: booking.review.createdAt,
        amount: booking.payment?.amount || booking.agreedPrice || 0,
        artisanName: booking.artisan?.fullName || 'Artisan',
        studentName:
          `${booking.student?.studentProfile?.firstName || ''} ${booking.student?.studentProfile?.lastName || ''}`.trim() ||
          booking.student?.email ||
          'Student',
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [bookings]);

  const pendingStudentReviews = useMemo(() => {
    if (!isStudent) return [];

    return bookings
      .filter((booking) => booking.status === 'COMPLETED' && booking.payment?.status === 'SUCCESS' && !booking.review)
      .map((booking) => ({
        bookingId: booking.id,
        title: booking.title,
        artisanName: booking.artisan?.fullName || 'Artisan',
        amount: booking.payment?.amount || booking.agreedPrice || 0,
      }));
  }, [bookings, isStudent]);

  const updateDraft = (bookingId, key, value) => {
    setDrafts((prev) => {
      const current = prev[bookingId] || { rating: 5, comment: '' };
      return {
        ...prev,
        [bookingId]: {
          ...current,
          [key]: value,
        },
      };
    });
  };

  const submitInlineReview = async (bookingId) => {
    const draft = drafts[bookingId] || { rating: 5, comment: '' };
    const rating = Number(draft.rating || 0);

    if (rating < 1 || rating > 5) {
      toast.error('Please select a valid rating between 1 and 5.');
      return;
    }

    setSubmittingId(bookingId);
    try {
      await api.post(`/reviews/bookings/${bookingId}`, {
        rating,
        comment: draft.comment?.trim() || undefined,
      });

      toast.success('Review submitted successfully.');
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
      await load(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to submit review.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <section className="reviews-page animate-fade-in">
      <div className="reviews-hero card">
        <div>
          <small>{isStudent ? 'Student space' : 'Artisan space'}</small>
          <h1>{isStudent ? 'My Reviews' : 'Reviews Received'}</h1>
          <p>
            {isStudent
              ? 'See your submitted reviews and quickly finish pending ones from completed jobs.'
              : 'Track student feedback from completed paid bookings.'}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/bookings')}>Open bookings</Button>
      </div>

      {isStudent && (
        <div className="reviews-pending card">
          <div className="reviews-pending__head">
            <h2>Pending reviews</h2>
            <Badge status={pendingStudentReviews.length > 0 ? 'PENDING' : 'SUCCESS'}>
              {pendingStudentReviews.length} pending
            </Badge>
          </div>

          {pendingStudentReviews.length === 0 ? (
            <p className="reviews-empty">No pending reviews. Nice work keeping feedback up to date.</p>
          ) : (
            <div className="reviews-pending__list">
              {pendingStudentReviews.map((item) => (
                <article key={item.bookingId}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.artisanName} · {toMoney(item.amount)}</p>
                  </div>
                  <div className="reviews-pending__actions">
                    <div className="reviews-pending__stars">
                      <StarRating
                        value={Number(drafts[item.bookingId]?.rating || 5)}
                        onChange={(value) => updateDraft(item.bookingId, 'rating', value)}
                        size={16}
                      />
                    </div>
                    <input
                      type="text"
                      className="reviews-pending__comment"
                      value={drafts[item.bookingId]?.comment || ''}
                      onChange={(e) => updateDraft(item.bookingId, 'comment', e.target.value)}
                      placeholder="Optional comment"
                      maxLength={500}
                    />
                    <div className="reviews-pending__buttons">
                      <Button size="sm" loading={submittingId === item.bookingId} onClick={() => submitInlineReview(item.bookingId)}>
                        Submit review
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/bookings/${item.bookingId}`)} icon={MessageSquareText}>
                        Open booking
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="reviews-list card">
        <div className="reviews-list__head">
          <h2>{isStudent ? 'Submitted reviews' : 'Recent feedback'}</h2>
          <span>{reviewRows.length} total</span>
        </div>

        {loading ? (
          <p className="reviews-empty">Loading reviews...</p>
        ) : reviewRows.length === 0 ? (
          <p className="reviews-empty">No reviews available yet.</p>
        ) : (
          <div className="reviews-list__items">
            {reviewRows.map((row) => (
              <article className="review-item" key={`${row.bookingId}:${row.createdAt}`}>
                <div className="review-item__top">
                  <button type="button" className="review-item__title" onClick={() => navigate(`/bookings/${row.bookingId}`)}>
                    {row.title}
                  </button>
                  <span>{new Date(row.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="review-item__meta">
                  <Stars value={row.rating} />
                  <p>{isStudent ? `Artisan: ${row.artisanName}` : `Student: ${row.studentName}`}</p>
                </div>

                {row.comment ? <p className="review-item__comment">{row.comment}</p> : <p className="review-item__comment">No comment provided.</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
