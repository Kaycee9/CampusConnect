import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, HandCoins, RotateCcw, TrendingUp, Wallet, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../lib/api.js';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import './Earnings.css';

const toMoney = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const isPaymentUnlockedBooking = (status) => ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(status || '');

export default function Earnings() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState(null);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [activeAmount, setActiveAmount] = useState(0);

  const load = async (active) => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings');
      if (!active) return;
      setBookings(data.bookings || []);
    } catch (error) {
      if (!active) return;
      toast.error(error.response?.data?.error || 'Unable to load payments data.');
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    load(active);

    return () => {
      active = false;
    };
  }, [toast]);

  const role = user?.role;

  const paymentRows = useMemo(() => {
    return bookings
      .filter((booking) => booking.payment || isPaymentUnlockedBooking(booking.status))
      .map((booking) => {
        const hasPayment = Boolean(booking.payment);
        const roleCounterparty = role === 'ARTISAN'
          ? `${booking.student?.studentProfile?.firstName || ''} ${booking.student?.studentProfile?.lastName || ''}`.trim() || booking.student?.email || 'Student'
          : booking.artisan?.fullName || 'Artisan';

        const fallbackAmount = Number(booking.agreedPrice || 0);
        const fallbackFee = fallbackAmount * 0.1;
        const fallbackPayout = fallbackAmount * 0.9;

        const status = hasPayment
          ? booking.payment.status
          : booking.status === 'ACCEPTED'
            ? 'PENDING'
            : 'UNAVAILABLE';

        const canPayNow = role === 'STUDENT'
          && booking.status === 'ACCEPTED'
          && (!hasPayment || ['PENDING', 'FAILED'].includes(booking.payment.status));

        return {
          bookingId: booking.id,
          title: booking.title,
          counterparty: roleCounterparty,
          status,
          amount: hasPayment ? booking.payment.amount : fallbackAmount,
          fee: hasPayment ? booking.payment.platformFee : fallbackFee,
          payout: hasPayment ? booking.payment.artisanAmount : fallbackPayout,
          reference: hasPayment ? booking.payment.reference : null,
          paidAt: hasPayment ? booking.payment.paidAt : null,
          createdAt: hasPayment ? booking.payment.createdAt : booking.updatedAt,
          paymentId: hasPayment ? booking.payment.id : null,
          canPayNow,
        };
      })
      .sort((a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt));
  }, [bookings, role]);

  const metrics = useMemo(() => {
    const successful = paymentRows.filter((row) => row.status === 'SUCCESS');
    const refunded = paymentRows.filter((row) => row.status === 'REFUNDED');
    const pendingCount = paymentRows.filter((row) => row.status === 'PENDING').length;
    const failedCount = paymentRows.filter((row) => row.status === 'FAILED').length;
    const dueNow = paymentRows
      .filter((row) => row.canPayNow)
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const grossInflow = successful.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const totalFees = successful.reduce((sum, row) => sum + Number(row.fee || 0), 0);
    const netEarnings = successful.reduce((sum, row) => sum + Number(row.payout || 0), 0);
    const totalSpent = successful.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const refundedAmount = refunded.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    return {
      grossInflow,
      totalFees,
      netEarnings,
      totalSpent,
      refundedAmount,
      pendingCount,
      failedCount,
      dueNow,
    };
  }, [paymentRows]);
  const isArtisan = role === 'ARTISAN';

  const openPaymentFlow = async (row) => {
    setPaymentBusy(true);
    try {
      if (!row.paymentId) {
        const { data } = await api.post(`/payments/bookings/${row.bookingId}/initiate`);
        setActivePayment(data.payment);
      } else if (row.status === 'FAILED') {
        const { data } = await api.post(`/payments/${row.paymentId}/retry`);
        setActivePayment(data.payment);
      } else {
        setActivePayment({ id: row.paymentId, amount: row.amount });
      }

      setActiveBookingId(row.bookingId);
      setActiveAmount(row.amount);
      setPaymentModalOpen(true);
      await load(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to start payment flow.');
    } finally {
      setPaymentBusy(false);
    }
  };

  const simulateOutcome = async (outcome) => {
    if (!activePayment?.id) return;
    setPaymentBusy(true);
    try {
      await api.post(`/payments/${activePayment.id}/simulate`, { outcome });
      setPaymentModalOpen(false);
      setActivePayment(null);
      setActiveBookingId(null);
      await load(true);
      const map = {
        success: 'Payment completed.',
        failed: 'Payment failed. You can retry.',
        cancelled: 'Payment flow cancelled.',
      };
      toast.success(map[outcome] || 'Payment updated.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to complete simulation.');
    } finally {
      setPaymentBusy(false);
    }
  };

  return (
    <section className="earnings-page animate-fade-in">
      <div className="earnings-hero card">
        <div>
          <small>{isArtisan ? 'Artisan finance' : 'Student finance'}</small>
          <h1>{isArtisan ? 'Earnings' : 'Payments'}</h1>
          <p>
            {isArtisan
              ? 'Track successful payments, fees, refunds, and payout history from booking simulations.'
              : 'Track what you have paid, what is still pending, and any refunds across your bookings.'}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/bookings')}>View bookings</Button>
      </div>

      <div className="earnings-kpis">
        <article className="earnings-kpi card">
          <span className="earnings-kpi__icon"><Wallet size={16} /></span>
          <div>
            <small>{isArtisan ? 'Net earnings' : 'Total paid'}</small>
            <strong>{toMoney(isArtisan ? metrics.netEarnings : metrics.totalSpent)}</strong>
          </div>
        </article>
        <article className="earnings-kpi card">
          <span className="earnings-kpi__icon"><CreditCard size={16} /></span>
          <div>
            <small>{isArtisan ? 'Gross payments' : 'Payments attempted'}</small>
            <strong>{isArtisan ? toMoney(metrics.grossInflow) : paymentRows.length}</strong>
          </div>
        </article>
        <article className="earnings-kpi card">
          <span className="earnings-kpi__icon"><TrendingUp size={16} /></span>
          <div>
            <small>{isArtisan ? 'Platform fees' : 'Failed payments'}</small>
            <strong>{isArtisan ? toMoney(metrics.totalFees) : metrics.failedCount}</strong>
          </div>
        </article>
        <article className="earnings-kpi card">
          <span className="earnings-kpi__icon"><HandCoins size={16} /></span>
          <div>
            <small>{isArtisan ? 'Refunded / pending' : 'Due now / pending'}</small>
            <strong>
              {isArtisan
                ? `${toMoney(metrics.refundedAmount)} / ${metrics.pendingCount}`
                : `${toMoney(metrics.dueNow)} / ${metrics.pendingCount}`}
            </strong>
          </div>
        </article>
      </div>

      <div className="earnings-ledger card">
        <div className="earnings-ledger__head">
          <h2>{isArtisan ? 'Payment ledger' : 'Payment activity'}</h2>
          <span>{paymentRows.length} records</span>
        </div>

        {loading ? (
          <p className="earnings-ledger__empty">Loading earnings...</p>
        ) : paymentRows.length === 0 ? (
          <p className="earnings-ledger__empty">
            {isArtisan
              ? 'No payment records yet. Payments will appear here after students complete booking payment simulations.'
              : 'No payment records yet. Start from an accepted booking and use the Pay now button in booking details.'}
          </p>
        ) : (
          <div className="payments-feed">
            {paymentRows.map((row) => (
              <article className="payment-item" key={`${row.bookingId}:${row.reference || row.status}`}>
                <div className="payment-item__top">
                  <div>
                    <button
                      type="button"
                      className="payment-item__title"
                      onClick={() => navigate(`/bookings/${row.bookingId}`)}
                    >
                      {row.title}
                    </button>
                    <p>{isArtisan ? `Student: ${row.counterparty}` : `Artisan: ${row.counterparty}`}</p>
                  </div>
                  <Badge status={row.status}>{row.status}</Badge>
                </div>

                <div className="payment-item__meta">
                  <div>
                    <small>Amount</small>
                    <strong>{toMoney(row.amount)}</strong>
                  </div>
                  <div>
                    <small>{isArtisan ? 'Payout' : 'Fee'}</small>
                    <strong>{isArtisan ? toMoney(row.payout) : toMoney(row.fee)}</strong>
                  </div>
                  <div>
                    <small>Time</small>
                    <strong>{new Date(row.paidAt || row.createdAt).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="payment-item__actions">
                  {row.reference && <span className="payment-item__ref">{row.reference}</span>}
                  {row.canPayNow && (
                    <Button loading={paymentBusy} onClick={() => openPaymentFlow(row)} icon={CreditCard}>
                      {row.status === 'FAILED' ? 'Retry payment' : 'Pay now'}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={paymentModalOpen}
        onClose={() => !paymentBusy && setPaymentModalOpen(false)}
        title="Complete payment"
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
            <strong>{toMoney(activePayment?.amount ?? activeAmount)}</strong>
          </div>

          <p className="payment-sim__caption">
            Choose an outcome below. This simulation stores a real transaction record in your database.
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
            {activeBookingId && (
              <Button variant="ghost" onClick={() => navigate(`/bookings/${activeBookingId}`)} icon={RotateCcw}>
                View booking
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </section>
  );
}
