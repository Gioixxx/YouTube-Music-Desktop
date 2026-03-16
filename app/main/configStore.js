'use strict';

/**
 * configStore.js
 *
 * Centralized persistent configuration for YouTube Music Desktop.
 * Wraps electron-store so all modules access a single store instance.
 *
 * Current keys:
 *   enableGlobalShortcuts  {boolean}  default: true
 *     When false, no global keyboard shortcuts are registered.
 *   showNotifications  {boolean}  default: true
 *     When false, track-change notifications are suppressed.
 *   artworkCacheMaxSize  {number}  default: 104857600 (100 MB)
 *     Maximum total size in bytes for the artwork cache before LRU eviction.
 */

const Store = require('electron-store');

const DEFAULT_ARTWORK_CACHE_MAX_SIZE = 100 * 1024 * 1024; // 100 MB

const store = new Store({
  name: 'app-config',
  defaults: {
    enableGlobalShortcuts: true,
    showNotifications: true,
    artworkCacheMaxSize: DEFAULT_ARTWORK_CACHE_MAX_SIZE,
  },
});

// ---------------------------------------------------------------------------
// enableGlobalShortcuts
// ---------------------------------------------------------------------------

/**
 * Returns whether global shortcuts are enabled.
 * @returns {boolean}
 */
function getEnableGlobalShortcuts() {
  return store.get('enableGlobalShortcuts');
}

/**
 * Persists the enableGlobalShortcuts setting.
 * @param {boolean} value
 */
function setEnableGlobalShortcuts(value) {
  store.set('enableGlobalShortcuts', Boolean(value));
}

// ---------------------------------------------------------------------------
// showNotifications
// ---------------------------------------------------------------------------

/**
 * Returns whether track-change notifications are enabled.
 * @returns {boolean}
 */
function getShowNotifications() {
  return store.get('showNotifications');
}

/**
 * Persists the showNotifications setting.
 * @param {boolean} value
 */
function setShowNotifications(value) {
  store.set('showNotifications', Boolean(value));
}

// ---------------------------------------------------------------------------
// artworkCacheMaxSize
// ---------------------------------------------------------------------------

/**
 * Returns the maximum total size in bytes allowed for the artwork cache.
 * @returns {number}
 */
function getArtworkCacheMaxSize() {
  return store.get('artworkCacheMaxSize');
}

/**
 * Persists the artworkCacheMaxSize setting.
 * @param {number} bytes
 */
function setArtworkCacheMaxSize(bytes) {
  store.set('artworkCacheMaxSize', Number(bytes));
}

module.exports = {
  getEnableGlobalShortcuts,
  setEnableGlobalShortcuts,
  getShowNotifications,
  setShowNotifications,
  getArtworkCacheMaxSize,
  setArtworkCacheMaxSize,
};
