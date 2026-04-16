import db from '../config/database.js';
import { sendEmail } from '../utils/email.js';

const statusTransitions = {
  accept: { from: ['PENDING'], to: 'ACCEPTED', actor: 'ARTISAN' },
  reject: { from: ['PENDING'], to: 'REJECTED', actor: 'ARTISAN' },
  start: { from: ['ACCEPTED'], to: 'IN_PROGRESS', actor: 'ARTISAN' },
  complete: { from: ['IN_PROGRESS'], to: 'COMPLETED', actor: 'ARTISAN' },
  cancel: { from: ['PENDING'], to: 'CANCELLED', actor: 'STUDENT' },
};

const buildBookingWhere = (user) => {
  if (user.role === 'STUDENT') {
    return { studentId: user.userId };
  }

  return { artisan: { userId: user.userId } };
};

const getArtisanOwner = async (userId) => {
  return db.artisanProfile.findUnique({ where: { userId }, include: { user: true } });
};

const getStudentOwner = async (userId) => {
  return db.studentProfile.findUnique({ where: { userId }, include: { user: true } });
};

const serializeBooking = (booking) => ({
  id: booking.id,
  title: booking.title,
  description: booking.description,
  address: booking.address,
  lat: booking.lat,
  lng: booking.lng,
  scheduledAt: booking.scheduledAt,
  agreedPrice: booking.agreedPrice,
  status: booking.status,
  rejectionReason: booking.rejectionReason,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
  student: booking.student
    ? {
      id: booking.student.id,
      email: booking.student.email,
      studentProfile: booking.student.studentProfile,
    }
    : null,
  artisan: booking.artisan
    ? {
      id: booking.artisan.id,
      firstName: booking.artisan.firstName,
      lastName: booking.artisan.lastName,
      fullName: `${booking.artisan.firstName} ${booking.artisan.lastName}`.trim(),
      avatarUrl: booking.artisan.avatarUrl,
      category: booking.artisan.category,
      isAvailable: booking.artisan.isAvailable,
      user: booking.artisan.user,
    }
    : null,
  payment: booking.payment || null,
  review: booking.review || null,
});

const notifyUser = ({ userId, title, body, type, metadata }) => {
  db.notification.create({
    data: {
      userId,
      title,
      body,
      type,
      metadata: metadata || undefined,
    },
  }).catch((error) => {
    console.error('Booking notification create failed:', error);
  });
};

const sendSafeEmail = ({ to, subject, html }) => {
  sendEmail({ to, subject, html }).catch((error) => {
    console.error('Booking email send failed:', error);
  });
};

