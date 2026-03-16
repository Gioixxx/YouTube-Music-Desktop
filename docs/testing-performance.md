# Performance & Resource Test Checklist

Run this checklist during regression testing and before each release to
confirm that CPU, RAM, network and startup targets are met.

For target values and the reference machine specification see
[PERFORMANCE.md](PERFORMANCE.md).

---

## 1. Preparation

Before each test session:

- [ ] Build and install the **packaged** app (`npm run dist` → run the NSIS installer).
      Do **not** test in `npm start` dev mode — Electron dev overhead skews results.
- [ ] Reboot the machine and wait 2 minutes for background services to settle.
- [ ] Close all non-essential applications (browser, IDE, chat clients).
- [ ] Disable OS automatic updates for the duration of the session.
- [ ] Sign in to YouTube Music inside the app before measuring.

---

## 2. CPU Usage

### Target

| Scenario | Acceptable range |
|----------|-----------------|
| Idle (music paused, window visible) | ≤ 5 % |
| Active playback (256 kbps stream) | ≤ 15 % |
| Window minimised / hidden to tray | ≤ 2 % |

### Tool — Windows Task Manager (quick check)

1. Press **Ctrl + Shift + Esc** → **Details** tab.
2. Locate `YouTube Music Desktop.exe`.
3. Observe the **CPU** column for 60 seconds.
4. Record the average (ignore momentary spikes < 2 s).

### Tool — Windows Performance Monitor (accurate sampling)

```
perfmon /res
```

1. Open **Resource Monitor** → **CPU** tab.
2. Check the box next to `YouTube Music Desktop.exe` in the Processes grid.
3. Observe **CPU Total** in the lower graph at 1-second intervals for 2 minutes.
4. Export: **File → Save As** (`.csv`) for archiving.

### Steps

- [ ] 2-1  Launch app, do not start playback.  Measure CPU for 60 s → record average.
- [ ] 2-2  Start a track, let it play for 60 s. Measure CPU → record average.
- [ ] 2-3  Minimise window to tray. Measure CPU for 60 s → record average.
- [ ] 2-4  All three values within target ranges above.

---

## 3. RAM (Memory) Usage

### Target

| Scenario | Acceptable range |
|----------|-----------------|
| Idle (signed in, music paused) | ≤ 300 MB |
| Active playback (standard quality) | ≤ 250 MB private working set |
| After 1 hour of continuous playback | ≤ 350 MB (no runaway leak) |

### Tool — Task Manager

1. **Ctrl + Shift + Esc** → **Details** tab.
2. Right-click the column header → **Select columns** → enable **Memory (private working set)**.
3. Locate `YouTube Music Desktop.exe`.

### Tool — Performance Monitor (heap leak detection)

```
perfmon
```

1. Add counter: **Process → Private Bytes → YouTube Music Desktop**.
2. Run for 1 hour with one playlist on repeat.
3. The graph should plateau, not grow continuously.

### Steps

- [ ] 3-1  Record private working set at startup (signed in, paused).
- [ ] 3-2  Start playback. Record working set after 5 min.
- [ ] 3-3  Continue playback for 1 hour. Record working set at 30 min and 60 min.
- [ ] 3-4  Values at 30 min and 60 min should not exceed value at 5 min by more than 50 MB.
- [ ] 3-5  All values within target ranges above.

---

## 4. Network Traffic (Superfluous Requests)

### Target

| Check | Expected behaviour |
|-------|--------------------|
| No telemetry to non-YouTube/Google hosts | Zero requests to third-party analytics domains |
| No polling when music is paused | Network idle between track loads |
| Update check frequency | At most 1 request to GitHub API per 4-hour window |

### Tool — Windows Resource Monitor

```
perfmon /res
```

1. **Network** tab → filter by `YouTube Music Desktop.exe`.
2. Observe **Connections** list for unexpected hostnames.

### Tool — Fiddler Classic (detailed inspection)

1. Download and install [Fiddler Classic](https://www.telerik.com/fiddler/fiddler-classic).
2. Enable **Decrypt HTTPS traffic** (Tools → Options → HTTPS).
3. Launch the app; filter sessions by Process = `YouTube Music Desktop`.
4. Review the Host column for any non-Google/YouTube hosts.

### Steps

- [ ] 4-1  Launch app, wait 30 s on the home screen.  No requests outside `*.youtube.com`, `*.google.com`, `*.gstatic.com`, `*.googlevideo.com`, `*.ggpht.com`.
- [ ] 4-2  Pause music; wait 2 min.  Verify no polling loop (Resource Monitor network graph should be flat).
- [ ] 4-3  Note the timestamp of any `api.github.com` request at startup.  Re-launch within 4 h — confirm no second request is sent (throttle check).
- [ ] 4-4  All checks pass.

---

## 5. Startup Time (Cold Start)

### Target

| Metric | Target |
|--------|--------|
| Time from launch to first visible window frame | < 3 s (NVMe SSD) |
| Time from launch to YouTube Music UI interactive | < 8 s (depends on network) |

### Tool — PowerShell stopwatch

```powershell
$sw = [System.Diagnostics.Stopwatch]::StartNew()
Start-Process "C:\Program Files\YouTube Music Desktop\YouTube Music Desktop.exe"
# Stop the stopwatch when the window becomes visible (manual observation)
$sw.Stop()
Write-Host "Elapsed: $($sw.Elapsed.TotalSeconds) s"
```

### Tool — Process Monitor (ProcMon)

1. Open [Process Monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) (Sysinternals).
2. Filter: `Process Name is YouTube Music Desktop.exe`.
3. Note the timestamp of the first event and the first `CreateWindow` event.
4. Difference = cold-start time.

### Steps

- [ ] 5-1  Kill all instances; flush DNS (`ipconfig /flushdns`); cold-start the app.
- [ ] 5-2  Start stopwatch on double-click; stop on first window frame.
- [ ] 5-3  Repeat 3 times; record median.
- [ ] 5-4  Median < 3 s on the reference machine.

---

## 6. Recording Results

Copy the table below into your release notes or CI artefacts:

```
Release: vX.Y.Z
Date:
Tester:
Machine: (CPU / RAM / SSD)

| Metric                          | Value    | Target  | Pass/Fail |
|---------------------------------|----------|---------|-----------|
| CPU idle (avg 60 s)             |          | ≤ 5 %   |           |
| CPU playback (avg 60 s)         |          | ≤ 15 %  |           |
| CPU tray (avg 60 s)             |          | ≤ 2 %   |           |
| RAM paused (private WS)         |          | ≤ 300 MB|           |
| RAM playback 5 min              |          | ≤ 250 MB|           |
| RAM playback 60 min             |          | ≤ 350 MB|           |
| Superfluous network requests    |          | None    |           |
| Cold-start median (3 runs)      |          | < 3 s   |           |
```
