'use strict';

/**
 * mediaController.js
 *
 * Sends media playback commands (play, pause, next, previous) to the YouTube
 * Music player running inside the main BrowserWindow.
 *
 * Commands are issued via webContents.executeJavaScript, which injects a small
 * self-contained script into the renderer page.  The injected code attempts
 * multiple DOM selector strategies so it stays functional across minor YouTube
 * Music UI changes, and falls back to synthetic keyboard events when no button
 * element can be found.
 *
 * All exported functions are fire-and-forget: they log errors but never throw,
 * so callers (e.g. global shortcut handlers) are never interrupted.
 */

const { BrowserWindow } = require('electron');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the webContents of the current main window, or null if no window is
 * open yet / the window has already been destroyed.
 *
 * @returns {Electron.WebContents | null}
 */
function getMainWebContents() {
  const wins = BrowserWindow.getAllWindows();
  if (wins.length === 0) return null;
  const win = wins[0];
  if (win.isDestroyed()) return null;
  return win.webContents;
}

/**
 * Executes a JavaScript string in the main window's renderer context.
 * Errors (no window, page not ready, JS exception) are logged but not thrown.
 *
 * @param {string} js - JavaScript source to evaluate.
 * @param {string} label - Human-readable command name used in log messages.
 * @returns {Promise<void>}
 */
async function exec(js, label) {
  const wc = getMainWebContents();
  if (!wc) {
    console.warn(`[mediaController] ${label}: no active window`);
    return;
  }
  if (wc.isLoading()) {
    console.warn(`[mediaController] ${label}: page still loading, skipping`);
    return;
  }
  try {
    await wc.executeJavaScript(js, true);
  } catch (err) {
    console.error(`[mediaController] ${label} failed:`, err);
  }
}

// ---------------------------------------------------------------------------
// Injected JavaScript fragments
//
// Each snippet is wrapped in an IIFE so it has its own scope and cannot leak
// variables into the page's global namespace.  The click-first / keyboard-
// fallback pattern keeps commands working even when YouTube Music tweaks its
// DOM structure.
// ---------------------------------------------------------------------------

/**
 * Builds a JS snippet that:
 *  1. Tries each CSS selector in `selectors` and clicks the first match.
 *  2. Falls back to dispatching a KeyboardEvent with the given `keyCode` if
 *     no element is found.
 *
 * @param {string[]} selectors - CSS selectors to try, in priority order.
 * @param {string}   key       - key value for the fallback KeyboardEvent.
 * @returns {string} JavaScript source string.
 */
function buildClickOrKeySnippet(selectors, key) {
  const selectorsJson = JSON.stringify(selectors);
  const keyJson = JSON.stringify(key);
  return `
(function () {
  var selectors = ${selectorsJson};
  for (var i = 0; i < selectors.length; i++) {
    var el = document.querySelector(selectors[i]);
    if (el) { el.click(); return; }
  }
  // Fallback: synthetic keyboard event on the document body.
  document.dispatchEvent(new KeyboardEvent('keydown', { key: ${keyJson}, bubbles: true }));
})();
  `.trim();
}

// Selector lists derived from YouTube Music's player bar markup.
// Multiple selectors are listed from most- to least-specific so the code
// gracefully handles UI changes without breaking entirely.
const PLAY_PAUSE_SELECTORS = [
  'ytmusic-player-bar #play-pause-button',
  '.ytmusic-player-bar .play-pause-button',
  '#play-pause-button',
  'tp-yt-paper-icon-button.play-pause-button',
  '[aria-label="Play"]',
  '[aria-label="Pause"]',
];

const NEXT_SELECTORS = [
  'ytmusic-player-bar .next-button',
  '.ytmusic-player-bar [data-next]',
  '.next-button',
  'tp-yt-paper-icon-button.next-button',
  '[aria-label="Next"]',
  '[title="Next"]',
];

const PREVIOUS_SELECTORS = [
  'ytmusic-player-bar .previous-button',
  '.ytmusic-player-bar [data-previous]',
  '.previous-button',
  'tp-yt-paper-icon-button.previous-button',
  '[aria-label="Previous"]',
  '[title="Previous"]',
];

// Pre-built JS snippets.
const JS_TOGGLE_PLAY = buildClickOrKeySnippet(PLAY_PAUSE_SELECTORS, 'k');
const JS_NEXT        = buildClickOrKeySnippet(NEXT_SELECTORS,        'MediaTrackNext');
const JS_PREVIOUS    = buildClickOrKeySnippet(PREVIOUS_SELECTORS,    'MediaTrackPrevious');

/**
 * JS snippet that queries the play/pause button to determine current state,
 * then either pauses or plays accordingly.  Falls back to a click on the
 * generic toggle button.
 */
const JS_PLAY = `
(function () {
  var btn = document.querySelector('#play-pause-button') ||
            document.querySelector('[aria-label="Pause"]');
  if (btn && btn.getAttribute('aria-label') !== 'Pause') { btn.click(); return; }
  if (btn) return; // already playing
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true }));
})();
`.trim();

const JS_PAUSE = `
(function () {
  var btn = document.querySelector('[aria-label="Pause"]') ||
            document.querySelector('#play-pause-button');
  if (btn && btn.getAttribute('aria-label') === 'Pause') { btn.click(); return; }
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true }));
})();
`.trim();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Starts playback (no-op if already playing). */
function play() {
  return exec(JS_PLAY, 'play');
}

/** Pauses playback (no-op if already paused). */
function pause() {
  return exec(JS_PAUSE, 'pause');
}

/** Toggles between play and pause. */
function togglePlay() {
  return exec(JS_TOGGLE_PLAY, 'togglePlay');
}

/** Skips to the next track in the queue. */
function nextTrack() {
  return exec(JS_NEXT, 'nextTrack');
}

/** Goes back to the previous track (or restarts the current one). */
function previousTrack() {
  return exec(JS_PREVIOUS, 'previousTrack');
}

module.exports = { play, pause, togglePlay, nextTrack, previousTrack };
