/* Admin sign-in: one shared password (ADMIN_PASSWORD), exchanged for a signed,
   HttpOnly session cookie. No database: the cookie carries its own expiry and
   an HMAC over it, so any function instance can verify it. Changing the
   password (or ADMIN_SESSION_SECRET) signs every existing session out. */
'use strict';

const crypto = require('crypto');
const { parseCookies } = require('./http.js');

const COOKIE = 'sdcc_admin';
const TTL_SECONDS = 8 * 60 * 60;

function configured() {
  return typeof process.env.ADMIN_PASSWORD === 'string' && process.env.ADMIN_PASSWORD.length >= 8;
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET ||
    crypto.createHash('sha256').update('sdcc-admin-session:' + (process.env.ADMIN_PASSWORD || '')).digest('hex');
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(payload) {
  return b64url(crypto.createHmac('sha256', secret()).update(payload).digest());
}

function safeEqual(a, b) {
  /* Compare fixed-length digests so neither timing nor length leaks. */
  const da = crypto.createHash('sha256').update(String(a)).digest();
  const db = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(da, db);
}

function checkPassword(candidate) {
  return configured() && safeEqual(candidate, process.env.ADMIN_PASSWORD);
}

function issue() {
  const payload = b64url(JSON.stringify({ v: 1, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }));
  return payload + '.' + sign(payload);
}

function verify(token) {
  if (!configured() || typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  if (!safeEqual(token.slice(dot + 1), sign(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return data.v === 1 && data.exp > Math.floor(Date.now() / 1000);
  } catch (e) {
    return false;
  }
}

function isSecure(req) {
  return process.env.VERCEL === '1' || req.headers['x-forwarded-proto'] === 'https';
}

function cookie(req, value, maxAge) {
  return [
    COOKIE + '=' + value,
    'Path=/api/admin',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=' + maxAge,
    isSecure(req) ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

function signedIn(req) {
  return verify(parseCookies(req)[COOKIE]);
}

module.exports = {
  configured, checkPassword, signedIn,
  sessionCookie: function (req) { return cookie(req, issue(), TTL_SECONDS); },
  clearCookie: function (req) { return cookie(req, '', 0); },
};
