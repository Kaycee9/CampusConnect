import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/database.js';
import { generateTokenPair, setTokenCookies, clearTokenCookies } from '../lib/jwt.js';
import env from '../config/env.js';
import { sendEmail } from '../utils/email.js';

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, category, bio, startingPrice, address, lat, lng } = req.body;

    // Check if user exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and profile in a transaction
    const user = await db.$transaction(async (prisma) => {
      // User model uses `passwordHash` (matches schema.prisma)
      const newUser = await prisma.user.create({
        data: { email, passwordHash: hashedPassword, role },
      });

      if (role === 'STUDENT') {
        await prisma.studentProfile.create({
          data: {
            userId: newUser.id,
            firstName,
            lastName,
            address: address || null,
            lat: typeof lat === 'number' ? lat : null,
            lng: typeof lng === 'number' ? lng : null,
          },
        });
      } else if (role === 'ARTISAN') {
        await prisma.artisanProfile.create({
          data: {
            userId: newUser.id,
            firstName,
            lastName,
            category,
            bio: bio || null,
            address: address || null,
            lat: typeof lat === 'number' ? lat : null,
            lng: typeof lng === 'number' ? lng : null,
            startingPrice: startingPrice ? Number(startingPrice) : null,
          },
        });
      }

      // Return user with profile included
      return prisma.user.findUnique({
        where: { id: newUser.id },
        include: { studentProfile: true, artisanProfile: true },
      });
    });

    const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);

    // Store refresh token in DB for server-side state/invalidation
    await db.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    setTokenCookies(res, accessToken, refreshToken);

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, accessToken });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.user.findUnique({
      where: { email },
      include: { studentProfile: true, artisanProfile: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Schema field is `passwordHash`, not `password`
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);

    await db.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setTokenCookies(res, accessToken, refreshToken);

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, accessToken });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Verify token exists in DB and is active
    const savedToken = await db.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!savedToken || savedToken.expiresAt < new Date()) {
      clearTokenCookies(res);
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Verify JWT signature
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      clearTokenCookies(res);
      return res.status(401).json({ error: 'Invalid refresh token signature' });
    }

    const { user } = savedToken;
    const { accessToken: newAccess, refreshToken: newRefresh } = generateTokenPair(user.id, user.role);

    // Rotate the token (delete old, create new)
    await db.$transaction([
      db.refreshToken.delete({ where: { token: refreshToken } }),
      db.refreshToken.create({
        data: {
          token: newRefresh,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    setTokenCookies(res, newAccess, newRefresh);

    res.json({ accessToken: newAccess });

  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    // Server-side invalidation
    if (refreshToken) {
      await db.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    clearTokenCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      include: {
        studentProfile: true,
        artisanProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // Always return a generic response to avoid account enumeration.
    if (!user) {
      return res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: expiresAt,
      },
    });

    const resetLink = `${env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your CampusConnect password',
        html: `
          <p>Hello,</p>
          <p>We received a request to reset your password.</p>
          <p>Use this link to reset it (valid for 1 hour):</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
      });
    } catch (mailError) {
      console.error('Forgot password email send failed:', mailError);
    }

    return res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const token = req.validatedParams?.token || req.params.token;
    const password = req.body.password;

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: { id: true },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
        },
      }),
      db.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return res.json({ message: 'Password reset successful. Please log in again.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
