# Distribution & Code Signing Guide

## Overview

YouTube Music Desktop is distributed via **GitHub Releases**.
`electron-updater` (already configured in `app/main/updater.js`) pulls
update metadata and installers directly from the GitHub Releases API,
so no additional update server is required.

---

## 1. Publishing a Release

### Prerequisites

- A GitHub **Personal Access Token** (PAT) with `repo` scope stored in the
  environment variable `GH_TOKEN`.
- `electron-builder` installed (`npm install`).

### Build & Publish

```bash
# Build installer + portable, then upload both as GitHub Release assets:
GH_TOKEN=<your-token> npm run release
```

`npm run release` runs `electron-builder --win --publish always`, which:
1. Compiles the app into `dist/`.
2. Creates (or updates) a **Draft** GitHub Release for the current
   `version` in `package.json`.
3. Uploads `YouTubeMusicDesktopSetup.exe` and `YouTubeMusicDesktop.exe`
   as release assets.
4. Generates `latest.yml` — the update manifest read by `electron-updater`.

Publish the draft on GitHub when ready; `electron-updater` on existing
installs will detect it on their next 4-hour check.

### Environment variables summary

| Variable | Purpose |
|----------|---------|
| `GH_TOKEN` | GitHub PAT for uploading release assets |
| `WIN_CSC_LINK` | Path or URL to the `.pfx` / `.p12` signing certificate |
| `WIN_CSC_KEY_PASSWORD` | Password for the signing certificate |

---

## 2. Landing Page / Download Page

A dedicated landing page is not yet live.  The canonical download URL is:

```
https://github.com/Gioixxx/YouTube-Music-Desktop/releases/latest
```

When a landing page is created, it should link directly to the latest
release assets:

```
https://github.com/Gioixxx/YouTube-Music-Desktop/releases/latest/download/YouTubeMusicDesktopSetup.exe
https://github.com/Gioixxx/YouTube-Music-Desktop/releases/latest/download/YouTubeMusicDesktop.exe
```

Recommended static-site options (no server required):
- **GitHub Pages** — free, hosted from the `docs/` branch or a `gh-pages` branch.
- **Netlify / Vercel** — connect to the repo for CI-based deploys.

---

## 3. Code Signing (Windows)

Signing the installer with an EV or OV certificate is the most effective
way to eliminate Windows SmartScreen "Unknown publisher" warnings and
Windows Defender flags on first run.

### 3a. Production certificate (EV / OV)

1. Purchase a **Code Signing Certificate** from a CA trusted by Microsoft
   (DigiCert, Sectigo, GlobalSign, etc.).
   - **EV certificates** eliminate SmartScreen warnings immediately.
   - **OV certificates** reduce warnings but require reputation build-up.

2. Export the certificate as a `.pfx` file (includes the private key).

3. Store the path in `WIN_CSC_LINK` and the password in
   `WIN_CSC_KEY_PASSWORD` **as CI/CD secrets** — never commit them to the
   repo.

4. In your CI pipeline (GitHub Actions example):

```yaml
- name: Build & release
  env:
    GH_TOKEN: ${{ secrets.GH_TOKEN }}
    WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
    WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
  run: npm run release
```

`electron-builder` reads `WIN_CSC_LINK` / `WIN_CSC_KEY_PASSWORD` via the
`${env.VAR}` interpolation already in `package.json` → `build.win`.

### 3b. Self-signed certificate (test / local dev)

For local testing without purchasing a certificate, generate a self-signed
certificate with PowerShell:

```powershell
# Generate a self-signed cert valid for 1 year
$cert = New-SelfSignedCertificate `
  -Type CodeSigningCert `
  -Subject "CN=YouTube Music Desktop (test)" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -NotAfter (Get-Date).AddYears(1)

# Export to .pfx
$pwd = ConvertTo-SecureString -String "testpassword" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath ".\test-cert.pfx" -Password $pwd
```

Set environment variables before building:

```powershell
$env:WIN_CSC_LINK     = Resolve-Path ".\test-cert.pfx"
$env:WIN_CSC_KEY_PASSWORD = "testpassword"
npm run dist
```

> **Note:** Self-signed installers will still trigger SmartScreen because
> the certificate has no Microsoft-recognised trust chain.  Their purpose
> is solely to verify that the signing pipeline works end-to-end before
> spending money on a commercial certificate.

### 3c. SmartScreen behaviour

| Certificate type | SmartScreen result |
|------------------|--------------------|
| No signature | "Windows protected your PC" — hard block |
| Self-signed | "Unknown publisher" warning — user can override |
| OV (new) | Warning shown until reputation is established (typically weeks) |
| OV (established) | Warning reduced / absent |
| EV | No warning — immediate trust |

To verify SmartScreen behaviour on a test machine:

1. Download the installer to a fresh Windows VM (no previous installs).
2. Double-click the installer and observe the SmartScreen dialog.
3. Right-click → Properties → Digital Signatures tab to confirm the
   signature is present and valid.

---

## 4. GitHub Actions CI Template

Create `.github/workflows/release.yml` to automate builds on tag push:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Build and publish
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
        run: npm run release
```

Push a version tag to trigger a release:

```bash
git tag v1.1.0
git push origin v1.1.0
```
