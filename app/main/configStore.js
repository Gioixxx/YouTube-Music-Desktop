'use strict';

/**
 * configStore.js
 *
 * Centralized persistent configuration for YouTube Music Desktop.
 * Wraps electron-store so all modules access a single store instance.
 * The backing file is stored at: {userData}/app-config.json
 *
 * Full configuration schema
 * ─────────────────────────
 *
 *  enableGlobalShortcuts  {boolean}  default: true
 *    When false, no global keyboard shortcuts are registered.
 *
 *  showNotifications  {boolean}  default: true
 *    When false, track-change native notifications are suppressed.
 *
 *  artworkCacheMaxSize  {number}  default: 104857600 (100 MB)
 *    Maximum total size in bytes for the LRU artwork cache before eviction.
 *
 *  theme  {'light'|'dark'|'system'}  default: 'system'
 *    Colour scheme for app-owned UI (mini player, dialogs).
 *    'system' defers to the OS via nativeTheme.
 *
 *  adBlockUI  {boolean}  default: true
 *    When true, known ad/promo DOM elements in YouTube Music are hidden via
 *    CSS injection and MutationObserver (cosmetic only, no network blocking).
 *
 *  startMinimized  {boolean}  default: false
 *    When true, the main window is created hidden on launch.
 *
 *  minimizeToTray  {boolean}  default: true
 *    When true, minimizing the main window hides it to the system tray
 *    instead of minimizing to the taskbar.
 *
 *  closeToTray  {boolean}  default: true
 *    When true, the window close button hides to tray rather than quitting.
 *
 *  enableDiscordRPC  {boolean}  default: false
 *    When true, the current track is broadcast to Discord via Rich Presence.
 *
 *  shortcuts  {object}  — custom global shortcut accelerators
 *    playPause       {string}  default: 'Ctrl+Alt+P'
 *    next            {string}  default: 'Ctrl+Alt+N'
 *    previous        {string}  default: 'Ctrl+Alt+B'
 *    miniPlayerMode  {string}  default: 'Ctrl+Alt+M'
 *    toggleWindow    {string}  default: 'Ctrl+Alt+Y'
 *    miniPlayerWindow {string} default: 'Ctrl+Alt+I'
 *
 *  window  — window bounds/state are persisted separately in the
 *    'window-state' electron-store (managed by windowManager.js).
 */

const Store = require('electron-store');

const DEFAULT_ARTWORK_CACHE_MAX_SIZE = 100 * 1024 * 1024; // 100 MB

/** Default global shortcut accelerators. */
const DEFAULT_SHORTCUTS = {
  playPause:        'Ctrl+Alt+P',
  next:             'Ctrl+Alt+N',
  previous:         'Ctrl+Alt+B',
  miniPlayerMode:   'Ctrl+Alt+M',
  toggleWindow:     'Ctrl+Alt+Y',
  miniPlayerWindow: 'Ctrl+Alt+I',
};

const store = new Store({
  name: 'app-config',
  defaults: {
    enableGlobalShortcuts: true,
    showNotifications:     true,
    artworkCacheMaxSize:   DEFAULT_ARTWORK_CACHE_MAX_SIZE,
    theme:                 'system',
    adBlockUI:             true,
    startMinimized:        false,
    minimizeToTray:        true,
    closeToTray:           true,
    enableDiscordRPC:        false,
    shortcuts:               DEFAULT_SHORTCUTS,
    closedToTrayHintShown:   false,
  },
});

// ---------------------------------------------------------------------------
// enableGlobalShortcuts
// ---------------------------------------------------------------------------

/** @returns {boolean} */
function getEnableGlobalShortcuts() { return store.get('enableGlobalShortcuts'); }
/** @param {boolean} value */
function setEnableGlobalShortcuts(value) { store.set('enableGlobalShortcuts', Boolean(value)); }

// ---------------------------------------------------------------------------
// showNotifications
// ---------------------------------------------------------------------------

/** @returns {boolean} */
function getShowNotifications() { return store.get('showNotifications'); }
/** @param {boolean} value */
function setShowNotifications(value) { store.set('showNotifications', Boolean(value)); }

