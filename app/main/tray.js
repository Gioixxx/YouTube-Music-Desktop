'use strict';

/**
 * tray.js
 *
 * Creates and manages the system-tray icon for YouTube Music Desktop.
 *
 * Features:
 *   - Context menu: Play/Pause, Next, Previous, Show App, Quit
 *   - Double-click on the tray icon brings the main window to the front
 *   - Tray is destroyed on app 'will-quit' so the icon is removed from the OS tray
 *
 * Usage:
 *   Call initTray() inside app.whenReady().
 *   The returned Tray instance is also stored internally; call destroyTray()
 *   on app 'will-quit' (or register it there).
 */

const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const { togglePlay, nextTrack, previousTrack } = require('./mediaController');
const { getMainWindow } = require('./windowManager');
const { toggleMiniPlayerWindow } = require('./miniPlayer');
const { checkForUpdatesManual } = require('./updater');

/** @type {Tray | null} */
let tray = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds the path to the tray icon.
 * The icon lives in assets/icons/ relative to the project root.
 *
 * @returns {string}
 */
function _iconPath() {
  return path.join(__dirname, '../../assets/icons/tray.png');
}

/**
 * Builds the context menu attached to the tray icon.
 *
 * @returns {Electron.Menu}
 */
function _buildContextMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Play / Pause',
      click: () => togglePlay(),
    },
    {
      label: 'Next',
      click: () => nextTrack(),
    },
    {
      label: 'Previous',
      click: () => previousTrack(),
    },
    { type: 'separator' },
    {
      label: 'Mini Player',
      click: () => toggleMiniPlayerWindow(),
    },
    { type: 'separator' },
    {
      label: 'Show App',
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Check for updates',
      click: () => checkForUpdatesManual(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialises the system-tray icon.
 * Must be called after app.whenReady() so that the Tray API is available.
 *
 * @returns {Tray} The created Tray instance.
 */
function initTray() {
  const icon = nativeImage.createFromPath(_iconPath());
  tray = new Tray(icon);
  tray.setToolTip('YouTube Music Desktop');
  tray.setContextMenu(_buildContextMenu());

  // Double-click: bring the main window to the front (Windows / Linux).
  tray.on('double-click', () => {
    const win = getMainWindow();
    if (win) {
      win.show();
      win.focus();
    }
  });

  return tray;
}

/**
 * Destroys the tray icon, removing it from the OS tray.
 * Should be called on app 'will-quit'.
 */
function destroyTray() {
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
  }
  tray = null;
}

module.exports = { initTray, destroyTray };
