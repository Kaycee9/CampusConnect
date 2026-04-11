import { Router } from 'express';
import { z } from 'zod';
import validate from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as bookingController from '../controllers/booking.controller.js';

const router = Router();

const createBookingSchema = z.object({
  artisanId: z.string().min(1, 'Artisan ID is required'),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Please provide more booking details'),
  address: z.string().min(3, 'Service address is required'),
  scheduledAt: z.string().datetime('Select a valid date and time'),
  agreedPrice: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  }, z.number().positive().optional()),
  lat: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  }, z.number().min(-90).max(90).optional()),
  lng: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  }, z.number().min(-180).max(180).optional()),
});

const bookingIdSchema = z.object({
  id: z.string().min(1, 'Booking ID is required'),
});

const rejectSchema = z.object({
  rejectionReason: z.string().min(3, 'Please provide a rejection reason').optional(),
});

const acceptSchema = z.object({
  agreedPrice: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  }, z.number().positive().optional()),
});

const priceUpdateSchema = z.object({
  agreedPrice: z.preprocess((value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  }, z.number().positive()),
  note: z.string().max(250, 'Note is too long').optional(),
});

router.use(authenticate);

router.get('/', bookingController.listBookings);
router.post('/', authorize('STUDENT'), validate(createBookingSchema), bookingController.createBooking);
router.get('/:id', validate(bookingIdSchema, 'params'), bookingController.getBooking);
router.patch('/:id/accept', authorize('ARTISAN'), validate(bookingIdSchema, 'params'), validate(acceptSchema), bookingController.acceptBooking);
router.patch('/:id/reject', authorize('ARTISAN'), validate(bookingIdSchema, 'params'), validate(rejectSchema), bookingController.rejectBooking);
router.patch('/:id/start', authorize('ARTISAN'), validate(bookingIdSchema, 'params'), bookingController.startBooking);
router.patch('/:id/complete', authorize('ARTISAN'), validate(bookingIdSchema, 'params'), bookingController.completeBooking);
router.patch('/:id/cancel', authorize('STUDENT'), validate(bookingIdSchema, 'params'), bookingController.cancelBooking);
router.patch('/:id/price', authorize('STUDENT', 'ARTISAN', 'ADMIN'), validate(bookingIdSchema, 'params'), validate(priceUpdateSchema), bookingController.updateBookingPrice);

export default router;
