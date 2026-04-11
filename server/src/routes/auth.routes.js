import { Router } from 'express';
import { z } from 'zod';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

/* ── Validation Schemas ─────────────────────────────────────────────────── */

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['STUDENT', 'ARTISAN']),
  
  // Artisan specific optional fields
  category: z.enum(['PLUMBING', 'ELECTRICAL', 'PAINTING', 'CARPENTRY', 'CLEANING', 'TAILORING', 'BARBING', 'WELDING', 'MECHANICS', 'TECH_REPAIR', 'OTHER']).optional(),
  bio: z.string().optional(),
  address: z.string().optional(),
  startingPrice: z.coerce.number().positive('Price must be greater than 0').optional(),
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

/* ── Routes ─────────────────────────────────────────────────────────────── */

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected route to resolve current user from token
router.get('/me', authenticate, authController.getMe);

// Pending MVP routes
router.get('/verify-email/:token', (req, res) => res.status(501).json({ message: 'Deferred for MVP' }));
router.post('/forgot-password', (req, res) => res.status(501).json({ message: 'Deferred for MVP' }));
router.post('/reset-password/:token', (req, res) => res.status(501).json({ message: 'Deferred for MVP' }));

export default router;
