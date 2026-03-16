'use strict';

/**
 * securityManager.js
 *
 * Centralises Electron security hardening for the YouTube Music Desktop app:
 *
 *  1. web-contents-created: attaches a `will-navigate` guard to every new
 *     WebContents (including OAuth popup windows) so that non-whitelisted
 *     URLs are opened in the system browser, never inside the app.
 *
 *  2. CSP via onHeadersReceived: injects a Content-Security-Policy header
 *     on all responses so that only YouTube Music / Google origins are
 *     permitted to load scripts, styles, frames, and other resources.
 */

const { app, session, shell } = require('electron');

/**
 * Domains the app is allowed to navigate to or open in-process.
 * Must stay in sync with the list in windowManager.js.
 */
const ALLOWED_NAVIGATION_HOSTS = [
  'music.youtube.com',
  'www.youtube.com',
  'youtube.com',
  'accounts.google.com',
  'accounts.youtube.com',
  'myaccount.google.com',
  'google.com',
];

/**
 * A permissive-but-scoped CSP that restricts loading to YouTube Music and
 * Google origins while still allowing the site to function correctly.
 *
 * Notes:
 *  - 'unsafe-inline' / 'unsafe-eval' are required by YouTube Music's own JS.
 *  - img-src and media-src are kept broad (data:, blob:, *) because YouTube
 *    Music streams content from many CDN hostnames.
 *  - The policy is intentionally not replaces the server-sent header; it is
 *    added alongside it so the browser enforces whichever is more restrictive.
 */
const CSP_POLICY = [
  "default-src 'self' https://*.youtube.com https://youtube.com https://*.google.com https://google.com https://*.gstatic.com https://*.googlevideo.com https://*.ggpht.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.youtube.com https://*.google.com https://*.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://*.youtube.com https://*.google.com https://*.gstatic.com https://fonts.googleapis.com",
  "font-src 'self' data: https://*.gstatic.com https://fonts.gstatic.com",
  "img-src * data: blob:",
  "media-src * blob:",
  "connect-src * data: blob:",
  "frame-src 'self' https://*.youtube.com https://*.google.com",
  "worker-src blob: 'self'",
].join('; ');

/**
 * Attaches a `will-navigate` guard to the given WebContents.
 * Any navigation to a host outside ALLOWED_NAVIGATION_HOSTS is cancelled and
 * forwarded to the system browser.
 *
 * @param {Electron.WebContents} contents
 */
function attachNavigationGuard(contents) {
  contents.on('will-navigate', (event, url) => {
    try {
      const { hostname } = new URL(url);
      if (!ALLOWED_NAVIGATION_HOSTS.includes(hostname)) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch {
      // Malformed URL – block it.
      event.preventDefault();
    }
  });
}

/**
 * Registers the app-level `web-contents-created` listener so that navigation
 * guards are applied to every WebContents created during the app's lifetime,
 * including OAuth popup windows opened via setWindowOpenHandler.
 */
function registerWebContentsCreatedHandler() {
  app.on('web-contents-created', (_event, contents) => {
    attachNavigationGuard(contents);
  });
}

/**
 * Injects a Content-Security-Policy header into all HTTP responses handled by
 * the default session.  This runs after the network response is received so it
 * can add (not replace) headers for every page loaded in the app.
 */
function registerCSPHeader() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };

    // Only inject on HTML documents; skip sub-resource responses to avoid
    // interfering with CDN resources that don't expect a CSP themselves.
    const contentType = Object.keys(responseHeaders).find(
      (k) => k.toLowerCase() === 'content-type',
    );
    const isHtml =
      !contentType ||
      String(responseHeaders[contentType]).toLowerCase().includes('text/html');

    if (isHtml) {
      responseHeaders['Content-Security-Policy'] = [CSP_POLICY];
    }

    callback({ responseHeaders });
  });
}

/**
 * Initialises all security hardening.  Must be called after `app.whenReady()`
 * so that `session.defaultSession` is available, and before the main window is
 * created so that the web-contents-created handler covers the main window.
 */
function initSecurity() {
  registerWebContentsCreatedHandler();
  registerCSPHeader();
}

module.exports = { initSecurity };
