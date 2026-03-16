'use strict';

/**
 * artworkCache.js
 *
 * Small download-and-cache service for track artwork images.
 *
 * Artwork URLs are downloaded once and stored as files inside a dedicated
 * sub-directory of the app's userData folder.  Subsequent requests for the
 * same URL are served from disk without any network round-trip.
 *
 * Public API:
 *   getArtworkPath(url)  →  Promise<string | null>
 *     Resolves to the local file-system path of the cached image, or null
 *     when the download fails or url is falsy.
 *
 *   getCacheDir()  →  string
 *     Returns the absolute path of the cache directory (created lazily).
 */

const fs   = require('fs');
const path = require('path');
const http  = require('http');
const https = require('https');
const crypto = require('crypto');
const { app } = require('electron');

// ---------------------------------------------------------------------------
// Cache directory
// ---------------------------------------------------------------------------

/**
 * Returns (and creates if needed) the artwork cache directory.
 * Uses app.getPath('userData') so it is writable on every platform.
 *
 * @returns {string}
 */
function getCacheDir() {
  const dir = path.join(app.getPath('userData'), 'artwork-cache');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derives a stable filename from a URL by SHA-1 hashing it,
 * preserving the original extension when detectable.
 *
 * @param {string} url
 * @returns {string}  e.g. "a3f8c2…d1.jpg"
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
 * Downloads a URL to a local file.
 *
 * @param {string} url
 * @param {string} dest  Absolute destination path.
 * @returns {Promise<void>}
 */
function _download(url, dest) {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith('https') ? https : http;

    const request = transport.get(url, (response) => {
      // Follow up to one redirect.
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
 * Returns the local path for an artwork URL, downloading it on first access.
 *
 * @param {string} url  Remote artwork URL.
 * @returns {Promise<string | null>}  Local file path, or null on error.
 */
async function getArtworkPath(url) {
  if (!url) return null;

  const dest = path.join(getCacheDir(), _fileNameForUrl(url));

  if (fs.existsSync(dest)) {
    return dest;
  }

  try {
    await _download(url, dest);
    return dest;
  } catch (err) {
    console.warn(`[artworkCache] Failed to download artwork: ${err.message}`);
    return null;
  }
}

module.exports = { getArtworkPath, getCacheDir };
