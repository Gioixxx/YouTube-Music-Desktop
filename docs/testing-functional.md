# Functional Test Plan — YouTube Music Desktop

Use this plan during each release to verify critical app behaviour manually.
Run all **Critical** tests before every release; run **High** and **Medium**
tests before minor releases and when touching the related code.

---

## Legend

| Priority | When to run |
|----------|-------------|
| Critical | Every release |
| High     | Every release (quick smoke) |
| Medium   | Minor / related-area releases |

Pass/Fail column is filled in per-run.

---

## 1. Player

| ID | Test case | Preconditions | Steps | Expected result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| P-01 | Load YouTube Music | App installed, internet available | Launch app | Main window opens and `music.youtube.com` loads within 5 s | Critical |
| P-02 | Play a track | Signed in to YouTube Music | Search for any track, click Play | Track plays; progress bar advances; title visible in window | Critical |
| P-03 | Pause / Resume | Track is playing | Click pause, then play | Playback stops on pause; resumes from same position | Critical |
| P-04 | Skip to next track | Playlist or album is open | Click Next button | Next track starts playing | High |
| P-05 | Skip to previous track | At least 2 tracks played | Click Previous button | Previous track plays (or current restarts if <3 s in) | High |
| P-06 | Seek via progress bar | Track is playing | Click mid-way on progress bar | Playback jumps to clicked position | Medium |
| P-07 | Volume control | Track is playing | Drag volume slider to 0 | Audio mutes; drag back — audio resumes | Medium |

---

## 2. Media Keys

| ID | Test case | Preconditions | Steps | Expected result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| MK-01 | Play/Pause hardware key | Track loaded | Press keyboard Play/Pause key | Playback toggles | Critical |
| MK-02 | Next hardware key | Track playing | Press keyboard Next Track key | Next track starts | Critical |
| MK-03 | Previous hardware key | Track playing | Press keyboard Previous Track key | Previous track or seek to start | High |
| MK-04 | Media keys work when app is in background | Another window focused | Press Play/Pause hardware key | Playback toggles in background app | Critical |
| MK-05 | Media keys work when app is minimised | App minimised to taskbar | Press hardware media key | Playback toggles | High |

---

## 3. System Tray

| ID | Test case | Preconditions | Steps | Expected result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TR-01 | Tray icon visible | App running | Check system tray area | YouTube Music Desktop icon is visible | Critical |
| TR-02 | Double-click tray icon | Main window hidden | Double-click tray icon | Main window appears and is focused | Critical |
| TR-03 | Tray → Play/Pause | Track paused | Right-click tray → Play/Pause | Playback toggles | High |
| TR-04 | Tray → Next | Track playing | Right-click tray → Next | Next track plays | High |
| TR-05 | Tray → Previous | Track playing | Right-click tray → Previous | Previous track plays | High |
| TR-06 | Tray → Show App | Window hidden | Right-click tray → Show App | Main window restores and focuses | High |
| TR-07 | Tray → Mini Player | App running | Right-click tray → Mini Player | Mini player window opens/toggles | Medium |
| TR-08 | Tray → Check for updates | App running | Right-click tray → Check for updates | Dialog shown (update available or up to date) | Medium |
| TR-09 | Tray → Quit | App running | Right-click tray → Quit | App exits; tray icon removed | Critical |
| TR-10 | Close to tray | `closeToTray` enabled in settings | Click window × button | Window hides; tray icon remains; app still running | High |

---

## 4. Notifications

| ID | Test case | Preconditions | Steps | Expected result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| NT-01 | Track-change notification shown | `enableNotifications: true`; OS notifications permitted | Skip to next track | OS notification appears with title, artist, album art | High |
| NT-02 | Notification not shown when disabled | `enableNotifications: false` | Skip to next track | No notification shown | Medium |
| NT-03 | Close-to-tray hint notification | `closeToTray: true`; first time closing | Click window × | Notification "App is still running in tray" appears once | Medium |
| NT-04 | Hint shown only once | NT-03 completed | Close window again | No duplicate notification | Medium |

---

## 5. Mini Player

