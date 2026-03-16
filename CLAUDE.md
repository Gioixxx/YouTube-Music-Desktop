# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Run the app in development mode
npm run dist       # Build Windows installer and portable .exe into dist/
npm run release    # Build and publish a stable release to GitHub Releases
npm run release:prerelease  # Build and publish a prerelease to GitHub Releases
```

There is no test runner or linter configured — functional testing is done manually following `docs/testing-functional.md`.

## Architecture

This is an **Electron 28** desktop wrapper for `https://music.youtube.com` with media controls, system tray, mini player, Discord RPC, and auto-updates.

### Process Model

```
Main Process (app/main/main.js)
  ├── windowManager.js       BrowserWindow lifecycle, navigation whitelist, tray/mini-player toggle
  ├── mediaController.js     Injects JS into renderer to click YT Music player buttons
  ├── mediaSessionManager.js OS media-key integration via MediaSession API
  ├── shortcuts.js           Global keyboard shortcuts (globalShortcut)
  ├── tray.js                System tray icon and context menu
  ├── miniPlayer.js          Separate always-on-top 320×90 frameless window
  ├── notifications.js       Native OS track-change notifications
  ├── discordRpc.js          Discord Rich Presence (lazy-loaded, opt-in)
  ├── updater.js             electron-updater pointing at GitHub Releases
  ├── securityManager.js     CSP headers, navigation guards, DevTools lockdown in prod
  ├── themeManager.js        Light/dark/system theme via nativeTheme
  ├── adBlockManager.js      CSS injection to hide ads cosmetically
  └── configStore.js         electron-store wrapper; defaults in config/default.js

Preload (app/preload/preload.js)
  └── Exposes window.ytmdAPI with a strict channel whitelist for IPC

Renderer
  └── The YouTube Music web app running inside BrowserWindow
```

### IPC Channels

| Direction | Channels |
|-----------|----------|
| Renderer → Main (send) | `media:play`, `media:pause`, `media:next`, `media:previous`, `track:changed`, `shortcuts:reload`, `theme:set` |
| Main → Renderer (on) | `theme:changed`, `settings:updated`, `miniPlayer:update` |

### Configuration

Settings are stored in `{userData}/app-config.json` via `electron-store`. Defaults are in `config/default.js`. All reads/writes go through `app/main/configStore.js` getter/setter functions — do not access the store directly elsewhere.

Window state (size, position, maximized) is persisted separately in `{userData}/window-state.json`.

### Security Constraints

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` on all BrowserWindows
- Navigation is restricted to a whitelist of YouTube/Google domains in `securityManager.js`
- DevTools are blocked when `app.isPackaged` is true
- New window requests (`window.open`) are intercepted for Google OAuth and blocked otherwise

### Distribution

- **Build output:** `dist/` — NSIS installer + portable `.exe`
- **Auto-update:** `electron-updater` fetches from GitHub Releases (`owner: Gioixxx`, `repo: YouTube-Music-Desktop`)
- **Code signing:** Configured via `WIN_CSC_LINK` / `WIN_CSC_KEY_PASSWORD` env vars (see `docs/distribution.md`)
- **CI/CD:** `.github/workflows/build.yml` (build artifact on push), `.github/workflows/release.yml` (publish release on demand)
