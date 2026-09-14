// ==UserScript==
// @name         Pixiv Arrow-Key Pagination
// @namespace    https://www.pixiv.net/
// @version      1.2
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

    /*
     * ============================================================
     * Configuration
     * ============================================================
     */

    // How often to re-check the pagination controls.
    const CHECK_INTERVAL = 500;

    /*
     * ============================================================
     * Page detection
     * ============================================================
     */

    function getPageType() {
        const path = window.location.pathname;

        // Search pages:
        //   /search
        const isSearchPage = path === '/search' || path.startsWith('/search/');

        // Tag pages:
        //   /tags/foo
        //   /tags/foo/illustrations
        //   /tags/foo/manga
        //   /tags/foo/novels
        const isTagPage = path.startsWith('/tags/');

        /*
         * Artist pages:
         *
         *   /users/12345678/illustrations
         *   /users/12345678/illustrations/foo
         *
         *   /users/12345678/manga
         *   /users/12345678/manga/foo
         *
         *   /users/12345678/novels
         *   /users/12345678/novels/foo
         *
         * The final part after illustrations/manga/novels is
         * allowed to be anything, which accommodates URL-encoded
         * tags such as:
         *
         *   /users/34011301/illustrations/%E6%B4%97%E8%84%B3
         */

        const artistMatch = path.match(
            /^\/users\/(\d+)\/(illustrations|manga|novels)(?:\/.*)?$/
        );

        if (artistMatch) {
            return {
                type: 'artist',
                category: artistMatch[2],
                userId: artistMatch[1]
            };
        }

        if (isSearchPage) {
            return {
                type: 'search'
            };
        }

        if (isTagPage) {
            return {
                type: 'tag'
            };
        }

        return null;
    }

    /*
     * ============================================================
     * Pagination detection
     * ============================================================
     *
     * Pixiv is a React/SPA application, so the exact DOM structure
     * can change. Rather than relying on one specific class name,
     * we inspect links/buttons for pagination information.
     */

    function getPaginationInfo() {
        const currentUrl = new URL(window.location.href);
        const currentPage = parseInt(
            currentUrl.searchParams.get('p') || '1',
            10
        );

        let maxPage = null;
        let hasNext = null;

        /*
         * --------------------------------------------------------
         * Method 1:
         * Look for links containing ?p=N or &p=N.
         *
         * This is particularly useful when Pixiv renders numbered
         * pagination links.
         * --------------------------------------------------------
         */

        const pageLinks = document.querySelectorAll('a[href]');

        for (const link of pageLinks) {
            try {
                const href = new URL(link.href, window.location.origin);

                // Only consider links that remain on the same path.
                if (href.pathname !== currentUrl.pathname) {
                    continue;
                }

                const p = parseInt(href.searchParams.get('p'), 10);

                if (Number.isFinite(p) && p >= 1) {
                    if (maxPage === null || p > maxPage) {
                        maxPage = p;
                    }

                    // A link to the next page proves that one exists.
                    if (p === currentPage + 1) {
                        hasNext = true;
                    }
                }
            } catch (_) {
                // Ignore malformed/non-standard links.
            }
        }

        /*
         * --------------------------------------------------------
         * Method 2:
         * Look for pagination controls whose accessible text or
         * aria-label indicates "next" / "previous".
         *
         * This handles cases where Pixiv uses buttons rather than
         * ordinary numbered <a> links.
         * --------------------------------------------------------
         */

        const controls = document.querySelectorAll(
            'button, a, [role="button"]'
        );

        for (const element of controls) {
            const text = (
                element.getAttribute('aria-label') ||
                element.getAttribute('title') ||
                element.textContent ||
                ''
            ).trim().toLowerCase();

            if (!text) {
                continue;
            }

            const isNext =
                text === 'next' ||
                text.includes('next page') ||
                text.includes('次へ') ||
                text.includes('次のページ');

            if (isNext) {
                const disabled =
                    element.disabled ||
                    element.getAttribute('aria-disabled') === 'true';

                hasNext = !disabled;
            }
        }

        /*
         * --------------------------------------------------------
         * Method 3:
         * If we found a maximum numbered page, that gives us a
         * reliable upper boundary.
         * --------------------------------------------------------
         */

        if (maxPage !== null) {
            hasNext = currentPage < maxPage;
        }

        return {
            currentPage,
            maxPage,
            hasNext
        };
    }

    /*
     * ============================================================
     * Is the requested direction available?
     * ============================================================
     */

    function canNavigate(direction) {
        const pageInfo = getPaginationInfo();

        // Page 1 has no previous page.
        if (direction === 'previous') {
            return pageInfo.currentPage > 1;
        }

        // If Pixiv explicitly tells us there is no next page,
        // don't navigate.
        if (direction === 'next') {
            if (pageInfo.hasNext === false) {
                return false;
            }

            /*
             * If Pixiv hasn't rendered pagination information yet,
             * allow the navigation. This is important because the
             * page may still be loading.
             */
            return true;
        }

        return false;
    }

    /*
     * ============================================================
     * Navigate
     * ============================================================
     */

    function navigate(direction) {
        const pageInfo = getPaginationInfo();
        let page = pageInfo.currentPage;

        if (direction === 'previous') {
            if (!canNavigate('previous')) {
                return;
            }

            page--;
        } else if (direction === 'next') {
            if (!canNavigate('next')) {
                return;
            }

            page++;
        } else {
            return;
        }

        const url = new URL(window.location.href);

        /*
         * Preserve every existing query parameter:
         *
         *   ?p=2
         *   ?p=6&order=date
         *   ?p=2&mode=all
         *
         * Only change the page number.
         */
        url.searchParams.set('p', page);

        window.location.href = url.toString();
    }

    /*
     * ============================================================
     * Keyboard handler
     * ============================================================
     */

    document.addEventListener('keydown', function (event) {
        /*
         * Don't interfere with typing.
         */
        const target = event.target;

        if (!target) {
            return;
        }

        const tag = target.tagName
            ? target.tagName.toLowerCase()
            : '';

        if (
            tag === 'input' ||
            tag === 'textarea' ||
            tag === 'select' ||
            target.isContentEditable
        ) {
            return;
        }

        /*
         * Only respond to plain Left/Right arrows.
         */
        if (
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
        ) {
            return;
        }

        /*
         * Don't activate on unrelated Pixiv pages.
         */
        if (!getPageType()) {
            return;
        }

        if (event.key === 'ArrowLeft') {
            if (!canNavigate('previous')) {
                return;
            }

            event.preventDefault();
            navigate('previous');
        } else if (event.key === 'ArrowRight') {
            if (!canNavigate('next')) {
                return;
            }

            event.preventDefault();
            navigate('next');
        }
    });

    /*
     * ============================================================
     * SPA / dynamic-page handling
     * ============================================================
     *
     * Pixiv uses dynamic page updates. Re-check the page after
     * navigation/content changes so that the pagination state is
     * refreshed.
     */

    let lastUrl = window.location.href;

    setInterval(function () {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
   
