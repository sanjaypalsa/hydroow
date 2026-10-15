# Hydroow front-end features (search + pagination)

Ye folder un tools ko rakhta hai jo site ke do naye features maintain karte hain:

1. **Header search (site-wide)** — header ke 🔍 par click karne se ek overlay khulta hai
   jo poore site ke products me naam / model / series / brand / category / description
   se search karta hai.
2. **Product page tools** — har product list ke upar ek search box (us list ko filter karta
   hai) aur **50 items per page** ki pagination.

---

## Files

| File | Kaam |
|------|------|
| `js/products-data.js` | Search index (saare products). **Ye hi edit karni wali file hai** jab manually product add/remove karna ho. |
| `js/site-search.js` | Header 🔍 overlay ka logic. Index ko **lazily** load karta hai (sirf pehli search par). |
| `css/site-search.css` | Overlay ki styling. |
| `js/product-tools.js` | Har product list ke liye in-page search box + 50/page pagination. |
| `css/product-tools.css` | In-page search box + pagination ki styling. |
| `_tools/build-products-index.js` | Product pages ko scan karke `js/products-data.js` **dobara generate** karta hai. |
| `_tools/add-feature-assets.js` | (One-time) har page me upar wale CSS/JS ke `<link>`/`<script>` tags add karta hai. Idempotent. |

---

## Product index kaise edit karein (`js/products-data.js`)

File grouped hai — har brand/page ke liye ek comment header hai:

```js
/* ===================== Festo  —  festo-product.html  (25) ===================== */
{ name: "ADN-20-25-A-P-A", model: "ADN-20-25-A-P-A", series: "ADN", brand: "Festo",
  category: "", desc: "Double-acting compact pneumatic cylinder", page: "festo-product.html" },
```

Fields:

- `name` — result me dikhne wala title
- `model` — model / part number
- `series` — series
- `brand` — brand / manufacturer
- `category` — category (agar page me ho)
- `desc` — chhoti description
- `page` — jo HTML file is product ko list karti hai (result isi par link karega)

**Manually add karna ho:** us brand ke block me ek object copy-paste kar ke values badal dein.
**Rebuild karna ho (recommended):** product HTML pages update karne ke baad, project root me chalaayein:

```bash
node _tools/build-products-index.js
```

Ye root ke saare `*-product.html` scan karta hai (spec tables + card grids dono) aur index
sahi UTF-8 me dobara likh deta hai.

---

## Speed / performance notes

- Index **page load par load nahi hota** — pehli dafa search kholne par load hota hai
  (`site-search.js` me lazy load), is liye normal page speed par koi asar nahi.
- Search ke liye ek pre-computed, lower-case text blob banaya jata hai (ek hi baar), aur
  input par **debounce (120ms)** laga hai — taake typing fast rahe.
- Production server par **gzip / brotli** on rakhein — `products-data.js` compress hone par
  kaafi chhota ho jata hai.
- Pagination aur in-page search pure **vanilla JavaScript** hain (jQuery par depend nahi),
  aur progressive enhancement hain: JS na bhi chale to poore products waise hi visible rehte hain.

---

## Naya page add karein

Har naye page me (jaise `newbrand-product.html`) `<head>` ke end me ye links aur `</body>`
se pehle ye scripts hone chahiye (ya `node _tools/add-feature-assets.js` chala dein):

```html
<link rel="stylesheet" href="css/product-tools.css">
<link rel="stylesheet" href="css/site-search.css">
...
<script src="js/site-search.js"></script>
<script src="js/product-tools.js"></script>
```
