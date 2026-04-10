import { Router } from 'express';
// import { authenticate } from '../middleware/auth.js';
// import * as authController from '../controllers/auth.controller.js';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet — Stage 2' });
});

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet — Stage 2' });
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet — Stage 2' });
});

// POST /api/v1/auth/refresh
router.post('/refresh', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet — Stage 2' });
});

// GET /api/v1/auth/verify-email/:token
router.get('/verify-email/:token', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet — Stage 2' });
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet — Stage 2' });
});

// POST /api/v1/auth/reset-password/:token
router.post('/reset-password/:token', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet — Stage 2' });
});

export default router;
