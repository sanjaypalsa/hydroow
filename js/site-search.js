/* ==========================================================================
   Hydroow site-wide product search
   Vanilla JavaScript. Opens a search overlay from the header search icons
   (.header_btn a / .search-mobile) and filters window.HYDROOW_PRODUCTS,
   which is lazy-loaded from js/products-data.js on first open.
   ========================================================================== */
(function () {
    'use strict';

    var PRODUCT_SCRIPT = 'js/products-data.js'; // relative to project root
    var MAX_RESULTS = 50;                      // maximum results rendered
    var DESC_MAX = 80;                         // description truncation length

    var overlay = null;
    var panel = null;
    var input = null;
    var resultsEl = null;
    var closeBtn = null;
    var lastFocused = null;
    var prevOverflow = null;
    var scriptLoading = false;
    var scriptLoaded = false;

    // Pre-built, lower-cased search blobs. Built once when the index loads so
    // each keystroke just does a fast indexOf instead of rebuilding strings.
    var searchIndex = null;
    var debounceTimer = null;
    var DEBOUNCE_MS = 120;

    /* ---------- helpers ---------- */

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function isOpen() {
        return !!(overlay && overlay.classList.contains('is-open'));
    }

    /* ---------- overlay construction ---------- */

    function buildOverlay() {
        if (overlay) return;

        overlay = document.createElement('div');
        overlay.className = 'hydroow-search-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Product search');

        panel = document.createElement('div');
        panel.className = 'hydroow-search-panel';

        closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'hydroow-search-close';
        closeBtn.setAttribute('aria-label', 'Close search');
        closeBtn.innerHTML = '&times;';

        input = document.createElement('input');
        input.type = 'text';
        input.className = 'hydroow-search-input';
        input.setAttribute('placeholder', 'Search products, model numbers, brands...');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('spellcheck', 'false');
        input.setAttribute('aria-label', 'Search products');

        resultsEl = document.createElement('div');
        resultsEl.className = 'hydroow-search-results';

        panel.appendChild(closeBtn);
        panel.appendChild(input);
        panel.appendChild(resultsEl);
        overlay.appendChild(panel);

        var host = document.body || document.documentElement;
        host.appendChild(overlay);

        closeBtn.addEventListener('click', closeSearch);

        // Close on backdrop click (only when the overlay itself is clicked).
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeSearch();
        });

        input.addEventListener('input', function () {
            if (debounceTimer) window.clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(function () {
                debounceTimer = null;
                runSearch(input.value);
            }, DEBOUNCE_MS);
        });

        // Enter opens the first matching result.
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var first = resultsEl.querySelector('a.hydroow-search-item');
                if (first) {
                    e.preventDefault();
                    first.click();
                }
            }
        });
    }

    /* ---------- index loading ---------- */

    // Build the flat, lower-cased search blobs once so typing stays fast.
    function buildSearchIndex() {
        if (searchIndex || !window.HYDROOW_PRODUCTS) return;
        var data = window.HYDROOW_PRODUCTS;
        searchIndex = new Array(data.length);
        for (var i = 0; i < data.length; i++) {
            var p = data[i] || {};
            searchIndex[i] = {
                item: p,
                text: (
                    (p.name || '') + ' ' +
                    (p.model || '') + ' ' +
                    (p.series || '') + ' ' +
                    (p.brand || '') + ' ' +
                    (p.category || '') + ' ' +
                    (p.desc || '') + ' ' +
                    (p.page || '')
                ).toLowerCase()
            };
        }
    }

    function ensureData() {
        if (window.HYDROOW_PRODUCTS) {
            buildSearchIndex();
            runSearch(input.value);
            return;
        }
        runSearch(input.value); // shows "Loading..." hint

        if (scriptLoading || scriptLoaded) return;
        scriptLoading = true;

        var script = document.createElement('script');
        script.src = PRODUCT_SCRIPT;
        script.async = true;
        script.onload = function () {
            scriptLoading = false;
            scriptLoaded = true;
            buildSearchIndex();
            if (isOpen()) runSearch(input.value);
        };
        script.onerror = function () {
            scriptLoading = false;
            if (resultsEl) {
                resultsEl.innerHTML =
                    '<div class="hydroow-search-hint">Could not load the product index.</div>';
            }
        };

        var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
        head.appendChild(script);
    }

    /* ---------- searching ---------- */

    function runSearch(rawQuery) {
        if (!resultsEl) return;

        var query = (rawQuery || '').trim();

        if (!window.HYDROOW_PRODUCTS) {
            resultsEl.innerHTML = '<div class="hydroow-search-hint">Loading products\u2026</div>';
            return;
        }

        if (query === '') {
            resultsEl.innerHTML =
                '<div class="hydroow-search-hint">Start typing to search products, model numbers or brands.</div>';
            return;
        }

        var q = query.toLowerCase();
        buildSearchIndex();
        var data = searchIndex || [];
        var matches = [];
        var i;
        var p;

        for (i = 0; i < data.length && matches.length < MAX_RESULTS; i++) {
            if (data[i].text.indexOf(q) !== -1) matches.push(data[i].item);
        }

        if (!matches.length) {
            resultsEl.innerHTML = '<div class="hydroow-search-hint">No products found</div>';
            return;
        }

        var html = '';
        for (i = 0; i < matches.length; i++) {
            p = matches[i];
            var desc = p.desc || '';
            if (desc.length > DESC_MAX) {
                desc = desc.slice(0, DESC_MAX).replace(/\s+\S*$/, '').trim() + '\u2026';
            }
            html +=
                '<a class="hydroow-search-item" href="' + escapeHtml(p.page || '#') + '">' +
                    '<span class="hydroow-search-name">' + escapeHtml(p.name || '') + '</span>' +
                    '<span class="hydroow-search-meta">' +
                        (p.brand ? '<span class="hydroow-search-brand">' + escapeHtml(p.brand) + '</span>' : '') +
                        (p.model && p.model !== p.name ? '<span class="hydroow-search-model">' + escapeHtml(p.model) + '</span>' : '') +
                    '</span>' +
                    (desc ? '<span class="hydroow-search-desc">' + escapeHtml(desc) + '</span>' : '') +
                '</a>';
        }

        resultsEl.innerHTML = html;
    }

    /* ---------- open / close ---------- */

    function openSearch() {
        buildOverlay();

        lastFocused = document.activeElement;
        prevOverflow = document.body.style.overflow;

        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';

        ensureData();

        // Focus the input after the overlay is displayed.
        window.setTimeout(function () {
            if (input) input.focus();
        }, 0);
    }

    function closeSearch() {
        if (!isOpen()) return;
        overlay.classList.remove('is-open');
        document.body.style.overflow = prevOverflow || '';
        if (lastFocused && typeof lastFocused.focus === 'function') {
            try { lastFocused.focus(); } catch (err) {}
        }
    }

    /* ---------- wiring ---------- */

    function onKeydown(e) {
        if ((e.key === 'Escape' || e.keyCode === 27) && isOpen()) {
            e.preventDefault();
            closeSearch();
        }
    }

    function attachTriggers() {
        var triggers = document.querySelectorAll('.header_btn a, .search-mobile');
        for (var i = 0; i < triggers.length; i++) {
            triggers[i].addEventListener('click', function (e) {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                openSearch();
                return false;
            });
        }
    }

    function init() {
        attachTriggers();
        document.addEventListener('keydown', onKeydown);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
