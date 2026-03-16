'use strict';

const { app, BrowserWindow } = require('electron');
const { getCloseToTray } = require('./settings');
const { createMainWindow } = require('./windowManager');
const { initSecurity } = require('./securityManager');
const { initMediaSession, unregisterMediaKeys } = require('./mediaSessionManager');
const { initShortcuts, unregisterShortcuts } = require('./shortcuts');
const { initNotifications } = require('./notifications');
const { initTray, destroyTray } = require('./tray');
const { initMiniPlayer, destroyMiniPlayerWindow } = require('./miniPlayer');
const { initTheme } = require('./themeManager');

app.whenReady().then(() => {
  initSecurity();
  initTheme();
  initMediaSession();
  initShortcuts();
  initNotifications();
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
