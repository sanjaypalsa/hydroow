/*!
 * product-tools.js
 * ---------------------------------------------------------------------------
 * Adds, to every Hydroow product list on a page:
 *   1. a small live search box directly ABOVE the list, which filters that
 *      list only (case-insensitive match on the item text); and
 *   2. pagination of 50 items per page.
 *
 * Supported list structures:
 *   (A) CARD GRIDS : <div class="products"> with direct <div class="product-card">
 *                    children.
 *   (B) SPEC TABLES: <table class="... product-table ..."> where the FIRST <tr>
 *                    is the always-visible header row and every later <tr> is a
 *                    product row.
 *
 * Vanilla JavaScript only (no jQuery). Every list keeps its own page number and
 * its own search query. Safe to load on pages with no product list.
 */
(function () {
    'use strict';

    var PAGE_SIZE = 50;   // items per page
    var WINDOW_SIZE = 5;  // numbered page buttons displayed around the active page

    // Guard against being included more than once.
    if (window.__hydroowProductToolsLoaded) {
        return;
    }
    window.__hydroowProductToolsLoaded = true;

    /* ------------------------------------------------------------------ */
    /* Helpers                                                            */
    /* ------------------------------------------------------------------ */

    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function hasClass(el, name) {
        return !!(el && el.classList && el.classList.contains(name));
    }

    function buildSearchBox() {
        var root = document.createElement('div');
        root.className = 'hydroow-list-search';

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'hydroow-list-search-input';
        input.setAttribute('placeholder', 'Search in this list...');
        input.setAttribute('aria-label', 'Search in this list');
        input.setAttribute('autocomplete', 'off');

        root.appendChild(input);
        return { root: root, input: input };
    }

    function buildPagination() {
        var root = document.createElement('div');
        root.className = 'hydroow-pagination';
        return root;
    }

    function scrollToList(el) {
        if (!el || typeof el.scrollIntoView !== 'function') {
            return;
        }
        try {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
            el.scrollIntoView(true);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Wire a single list                                                 */
    /* ------------------------------------------------------------------ */

    function setupList(config) {
        var items = config.items;                // all pageable item elements
        var anchorBefore = config.anchorBefore;  // node the search box goes before
        var anchorAfter = config.anchorAfter;    // node the pagination goes after
        var scrollTarget = config.scrollTarget || anchorBefore;

        if (!items || !items.length ||
            !anchorBefore || !anchorBefore.parentNode ||
            !anchorAfter || !anchorAfter.parentNode) {
            return;
        }

        var search = buildSearchBox();
        var pagination = buildPagination();

        anchorBefore.parentNode.insertBefore(search.root, anchorBefore);
        anchorAfter.parentNode.insertBefore(pagination, anchorAfter.nextSibling);

        var state = { page: 1, query: '', totalPages: 1 };
        var filtered = items.slice();

        /* -- filtering -------------------------------------------------- */

        function applyFilter() {
            var i;
            filtered = [];

            if (!state.query) {
                for (i = 0; i < items.length; i++) {
                    filtered.push(items[i]);
                }
                return;
            }

            for (i = 0; i < items.length; i++) {
                var text = items[i].textContent || '';
                if (text.toLowerCase().indexOf(state.query) !== -1) {
                    filtered.push(items[i]);
                }
            }
        }

        function hideAll() {
            for (var i = 0; i < items.length; i++) {
                items[i].classList.add('hydroow-hidden');
            }
        }

        /* -- rendering -------------------------------------------------- */

        function render() {
            applyFilter();

            var total = filtered.length;
            var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

            if (state.page > totalPages) { state.page = totalPages; }
            if (state.page < 1) { state.page = 1; }
            state.totalPages = totalPages;

            hideAll();

            var start = (state.page - 1) * PAGE_SIZE;
            var end = Math.min(start + PAGE_SIZE, total);
            for (var i = start; i < end; i++) {
                filtered[i].classList.remove('hydroow-hidden');
            }

            renderControls();
        }

        function makeButton(label, page, disabled, active) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hydroow-page-btn';
            btn.textContent = label;

            if (active) {
                btn.classList.add('hydroow-page-active');
                btn.setAttribute('aria-current', 'page');
            }
            if (disabled) {
                btn.disabled = true;
            } else if (!active) {
                btn.addEventListener('click', function () {
                    goTo(page);
                });
            }
            return btn;
        }

        function makeEllipsis() {
            var span = document.createElement('span');
            span.className = 'hydroow-pagination-ellipsis';
            span.textContent = '\u2026';
            return span;
        }

        function renderControls() {
            pagination.innerHTML = '';

            // Only render controls when there is more than one page.
            if (state.totalPages <= 1) {
                return;
            }

            var frag = document.createDocumentFragment();

            frag.appendChild(makeButton('Previous', state.page - 1, state.page <= 1, false));

            var startPage = Math.max(1, state.page - Math.floor(WINDOW_SIZE / 2));
            var endPage = Math.min(state.totalPages, startPage + WINDOW_SIZE - 1);
            startPage = Math.max(1, endPage - WINDOW_SIZE + 1);

            if (startPage > 1) {
                frag.appendChild(makeButton('1', 1, false, state.page === 1));
                if (startPage > 2) {
                    frag.appendChild(makeEllipsis());
                }
            }

            for (var p = startPage; p <= endPage; p++) {
                frag.appendChild(makeButton(String(p), p, false, p === state.page));
            }

            if (endPage < state.totalPages) {
                if (endPage < state.totalPages - 1) {
                    frag.appendChild(makeEllipsis());
                }
                frag.appendChild(makeButton(String(state.totalPages), state.totalPages, false,
                    state.page === state.totalPages));
            }

            frag.appendChild(makeButton('Next', state.page + 1, state.page >= state.totalPages, false));

            pagination.appendChild(frag);
        }

        function goTo(page) {
            if (page < 1 || page > state.totalPages || page === state.page) {
                return;
            }
            state.page = page;
            render();
            scrollToList(scrollTarget);
        }

        /* -- events ----------------------------------------------------- */

        search.input.addEventListener('input', function () {
            state.query = (search.input.value || '').trim().toLowerCase();
            state.page = 1;
            render();
        });

        // Keep Enter from submitting any surrounding form / refreshing.
        search.input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
            }
        });

        render();
    }

    /* ------------------------------------------------------------------ */
    /* Discover lists                                                     */
    /* ------------------------------------------------------------------ */

    function directProductCards(container) {
        var result = [];
        var children = container.children;
        for (var i = 0; i < children.length; i++) {
            if (hasClass(children[i], 'product-card')) {
                result.push(children[i]);
            }
        }
        return result;
    }

    // The dedicated wrapper around a spec table is a plain ".product" element
    // (e.g. class="product mt-4"). The page's outer section wrapper is
    // class="product _sec ..." and must NOT be used.
    function findTableWrapper(table) {
        var parent = table.parentElement;
        if (parent && hasClass(parent, 'product') && !hasClass(parent, '_sec')) {
            return parent;
        }
        return null;
    }

    function initCardGrids() {
        var grids = document.querySelectorAll('.products');
        for (var i = 0; i < grids.length; i++) {
            var grid = grids[i];
            if (grid.getAttribute('data-hydroow-init') === '1') {
                continue;
            }
            grid.setAttribute('data-hydroow-init', '1');

            var cards = directProductCards(grid);
            if (!cards.length) {
                continue;
            }

            setupList({
                items: cards,
                anchorBefore: grid,
                anchorAfter: grid,
                scrollTarget: grid
            });
        }
    }

    function initTables() {
        var tables = document.querySelectorAll('table.product-table');
        for (var i = 0; i < tables.length; i++) {
            var table = tables[i];
            if (table.getAttribute('data-hydroow-init') === '1') {
                continue;
            }
            table.setAttribute('data-hydroow-init', '1');

            // Row 1 is the always-visible header; rows 2..n are products.
            var rows = table.querySelectorAll('tr');
            var dataRows = [];
            for (var r = 1; r < rows.length; r++) {
                dataRows.push(rows[r]);
            }
            if (!dataRows.length) {
                continue;
            }

            var wrapper = findTableWrapper(table);
            var anchorBefore = wrapper || table;
            var anchorAfter = wrapper || table;

            setupList({
                items: dataRows,
                anchorBefore: anchorBefore,
                anchorAfter: anchorAfter,
                scrollTarget: anchorBefore
            });
        }
    }

    function initAll() {
        try {
            initCardGrids();
            initTables();
        } catch (err) {
            if (window.console && typeof console.warn === 'function') {
                console.warn('[product-tools]', err);
            }
        }
    }

    onReady(initAll);
})();
