#!/usr/bin/env node
/* Local preview of the whole site, admin panel included.

     node tools/dev-server.js            http://localhost:8791
     PORT=9000 node tools/dev-server.js

   Serves the static files like Vercel does (including the response headers
   declared in vercel.json, so the admin's Content-Security-Policy is tested
   locally too) and runs the /api/admin/* functions in-process with
   CASES_STORAGE=local: publishing a case writes to this checkout instead of
   committing to GitHub. Review the result with `git status` / `git diff`.

   The admin password is ADMIN_PASSWORD if set, otherwise "shanker-local". */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = parseInt(process.env.PORT || '8791', 10);

process.env.CASES_STORAGE = 'local';
if (!process.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = 'shanker-local';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf', '.woff2': 'font/woff2',
};

/* vercel.json header rules, with Vercel's path patterns turned into regexes. */
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const headerRules = (vercel.headers || []).map(function (rule) {
  /* "(.*)" is any tail; ":name*" is zero or more path segments, so
     "/admin/:path*" also matches "/admin" itself, as it does on Vercel. */
  const re = new RegExp('^' + rule.source
    .replace(/\(\.\*\)/g, '.*')
    .replace(/\/:\w+\*/g, '(?:/.*)?') + '$');
  return { re: re, headers: rule.headers };
});
const redirects = (vercel.redirects || []).reduce(function (m, r) { m[r.source] = r.destination; return m; }, {});

const API = {
  '/api/admin/session': require('../api/admin/session.js'),
  '/api/admin/cases': require('../api/admin/cases.js'),
};

function applyHeaders(res, urlPath) {
  headerRules.forEach(function (rule) {
    if (rule.re.test(urlPath)) rule.headers.forEach(function (h) { res.setHeader(h.key, h.value); });
  });
}

const server = http.createServer(function (req, res) {
  const url = new URL(req.url, 'http://localhost');
  let p = decodeURIComponent(url.pathname);

  if (API[p]) {
    req.query = Object.fromEntries(url.searchParams);
    Promise.resolve(API[p](req, res)).catch(function (err) {
      console.error(err);
      if (!res.headersSent) { res.statusCode = 500; res.end('{"ok":false}'); }
    });
    return;
  }
  if (p.startsWith('/api/')) { res.statusCode = 404; res.end('Not found'); return; }

  if (redirects[p]) { res.statusCode = 308; res.setHeader('Location', redirects[p]); res.end(); return; }

  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep) || /(^|\/)\.|\/(tools|node_modules)\//.test(p)) {
    res.statusCode = 404; res.end('Not found'); return;
  }
  fs.stat(file, function (err, st) {
    if (!err && st.isDirectory()) {
      res.statusCode = 308; res.setHeader('Location', p + '/'); res.end(); return;
    }
    if (err || !st.isFile()) { res.statusCode = 404; res.end('Not found'); return; }
    applyHeaders(res, p);
    /* Never let the browser cache locally: edits should show on reload. */
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(PORT, function () {
  console.log('Shanker Dental dev server: http://localhost:' + PORT);
  console.log('Admin panel:               http://localhost:' + PORT + '/admin/  (password: ' +
    (process.env.ADMIN_PASSWORD === 'shanker-local' ? 'shanker-local' : 'from ADMIN_PASSWORD') + ')');
  console.log('Storage: local. Published cases are written to this folder, not GitHub.');
});
