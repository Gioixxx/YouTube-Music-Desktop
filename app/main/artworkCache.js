'use strict';

/**
 * artworkCache.js
 *
 * Download service for track artwork images.
 *
 * Cache storage and LRU eviction are delegated to cacheManager so that all
 * cached artwork lives under {userData}/cache/artwork/ and respects the
 * configured size limit.
 *
 * Public API:
 *   getArtworkPath(url)  →  Promise<string | null>
 *     Returns the local path of the artwork (downloading if necessary),
 *     or null when the URL is falsy or the download fails.
 *
 *   getCacheDir()  →  string
 *     Convenience re-export of cacheManager.getCacheDir().
 */

const fs     = require('fs');
const path   = require('path');
const http   = require('http');
const https  = require('https');
const crypto = require('crypto');
const { getCacheDir, getCachedPath, store } = require('./cacheManager');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derives a stable filename from a URL (SHA-1 hash + original extension).
 *
 * @param {string} url
 * @returns {string}
 */
function _fileNameForUrl(url) {
  const hash = crypto.createHash('sha1').update(url).digest('hex');
  let ext = '.png';
  try {
    const pathname = new URL(url).pathname;
    const m = pathname.match(/\.(jpe?g|png|webp|gif)$/i);
    if (m) ext = m[0].toLowerCase();
  } catch {
    // ignore malformed URLs
  }
  return hash + ext;
}

/**
 * Downloads a URL to a local file path, following up to one redirect.
 *
 * @param {string} url
 * @param {string} dest  Absolute destination path.
 * @returns {Promise<void>}
 */
function _download(url, dest) {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith('https') ? https : http;

    const request = transport.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        _download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }

      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });

    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy(new Error(`Timeout downloading artwork: ${url}`));
    });
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the local path for an artwork URL.
 * Serves from the LRU cache (via cacheManager) when available;
 * downloads and registers in the cache otherwise.
 *
 * @param {string} url  Remote artwork URL.
 * @returns {Promise<string | null>}  Local file path, or null on error.
 */
async function getArtworkPath(url) {
  if (!url) return null;

  // Check LRU cache first (also updates lastAccess).
  const cached = getCachedPath(url);
  if (cached) return cached;

  // Cache miss — download to the managed cache directory.
  const dest = path.join(getCacheDir(), _fileNameForUrl(url));

  try {
    await _download(url, dest);
    store(url, dest); // register + evict if needed
    return dest;
  } catch (err) {
    console.warn(`[artworkCache] Failed to download artwork: ${err.message}`);
    return null;
  }
}

module.exports = { getArtworkPath, getCacheDir };
