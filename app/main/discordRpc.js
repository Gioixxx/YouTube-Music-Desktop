'use strict';

/**
 * discordRpc.js
 *
 * Integrates Discord Rich Presence so the user's Discord status reflects
 * what they are listening to in YouTube Music Desktop.
 *
 * Presence fields updated on each track change:
 *   details  — track title
 *   state    — "by <artist>" (falls back to "Listening to YouTube Music")
 *   largeImageKey  — 'youtube-music' (asset registered in the Discord app)
 *   largeImageText — album name when available
 *   startTimestamp — set to current time so Discord shows elapsed time
 *
 * The integration is gated on the `enableDiscordRPC` config key (default
 * false) so users must explicitly opt in.
 *
 * Graceful degradation:
 *   - If Discord is not running the connection attempt is silently dropped.
 *   - On unexpected disconnect the module schedules reconnect retries with
 *     exponential back-off (up to MAX_RETRY_DELAY_MS).
 *   - No error ever propagates to the app's main process.
 *
 * Public API:
 *   initDiscordRpc()      Initialise and connect (reads enableDiscordRPC).
 *   updatePresence(data)  Push new track data to Discord immediately.
 *   destroyDiscordRpc()   Disconnect and clean up (call on app will-quit).
 */

const { ipcMain } = require('electron');
const { getEnableDiscordRPC } = require('./settings');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Discord application client ID.
 * Register your own application at https://discord.com/developers/applications
 * and replace this value (or make it user-configurable via settings).
 *
 * @type {string}
 */
const DISCORD_CLIENT_ID = '1045109033384796231';

/** Minimum delay between reconnect attempts in milliseconds. */
const MIN_RETRY_DELAY_MS = 5_000;
/** Maximum delay between reconnect attempts in milliseconds. */
const MAX_RETRY_DELAY_MS = 120_000;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

/** @type {import('discord-rpc').Client | null} */
let rpcClient = null;

/** @type {boolean} Whether the client is currently connected to Discord. */
let connected = false;

/** @type {boolean} Whether the module has been destroyed (app quitting). */
let destroyed = false;

/** @type {ReturnType<typeof setTimeout> | null} */
let retryTimer = null;

/** Current retry delay, doubles on each failed attempt (exponential back-off). */
let retryDelayMs = MIN_RETRY_DELAY_MS;

/**
 * Last known track data so we can push it again after a reconnect.
 * @type {{ title?: string, artist?: string, album?: string } | null}
 */
let lastTrackData = null;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Clears any pending retry timer.
 */
function _clearRetryTimer() {
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

/**
 * Schedules a reconnect attempt after the current back-off delay,
 * then doubles the delay for the next attempt (up to MAX_RETRY_DELAY_MS).
 */
function _scheduleReconnect() {
  if (destroyed) return;
  _clearRetryTimer();
  retryTimer = setTimeout(() => {
    retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
    _connect();
  }, retryDelayMs);
}

/**
 * Creates a fresh RPC client and attempts to connect to Discord.
 * All errors are caught; the module never throws to the caller.
 */
async function _connect() {
  if (destroyed || !getEnableDiscordRPC()) return;

  // Clean up any existing client.
  if (rpcClient) {
    try { rpcClient.destroy(); } catch (_) {}
    rpcClient = null;
  }
  connected = false;

  let RPC;
  try {
    RPC = require('discord-rpc');
  } catch (err) {
    console.warn('[discordRpc] discord-rpc package not available:', err.message);
    return;
  }

  RPC.register(DISCORD_CLIENT_ID);
  const client = new RPC.Client({ transport: 'ipc' });
  rpcClient = client;

  client.on('ready', () => {
    if (destroyed) return;
    connected = true;
    retryDelayMs = MIN_RETRY_DELAY_MS; // reset back-off on successful connect
    console.log('[discordRpc] Connected to Discord.');

    // Restore last known presence if a track was already playing.
    if (lastTrackData) {
      _setActivity(lastTrackData);
    }
  });

  client.on('disconnected', () => {
    connected = false;
    if (!destroyed) {
      console.log('[discordRpc] Disconnected from Discord — will retry.');
      _scheduleReconnect();
    }
  });

  try {
    await client.login({ clientId: DISCORD_CLIENT_ID });
  } catch (err) {
    // Discord is not running or the IPC pipe is unavailable — not an error.
    connected = false;
    if (!destroyed) {
      _scheduleReconnect();
    }
  }
}

/**
 * Builds and sends a Rich Presence activity to Discord.
 *
 * @param {{ title?: string, artist?: string, album?: string }} data
 */
function _setActivity({ title, artist, album } = {}) {
  if (!rpcClient || !connected) return;

  /** @type {import('discord-rpc').Presence} */
  const activity = {
    details:        title  || 'YouTube Music',
    state:          artist ? `by ${artist}` : 'Listening to YouTube Music',
    largeImageKey:  'youtube-music',
    largeImageText: album  || 'YouTube Music Desktop',
    startTimestamp: Math.floor(Date.now() / 1000),
    instance:       false,
  };

  rpcClient.setActivity(activity).catch((err) => {
    console.warn('[discordRpc] setActivity failed:', err.message);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialises the Discord RPC integration.
 * Registers an IPC listener for 'track:changed' events so the presence
 * stays in sync with the currently-playing track.
 *
 * Does nothing when enableDiscordRPC is false.
 * Must be called after app.whenReady().
 */
function initDiscordRpc() {
  if (!getEnableDiscordRPC()) return;

  _connect();

  ipcMain.on('track:changed', (_event, { title, artist, album } = {}) => {
    lastTrackData = { title, artist, album };
    if (connected) {
      _setActivity(lastTrackData);
    }
  });
}

/**
 * Pushes updated track information to Discord immediately.
 * No-op when not connected or disabled.
 *
 * @param {{ title?: string, artist?: string, album?: string }} data
 */
function updatePresence(data) {
  lastTrackData = data;
  _setActivity(data);
}

/**
 * Disconnects from Discord and cancels any pending reconnect timers.
 * Should be called on app 'will-quit'.
 */
function destroyDiscordRpc() {
  destroyed = true;
  _clearRetryTimer();
  if (rpcClient) {
    try { rpcClient.destroy(); } catch (_) {}
    rpcClient = null;
  }
  connected = false;
}

module.exports = { initDiscordRpc, updatePresence, destroyDiscordRpc };