| ID | Test case | Preconditions | Steps | Expected result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| MP-01 | Open mini player | App running | Tray → Mini Player (or shortcut) | Small 340×130 frameless window opens, always on top | High |
| MP-02 | Mini player shows track info | Track playing, mini player open | Observe mini player | Track title and artist are displayed | High |
| MP-03 | Mini player updates on track change | Mini player open | Skip to next track | Mini player content updates to new track | High |
| MP-04 | Mini player controls work | Mini player open | Click Play/Pause, Next, Previous buttons | Playback responds correctly | High |
| MP-05 | Close mini player | Mini player open | Click close (×) | Mini player closes; main window unaffected | Medium |
| MP-06 | Toggle mini player twice | Mini player closed | Open then close via tray | State toggles correctly each time | Medium |

---

## 6. Keyboard Shortcuts

| ID | Test case | Preconditions | Steps | Expected result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| SC-01 | Default Play/Pause shortcut | App running, default settings | Press configured shortcut (e.g. Ctrl+Alt+Space) | Playback toggles | Critical |
| SC-02 | Default Next shortcut | Track playing | Press Next shortcut | Next track starts | High |
| SC-03 | Default Previous shortcut | Track playing | Press Previous shortcut | Previous track or seek to start | High |
| SC-04 | Custom shortcut applied | User sets custom shortcut in settings | Press new shortcut | Action fires with new binding | Medium |
| SC-05 | Shortcuts work globally | Different app focused | Press Play/Pause shortcut | Playback toggles in background | Critical |
| SC-06 | Conflicting shortcut gracefully rejected | User enters shortcut used by OS | Save shortcut | Warning shown; previous binding kept | Medium |

---

## 7. Window Behaviour

| ID | Test case | Preconditions | Steps | Expected result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| W-01 | Window size/position persisted | App run and resized/moved once | Quit and relaunch | Window reopens at same size and position | High |
| W-02 | Maximized state persisted | Window maximized, then quit | Relaunch | Window opens maximized | Medium |
| W-03 | Minimize to taskbar | `minimizeToTray: false` | Click minimise (−) | Window minimises to taskbar | High |
| W-04 | Minimize to tray | `minimizeToTray: true` | Click minimise (−) | Window hides; tray icon visible | High |
| W-05 | Fullscreen toggle | App running | Press F11 (or OS fullscreen shortcut) | Window enters/exits fullscreen | Medium |
| W-06 | Window off-screen guard | Move window off-screen; quit | Relaunch | Window appears on a visible display | Medium |
| W-07 | Start minimized | `startMinimized: true` | Launch app | Window not shown; tray icon visible immediately | Medium |

---

## 8. Themes

| ID | Test case | Preconditions | Steps | Expected result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TH-01 | Apply dark theme | App running | Open settings → select Dark theme | UI switches to dark colour scheme immediately | High |
| TH-02 | Apply light theme | Dark theme active | Select Light theme | UI switches to light colour scheme | High |
| TH-03 | Theme persisted across restarts | Dark theme set; quit | Relaunch | Dark theme applied on startup without user action | High |
| TH-04 | System theme follows OS setting | `system` theme selected | Change OS dark/light mode | App theme updates to match OS | Medium |

---

## 9. Auto-Update

| ID | Test case | Preconditions | Steps | Expected result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| AU-01 | Manual check — up to date | Packaged build, latest version | Tray → Check for updates | Dialog/toast "App is up to date" | High |
| AU-02 | Manual check — update available | Older packaged build | Tray → Check for updates | Notification that update is downloading | High |
| AU-03 | Download completes | Update found (AU-02) | Wait for download | Dialog "Restart now / Later" appears | High |
| AU-04 | Restart and install | AU-03 dialog open | Click "Restart now" | App quits, installs update, relaunches at new version | Critical |
| AU-05 | Defer update | AU-03 dialog open | Click "Later" | App continues running; update applied on next launch | High |
| AU-06 | No crash when Discord offline | Discord not running, `enableDiscordRPC: true` | Launch app | App starts normally; no error dialogs | High |

---

## Running the Plan

1. Build the installer: `npm run dist`
2. Install on the reference machine (see `docs/PERFORMANCE.md`).
3. Work through each section top-to-bottom, recording Pass / Fail.
4. File a GitHub issue for each failing test before publishing the release.
