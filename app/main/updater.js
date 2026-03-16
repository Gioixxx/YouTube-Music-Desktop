'use strict';

/**
 * updater.js
 *
 * Integrates electron-updater with GitHub Releases so the app can
 * automatically check for, download, and install updates.
 *
 * Behaviour:
 *   - On startup checkForUpdates() is called once.  Subsequent automatic
 *     checks are throttled to once every CHECK_INTERVAL_MS (4 hours).
 *   - When a new version is found it is downloaded silently in the
 *     background.
 *   - When the download finishes the user is shown a dialog asking whether
 *     to restart now and install, or defer to the next launch.
 *   - A manual "Check for updates" action is exposed via checkForUpdatesManual()
 *     (wired into the tray context menu by initUpdater).
 *
 * Graceful degradation:
 *   - All autoUpdater errors are caught and logged; they never crash the app.
 *   - Running in development (app.isPackaged === false) skips the update
 *     check so that local dev is not affected.
 *
 * Public API:
 *   initUpdater()              Wire up events and kick off the startup check.
 *   checkForUpdatesManual()    Trigger an immediate check (e.g. from tray menu).
 */

const { autoUpdater } = require('electron-updater');
const { dialog, app }  = require('electron');
const { getMainWindow } = require('./windowManager');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** GitHub repository that hosts the releases. */
const GITHUB_OWNER = 'Gioixxx';
const GITHUB_REPO  = 'YouTube-Music-Desktop';

/** Minimum interval between automatic background checks (4 hours). */
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

/** Timestamp of the last update check (ms since epoch). */
let lastCheckAt = 0;

/** Whether a download is already in progress (avoid double-download). */
let downloading = false;

/** Interval handle for periodic auto-checks. */
let checkInterval = null;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Configures autoUpdater to pull from the project's GitHub Releases.
 */
function _configure() {
  autoUpdater.autoDownload    = false; // we trigger the download ourselves
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.setFeedURL({
    provider: 'github',
    owner:    GITHUB_OWNER,
    repo:     GITHUB_REPO,
  });
}

/**
 * Performs the actual update check.  Resets the throttle timestamp so that
 * the next automatic check starts from now.
 *
 * @param {boolean} [manual=false] When true, shows a "no updates" dialog.
 */
async function _check(manual = false) {
  lastCheckAt = Date.now();
  try {
    await autoUpdater.checkForUpdates();
  } catch (err) {
    console.warn('[updater] checkForUpdates error:', err.message);
    if (manual) {
      dialog.showMessageBox({
        type:    'info',
        title:   'Update check failed',
        message: `Could not check for updates:\n${err.message}`,
        buttons: ['OK'],
      }).catch(() => {});
    }
  }
}

// ---------------------------------------------------------------------------
// autoUpdater event handlers
// ---------------------------------------------------------------------------

function _attachListeners() {
  autoUpdater.on('update-available', (info) => {
    if (downloading) return;
    downloading = true;
    console.log(`[updater] Update available: ${info.version} — downloading…`);
    autoUpdater.downloadUpdate().catch((err) => {
      console.warn('[updater] downloadUpdate error:', err.message);
      downloading = false;
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log(`[updater] App is up to date (${info.version}).`);
  });

  autoUpdater.on('download-progress', (progress) => {
    const pct = Math.round(progress.percent);
    if (pct % 20 === 0) {
      console.log(`[updater] Download progress: ${pct}%`);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    downloading = false;
    console.log(`[updater] Update downloaded: ${info.version}`);

    const win = getMainWindow();
    const opts = {
      type:    'info',
      title:   'Update ready',
      message: `Version ${info.version} has been downloaded.`,
      detail:  'Restart the app now to apply the update, or it will be applied automatically on the next launch.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId:  1,
    };

    const showDialog = win
      ? dialog.showMessageBox(win, opts)
      : dialog.showMessageBox(opts);

    showDialog.then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    }).catch(() => {});
  });

  autoUpdater.on('error', (err) => {
    console.warn('[updater] autoUpdater error:', err.message);
    downloading = false;
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialises the updater: configures autoUpdater, attaches event listeners,
 * performs the startup check, and schedules periodic background checks.
 *
 * Must be called after app.whenReady().
 * Does nothing when the app is not packaged (development mode).
 */
function initUpdater() {
  if (!app.isPackaged) {
    console.log('[updater] Running in development — update checks skipped.');
    return;
  }

  _configure();
  _attachListeners();
  _check(false);

  // Periodic background check every CHECK_INTERVAL_MS.
  checkInterval = setInterval(() => {
    const elapsed = Date.now() - lastCheckAt;
    if (elapsed >= CHECK_INTERVAL_MS) {
      _check(false);
    }
  }, CHECK_INTERVAL_MS);
}

/**
 * Triggers an immediate update check.
 * Shows a dialog whether an update is available or the app is already up to date.
 * Intended to be wired into tray / application menu as "Check for updates".
 */
async function checkForUpdatesManual() {
  if (!app.isPackaged) {
    dialog.showMessageBox({
      type:    'info',
      title:   'Development mode',
      message: 'Update checks are disabled in development mode.',
      buttons: ['OK'],
    }).catch(() => {});
    return;
  }

  await _check(true);
}

module.exports = { initUpdater, checkForUpdatesManual };
