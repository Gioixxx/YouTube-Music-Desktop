// Preload script — bridge between main process and renderer.
// contextIsolation: true keeps this isolated from page scripts.
// Expose only what is strictly necessary via contextBridge.

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('ytmdAPI', {
  version: '1.0.0',
});
