import db from '../config/database.js';

const PLATFORM_FEE_RATE = 0.1;

const makeReference = () => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SIM-${Date.now()}-${random}`;
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
      return res.json({ payment: serializePayment(booking.payment) });
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
        note: 'Simulation initiated',
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
        note: 'Simulation reopened',
      });
    }

    const hydrated = await db.payment.findUnique({
      where: { id: payment.id },
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    return res.status(201).json({ payment: serializePayment(hydrated) });
  } catch (error) {
    console.error('Initiate booking payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const simulatePaymentOutcome = async (req, res) => {
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
      return res.status(403).json({ error: 'Only the student can run payment simulation' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending payments can be simulated' });
    }

    const outcome = req.body.outcome;
    const map = {
      success: { status: 'SUCCESS', action: 'SIMULATED_SUCCESS', note: 'Simulation marked as successful' },
      failed: { status: 'FAILED', action: 'SIMULATED_FAILURE', note: 'Simulation marked as failed' },
      cancelled: { status: 'FAILED', action: 'SIMULATED_CANCELLED', note: 'Simulation cancelled by user' },
    };

    const selected = map[outcome];
    if (!selected) {
      return res.status(400).json({ error: 'Invalid simulation outcome' });
    }

    const updated = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: selected.status,
        paidAt: selected.status === 'SUCCESS' ? new Date() : null,
      },
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    await createPaymentEvent({
      paymentId: payment.id,
      actorId: req.user.userId,
      action: selected.action,
      fromStatus: payment.status,
      toStatus: selected.status,
      note: selected.note,
      metadata: { outcome },
    });

    const refreshed = await db.payment.findUnique({
      where: { id: payment.id },
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    return res.json({ payment: serializePayment(refreshed) });
  } catch (error) {
    console.error('Simulate payment outcome error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const retryPaymentSimulation = async (req, res) => {
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
      return res.status(403).json({ error: 'Only the student can retry payment simulation' });
    }

    if (payment.status !== 'FAILED') {
      return res.status(400).json({ error: 'Only failed payments can be retried' });
    }

    const updated = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PENDING',
        reference: makeReference(),
        paidAt: null,
      },
    });

    await createPaymentEvent({
      paymentId: payment.id,
      actorId: req.user.userId,
      action: 'RETRY',
      fromStatus: payment.status,
      toStatus: 'PENDING',
      note: 'Retry simulation requested',
    });

    const refreshed = await db.payment.findUnique({
      where: { id: updated.id },
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    return res.json({ payment: serializePayment(refreshed) });
  } catch (error) {
    console.error('Retry payment simulation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
      note: req.body.reason || 'Simulation refund completed',
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
