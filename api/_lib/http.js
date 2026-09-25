/* Minimal request/response helpers for the admin API. Written against plain
   Node (req, res) so the same handlers run on Vercel and in the local dev
   server (tools/dev-server.js) without either needing the other's helpers. */
'use strict';

const MAX_BODY = 4.4 * 1024 * 1024; /* Vercel rejects bodies over 4.5 MB */

function send(res, status, body, headers) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  Object.keys(headers || {}).forEach(function (k) { res.setHeader(k, headers[k]); });
  res.end(JSON.stringify(body));
}

function fail(res, status, message, extra) {
  send(res, status, Object.assign({ ok: false, error: message }, extra || {}));
}

/* Vercel pre-parses JSON into req.body; the dev server does not. Either way
   the handler gets a parsed object, and oversized bodies are refused. */
function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body || '{}')); } catch (e) { return Promise.reject(httpError(400, 'Malformed request.')); }
  }
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let size = 0;
    req.on('data', function (c) {
      size += c.length;
      if (size > MAX_BODY) { reject(httpError(413, 'That upload is too large. Try a smaller PDF.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', function () {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(httpError(400, 'Malformed request.')); }
    });
    req.on('error', reject);
  });
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(function (part) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

/* A request that changes anything must carry this header. Browsers will not
   attach a custom header to a cross-site request without a CORS preflight,
   which this API never grants, so it closes the CSRF door alongside the
   SameSite=Strict cookie. */
function isSameSiteWrite(req) {
  return req.headers['x-admin-request'] === '1';
}

module.exports = { send, fail, readJson, httpError, parseCookies, isSameSiteWrite };
