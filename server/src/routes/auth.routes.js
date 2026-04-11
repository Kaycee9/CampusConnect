import { Router } from 'express';
import { z } from 'zod';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();
const SERVICE_CATEGORIES = [
  'PLUMBING',
  'ELECTRICAL',
  'PAINTING',
  'CARPENTRY',
  'CLEANING',
  'TAILORING',
  'BARBING',
  'WELDING',
  'MECHANICS',
  'TECH_REPAIR',
  'OTHER',
];

const emptyStringToUndefined = (value) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

const parseNumber = (value) => {
  const cleaned = emptyStringToUndefined(value);
  if (cleaned === undefined) {
    return undefined;
  }
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : cleaned;
};

/* ── Validation Schemas ─────────────────────────────────────────────────── */

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['STUDENT', 'ARTISAN']),

  // Artisan specific optional fields
  category: z.preprocess(emptyStringToUndefined, z.enum(SERVICE_CATEGORIES).optional()),
  bio: z.preprocess(emptyStringToUndefined, z.string().optional()),
  address: z.preprocess(emptyStringToUndefined, z.string().optional()),
  lat: z.preprocess(parseNumber, z.number().min(-90).max(90).optional()),
  lng: z.preprocess(parseNumber, z.number().min(-180).max(180).optional()),
  startingPrice: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().positive('Price must be greater than 0').optional(),
  ),
}).refine((data) => {
  if (data.role === 'ARTISAN' && !data.category) {
    return false;
  }
  return true;
}, {
  message: "Service category is required for artisans",
  path: ["category"],
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordParamsSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/* ── Routes ─────────────────────────────────────────────────────────────── */

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected route to resolve current user from token
router.get('/me', authenticate, authController.getMe);

// Pending MVP routes
router.get('/verify-email/:token', (req, res) => res.status(501).json({ message: 'Deferred for MVP' }));
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordParamsSchema, 'params'), validate(resetPasswordSchema), authController.resetPassword);

export default router;
