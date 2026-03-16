'use strict';

/**
 * settings.js
 *
 * Public settings API for YouTube Music Desktop.
 *
 * This module is the canonical entry-point for reading and writing user
 * preferences.  All persistence is delegated to configStore, which wraps
 * electron-store and stores settings at:
 *
 *   {userData}/app-config.json   ← all keys below
 *   {userData}/window-state.json ← window bounds/maximized (windowManager)
 *   {userData}/cache/artwork/    ← LRU artwork cache (cacheManager)
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Key                  Type                      Default                 │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  theme                'light'|'dark'|'system'   'system'                │
 * │  startMinimized       boolean                   false                   │
 * │  minimizeToTray       boolean                   true                    │
 * │  closeToTray          boolean                   true                    │
 * │  showNotifications    boolean                   true                    │
 * │  enableGlobalShortcuts boolean                  true                    │
 * │  enableDiscordRPC     boolean                   false                   │
 * │  adBlockUI            boolean                   true                    │
 * │  artworkCacheMaxSize  number (bytes)             104857600 (100 MB)      │
 * │  shortcuts            object                    see DEFAULT_SHORTCUTS   │
 * │    .playPause         string                    'Ctrl+Alt+P'            │
 * │    .next              string                    'Ctrl+Alt+N'            │
 * │    .previous          string                    'Ctrl+Alt+B'            │
 * │    .miniPlayerMode    string                    'Ctrl+Alt+M'            │
 * │    .toggleWindow      string                    'Ctrl+Alt+Y'            │
 * │    .miniPlayerWindow  string                    'Ctrl+Alt+I'            │
 * │  window               object (window-state store)                       │
 * │    .width             number                    1280                    │
 * │    .height            number                    800                     │
 * │    .x                 number|undefined          undefined               │
 * │    .y                 number|undefined          undefined               │
 * │    .maximized         boolean                   false                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Usage example:
 *   const settings = require('./settings');
 *   if (settings.getCloseToTray()) { ... }
 *   settings.setTheme('dark');
 *   const all = settings.getAll();
 */

// Re-export everything from configStore so callers only need one import.
module.exports = require('./configStore');
