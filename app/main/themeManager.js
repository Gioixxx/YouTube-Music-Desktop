'use strict';

/**
 * themeManager.js
 *
 * Manages the colour scheme for all app-owned UI (mini player, future
 * settings dialogs, etc.).
 *
 * Supported values for the 'theme' config key:
 *   'light'   — always light
 *   'dark'    — always dark
 *   'system'  — follow the OS via Electron's nativeTheme (default)
 *
 * Runtime changes are broadcast immediately to every open BrowserWindow as
 * a 'theme:changed' IPC message so renderers can update without restarting.
 *
 * Public API:
 *   initTheme()           Apply the stored theme and start listeners.
 *   setTheme(value)       Change and persist the theme; broadcast to windows.
 *   getEffectiveTheme()   Returns 'light' | 'dark' (resolves 'system').
 */

const { nativeTheme, ipcMain, BrowserWindow } = require('electron');
const { getTheme, setTheme: persistTheme } = require('./configStore');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the effective theme ('light' | 'dark') from the stored preference,
 * using nativeTheme when the preference is 'system'.
 *
 * @returns {'light'|'dark'}
 */
function getEffectiveTheme() {
  const pref = getTheme();
  if (pref === 'light' || pref === 'dark') return pref;
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
}

/**
 * Sends 'theme:changed' with the current effective theme to every open,
 * non-destroyed BrowserWindow renderer.
 */
function _broadcast() {
  const effective = getEffectiveTheme();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('theme:changed', { theme: effective });
    }
  }
}

/**
 * Maps a theme preference to an nativeTheme.themeSource value.
 * @param {'light'|'dark'|'system'} pref
 * @returns {'light'|'dark'|'system'}
 */
function _toThemeSource(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  return 'system';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Applies the persisted theme preference to nativeTheme, broadcasts the
 * initial effective theme to all windows, and registers:
 *   - nativeTheme 'updated' listener (for OS theme changes when pref='system')
 *   - IPC handler 'theme:set' (for renderer-driven theme changes)
 *
 * Must be called after app.whenReady().
 */
function initTheme() {
  // Apply stored preference to Electron's native theme.
  nativeTheme.themeSource = _toThemeSource(getTheme());

  // Broadcast when the OS theme changes (only relevant when pref='system').
  nativeTheme.on('updated', () => {
    if (getTheme() === 'system') {
      _broadcast();
    }
  });

  // IPC: renderer sends ('theme:set', 'light'|'dark'|'system')
  ipcMain.handle('theme:set', (_event, value) => {
    setTheme(value);
  });
}

/**
 * Changes the active theme, persists it, and immediately broadcasts the new
 * effective theme to all open BrowserWindows.
 *
 * @param {'light'|'dark'|'system'} value
 */
function setTheme(value) {
  if (!['light', 'dark', 'system'].includes(value)) {
    console.warn(`[themeManager] Unknown theme value: ${value}`);
    return;
  }
  persistTheme(value);
  nativeTheme.themeSource = _toThemeSource(value);
  _broadcast();
}

module.exports = { initTheme, setTheme, getEffectiveTheme };