const toTitleCase = (value = '') => {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatBookingTitle = (title = '') => {
  if (!title) return 'Service request';
  if (title !== title.toUpperCase()) return title;
  return toTitleCase(title);
};

const formatPrice = (value) => {
  if (value == null) return 'pending agreement';
  return `NGN ${Number(value).toLocaleString()}`;
};

const isBookingParticipant = (booking, user) => {
  const isStudentOwner = booking.studentId === user.userId;
  const isArtisanOwner = booking.artisan.userId === user.userId;
  const isAdmin = user.role === 'ADMIN';
  return { isStudentOwner, isArtisanOwner, isAdmin };
};

const getNegotiationHistory = async (booking) => {
  const records = await db.notification.findMany({
    where: {
      userId: { in: [booking.studentId, booking.artisan.userId] },
      type: 'BOOKING_NEGOTIATION',
    },
    orderBy: { createdAt: 'desc' },
  });

  const unique = new Map();

  for (const record of records) {
    const metadata = record.metadata || {};
    if (metadata.bookingId !== booking.id) continue;
    const offerId = metadata.offerId;
    if (!offerId || unique.has(offerId)) continue;

    unique.set(offerId, {
      id: offerId,
      bookingId: booking.id,
      proposedPrice: metadata.proposedPrice ?? null,
      note: metadata.note || null,
      by: metadata.by || 'unknown',
      actorName: metadata.actorName || null,
      createdAt: record.createdAt,
    });
  }

  return Array.from(unique.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const createBooking = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can create bookings' });
    }

    const {
      artisanId,
      title,
      description,
      address,
      scheduledAt,
      agreedPrice,
      lat,
      lng,
    } = req.body;

    const artisan = await db.artisanProfile.findUnique({
      where: { id: artisanId },
      include: { user: true },
    });

    if (!artisan) {
      return res.status(404).json({ error: 'Artisan not found' });
    }

    const student = await getStudentOwner(req.user.userId);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const booking = await db.booking.create({
      data: {
        studentId: req.user.userId,
        artisanId,
        title,
        description,
        address,
        scheduledAt: new Date(scheduledAt),
        agreedPrice: agreedPrice != null ? Number(agreedPrice) : artisan.startingPrice || null,
        lat: lat != null ? Number(lat) : null,
        lng: lng != null ? Number(lng) : null,
      },
      include: {
        student: { include: { studentProfile: true } },
        artisan: { include: { user: true } },
      },
    });

    notifyUser({
      userId: artisan.userId,
      title: 'New booking request',
      body: `${student.firstName} ${student.lastName} sent a booking request for ${formatBookingTitle(title)}`,
      type: 'BOOKING_REQUEST',
      metadata: { bookingId: booking.id, artisanId },
    });

    sendSafeEmail({
      to: artisan.user.email,
      subject: 'New booking request on CampusConnect',
      html: `
        <p>Hello ${artisan.firstName},</p>
        <p>You have a new booking request for <strong>${formatBookingTitle(title)}</strong>.</p>
        <p>Proposed price: <strong>${formatPrice(agreedPrice != null ? Number(agreedPrice) : artisan.startingPrice)}</strong></p>
        <p>Scheduled for: <strong>${new Date(scheduledAt).toLocaleString()}</strong></p>
        <p>Open CampusConnect to accept or reject it.</p>
      `,
    });

    return res.status(201).json({ booking: serializeBooking(booking) });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const listBookings = async (req, res) => {
  try {
    const where = buildBookingWhere(req.user);

    const bookings = await db.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { studentProfile: true } },
        artisan: { include: { user: true } },
        payment: true,
        review: true,
      },
    });

    return res.json({ bookings: bookings.map(serializeBooking) });
  } catch (error) {
    console.error('List bookings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBooking = async (req, res) => {
  try {
    const booking = await db.booking.findUnique({
      where: { id: req.params.id },
      include: {
        student: { include: { studentProfile: true } },
        artisan: { include: { user: true } },
        payment: true,
        review: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const { isStudentOwner, isArtisanOwner, isAdmin } = isBookingParticipant(booking, req.user);

    if (!isStudentOwner && !isArtisanOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const negotiationHistory = await getNegotiationHistory(booking);
    return res.json({ booking: serializeBooking(booking), negotiationHistory });
  } catch (error) {
    console.error('Get booking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const runStatusTransition = async (req, res, action) => {
  try {
    const config = statusTransitions[action];
    const booking = await db.booking.findUnique({
      where: { id: req.params.id },
      include: {
        student: { include: { studentProfile: true } },
        artisan: { include: { user: true } },
        payment: true,
        review: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!config.from.includes(booking.status)) {
      return res.status(400).json({ error: `Cannot ${action} a ${booking.status.toLowerCase()} booking` });
    }

    if (req.user.role !== config.actor) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { isStudentOwner, isArtisanOwner } = isBookingParticipant(booking, req.user);

    if ((config.actor === 'STUDENT' && !isStudentOwner) || (config.actor === 'ARTISAN' && !isArtisanOwner)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = { status: config.to };
    if (action === 'accept' && req.body.agreedPrice != null) {
      updateData.agreedPrice = Number(req.body.agreedPrice);
    }
    if (action === 'reject') {
      updateData.rejectionReason = req.body.rejectionReason || null;
    }

    const updatedBooking = await db.booking.update({
      where: { id: booking.id },
      data: updateData,
      include: {
        student: { include: { studentProfile: true } },
        artisan: { include: { user: true } },
        payment: true,
        review: true,
      },
    });

    const statusLabel = config.to.replace('_', ' ').toLowerCase();
    const studentName = `${booking.student.studentProfile?.firstName || ''} ${booking.student.studentProfile?.lastName || ''}`.trim();
    const artisanName = `${booking.artisan.firstName} ${booking.artisan.lastName}`.trim();

    if (config.actor === 'ARTISAN') {
      notifyUser({
        userId: booking.studentId,
        title: `Booking ${toTitleCase(statusLabel)}`,
        body: `${artisanName} updated your booking to ${statusLabel}. Current offer: ${formatPrice(updatedBooking.agreedPrice)}.`,
        type: 'BOOKING_STATUS',
        metadata: { bookingId: booking.id, status: config.to },
      });

      await sendSafeEmail({
        to: booking.student.email,
        subject: `Your booking is now ${toTitleCase(statusLabel)}`,
        html: `
          <p>Hello ${studentName || 'there'},</p>
          <p>Your booking for <strong>${formatBookingTitle(booking.title)}</strong> is now <strong>${statusLabel}</strong>.</p>
          <p>Current agreed price: <strong>${formatPrice(updatedBooking.agreedPrice)}</strong></p>
          ${action === 'reject' && booking.rejectionReason ? `<p>Reason: ${booking.rejectionReason}</p>` : ''}
        `,
      });
    } else {
      notifyUser({
        userId: booking.artisan.userId,
        title: `Booking ${toTitleCase(statusLabel)}`,
        body: `${studentName || 'A student'} cancelled the booking request.`,
        type: 'BOOKING_STATUS',
        metadata: { bookingId: booking.id, status: config.to },
      });

      await sendSafeEmail({
        to: booking.artisan.user.email,
        subject: `Booking ${toTitleCase(statusLabel)}`,
        html: `
          <p>Hello ${artisanName || 'there'},</p>
          <p>A student cancelled the booking for <strong>${formatBookingTitle(booking.title)}</strong>.</p>
          <p>Last proposed price was <strong>${formatPrice(booking.agreedPrice)}</strong>.</p>
        `,
      });
    }

    return res.json({ booking: serializeBooking(updatedBooking) });
  } catch (error) {
    console.error(`${action} booking error:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const acceptBooking = async (req, res) => runStatusTransition(req, res, 'accept');
export const rejectBooking = async (req, res) => runStatusTransition(req, res, 'reject');
export const startBooking = async (req, res) => runStatusTransition(req, res, 'start');
export const completeBooking = async (req, res) => runStatusTransition(req, res, 'complete');
export const cancelBooking = async (req, res) => runStatusTransition(req, res, 'cancel');

export const updateBookingPrice = async (req, res) => {
  try {
    const booking = await db.booking.findUnique({
      where: { id: req.params.id },
      include: {
        student: { include: { studentProfile: true } },
        artisan: { include: { user: true } },
        payment: true,
        review: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!['PENDING', 'ACCEPTED'].includes(booking.status)) {
      return res.status(400).json({ error: 'Price can only be updated for pending or accepted bookings' });
    }

    const { isStudentOwner, isArtisanOwner, isAdmin } = isBookingParticipant(booking, req.user);
    if (!isStudentOwner && !isArtisanOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const nextPrice = Number(req.body.agreedPrice);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      return res.status(400).json({ error: 'Provide a valid positive price' });
    }

    const updatedBooking = await db.booking.update({
      where: { id: booking.id },
      data: { agreedPrice: nextPrice },
      include: {
        student: { include: { studentProfile: true } },
        artisan: { include: { user: true } },
        payment: true,
        review: true,
      },
    });

    const senderLabel = isArtisanOwner ? 'artisan' : 'student';
    const receiverUserId = isArtisanOwner ? booking.studentId : booking.artisan.userId;
    const receiverEmail = isArtisanOwner ? booking.student.email : booking.artisan.user.email;
    const actorName = isArtisanOwner
      ? `${booking.artisan.firstName} ${booking.artisan.lastName}`.trim()
      : `${booking.student.studentProfile?.firstName || ''} ${booking.student.studentProfile?.lastName || ''}`.trim() || 'A student';
    const offerId = `${booking.id}:${Date.now()}:${senderLabel}`;
    const metadata = {
      bookingId: booking.id,
      offerId,
      proposedPrice: nextPrice,
      by: senderLabel,
      actorName,
      note: req.body.note || null,
    };

    notifyUser({
      userId: receiverUserId,
      title: 'Price counter-offer',
      body: `${actorName} proposed ${formatPrice(nextPrice)} for ${formatBookingTitle(booking.title)}.`,
      type: 'BOOKING_NEGOTIATION',
      metadata,
    });

    notifyUser({
      userId: isArtisanOwner ? booking.artisan.userId : booking.studentId,
      title: 'Price offer sent',
      body: `You proposed ${formatPrice(nextPrice)} for ${formatBookingTitle(booking.title)}.`,
      type: 'BOOKING_NEGOTIATION',
      metadata,
    });

    await sendSafeEmail({
      to: receiverEmail,
      subject: `New price offer for ${formatBookingTitle(booking.title)}`,
      html: `
        <p>Hello,</p>
        <p>${actorName} proposed a new price of <strong>${formatPrice(nextPrice)}</strong>.</p>
        ${req.body.note ? `<p>Note: ${req.body.note}</p>` : ''}
        <p>Open CampusConnect to respond to this offer.</p>
      `,
    });

    const negotiationHistory = await getNegotiationHistory(updatedBooking);
    return res.json({ booking: serializeBooking(updatedBooking), negotiationHistory });
  } catch (error) {
    console.error('Update booking price error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
