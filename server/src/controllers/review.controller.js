import db from '../config/database.js';

const serializeReview = (review) => ({
  id: review.id,
  bookingId: review.bookingId,
  studentId: review.studentId,
  artisanId: review.artisanId,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
});

const getStudentProfileByUserId = async (userId) => {
  return db.studentProfile.findUnique({ where: { userId } });
};

export const getBookingReview = async (req, res) => {
  try {
    const booking = await db.booking.findUnique({
      where: { id: req.params.bookingId },
      include: {
        artisan: true,
        review: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isStudent = booking.studentId === req.user.userId;
    const isArtisan = booking.artisan.userId === req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isStudent && !isArtisan && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json({ review: booking.review ? serializeReview(booking.review) : null });
  } catch (error) {
    console.error('Get booking review error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBookingReview = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can submit reviews' });
    }

    const booking = await db.booking.findUnique({
      where: { id: req.params.bookingId },
      include: {
        artisan: true,
        review: true,
        payment: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.studentId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed bookings' });
    }

    if (!booking.payment || booking.payment.status !== 'SUCCESS') {
      return res.status(400).json({ error: 'Only successfully paid bookings can be reviewed' });
    }

    if (booking.review) {
      return res.status(400).json({ error: 'Review already submitted for this booking' });
    }

    const studentProfile = await getStudentProfileByUserId(req.user.userId);
    if (!studentProfile) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const rating = Number(req.body.rating);
    const comment = req.body.comment?.trim() || null;

    const review = await db.review.create({
      data: {
        bookingId: booking.id,
        studentId: studentProfile.id,
        artisanId: booking.artisanId,
        rating,
        comment,
      },
    });

    const stats = await db.review.aggregate({
      where: { artisanId: booking.artisanId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const completedJobs = await db.booking.count({
      where: {
        artisanId: booking.artisanId,
        status: 'COMPLETED',
      },
    });

    await db.artisanProfile.update({
      where: { id: booking.artisanId },
      data: {
        averageRating: Number((stats._avg.rating || 0).toFixed(2)),
        totalReviews: stats._count.rating,
        totalJobs: completedJobs,
      },
    });

    return res.status(201).json({ review: serializeReview(review) });
  } catch (error) {
    console.error('Create booking review error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
