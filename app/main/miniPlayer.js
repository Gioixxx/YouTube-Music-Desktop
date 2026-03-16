'use strict';

/**
 * miniPlayer.js
 *
 * Manages a compact, always-on-top second BrowserWindow that shows current
 * track info and playback controls.
 *
 * Window characteristics:
 *   - 340 × 130 px, not resizable
 *   - alwaysOnTop: true
 *   - frameless (no OS title-bar chrome)
 *   - Loads app/renderer/miniPlayer.html
 *
 * IPC flow:
 *   Inbound (renderer → main):  media:play / media:pause / media:next /
 *                                media:previous  (handled by mediaSessionManager)
 *   Outbound (main → renderer): miniPlayer:update { title, artist, artworkPath }
 *
 * Public API:
 *   initMiniPlayer()           Register the track:changed IPC listener.
 *   toggleMiniPlayerWindow()   Show (create if needed) or hide the window.
 *   updateTrackInfo(data)      Push track data to the mini player renderer.
 *   destroyMiniPlayerWindow()  Destroy the window (call on app will-quit).
 */

const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { getArtworkPath } = require('./artworkCache');

/** @type {BrowserWindow | null} */
let miniPlayerWin = null;

// ---------------------------------------------------------------------------
// Window management
// ---------------------------------------------------------------------------

/**
 * Creates the mini player BrowserWindow (hidden until ready-to-show).
 * @returns {BrowserWindow}
 */
function _createWindow() {
  const win = new BrowserWindow({
    width: 340,
    height: 130,
    alwaysOnTop: true,
    resizable: false,
    frame: false,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
  });

  win.loadFile(path.join(__dirname, '../renderer/miniPlayer.html'));

  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {
    miniPlayerWin = null;
  });

  return win;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Toggles the mini player window: creates and shows it on first call,
 * hides it when visible, shows it when hidden.
 */
function toggleMiniPlayerWindow() {
  if (!miniPlayerWin || miniPlayerWin.isDestroyed()) {
    miniPlayerWin = _createWindow();
    return;
  }

  if (miniPlayerWin.isVisible()) {
    miniPlayerWin.hide();
  } else {
    miniPlayerWin.show();
    miniPlayerWin.focus();
  }
}

/**
 * Sends updated track information to the mini player renderer.
 * No-op when the window does not exist or is destroyed.
 *
 * @param {{ title: string, artist: string, artworkPath: string | null }} trackInfo
 */
function updateTrackInfo(trackInfo) {
  if (miniPlayerWin && !miniPlayerWin.isDestroyed()) {
    miniPlayerWin.webContents.send('miniPlayer:update', trackInfo);
  }
}

/**
 * Destroys the mini player window.  Should be called on app 'will-quit'.
 */
function destroyMiniPlayerWindow() {
  if (miniPlayerWin && !miniPlayerWin.isDestroyed()) {
    miniPlayerWin.destroy();
  }
  miniPlayerWin = null;
}

/**
 * Registers the IPC listener for 'track:changed' events so the mini player
 * stays in sync when the track changes.
 * Must be called after app.whenReady().
 */
function initMiniPlayer() {
  ipcMain.on('track:changed', async (_event, { title, artist, artworkUrl } = {}) => {
    const artworkPath = await getArtworkPath(artworkUrl || null);
    updateTrackInfo({ title, artist, artworkPath });
  });
}

module.exports = {
  initMiniPlayer,
  toggleMiniPlayerWindow,
  updateTrackInfo,
  destroyMiniPlayerWindow,
};
