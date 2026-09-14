// ==UserScript==
// @name         Pixiv Arrow-Key Pagination
// @namespace    https://www.pixiv.net/
// @version      1.1
// @description  Use Left/Right arrow keys to navigate Pixiv paginated pages.
// @match        https://www.pixiv.net/search*
// @match        https://www.pixiv.net/*/tags/*
// @match        https://www.pixiv.net/users/*/illustrations*
// @match        https://www.pixiv.net/users/*/manga*
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

        const url = new URL(window.location.href);
        const path = url.pathname;

        // Supported Pixiv pages:
        //   /search
        //   /tags/...
        //   /users/<id>/illustrations
        //   /users/<id>/manga
        const isSearchPage = path.startsWith('/search');
        const isTagPage = path.includes('/tags/');
        const isArtistIllustrations = /^\/users\/\d+\/illustrations\/?$/.test(path);
        const isArtistManga = /^\/users\/\d+\/manga\/?$/.test(path);

        if (
            !isSearchPage &&
            !isTagPage &&
            !isArtistIllustrations &&
            !isArtistManga
        ) {
            return;
        }

        // Pixiv uses "p" for pagination.
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

        // Navigate to the new page.
        window.location.href = url.toString();
    });
})();
