'use strict';

/**
 * shortcuts.js
 *
 * Registers global keyboard shortcuts that control YouTube Music Desktop
 * even when the application window does not have focus.
 *
 * Default bindings:
 *   Ctrl+Alt+P  — Play / Pause
 *   Ctrl+Alt+N  — Next track
 *   Ctrl+Alt+B  — Previous track
 *   Ctrl+Alt+M  — Toggle mini-player mode
 *   Ctrl+Alt+Y  — Show / hide application window
 *
 * All shortcuts are unregistered on app 'will-quit' to prevent leaks.
 * Call initShortcuts() inside app.whenReady(), and unregisterShortcuts()
 * on app 'will-quit'.
 */

const { globalShortcut } = require('electron');
const { togglePlay, nextTrack, previousTrack } = require('./mediaController');
const { toggleVisibility, toggleMiniPlayer } = require('./windowManager');

// ---------------------------------------------------------------------------
// Shortcut map
// ---------------------------------------------------------------------------

/**
 * Default global shortcuts.
 * Each entry maps an accelerator string to its handler function.
 *
 * @type {Array<{ accelerator: string, handler: () => void }>}
 */
const DEFAULT_SHORTCUTS = [
  { accelerator: 'Ctrl+Alt+P', handler: togglePlay        },
  { accelerator: 'Ctrl+Alt+N', handler: nextTrack         },
  { accelerator: 'Ctrl+Alt+B', handler: previousTrack     },
  { accelerator: 'Ctrl+Alt+M', handler: toggleMiniPlayer  },
  { accelerator: 'Ctrl+Alt+Y', handler: toggleVisibility  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Registers all default global shortcuts.
 * If a shortcut cannot be registered (e.g. taken by another app) a warning
 * is logged but the remaining shortcuts are still registered.
 */
function initShortcuts() {
  for (const { accelerator, handler } of DEFAULT_SHORTCUTS) {
    const ok = globalShortcut.register(accelerator, handler);
    if (!ok) {
      console.warn(`[shortcuts] Could not register shortcut: ${accelerator}`);
    }
  }
}

/**
 * Unregisters all global shortcuts registered by this module.
 * Should be called on app 'will-quit' to avoid OS-level shortcut leaks.
 */
function unregisterShortcuts() {
  for (const { accelerator } of DEFAULT_SHORTCUTS) {
    globalShortcut.unregister(accelerator);
  }
}

module.exports = { initShortcuts, unregisterShortcuts };
