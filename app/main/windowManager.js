'use strict';

/**
 * windowManager.js
 *
 * Responsible for creating and managing the main BrowserWindow.
 * Persists window state (size, position, maximized) via electron-store
 * so the window reopens in the same place across launches.
 */

const { BrowserWindow, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');

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
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  if (saved.maximized) {
    win.maximize();
  }

  /**
   * Persist window state just before the window closes.
   * We use getNormalBounds() so we save the restored size even if
   * the window is maximised at close time.
   */
  win.on('close', () => {
    const isMaximized = win.isMaximized();
    const bounds = win.getNormalBounds();

    store.set('windowState', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      maximized: isMaximized,
    });
  });

  win.loadFile(path.join(__dirname, '../renderer/index.html'));

  return win;
}

module.exports = { createMainWindow };
