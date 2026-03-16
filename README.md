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

## Deploy su Git e download del setup

1. **Crea il repository su GitHub** (se non esiste): [github.com/new](https://github.com/new) con nome `YouTube-Music-Desktop` (o quello che preferisci).

2. **Inizializza Git e push** (dalla cartella del progetto):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/Gioixxx/YouTube-Music-Desktop.git
   git push -u origin main
   ```

3. **Scarica il setup** dopo il push:
   - Vai su **GitHub** → repository **YouTube-Music-Desktop** → tab **Actions**.
   - Apri l’ultima esecuzione del workflow **"Build"** (verde).
   - In fondo alla pagina, nella sezione **Artifacts**, scarica `YouTube-Music-Desktop-<commit>`: troverai `YouTubeMusicDesktopSetup.exe` (installer) e `YouTubeMusicDesktop.exe` (portabile).

Il workflow **Build** parte automaticamente a ogni push su `main`; non servono token né certificati. Per rilasci ufficiali con aggiornamenti automatici usa il workflow **Release** (vedi [docs/distribution.md](docs/distribution.md)).

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

## Licenza

Questo progetto è rilasciato sotto licenza **GNU GPL v3.0 o successiva (GPL-3.0-or-later)**.
Per maggiori dettagli vedere il file `LICENSE` nella root del repository.
