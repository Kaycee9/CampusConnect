import crypto from 'crypto';
import env from '../config/env.js';

const PAYSTACK_API_BASE = process.env.PAYSTACK_API_BASE || 'https://api.paystack.co';

const ensureSecretKey = () => {
  if (!env.PAYSTACK_SECRET_KEY) {
    const error = new Error('Paystack secret key is not configured');
    error.status = 500;
    throw error;
  }
};

const toError = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch (_err) {
    payload = null;
  }

  const message = payload?.message || payload?.error || `Paystack request failed (${response.status})`;
  const error = new Error(message);
  error.status = response.status;
  error.payload = payload;
  return error;
};

const paystackRequest = async (path, { method = 'GET', body } = {}) => {
  ensureSecretKey();

  const response = await fetch(`${PAYSTACK_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw await toError(response);
  }

  const payload = await response.json();
  if (!payload?.status) {
    const error = new Error(payload?.message || 'Unexpected Paystack response');
    error.status = 502;
    error.payload = payload;
    throw error;
  }

  return payload.data;
};

export const initializePaystackTransaction = async (input) => {
  return paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: input,
  });
};

export const verifyPaystackTransaction = async (reference) => {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
};

export const isValidPaystackSignature = (rawBody, signature) => {
  if (!signature || !env.PAYSTACK_SECRET_KEY || typeof rawBody !== 'string') {
    return false;
  }

  const digest = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  const left = Buffer.from(digest, 'utf8');
  const right = Buffer.from(signature, 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
};
