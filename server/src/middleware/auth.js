import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Auth middleware — resolves access token from:
 *   1. Authorization: Bearer <token> header (API clients / mobile)
 *   2. accessToken cookie (browser SPA)
 * If neither present → 401
 */
const authenticate = (req, res, next) => {
  let token = null;

  // Priority 1: Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Priority 2: Cookie fallback
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Role-based authorization — must be used AFTER authenticate
 * Usage: authorize('ARTISAN') or authorize('STUDENT', 'ADMIN')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export { authenticate, authorize };
