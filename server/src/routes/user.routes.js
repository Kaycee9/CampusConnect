import { Router } from 'express';
import { z } from 'zod';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

/* ── Validation Schemas ─────────────────────────────────────────────────── */

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  
  // Artisan specific
  bio: z.string().optional(),
  category: z.enum(['PLUMBING', 'ELECTRICAL', 'PAINTING', 'CARPENTRY', 'CLEANING', 'TAILORING', 'BARBING', 'WELDING', 'MECHANICS', 'TECH_REPAIR', 'OTHER']).optional(),
  startingPrice: z.union([z.string(), z.number()]).optional(),
  yearsExp: z.union([z.string(), z.number()]).optional(),
});

/* ── Routes ─────────────────────────────────────────────────────────────── */

// PUT /api/v1/users/profile
router.put(
  '/profile',
  authenticate,
  (req, res, next) => {
    // We use multer to parse the multipart/form-data before Zod validation so req.body is populated
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  validate(updateProfileSchema),
  userController.updateProfile
);

export default router;
