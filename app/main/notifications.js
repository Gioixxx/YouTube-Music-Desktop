'use strict';

/**
 * notifications.js
 *
 * Sends native OS notifications when the currently-playing track changes.
 *
 * Flow:
 *   1. The renderer detects a track change and sends 'track:changed' via IPC
 *      with payload { title, artist, artworkUrl }.
 *   2. initNotifications() registers an ipcMain listener for that channel.
 *   3. The listener downloads/caches the artwork via artworkCache and calls
 *      showTrackNotification() with the local file path.
 *   4. showTrackNotification() fires an Electron Notification if the
 *      showNotifications config key is enabled.
 *
 * Public API:
 *   initNotifications()
 *     Register the IPC handler. Call after app.whenReady().
 *
 *   showTrackNotification({ title, artist, artworkPath })
 *     Display a native notification.  artworkPath may be null.
 */

const { Notification, ipcMain } = require('electron');
const { getShowNotifications } = require('./configStore');
const { getArtworkPath } = require('./artworkCache');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Displays a native notification for the currently-playing track.
 * Does nothing when showNotifications is disabled in the config store.
 *
 * @param {{ title: string, artist: string, artworkPath: string | null }} params
 */
function showTrackNotification({ title, artist, artworkPath }) {
  if (!getShowNotifications()) return;
  if (!Notification.isSupported()) return;

  /** @type {Electron.NotificationConstructorOptions} */
  const options = {
    title: title || 'Now Playing',
    body: artist || '',
    silent: true,
  };

  if (artworkPath) {
    options.icon = artworkPath;
  }

  new Notification(options).show();
}

/**
 * Registers the IPC listener for 'track:changed' events sent by the renderer.
 *
 * Expected payload shape:
 *   { title: string, artist: string, artworkUrl: string }
 *
 * Must be called after app.whenReady().
 */
function initNotifications() {
  ipcMain.on('track:changed', async (_event, { title, artist, artworkUrl } = {}) => {
    const artworkPath = await getArtworkPath(artworkUrl || null);
    showTrackNotification({ title, artist, artworkPath });
  });
}

module.exports = { initNotifications, showTrackNotification };
