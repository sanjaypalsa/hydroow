/*
 * build-products-index.js
 * -----------------------
 * Regenerates js/products-data.js (the site-wide product search index)
 * by scanning every *-product.html page in the project root.
 *
 * Run from the project root:
 *     node _tools/build-products-index.js
 *
 * It understands the two product layouts used on this site:
 *   1. Spec tables : <table class="...product-table...">  (first row is the header)
 *   2. Card grids  : <div class="products"> <div class="product-card"> ... </div> </div>
 *
 * Every product is written as one object with these fields:
 *     name      - product title (shown in results)
 *     model     - model / part number ("" if none)
 *     series    - product series ("" if none)
 *     brand     - brand / manufacturer
 *     category  - category/type if the table has one ("" otherwise)
 *     desc      - short description
 *     page      - the HTML file that lists this product (results link to it)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'js', 'products-data.js');

/* Pretty brand names for each product page (fallback when a table has no Brand column). */
const BRAND_BY_FILE = {
  'airtac-product.html': 'AirTAC',
  'asco-solenoid-valves-product.html': 'ASCO',
  'atos-hydraulic-components-product.html': 'Atos',
  'aventics-pneumatic-components-product.html': 'Aventics',
  'bimba-product.html': 'Bimba',
  'bosch-rexroth-product.html': 'Bosch Rexroth',
  'bucher-product.html': 'Bucher',
  'burkert-process-valves-product.html': 'Burkert',
  'camozzi-product.html': 'Camozzi',
  'ckd-product.html': 'CKD',
  'clippard-product.html': 'Clippard',
  'daikin-product.html': 'Daikin',
  'danfoss-product.html': 'Danfoss',
  'eaton-product.html': 'Eaton',
  'emerson-automation-parts-product.html': 'Emerson',
  'fabco-air-product.html': 'Fabco-Air',
  'festo-product.html': 'Festo',
  'hawe-hydraulic-product.html': 'HAWE',
  'humphrey-product.html': 'Humphrey',
  'hydac-product.html': 'HYDAC',
  'imi-precision-product.html': 'IMI Precision',
  'janatics-product.html': 'Janatics',
  'koganei-pneumatic-components-product.html': 'Koganei',
  'lubricant-product.html': 'Shell',
  'mac-valves-product.html': 'MAC',
  'mindman-pneumatic-components-product.html': 'Mindman',
  'moog-product.html': 'Moog',
  'nachi-industrial-components-product.html': 'Nachi',
  'Norgren-product.html': 'Norgren',
  'oil-control-product.html': 'Oil Control',
  'parker-product.html': 'Parker',
  'pisco-product.html': 'Pisco',
  'pneumax-pneumatic-components-product.html': 'Pneumax',
  'ross-controls-product.html': 'Ross Controls',
  'rotork-product.html': 'Rotork',
  'smc-product.html': 'SMC',
  'thomson-product.html': 'Thomson',
  'tokimec-product.html': 'Tokimec',
  'tolomatic-product.html': 'Tolomatic',
  'univer-pneumatic-components-product.html': 'Univer',
  'vickers-hydraulic-components-product.html': 'Vickers',
  'walvoil-product.html': 'Walvoil',
  'yuken-product.html': 'Yuken'
};

