// ==UserScript==
// @name         Pixiv Arrow-Key Pagination
// @namespace    https://www.pixiv.net/
// @version      1.0
// @description  Use Left/Right arrow keys to navigate Pixiv search result pages.
// @match        https://www.pixiv.net/search*
// @match        https://www.pixiv.net/*/tags/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/adc888/pixiv-arrow-pagination/main/pixiv-arrow-pagination.user.js
// @downloadURL  https://raw.githubusercontent.com/adc888/pixiv-arrow-pagination/main/pixiv-arrow-pagination.user.js
// ==/UserScript==

(function () {
    'use strict';

    document.addEventListener('keydown', function (event) {
        // Don't interfere with typing in search boxes, comments, etc.
        const tag = event.target.tagName.toLowerCase();

        if (
            tag === 'input' ||
            tag === 'textarea' ||
            tag === 'select' ||
            event.target.isContentEditable
        ) {
            return;
        }

        // Only handle plain Left/Right arrows.
        if (
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
        ) {
            return;
        }

        // Make sure we're on a Pixiv search/tag page.
        const url = new URL(window.location.href);

        const isSearchPage = url.pathname.startsWith('/search');
        const isTagPage = url.pathname.includes('/tags/');

        if (!isSearchPage && !isTagPage) {
            return;
        }

        // Pixiv uses "p" for the search/tag page number.
        let page = parseInt(url.searchParams.get('p') || '1', 10);

        if (event.key === 'ArrowLeft') {
            if (page <= 1) {
                return;
            }

            page--;
        } else if (event.key === 'ArrowRight') {
            page++;
        } else {
            return;
        }

        event.preventDefault();

        url.searchParams.set('p', page);

        // Let Pixiv perform its normal navigation.
        window.location.href = url.toString();
    });
})();

