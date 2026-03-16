'use strict';

/**
 * adBlockManager.js
 *
 * Cosmetic ad-blocking for YouTube Music.
 *
 * Approach: purely DOM-level — no network requests are intercepted or blocked.
 * On every page load the module:
 *   1. Injects a CSS rule that sets `display:none !important` on all known
 *      ad/promo selectors (instant hiding of static elements).
 *   2. Executes a small inline script that sets up a MutationObserver to
 *      hide the same selectors whenever new nodes are added to the DOM
 *      (covers YouTube Music's dynamic SPA rendering).
 *
 * The feature is gated on the `adBlockUI` config key (default: true).
 *
 * Public API:
 *   initAdBlock(win)   Attach ad-hiding logic to a BrowserWindow.
 *                      Call once after the window is created; the module
 *                      re-injects on every subsequent navigation automatically.
 */

const { getAdBlockUI } = require('./configStore');

// ---------------------------------------------------------------------------
// Selector list
// Covers promotional banners, in-feed ads, player ad slots and overlay promos
// that appear in YouTube Music.  Purely cosmetic — only hides DOM elements.
// ---------------------------------------------------------------------------

const AD_SELECTORS = [
  /* YouTube Music promo / premium upsell */
  'ytmusic-mealbar-promo-renderer',
  'ytmusic-premium-offer-box-renderer',
  '.ytmusic-mealbar-promo-renderer',

  /* Generic YouTube ad containers (shared with YTM web) */
  '#player-ads',
  '#masthead-ad',
  '.ad-container',
  '.ad-showing',

  /* Slot / feed ad renderers */
  'ytd-ad-slot-renderer',
  'ytd-in-feed-ad-layout-renderer',
  'ytd-banner-promo-renderer',
  'ytd-promoted-sparkles-web-renderer',
  'ytd-promoted-video-renderer',
  'ytd-companion-slot-renderer',
  'ytd-promoted-sparkles-text-search-renderer',

  /* Overlay / interstitial */
  '.ytd-companion-slot-renderer',
  '.googleads',
  'iframe[id^="google_ads"]',
  'div[id^="google_ads"]',
  'div[id^="ad_"]',
  '[aria-label="Ad"]',
  '[aria-label="Ads"]',
];

// ---------------------------------------------------------------------------
// CSS string injected via webContents.insertCSS()
// ---------------------------------------------------------------------------

const AD_HIDE_CSS = AD_SELECTORS.join(',\n') + ' {\n  display: none !important;\n}\n';

// ---------------------------------------------------------------------------
// MutationObserver script injected via webContents.executeJavaScript()
// Runs in the page context (no Node.js — pure DOM API).
// ---------------------------------------------------------------------------

/**
 * Builds a self-contained IIFE string that:
 *  - immediately hides all matching elements in the current DOM
 *  - attaches a MutationObserver to hide dynamically-added elements
 *
 * @param {string[]} selectors
 * @returns {string}
 */
function _buildObserverScript(selectors) {
  // Serialise the array so it is embedded as a JSON literal in the script.
  const selectorsJson = JSON.stringify(selectors);

  return `
(function () {
  'use strict';
  if (window.__ytmdAdBlockInstalled) return;
  window.__ytmdAdBlockInstalled = true;

  var SELECTORS = ${selectorsJson};

  function hideAll() {
    for (var i = 0; i < SELECTORS.length; i++) {
      try {
        var nodes = document.querySelectorAll(SELECTORS[i]);
        for (var j = 0; j < nodes.length; j++) {
          nodes[j].style.setProperty('display', 'none', 'important');
        }
      } catch (_) {}
    }
  }

  hideAll();

  var observer = new MutationObserver(hideAll);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attaches ad-hiding logic to the given BrowserWindow.
 *
 * CSS is injected and the MutationObserver script is executed on every
 * `dom-ready` event, which fires for both the initial load and subsequent
 * SPA navigations that trigger a full page reload.
 *
 * @param {Electron.BrowserWindow} win
 */
function initAdBlock(win) {
  const wc = win.webContents;

  wc.on('dom-ready', () => {
    if (!getAdBlockUI()) return;

    // 1. CSS injection — hides elements that are present at DOM-ready.
    wc.insertCSS(AD_HIDE_CSS).catch((err) => {
      console.warn('[adBlockManager] insertCSS failed:', err.message);
    });

    // 2. MutationObserver — hides elements added dynamically by the SPA.
    wc.executeJavaScript(_buildObserverScript(AD_SELECTORS)).catch((err) => {
      console.warn('[adBlockManager] executeJavaScript failed:', err.message);
    });
  });
}

module.exports = { initAdBlock };