function decodeEntities(str) {
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function clean(str) {
  return decodeEntities(String(str || '').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function normHeader(str) {
  return clean(str).toLowerCase().replace(/\.$/, '').trim();
}

/* Map a header row to column indexes. Tolerant to column order and naming. */
function buildColumnMap(headerCells) {
  const map = { brand: -1, series: -1, model: -1, name: -1, desc: -1, category: -1 };
  headerCells.forEach((raw, i) => {
    const h = normHeader(raw);
    if (map.brand === -1 && (h === 'brand name' || h === 'brand' || h === 'manufacturer')) map.brand = i;
    else if (map.series === -1 && h === 'series') map.series = i;
    else if (map.model === -1 && (h === 'model number' || h === 'part number' || h === 'model' || /(^|\s)part(\s*no|\s*number|$)/.test(h) || /model/.test(h))) map.model = i;
    else if (map.name === -1 && (h === 'product name' || h === 'product' || h === 'name')) map.name = i;
    else if (map.category === -1 && h === 'category') map.category = i;
    else if (map.desc === -1 && (h === 'description' || h === 'product description' || h === 'details')) map.desc = i;
  });
  return map;
}

function cellAt(cells, idx) {
  return idx >= 0 && idx < cells.length ? clean(cells[idx]) : '';
}

function extractFromTables(html, brand, page, out) {
  const tableRe = /<table[^>]*class="[^"]*product-table[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  let tm;
  while ((tm = tableRe.exec(html))) {
    const rows = tm[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    if (rows.length < 2) continue;
    const headerCells = (rows[0].match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || []).map(clean);
    const col = buildColumnMap(headerCells);
    for (let r = 1; r < rows.length; r++) {
      const cells = (rows[r].match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || []).map(clean);
      if (!cells.length || cells.every(c => !c)) continue;
      if (/^s\.?\s*no\.?$/i.test(cells[0]) && cells.length <= 2) continue; // stray header
      const model = cellAt(cells, col.model);
      const name = cellAt(cells, col.name) || model;
      const desc = cellAt(cells, col.desc);
      if (!name && !desc && !model) continue;
      out.push({
        name: name || model,
        model: model,
        series: cellAt(cells, col.series),
        brand: cellAt(cells, col.brand) || brand,
        category: cellAt(cells, col.category),
        desc: desc,
        page: page
      });
    }
  }
}

function extractFromCards(html, brand, page, out) {
  const cardRe = /<div class="product-card">([\s\S]*?)<\/div>/gi;
  let cm;
  while ((cm = cardRe.exec(html))) {
    const block = cm[1];
    const h4 = /<h4[^>]*>([\s\S]*?)<\/h4>/i.exec(block);
    const p = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block);
    const name = h4 ? clean(h4[1]) : '';
    const desc = p ? clean(p[1]) : '';
    if (!name && !desc) continue;
    out.push({
      name: name || desc,
      model: '',
      series: '',
      brand: brand,
      category: '',
      desc: desc,
      page: page
    });
  }
}

function jsVal(v) {
  return JSON.stringify(v == null ? '' : v);
}

function main() {
  const files = fs.readdirSync(ROOT)
    .filter(f => /-product\.html$/i.test(f))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  const byPage = [];
  let total = 0;

  for (const file of files) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const brand = BRAND_BY_FILE[file] || file.replace(/-product\.html$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const items = [];
    extractFromTables(html, brand, file, items);
    extractFromCards(html, brand, file, items);
    if (items.length) {
      byPage.push({ file, brand, items });
      total += items.length;
    }
  }

  const lines = [];
  lines.push('/*');
  lines.push(' * Hydroow site-wide product search index');
  lines.push(' * =====================================');
  lines.push(' * This file powers the header search (js/site-search.js). It is grouped by');
  lines.push(' * brand/page so it is easy to read and edit by hand.');
  lines.push(' *');
  lines.push(' * Each product object has these fields:');
  lines.push(' *   name      - product title shown in the results');
  lines.push(' *   model     - model / part number ("" if none)');
  lines.push(' *   series    - product series ("" if none)');
  lines.push(' *   brand     - brand / manufacturer');
  lines.push(' *   category  - category/type ("" if the page has none)');
  lines.push(' *   desc      - short description');
  lines.push(' *   page      - the HTML file that lists this product (results link to it)');
  lines.push(' *');
  lines.push(' * To add a single product by hand, copy line style below into the right brand block.');
  lines.push(' * To rebuild everything from the product pages, run:  node _tools/build-products-index.js');
  lines.push(' *');
  lines.push(' * Indexed: ' + total + ' products from ' + byPage.length + ' pages.');
  lines.push(' */');
  lines.push('window.HYDROOW_PRODUCTS = [');

  byPage.forEach((group, gi) => {
    lines.push('');
    lines.push('  /* ===================== ' + group.brand + '  —  ' + group.file + '  (' + group.items.length + ') ===================== */');
    group.items.forEach((p, i) => {
      const comma = (gi === byPage.length - 1 && i === group.items.length - 1) ? '' : ',';
      lines.push(
        '  { name: ' + jsVal(p.name) +
        ', model: ' + jsVal(p.model) +
        ', series: ' + jsVal(p.series) +
        ', brand: ' + jsVal(p.brand) +
        ', category: ' + jsVal(p.category) +
        ', desc: ' + jsVal(p.desc) +
        ', page: ' + jsVal(p.page) + ' }' + comma
      );
    });
  });

  lines.push('');
  lines.push('];');
  lines.push('');

  fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log('Wrote ' + OUT);
  console.log('Products: ' + total + ' across ' + byPage.length + ' pages.');
}

main();
