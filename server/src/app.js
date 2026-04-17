import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import env from './config/env.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import artisanRoutes from './routes/artisan.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import messageRoutes from './routes/message.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import { handlePaystackWebhook } from './controllers/payment.controller.js';

const app = express();

// ─── GLOBAL MIDDLEWARE ────────────────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS — allow frontend origin with credentials (cookies)
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Paystack webhook must receive raw body for signature validation
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), handlePaystackWebhook);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing (for HttpOnly auth cookies)
app.use(cookieParser());

// Request logging
if (env.isDev) {
  app.use(morgan('dev'));
}

// Rate limiter — strict on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API v1
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/artisans', artisanRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: env.isProd ? 'Internal server error' : err.message,
  });
});

export default app;
