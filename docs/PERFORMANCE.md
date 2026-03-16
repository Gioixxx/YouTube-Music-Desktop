# Performance Targets & Notes

## Reference Machine

| Component | Specification |
|-----------|--------------|
| CPU       | Intel Core i5-8250U (4C/8T, 1.6–3.4 GHz) |
| RAM       | 8 GB DDR4 |
| Storage   | NVMe SSD (500 MB/s read) |
| OS        | Windows 10 22H2 64-bit |

---

## Targets

| Metric | Target | Notes |
|--------|--------|-------|
| CPU (idle, window visible) | < 5 % | App open, music paused |
| CPU (during playback) | < 15 % | Standard 256 kbps stream |
| RAM (playback) | ≤ 250 MB | Single main window, no mini-player |
| Cold-start (app launch → UI visible) | < 3 s | On NVMe SSD |

---

## Optimisations in Place

### Lazy loading of optional modules (`main.js`)

`discord-rpc` (≈ 1 MB native binding) is only `require()`d when the user
has explicitly enabled Discord RPC (`enableDiscordRPC: true` in settings).
On a default install the module is never loaded.

`electron-updater` (≈ 3 MB) is `require()`d lazily inside
`updater.js#_configure()`, which is itself only called when the app is
packaged (`app.isPackaged === true`).  In development the module is never
loaded at all.

### Background throttling disabled (`windowManager.js`)

`backgroundThrottling: false` is set on the main BrowserWindow so Chromium
never suspends JavaScript timers or audio callbacks when the window is
hidden or minimised.  This keeps music playback uninterrupted without
requiring the window to stay focused.

### Ad-block CSS injection (`adBlockManager.js`)

A lightweight CSS-based ad filter removes common YouTube Music ad elements
at paint time rather than blocking network requests.  This avoids the
overhead of a full network-layer blocker.

---

## How to Measure

### CPU & RAM
Use Windows Task Manager → Details tab, filter on
`YouTube Music Desktop.exe`, observe CPU % and Memory columns during:
1. Idle (app open, music paused, window visible)
2. Idle (window minimised / hidden to tray)
3. Active playback (let a full song play, sample every 10 s)

### Cold-start
```
Measure-Command { Start-Process "YouTubeMusicDesktop.exe" } | Select-Object TotalSeconds
```
Or use a stopwatch from double-click to first visible window frame.

### Heap snapshot
In development (DevTools available), open Memory tab → Heap snapshot
during active playback to inspect retained object counts.
