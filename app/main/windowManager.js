'use strict';

/**
 * windowManager.js
 *
 * Responsible for creating and managing the main BrowserWindow.
 * Persists window state (size, position, maximized) via electron-store
 * so the window reopens in the same place across launches.
 *
 * Security model:
 *   - contextIsolation + sandbox prevent renderer from accessing Node APIs
 *   - Navigation is restricted to YouTube Music and Google auth domains
 *   - New-window requests for auth flows open inside the app; all others
 *     are blocked (handled by the caller if needed)
 */

const { BrowserWindow, screen, shell, app } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { initAdBlock } = require('./adBlockManager');
const {
  getStartMinimized,
  getMinimizeToTray,
  getCloseToTray,
} = require('./settings');

/** The URL loaded by the main window. */
const YOUTUBE_MUSIC_URL = 'https://music.youtube.com';

/**
 * Domains that the renderer is allowed to navigate to.
 * Covers YouTube Music itself and the Google OAuth / login flow.
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

/** Persistent store for window state. */
const store = new Store({
  name: 'window-state',
  defaults: {
    windowState: {
      width: 1280,
      height: 800,
      x: undefined,
      y: undefined,
      maximized: false,
    },
  },
});

/**
 * Returns true if the saved window bounds fall within at least one
 * connected display.  Prevents the window from opening off-screen when
 * monitors change between sessions.
 *
 * @param {{ x: number|undefined, y: number|undefined, width: number, height: number }} state
 * @returns {boolean}
 */
function isStateOnScreen(state) {
  if (state.x === undefined || state.y === undefined) return false;

  return screen.getAllDisplays().some(({ bounds }) => (
    state.x >= bounds.x &&
    state.y >= bounds.y &&
    state.x + state.width <= bounds.x + bounds.width &&
    state.y + state.height <= bounds.y + bounds.height
  ));
}

/**
 * Creates (or recreates) the main application window.
 * Restores the last saved size and position when available.
 *
 * @returns {BrowserWindow}
 */
function createMainWindow() {
  const saved = store.get('windowState');
  const restorePosition = isStateOnScreen(saved);

  const win = new BrowserWindow({
    width: saved.width,
    height: saved.height,
    ...(restorePosition ? { x: saved.x, y: saved.y } : {}),
    // Hide on launch when startMinimized is set; shown after ready-to-show.
    show: !getStartMinimized(),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      // enableRemoteModule was removed in Electron 14+; kept explicit for clarity.
      enableRemoteModule: false,
    },
  });

  if (saved.maximized) {
    win.maximize();
  }

  // Show once ready when startMinimized is false (default Electron behaviour).
  if (!getStartMinimized()) {
    win.once('ready-to-show', () => win.show());
  }

  // Override the user-agent to remove the Electron identifier so that
  // YouTube Music does not serve a degraded or blocked experience.
  const chromeUA = win.webContents.getUserAgent()
    .replace(/\s*Electron\/[\d.]+/, '');
  win.webContents.setUserAgent(chromeUA);

  /**
   * Restrict in-page navigation to allowed hosts.
   * This covers standard link clicks and JS-driven location changes.
   */
  win.webContents.on('will-navigate', (event, url) => {
    try {
      const { hostname } = new URL(url);
      if (!ALLOWED_NAVIGATION_HOSTS.includes(hostname)) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch {
      event.preventDefault();
    }
  });

  /**
   * Handle window.open() calls (e.g. Google OAuth popup).
   * Auth-related hosts open inside the app; everything else goes to the
   * system browser.
   */
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const { hostname } = new URL(url);
      if (ALLOWED_NAVIGATION_HOSTS.includes(hostname)) {
        return { action: 'allow' };
      }
    } catch {
      // malformed URL — block it
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  /**
   * minimizeToTray: hide to tray instead of minimizing to the taskbar.
   */
  win.on('minimize', (event) => {
    if (getMinimizeToTray()) {
      event.preventDefault();
      win.hide();
    }
  });

  /**
   * closeToTray: hide to tray instead of quitting when the user closes the
   * window.  Persist window state in both cases.
   */
  win.on('close', (event) => {
    // Always persist bounds first.
    const isMaximized = win.isMaximized();
    const bounds = win.getNormalBounds();
    store.set('windowState', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      maximized: isMaximized,
    });

    if (getCloseToTray() && !app.isQuiting) {
      event.preventDefault();
      win.hide();
    }
  });

  // Cosmetic ad-blocking: inject CSS + MutationObserver on every page load.
  initAdBlock(win);

  win.loadURL(YOUTUBE_MUSIC_URL);

  return win;
}

// ---------------------------------------------------------------------------
// Mini-player state
// ---------------------------------------------------------------------------

/** Dimensions used when the window is in mini-player mode. */
const MINI_WIDTH  = 320;
const MINI_HEIGHT = 90;

/**
 * Tracks whether the window is currently in mini-player mode.
 * @type {boolean}
 */
let miniPlayerActive = false;

/**
 * Saved normal-mode bounds so we can restore them when leaving mini-player.
 * @type {{ width: number, height: number, x?: number, y?: number } | null}
 */
let savedNormalBounds = null;

// ---------------------------------------------------------------------------
// Window visibility / mini-player helpers
// ---------------------------------------------------------------------------

/**
 * Returns the first open (non-destroyed) BrowserWindow, or null.
 *
 * @returns {BrowserWindow | null}
 */
function getMainWindow() {
  const wins = BrowserWindow.getAllWindows();
  if (wins.length === 0) return null;
  const win = wins[0];
  return win.isDestroyed() ? null : win;
}

/**
 * Toggles the main window between visible and hidden.
 * When shown, the window is also focused and brought to the front.
 */
function toggleVisibility() {
  const win = getMainWindow();
  if (!win) return;

  if (win.isVisible()) {
    win.hide();
  } else {
    win.show();
    win.focus();
  }
}

/**
 * Toggles between the normal window size and a compact mini-player view.
 *
 * Mini-player mode resizes the window to MINI_WIDTH × MINI_HEIGHT and makes
 * it always-on-top.  Calling again restores the previous normal bounds.
 */
function toggleMiniPlayer() {
  const win = getMainWindow();
  if (!win) return;

  if (!miniPlayerActive) {
    // Enter mini-player mode: save current bounds, resize.
    savedNormalBounds = win.getNormalBounds();
    win.setResizable(false);
    win.setAlwaysOnTop(true);
    win.setSize(MINI_WIDTH, MINI_HEIGHT, true);
    miniPlayerActive = true;
  } else {
    // Exit mini-player mode: restore saved bounds.
    win.setAlwaysOnTop(false);
    win.setResizable(true);
    if (savedNormalBounds) {
      win.setSize(savedNormalBounds.width, savedNormalBounds.height, true);
      if (savedNormalBounds.x !== undefined && savedNormalBounds.y !== undefined) {
        win.setPosition(savedNormalBounds.x, savedNormalBounds.y, true);
      }
      savedNormalBounds = null;
    }
    miniPlayerActive = false;
  }
}

module.exports = { createMainWindow, getMainWindow, toggleVisibility, toggleMiniPlayer };
