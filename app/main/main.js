'use strict';

const { app, BrowserWindow } = require('electron');
const { getCloseToTray, getEnableDiscordRPC } = require('./settings');
const { createMainWindow } = require('./windowManager');
const { initSecurity } = require('./securityManager');
const { initMediaSession, unregisterMediaKeys } = require('./mediaSessionManager');
const { initShortcuts, unregisterShortcuts } = require('./shortcuts');
const { initNotifications } = require('./notifications');
const { initTray, destroyTray } = require('./tray');
const { initMiniPlayer, destroyMiniPlayerWindow } = require('./miniPlayer');
const { initTheme } = require('./themeManager');

// Optional-module teardown functions — populated lazily in whenReady.
let destroyDiscordRpc = () => {};

app.whenReady().then(() => {
  initSecurity();
  initTheme();
  initMediaSession();
  initShortcuts();
  initNotifications();

  // --- Lazy-loaded optional modules ---

  // Discord RPC: only require and initialise when the user has enabled it.
  // This avoids loading the ~1 MB discord-rpc native binding on every launch.
  if (getEnableDiscordRPC()) {
    const discordRpc = require('./discordRpc');
    discordRpc.initDiscordRpc();
    destroyDiscordRpc = discordRpc.destroyDiscordRpc;
  }

  // Auto-updater: electron-updater is lazily required inside initUpdater()
  // itself and is a no-op in dev; safe to call unconditionally.
  require('./updater').initUpdater();

  initMiniPlayer();
  initTray();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  // Signal windowManager that the close event is a real quit, not a
  // "close to tray" action, so the window is not hidden instead of closed.
  app.isQuiting = true;
});

app.on('will-quit', () => {
  unregisterMediaKeys();
  unregisterShortcuts();
  destroyDiscordRpc();
  destroyMiniPlayerWindow();
  destroyTray();
});

app.on('window-all-closed', () => {
  // When closeToTray is enabled the main window is hidden (not destroyed) on
  // close, so this event should never fire during normal usage.  Guard it
  // anyway: if all windows are truly gone and we are not in tray-hide mode,
  // quit as usual on non-macOS.
  if (process.platform !== 'darwin' && !getCloseToTray()) {
    app.quit();
  }
});
