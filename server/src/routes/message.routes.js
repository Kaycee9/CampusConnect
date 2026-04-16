import { Router } from 'express';
import { z } from 'zod';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as messageController from '../controllers/message.controller.js';

const router = Router();

const startConversationSchema = z.object({
  participantId: z.string().min(1).optional(),
  bookingId: z.string().min(1).optional(),
}).refine((data) => data.participantId || data.bookingId, {
  message: 'Provide a participant or booking to start a conversation',
});

const conversationIdSchema = z.object({
  id: z.string().min(1, 'Conversation ID is required'),
});

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
});

const finalizeNegotiationSchema = z.object({
  agreedPrice: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  }, z.number().positive().optional()),
});

router.use(authenticate);

router.get('/conversations', messageController.listConversations);
router.post('/conversations', validate(startConversationSchema), messageController.createConversation);
router.get('/conversations/:id', validate(conversationIdSchema, 'params'), messageController.getConversation);
router.post('/conversations/:id', validate(conversationIdSchema, 'params'), validate(sendMessageSchema), messageController.sendMessage);
router.patch('/conversations/:id/read', validate(conversationIdSchema, 'params'), messageController.markConversationRead);
router.patch('/conversations/:id/finalize', validate(conversationIdSchema, 'params'), validate(finalizeNegotiationSchema), messageController.finalizeNegotiation);

export default router;
