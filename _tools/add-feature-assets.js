/*
 * add-feature-assets.js
 * ---------------------
 * One-time installer: adds the search + product-tools assets to every page
 * that already uses the site stylesheet (i.e. every header page).
 *
 *   <head>  -> css/product-tools.css , css/site-search.css
 *   </body> -> js/site-search.js , js/product-tools.js
 *
 * It is idempotent (safe to run again) and only inserts if missing.
 * It does NOT touch any page content.
 *
 * Run:  node _tools/add-feature-assets.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const CSS_LINKS = [
  '    <link rel="stylesheet" href="css/product-tools.css">',
  '    <link rel="stylesheet" href="css/site-search.css">'
];

const JS_SCRIPTS = [
  '    <script src="js/site-search.js"></script>',
  '    <script src="js/product-tools.js"></script>'
];

const files = fs.readdirSync(ROOT).filter(f => /\.html$/i.test(f));
let changed = 0;
const changedFiles = [];

for (const file of files) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');

  // Only pages that load the site stylesheet (i.e. real site pages).
  if (!/css\/style\.css/.test(html)) continue;

  const hadBom = html.charCodeAt(0) === 0xFEFF;
  if (hadBom) html = html.slice(1);

  const before = html;

  if (!/css\/site-search\.css/.test(html)) {
    html = html.replace(/<\/head>/i, CSS_LINKS.join('\n') + '\n</head>');
  }
  if (!/js\/site-search\.js/.test(html)) {
    html = html.replace(/<\/body>/i, JS_SCRIPTS.join('\n') + '\n</body>');
  }

  if (html !== before) {
    fs.writeFileSync(full, (hadBom ? '\uFEFF' : '') + html, 'utf8');
    changed++;
    changedFiles.push(file);
  }
}

console.log('Updated ' + changed + ' files:');
changedFiles.forEach(f => console.log('  ' + f));
