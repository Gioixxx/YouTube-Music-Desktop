'use strict';

/**
 * cacheManager.js
 *
 * Persistent LRU cache for track artwork images.
 *
 * Files are stored in  {userData}/cache/artwork/
 * An accompanying JSON index (cache-index.json in the same directory) tracks
 * each entry's URL, byte size, and last-access timestamp.
 *
 * When the total cached size exceeds the configured limit
 * (artworkCacheMaxSize, default 100 MB) the least-recently-used entries are
 * deleted until the total is back below the threshold.
 *
 * Public API:
 *   getCacheDir()             → string          cache directory path
 *   getCachedPath(url)        → string | null   local path if cached (updates lastAccess)
 *   store(url, filePath)      → void            register a downloaded file; triggers evict()
 *   evict()                   → void            enforce the size limit right now
 */

const fs     = require('fs');
const path   = require('path');
const { app } = require('electron');
const { getArtworkCacheMaxSize } = require('./configStore');

// ---------------------------------------------------------------------------
// Index shape
// ---------------------------------------------------------------------------
//
//  {
//    "<filename>": {
//      "url":        "<original remote URL>",
//      "size":       <bytes: number>,
//      "lastAccess": <Unix ms timestamp: number>
//    },
//    …
//  }
//
// ---------------------------------------------------------------------------

/** @type {string | null} */
let _cacheDir = null;

/** @type {string | null} */
let _indexPath = null;

/**
 * Returns (and lazily creates) the artwork cache directory.
 * @returns {string}
 */
function getCacheDir() {
  if (_cacheDir) return _cacheDir;
  _cacheDir = path.join(app.getPath('userData'), 'cache', 'artwork');
  if (!fs.existsSync(_cacheDir)) {
    fs.mkdirSync(_cacheDir, { recursive: true });
  }
  _indexPath = path.join(_cacheDir, 'cache-index.json');
  return _cacheDir;
}

// ---------------------------------------------------------------------------
// Index helpers
// ---------------------------------------------------------------------------

/**
 * Loads the index from disk, returning an empty object if it does not exist
 * or cannot be parsed.
 *
 * @returns {Object.<string, {url: string, size: number, lastAccess: number}>}
 */
function _loadIndex() {
  const p = path.join(getCacheDir(), 'cache-index.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Persists the index to disk atomically-ish (write then rename is ideal,
 * but writeFileSync is sufficient for this use-case).
 *
 * @param {Object} index
 */
function _saveIndex(index) {
  const p = path.join(getCacheDir(), 'cache-index.json');
  fs.writeFileSync(p, JSON.stringify(index, null, 2), 'utf8');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the local path for a cached URL, or null if the URL is not cached.
 * Updates the lastAccess timestamp so this entry is considered recently used.
 *
 * @param {string} url
 * @returns {string | null}
 */
function getCachedPath(url) {
  if (!url) return null;

  const index = _loadIndex();
  const entry = Object.entries(index).find(([, v]) => v.url === url);
  if (!entry) return null;

  const [filename, meta] = entry;
  const filePath = path.join(getCacheDir(), filename);

  if (!fs.existsSync(filePath)) {
    // Stale index entry — remove it.
    delete index[filename];
    _saveIndex(index);
    return null;
  }

  // Refresh last-access time.
  meta.lastAccess = Date.now();
  _saveIndex(index);
  return filePath;
}

/**
 * Registers a downloaded file in the cache index, then runs eviction.
 * The file must already exist at filePath inside the cache directory.
 *
 * @param {string} url       Original remote URL.
 * @param {string} filePath  Absolute path of the file (must be in getCacheDir()).
 */
function store(url, filePath) {
  let size = 0;
  try {
    size = fs.statSync(filePath).size;
  } catch {
    return; // file disappeared — nothing to register
  }

  const filename = path.basename(filePath);
  const index = _loadIndex();

  index[filename] = {
    url,
    size,
    lastAccess: Date.now(),
  };

  _saveIndex(index);
  evict();
}

/**
 * Enforces the configured size limit by deleting the least-recently-used
 * cache entries until the total stored size is below the threshold.
 */
function evict() {
  const maxSize = getArtworkCacheMaxSize();
  const index   = _loadIndex();
  const dir     = getCacheDir();

  // Remove index entries whose files no longer exist on disk.
  for (const filename of Object.keys(index)) {
    if (!fs.existsSync(path.join(dir, filename))) {
      delete index[filename];
    }
  }

  // Sort entries LRU-first (oldest lastAccess first).
  const entries = Object.entries(index).sort(
    ([, a], [, b]) => a.lastAccess - b.lastAccess,
  );

  let totalSize = entries.reduce((sum, [, v]) => sum + v.size, 0);

  for (const [filename, meta] of entries) {
    if (totalSize <= maxSize) break;

    const filePath = path.join(dir, filename);
    try {
      fs.unlinkSync(filePath);
      totalSize -= meta.size;
      delete index[filename];
      console.log(`[cacheManager] Evicted ${filename} (${meta.size} bytes)`);
    } catch (err) {
      console.warn(`[cacheManager] Could not evict ${filename}: ${err.message}`);
    }
  }

  _saveIndex(index);
}

module.exports = { getCacheDir, getCachedPath, store, evict };
