// ==UserScript==
// @name         Pixiv Arrow-Key Pagination
// @namespace    https://www.pixiv.net/
// @version      1.3
// @description  Use Left/Right arrow keys to navigate Pixiv paginated pages.
// @match        https://www.pixiv.net/search*
// @match        https://www.pixiv.net/*/tags/*
// @match        https://www.pixiv.net/users/*/illustrations*
// @match        https://www.pixiv.net/users/*/manga*
// @match        https://www.pixiv.net/users/*/novels*
// @grant        none
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

        // Make sure we're on a supported Pixiv page.
        const url = new URL(window.location.href);
        const path = url.pathname;

        const isSearchPage = path.startsWith('/search');
        const isTagPage = path.includes('/tags/');

        // Artist galleries:
        // /users/<ID>/illustrations
        // /users/<ID>/illustrations/<filter>
        // /users/<ID>/manga
        // /users/<ID>/manga/<filter>
        // /users/<ID>/novels
        // /users/<ID>/novels/<filter>
        const isArtistPage =
            /^\/users\/\d+\/(illustrations|manga|novels)(\/|$)/.test(path);

        if (
            !isSearchPage &&
            !isTagPage &&
            !isArtistPage
        ) {
            return;
        }

        // Pixiv uses "p" for the page number.
        let page = parseInt(
            url.searchParams.get('p') || '1',
            10
        );

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

        // Navigate to the new page.
        window.location.href = url.toString();
    });
})();
