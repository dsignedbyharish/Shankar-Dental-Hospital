/* GET    /api/admin/session   → { signedIn, configured, mode }
   POST   /api/admin/session   { password } → sets the session cookie
   DELETE /api/admin/session   → signs out */
'use strict';

const auth = require('../_lib/auth.js');
const store = require('../_lib/store.js');
const { send, fail, readJson, isSameSiteWrite } = require('../_lib/http.js');

const wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return send(res, 200, { ok: true, configured: auth.configured(), signedIn: auth.signedIn(req), mode: store.mode() });
    }
    if (!isSameSiteWrite(req)) return fail(res, 403, 'Request refused.');

    if (req.method === 'POST') {
      if (!auth.configured()) {
        return fail(res, 503, 'The admin password has not been set up yet (ADMIN_PASSWORD in the Vercel project settings).');
      }
      const body = await readJson(req);
      if (!auth.checkPassword(String(body.password || ''))) {
        /* Flat delay on every miss: slows guessing without any state. */
        await wait(700);
        return fail(res, 401, 'That password is not right. Please try again.');
      }
      return send(res, 200, { ok: true, signedIn: true, mode: store.mode() }, { 'Set-Cookie': auth.sessionCookie(req) });
    }

    if (req.method === 'DELETE') {
      return send(res, 200, { ok: true, signedIn: false }, { 'Set-Cookie': auth.clearCookie(req) });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return fail(res, 405, 'Method not allowed.');
  } catch (err) {
    return fail(res, err.status || 500, err.status ? err.message : 'Something went wrong. Please try again.');
  }
};
