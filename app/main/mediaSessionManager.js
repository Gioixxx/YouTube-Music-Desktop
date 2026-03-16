'use strict';

/**
 * mediaSessionManager.js
 *
 * Integrates OS-level media controls with the YouTube Music player through
 * two complementary mechanisms:
 *
 *  1. globalShortcut  — binds hardware media keys (MediaPlayPause,
 *     MediaNextTrack, MediaPreviousTrack, MediaStop).  Works in both
 *     foreground and background because globalShortcut bypasses window focus.
 *
 *  2. IPC handlers    — receives 'media:*' messages forwarded by the preload's
 *     navigator.mediaSession action handlers (OS Transport Controls overlay,
 *     macOS Now Playing, Linux MPRIS).
 *
 * Both paths call the corresponding function in mediaController.
 *
 * Call initMediaSession() inside app.whenReady() before creating the main
 * window.  Call unregisterMediaKeys() on app 'will-quit' to release shortcuts.
 */

const { globalShortcut, ipcMain } = require('electron');
const {
  play,
  pause,
  togglePlay,
  nextTrack,
  previousTrack,
} = require('./mediaController');

// ---------------------------------------------------------------------------
// IPC — receives commands forwarded by the preload's MediaSession handlers
// ---------------------------------------------------------------------------

/**
 * Registers ipcMain handlers for the media:* channels whitelisted in the
 * preload.  Each handler is idempotent (safe to call multiple times).
 */
function registerIPCHandlers() {
  ipcMain.on('media:play',     () => play());
  ipcMain.on('media:pause',    () => pause());
  ipcMain.on('media:next',     () => nextTrack());
  ipcMain.on('media:previous', () => previousTrack());
}

// ---------------------------------------------------------------------------
// globalShortcut — hardware media keys
// ---------------------------------------------------------------------------

/** Media key → handler mapping. */
const MEDIA_KEY_MAP = [
  { accelerator: 'MediaPlayPause',   handler: togglePlay    },
  { accelerator: 'MediaNextTrack',   handler: nextTrack     },
  { accelerator: 'MediaPreviousTrack', handler: previousTrack },
  { accelerator: 'MediaStop',        handler: pause         },
];

/**
 * Registers all global media-key shortcuts.
 * Failures (key already taken by another app) are logged but non-fatal.
 */
function registerMediaKeys() {
  for (const { accelerator, handler } of MEDIA_KEY_MAP) {
    const ok = globalShortcut.register(accelerator, handler);
    if (!ok) {
      console.warn(`[mediaSessionManager] Could not register shortcut: ${accelerator}`);
    }
  }
}

/**
 * Unregisters all global media-key shortcuts registered by this module.
 * Should be called on app 'will-quit'.
 */
function unregisterMediaKeys() {
  for (const { accelerator } of MEDIA_KEY_MAP) {
    globalShortcut.unregister(accelerator);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialises the full MediaSession integration.
 * Must be called after app.whenReady() so that globalShortcut is available.
 */
function initMediaSession() {
  registerIPCHandlers();
  registerMediaKeys();
}

module.exports = { initMediaSession, unregisterMediaKeys };
