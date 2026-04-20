import jwt from 'jsonwebtoken';

/**
 * Generates an Access Token and a Refresh Token
 * Access Token: short-lived (120m), contains role for authorization
 * Refresh Token: long-lived (7d), used only to fetch a new pair
 */
export const generateTokenPair = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '120m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax', // Lax for localhost dev, strict in prod
    maxAge: 120 * 60 * 1000, // 2 hours
    path: '/',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth/refresh', // Crucial: Only send on refresh endpoint
  });
};

export const clearTokenCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieBaseOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
  };

  res.clearCookie('accessToken', cookieBaseOptions);
  res.clearCookie('refreshToken', {
    ...cookieBaseOptions,
    path: '/api/v1/auth/refresh',
  });
};
