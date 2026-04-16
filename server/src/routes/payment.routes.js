import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = Router();

const bookingIdSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

const paymentIdSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
});

const simulateSchema = z.object({
  outcome: z.enum(['success', 'failed', 'cancelled']),
});

const refundSchema = z.object({
  reason: z.string().max(200, 'Reason is too long').optional(),
});

const withdrawalRequestSchema = z.object({
  note: z.string().max(250, 'Note is too long').optional(),
});

router.use(authenticate);

router.get('/bookings/:bookingId', validate(bookingIdSchema, 'params'), paymentController.getBookingPayment);
router.post('/bookings/:bookingId/initiate', validate(bookingIdSchema, 'params'), paymentController.initiateBookingPayment);
router.post('/:paymentId/simulate', validate(paymentIdSchema, 'params'), validate(simulateSchema), paymentController.simulatePaymentOutcome);
router.post('/:paymentId/retry', validate(paymentIdSchema, 'params'), paymentController.retryPaymentSimulation);
router.post('/:paymentId/refund', validate(paymentIdSchema, 'params'), validate(refundSchema), paymentController.refundPayment);
router.get('/withdrawals/summary', paymentController.getWithdrawalSummary);
router.post('/withdrawals/request', validate(withdrawalRequestSchema), paymentController.requestWithdrawal);

export default router;
