import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import * as reviewController from '../controllers/review.controller.js';

const router = Router();

const bookingIdSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

const createReviewSchema = z.object({
  rating: z.preprocess((value) => Number(value), z.number().int().min(1).max(5)),
  comment: z.string().max(500, 'Comment is too long').optional(),
});

router.use(authenticate);

router.get('/bookings/:bookingId', validate(bookingIdSchema, 'params'), reviewController.getBookingReview);
router.post('/bookings/:bookingId', authorize('STUDENT'), validate(bookingIdSchema, 'params'), validate(createReviewSchema), reviewController.createBookingReview);

export default router;
