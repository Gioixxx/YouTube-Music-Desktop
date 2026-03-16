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
 */

const Store = require('electron-store');

const store = new Store({
  name: 'app-config',
  defaults: {
    enableGlobalShortcuts: true,
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

module.exports = { getEnableGlobalShortcuts, setEnableGlobalShortcuts };
