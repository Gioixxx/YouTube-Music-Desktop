/**
 * Preload script — secure bridge between main process and renderer.
 *
 * Rules:
 *  - contextIsolation: true  → this file runs in an isolated context.
 *  - sandbox: true           → no Node.js APIs available here directly.
 *  - Only expose what the renderer strictly needs via contextBridge.
 *
 * Exposed API: window.ytmdAPI
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Whitelist of IPC channels the renderer is allowed to send to the main process.
 * @type {string[]}
 */
const ALLOWED_SEND_CHANNELS = [
  'media:play',
  'media:pause',
  'media:next',
  'media:previous',
  'track:changed',
];

/**
 * Whitelist of IPC channels the renderer is allowed to listen on.
 * @type {string[]}
 */
const ALLOWED_RECEIVE_CHANNELS = [
  'theme:changed',
  'settings:updated',
];

contextBridge.exposeInMainWorld('ytmdAPI', {
  /** App version exposed to renderer */
  version: '1.0.0',

  /**
   * Send a one-way IPC message to the main process.
   * @param {string} channel
   * @param {...any} args
   */
  send(channel, ...args) {
    if (ALLOWED_SEND_CHANNELS.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },

  /**
   * Invoke a main-process handler and return a Promise with the result.
   * @param {string} channel
   * @param {...any} args
   * @returns {Promise<any>}
   */
  invoke(channel, ...args) {
    if (ALLOWED_SEND_CHANNELS.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Channel not allowed: ${channel}`));
  },

  /**
   * Register a listener for messages coming from the main process.
   * Returns a cleanup function.
   * @param {string} channel
   * @param {(...args: any[]) => void} listener
   * @returns {() => void}
   */
  on(channel, listener) {
    if (!ALLOWED_RECEIVE_CHANNELS.includes(channel)) return () => {};
    const wrapped = (_event, ...args) => listener(...args);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  },
});
