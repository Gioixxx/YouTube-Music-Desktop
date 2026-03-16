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
 *   Ctrl+Alt+M  — Toggle mini-player mode (resize main window)
 *   Ctrl+Alt+Y  — Show / hide application window
 *   Ctrl+Alt+I  — Toggle mini player window (always-on-top companion)
 *
 * Whether shortcuts are registered is controlled by the
 * `enableGlobalShortcuts` key in configStore (default: true).
 *
 * Call initShortcuts() inside app.whenReady().
 * Call unregisterShortcuts() on app 'will-quit' to avoid OS-level leaks.
 * Call reloadShortcuts(enabled) (or send the 'shortcuts:reload' IPC message)
 * to dynamically enable or disable shortcuts at runtime.
 */

const { globalShortcut, ipcMain } = require('electron');
const { togglePlay, nextTrack, previousTrack } = require('./mediaController');
const { toggleVisibility, toggleMiniPlayer } = require('./windowManager');
const { toggleMiniPlayerWindow } = require('./miniPlayer');
const {
  getEnableGlobalShortcuts,
  setEnableGlobalShortcuts,
} = require('./configStore');

// ---------------------------------------------------------------------------
// Shortcut map
// ---------------------------------------------------------------------------

/**
 * Default global shortcuts.
 * @type {Array<{ accelerator: string, handler: () => void }>}
 */
const DEFAULT_SHORTCUTS = [
  { accelerator: 'Ctrl+Alt+P', handler: togglePlay             },
  { accelerator: 'Ctrl+Alt+N', handler: nextTrack              },
  { accelerator: 'Ctrl+Alt+B', handler: previousTrack          },
  { accelerator: 'Ctrl+Alt+M', handler: toggleMiniPlayer       },
  { accelerator: 'Ctrl+Alt+Y', handler: toggleVisibility       },
  { accelerator: 'Ctrl+Alt+I', handler: toggleMiniPlayerWindow },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Registers all shortcuts unconditionally. */
function _register() {
  for (const { accelerator, handler } of DEFAULT_SHORTCUTS) {
    const ok = globalShortcut.register(accelerator, handler);
    if (!ok) {
      console.warn(`[shortcuts] Could not register shortcut: ${accelerator}`);
    }
  }
}

/** Unregisters all shortcuts unconditionally. */
function _unregister() {
  for (const { accelerator } of DEFAULT_SHORTCUTS) {
    globalShortcut.unregister(accelerator);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialises shortcuts based on the persisted `enableGlobalShortcuts` value.
 * Also registers the IPC handler so the renderer can toggle them at runtime.
 * Must be called after app.whenReady().
 */
function initShortcuts() {
  if (getEnableGlobalShortcuts()) {
    _register();
  }

  // IPC handler: renderer sends ('shortcuts:reload', enabled)
  // Updates the persisted setting and re-registers/unregisters accordingly.
  ipcMain.handle('shortcuts:reload', (_event, enabled) => {
    reloadShortcuts(Boolean(enabled));
  });
}

/**
 * Dynamically enables or disables global shortcuts.
 * Persists the new value to configStore so the setting survives restarts.
 *
 * @param {boolean} enabled - true to register shortcuts, false to unregister.
 */
function reloadShortcuts(enabled) {
  setEnableGlobalShortcuts(enabled);
  _unregister();
  if (enabled) {
    _register();
  }
}

/**
 * Unregisters all shortcuts.  Should be called on app 'will-quit'.
 */
function unregisterShortcuts() {
  _unregister();
}

module.exports = { initShortcuts, unregisterShortcuts, reloadShortcuts };
