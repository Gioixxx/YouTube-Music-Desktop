# YouTube Music Desktop

An Electron-based desktop wrapper for [YouTube Music](https://music.youtube.com) with system integrations.

## Features

- YouTube Music in a native desktop window
- Global media-key support (Play/Pause, Next, Previous)
- System-tray icon with playback controls
- Compact always-on-top mini player
- Desktop notifications on track change
- Dark / Light / System theme
- Custom keyboard shortcuts
- Ad-block (CSS-based)
- Discord Rich Presence (optional, opt-in)
- Automatic updates via GitHub Releases

## Getting Started

```bash
npm install
npm start          # launch in development
npm run dist       # build Windows installer (requires electron-builder)
```

## Documentation

| Document | Description |
|----------|-------------|
| [docs/testing-functional.md](docs/testing-functional.md) | Functional test plan — run before each release |
| [docs/testing-performance.md](docs/testing-performance.md) | Performance & resource test checklist (CPU, RAM, network, startup) |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | Performance targets, optimisations and measurement guide |
| [docs/distribution.md](docs/distribution.md) | Release publishing, code signing and GitHub Actions CI guide |

## Release Checklist

Before publishing a new release, run the full **Critical** tier of the
[functional test plan](docs/testing-functional.md) and confirm all tests pass.