// ---------------------------------------------------------------------------
// artworkCacheMaxSize
// ---------------------------------------------------------------------------

/** @returns {number} */
function getArtworkCacheMaxSize() { return store.get('artworkCacheMaxSize'); }
/** @param {number} bytes */
function setArtworkCacheMaxSize(bytes) { store.set('artworkCacheMaxSize', Number(bytes)); }

// ---------------------------------------------------------------------------
// theme
// ---------------------------------------------------------------------------

/** @returns {'light'|'dark'|'system'} */
function getTheme() { return store.get('theme'); }
/** @param {'light'|'dark'|'system'} value */
function setTheme(value) { store.set('theme', value); }

// ---------------------------------------------------------------------------
// adBlockUI
// ---------------------------------------------------------------------------

/** @returns {boolean} */
function getAdBlockUI() { return store.get('adBlockUI'); }
/** @param {boolean} value */
function setAdBlockUI(value) { store.set('adBlockUI', Boolean(value)); }

// ---------------------------------------------------------------------------
// startMinimized
// ---------------------------------------------------------------------------

/** @returns {boolean} */
function getStartMinimized() { return store.get('startMinimized'); }
/** @param {boolean} value */
function setStartMinimized(value) { store.set('startMinimized', Boolean(value)); }

// ---------------------------------------------------------------------------
// minimizeToTray
// ---------------------------------------------------------------------------

/** @returns {boolean} */
function getMinimizeToTray() { return store.get('minimizeToTray'); }
/** @param {boolean} value */
function setMinimizeToTray(value) { store.set('minimizeToTray', Boolean(value)); }

// ---------------------------------------------------------------------------
// closeToTray
// ---------------------------------------------------------------------------

/** @returns {boolean} */
function getCloseToTray() { return store.get('closeToTray'); }
/** @param {boolean} value */
function setCloseToTray(value) { store.set('closeToTray', Boolean(value)); }

// ---------------------------------------------------------------------------
// enableDiscordRPC
// ---------------------------------------------------------------------------

/** @returns {boolean} */
function getEnableDiscordRPC() { return store.get('enableDiscordRPC'); }
/** @param {boolean} value */
function setEnableDiscordRPC(value) { store.set('enableDiscordRPC', Boolean(value)); }

// ---------------------------------------------------------------------------
// shortcuts
// ---------------------------------------------------------------------------

/**
 * Returns the full custom shortcuts object.
 * @returns {{ playPause: string, next: string, previous: string,
 *             miniPlayerMode: string, toggleWindow: string,
 *             miniPlayerWindow: string }}
 */
function getShortcuts() { return store.get('shortcuts'); }

/**
 * Merges partial shortcut overrides into the stored object.
 * @param {Partial<typeof DEFAULT_SHORTCUTS>} overrides
 */
function setShortcuts(overrides) {
  store.set('shortcuts', { ...store.get('shortcuts'), ...overrides });
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Returns a plain object snapshot of every configuration key.
 * Useful for serialising settings to the renderer or logging.
 *
 * @returns {object}
 */
function getAll() {
  return store.store;
}

module.exports = {
  // individual accessors
  getEnableGlobalShortcuts, setEnableGlobalShortcuts,
  getShowNotifications,     setShowNotifications,
  getArtworkCacheMaxSize,   setArtworkCacheMaxSize,
  getTheme,                 setTheme,
  getAdBlockUI,             setAdBlockUI,
  getStartMinimized,        setStartMinimized,
  getMinimizeToTray,        setMinimizeToTray,
  getCloseToTray,           setCloseToTray,
  getEnableDiscordRPC,      setEnableDiscordRPC,
  getShortcuts,             setShortcuts,
  // utility
  getAll,
  // expose the raw store for advanced use (e.g. electron-store's onDidChange)
  store,
  // internal / one-shot flags
  getClosedToTrayHintShown: () => store.get('closedToTrayHintShown'),
  setClosedToTrayHintShown: (v) => store.set('closedToTrayHintShown', Boolean(v)),
};
