/**
 * Renderer-side entry script (ui.js).
 *
 * Runs in the renderer process with contextIsolation active.
 * Communicates with the main process exclusively through window.ytmdAPI
 * (the bridge exposed by preload.js).
 *
 * No Node.js or Electron internals are accessible here.
 */

'use strict';

(function () {
  /**
   * Update the status paragraph in the placeholder UI.
   * @param {string} text
   */
  function setStatus(text) {
    const el = document.getElementById('status');
    if (el) el.textContent = text;
  }

  function init() {
    if (window.ytmdAPI) {
      setStatus(`YouTube Music Desktop v${window.ytmdAPI.version} — ready.`);

      // Listen for theme changes pushed from the main process.
      window.ytmdAPI.on('theme:changed', (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
      });
    } else {
      setStatus('Preload bridge not available.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
