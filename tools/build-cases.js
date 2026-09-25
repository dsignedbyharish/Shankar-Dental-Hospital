#!/usr/bin/env node
/* Regenerates the Case of the Month blocks from data/cases.json.

     node tools/build-cases.js           rewrite case-of-the-month.html + index.html
     node tools/build-cases.js --check   exit 1 if either page is out of date

   The admin panel runs the same renderer (api/_lib/cases.js) when it
   publishes, so this is only needed after editing data/cases.json by hand. */
'use strict';

const fs = require('fs');
const path = require('path');
const cases = require('../api/_lib/cases.js');

const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

const data = JSON.parse(read('data/cases.json'));
const before = { archive: read('case-of-the-month.html'), home: read('index.html') };
const after = cases.renderPages(before, data.cases);

const stale = ['archive', 'home'].filter((k) => before[k] !== after[k]);
const files = { archive: 'case-of-the-month.html', home: 'index.html' };

if (process.argv.includes('--check')) {
  if (stale.length) {
    console.error('Out of date: ' + stale.map((k) => files[k]).join(', ') + '. Run: node tools/build-cases.js');
    process.exit(1);
  }
  console.log('Case blocks are up to date (' + cases.publishedCases(data.cases).length + ' published cases).');
} else {
  stale.forEach((k) => fs.writeFileSync(path.join(ROOT, files[k]), after[k]));
  console.log(stale.length ? 'Updated ' + stale.map((k) => files[k]).join(', ') : 'Already up to date.');
}
