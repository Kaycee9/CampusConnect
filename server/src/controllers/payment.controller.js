import db from '../config/database.js';
import env from '../config/env.js';
import {
  initializePaystackTransaction,
  isValidPaystackSignature,
  verifyPaystackTransaction,
} from '../lib/paystack.js';

const PLATFORM_FEE_RATE = Math.max(0, Number(env.PLATFORM_FEE_PERCENT || 10) / 100);

const makeReference = () => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PAY-${Date.now()}-${random}`;
};

const toCurrencyAmount = (value) => Number(Number(value || 0).toFixed(2));

const breakdownAmount = (amount) => {
  const normalized = toCurrencyAmount(amount);
  const platformFee = toCurrencyAmount(normalized * PLATFORM_FEE_RATE);
  const artisanAmount = toCurrencyAmount(normalized - platformFee);

  return {
    amount: normalized,
    platformFee,
    artisanAmount,
  };
};

const toMinorUnit = (value) => Math.round(Number(value || 0) * 100);

const getBookingWithPayment = async (bookingId) => {
  return db.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: { include: { studentProfile: true } },
      artisan: { include: { user: true } },
      payment: {
        include: {
          events: { orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });
};

const getArtisanProfileByUser = async (userId) => {
  return db.artisanProfile.findUnique({ where: { userId } });
};

const getEligibleWithdrawalPayments = async (artisanId) => {
  return db.payment.findMany({
    where: {
      status: 'SUCCESS',
      booking: {
        artisanId,
        status: 'COMPLETED',
      },
      withdrawalItem: { is: null },
    },
    include: {
      booking: true,
    },
    orderBy: { createdAt: 'asc' },
  });
};

const isBookingParticipant = (booking, user) => {
  const isStudentOwner = booking.studentId === user.userId;
  const isArtisanOwner = booking.artisan.userId === user.userId;
  const isAdmin = user.role === 'ADMIN';
  return { isStudentOwner, isArtisanOwner, isAdmin };
};

const ensureBookingAccess = (booking, user) => {
  const { isStudentOwner, isArtisanOwner, isAdmin } = isBookingParticipant(booking, user);
  if (!isStudentOwner && !isArtisanOwner && !isAdmin) {
    return null;
  }
  return { isStudentOwner, isArtisanOwner, isAdmin };
};

const serializePayment = (payment) => {
  if (!payment) return null;

  return {
    id: payment.id,
    bookingId: payment.bookingId,
    amount: payment.amount,
    platformFee: payment.platformFee,
    artisanAmount: payment.artisanAmount,
    reference: payment.reference,
    paystackReference: payment.paystackRef,
    status: payment.status,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    events: (payment.events || []).map((event) => ({
      id: event.id,
      action: event.action,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      note: event.note,
      metadata: event.metadata,
      createdAt: event.createdAt,
      actorId: event.actorId,
    })),
  };
};

const mapGatewayStatus = (status) => {
  if (status === 'success') return 'SUCCESS';
  if (status === 'failed' || status === 'abandoned' || status === 'reversed') return 'FAILED';
  return 'PENDING';
};

const updatePaymentStatus = async ({ paymentId, fromStatus, toStatus, actorId, action, note, metadata, paidAt, paystackReference }) => {
  const payload = { status: toStatus };

  if (toStatus === 'SUCCESS') {
    payload.paidAt = paidAt || new Date();
  }

  if (toStatus !== 'SUCCESS' && fromStatus !== 'SUCCESS') {
    payload.paidAt = null;
  }

  if (paystackReference) {
    payload.paystackRef = paystackReference;
  }

  await db.payment.update({
    where: { id: paymentId },
    data: payload,
  });

  await createPaymentEvent({
    paymentId,
    actorId,
    action,
    fromStatus,
    toStatus,
    note,
    metadata,
  });

  return db.payment.findUnique({
    where: { id: paymentId },
    include: { events: { orderBy: { createdAt: 'desc' } } },
  });
};

const createPaymentEvent = ({ paymentId, actorId, action, fromStatus, toStatus, note, metadata }) => {
  return db.paymentEvent.create({
    data: {
      paymentId,
      actorId: actorId || null,
      action,
      fromStatus: fromStatus || null,
      toStatus: toStatus || null,
      note: note || null,
      metadata: metadata || undefined,
    },
  });
};

export const getBookingPayment = async (req, res) => {
  try {
    const booking = await getBookingWithPayment(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const access = ensureBookingAccess(booking, req.user);
    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json({ payment: serializePayment(booking.payment) });
  } catch (error) {
    console.error('Get booking payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const initiateBookingPayment = async (req, res) => {
  try {
    const booking = await getBookingWithPayment(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const access = ensureBookingAccess(booking, req.user);
    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!access.isStudentOwner && !access.isAdmin) {
      return res.status(403).json({ error: 'Only the student can initiate payment' });
    }

    if (booking.status !== 'ACCEPTED') {
      return res.status(400).json({ error: 'Payment can only be initiated for accepted bookings' });
    }

    if (!Number.isFinite(Number(booking.agreedPrice)) || Number(booking.agreedPrice) <= 0) {
      return res.status(400).json({ error: 'Booking needs a valid agreed price before payment' });
    }

    if (booking.payment?.status === 'SUCCESS') {
      return res.json({
        payment: serializePayment(booking.payment),
        checkout: null,
      });
    }

    if (booking.payment?.status === 'REFUNDED') {
      return res.status(400).json({ error: 'This booking payment has been refunded and cannot be re-initiated' });
    }

    const amounts = breakdownAmount(booking.agreedPrice);
    let payment;

    if (!booking.payment) {
      payment = await db.payment.create({
        data: {
          bookingId: booking.id,
          amount: amounts.amount,
          platformFee: amounts.platformFee,
          artisanAmount: amounts.artisanAmount,
          reference: makeReference(),
          status: 'PENDING',
        },
      });

      await createPaymentEvent({
        paymentId: payment.id,
        actorId: req.user.userId,
        action: 'INITIATED',
        fromStatus: null,
        toStatus: 'PENDING',
        note: 'Checkout initialized',
      });
    } else {
      payment = await db.payment.update({
        where: { id: booking.payment.id },
        data: {
          amount: amounts.amount,
          platformFee: amounts.platformFee,
          artisanAmount: amounts.artisanAmount,
          reference: makeReference(),
          status: 'PENDING',
          paidAt: null,
        },
      });

      await createPaymentEvent({
        paymentId: payment.id,
        actorId: req.user.userId,
        action: 'REOPENED',
        fromStatus: booking.payment.status,
        toStatus: 'PENDING',
        note: 'Checkout reinitialized',
      });
    }

    const callbackUrl = `${env.CLIENT_URL}/bookings/${booking.id}`;

    const checkout = await initializePaystackTransaction({
      email: booking.student.email,
      amount: toMinorUnit(amounts.amount),
      reference: payment.reference,
      callback_url: callbackUrl,
      metadata: {
        bookingId: booking.id,
        paymentId: payment.id,
        studentId: booking.studentId,
        artisanId: booking.artisanId,
      },
    });

    const hydrated = await db.payment.findUnique({
      where: { id: payment.id },
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    return res.status(201).json({
      payment: serializePayment(hydrated),
      checkout: {
        authorizationUrl: checkout.authorization_url,
        accessCode: checkout.access_code,
        reference: checkout.reference,
      },
    });
  } catch (error) {
    console.error('Initiate booking payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyPaymentStatus = async (req, res) => {
  try {
    const payment = await db.payment.findUnique({
      where: { id: req.params.paymentId },
      include: {
        booking: {
          include: {
            artisan: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const access = ensureBookingAccess(payment.booking, req.user);
    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!access.isStudentOwner && !access.isAdmin) {
      return res.status(403).json({ error: 'Only the student can verify this payment' });
    }

    if (payment.status === 'SUCCESS') {
      const alreadyPaid = await db.payment.findUnique({
        where: { id: payment.id },
        include: { events: { orderBy: { createdAt: 'desc' } } },
      });
      return res.json({ payment: serializePayment(alreadyPaid) });
    }

    const gateway = await verifyPaystackTransaction(payment.reference);
    const nextStatus = mapGatewayStatus(gateway.status);
    const expectedAmount = toMinorUnit(payment.amount);

    if (Number(gateway.amount) !== expectedAmount) {
      await createPaymentEvent({
        paymentId: payment.id,
        actorId: req.user.userId,
        action: 'VERIFY_AMOUNT_MISMATCH',
        fromStatus: payment.status,
        toStatus: payment.status,
        note: 'Gateway amount does not match expected amount',
        metadata: {
          gatewayAmount: gateway.amount,
          expectedAmount,
          reference: payment.reference,
        },
      });
      return res.status(409).json({ error: 'Gateway amount mismatch. Please contact support.' });
    }

    const action = nextStatus === 'SUCCESS' ? 'VERIFY_SUCCESS' : 'VERIFY_PENDING_OR_FAILED';
    const note = nextStatus === 'SUCCESS'
      ? 'Verified successfully with Paystack'
      : `Paystack status is ${gateway.status}`;

    const refreshed = await updatePaymentStatus({
      paymentId: payment.id,
      fromStatus: payment.status,
      toStatus: nextStatus,
      actorId: req.user.userId,
      action,
      note,
      metadata: {
        gatewayStatus: gateway.status,
        reference: payment.reference,
      },
      paidAt: gateway.paid_at ? new Date(gateway.paid_at) : undefined,
      paystackReference: String(gateway.reference || ''),
    });

    return res.json({ payment: serializePayment(refreshed) });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const handlePaystackWebhook = async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    const signature = req.headers['x-paystack-signature'];

    if (!isValidPaystackSignature(rawBody, String(signature || ''))) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (_error) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    if (!event?.data?.reference) {
      return res.status(200).json({ ok: true });
    }

    if (event.event !== 'charge.success' && event.event !== 'charge.failed') {
      return res.status(200).json({ ok: true });
    }

    const payment = await db.payment.findUnique({
      where: { reference: String(event.data.reference) },
    });

    if (!payment) {
      return res.status(200).json({ ok: true });
    }

    const expectedAmount = toMinorUnit(payment.amount);
    if (Number(event.data.amount) !== expectedAmount) {
      await createPaymentEvent({
        paymentId: payment.id,
        action: 'WEBHOOK_AMOUNT_MISMATCH',
        fromStatus: payment.status,
        toStatus: payment.status,
        note: 'Webhook amount does not match expected amount',
        metadata: {
          gatewayAmount: event.data.amount,
          expectedAmount,
          event: event.event,
        },
      });
      return res.status(200).json({ ok: true });
    }

    const nextStatus = event.event === 'charge.success' ? 'SUCCESS' : 'FAILED';

    if (payment.status === nextStatus || payment.status === 'REFUNDED') {
      return res.status(200).json({ ok: true });
    }

    await updatePaymentStatus({
      paymentId: payment.id,
      fromStatus: payment.status,
      toStatus: nextStatus,
      action: event.event === 'charge.success' ? 'WEBHOOK_SUCCESS' : 'WEBHOOK_FAILED',
      note: `Processed ${event.event} webhook`,
      metadata: {
        event: event.event,
        reference: event.data.reference,
      },
      paidAt: event.data.paid_at ? new Date(event.data.paid_at) : undefined,
      paystackReference: String(event.data.reference || ''),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return res.status(200).json({ ok: true });
  }
};

export const refundPayment = async (req, res) => {
  try {
    const payment = await db.payment.findUnique({
      where: { id: req.params.paymentId },
      include: {
        booking: {
          include: {
            artisan: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const access = ensureBookingAccess(payment.booking, req.user);
    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!access.isStudentOwner && !access.isAdmin) {
      return res.status(403).json({ error: 'Only the student or admin can refund this payment' });
    }

    if (payment.status !== 'SUCCESS') {
      return res.status(400).json({ error: 'Only successful payments can be refunded' });
    }

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
      },
    });

    await createPaymentEvent({
      paymentId: payment.id,
      actorId: req.user.userId,
      action: 'REFUND',
      fromStatus: payment.status,
      toStatus: 'REFUNDED',
      note: req.body.reason || 'Refund recorded',
      metadata: req.body.reason ? { reason: req.body.reason } : undefined,
    });

    const refreshed = await db.payment.findUnique({
      where: { id: payment.id },
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    return res.json({ payment: serializePayment(refreshed) });
  } catch (error) {
    console.error('Refund payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWithdrawalSummary = async (req, res) => {
  try {
    if (req.user.role !== 'ARTISAN') {
      return res.status(403).json({ error: 'Only artisans can view withdrawal summary' });
    }

    const artisan = await getArtisanProfileByUser(req.user.userId);
    if (!artisan) {
      return res.status(404).json({ error: 'Artisan profile not found' });
    }

    const eligiblePayments = await getEligibleWithdrawalPayments(artisan.id);
    const availableBalance = eligiblePayments.reduce((sum, payment) => sum + Number(payment.artisanAmount || 0), 0);

    const pendingRequests = await db.withdrawalRequest.findMany({
      where: {
        artisanId: artisan.id,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    const recentRequests = await db.withdrawalRequest.findMany({
      where: { artisanId: artisan.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: true,
      },
    });

    const pendingAmount = pendingRequests.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return res.json({
      availableBalance: toCurrencyAmount(availableBalance),
      eligibleCount: eligiblePayments.length,
      pendingAmount: toCurrencyAmount(pendingAmount),
      requests: recentRequests.map((request) => ({
        id: request.id,
        amount: request.amount,
        status: request.status,
        note: request.note,
        itemCount: request.items.length,
        createdAt: request.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get withdrawal summary error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    if (req.user.role !== 'ARTISAN') {
      return res.status(403).json({ error: 'Only artisans can request withdrawals' });
    }

    const artisan = await getArtisanProfileByUser(req.user.userId);
    if (!artisan) {
      return res.status(404).json({ error: 'Artisan profile not found' });
    }

    const eligiblePayments = await getEligibleWithdrawalPayments(artisan.id);
    if (eligiblePayments.length === 0) {
      return res.status(400).json({ error: 'No completed paid bookings are currently eligible for withdrawal' });
    }

    const amount = toCurrencyAmount(
      eligiblePayments.reduce((sum, payment) => sum + Number(payment.artisanAmount || 0), 0)
    );

    const created = await db.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.create({
        data: {
          artisanId: artisan.id,
          amount,
          status: 'PENDING',
          note: req.body.note?.trim() || null,
        },
      });

      await tx.withdrawalItem.createMany({
        data: eligiblePayments.map((payment) => ({
          requestId: request.id,
          paymentId: payment.id,
          amount: toCurrencyAmount(payment.artisanAmount),
        })),
      });

      return tx.withdrawalRequest.findUnique({
        where: { id: request.id },
        include: {
          items: true,
        },
      });
    });

    return res.status(201).json({
      request: {
        id: created.id,
        amount: created.amount,
        status: created.status,
        note: created.note,
        itemCount: created.items.length,
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    console.error('Request withdrawal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
