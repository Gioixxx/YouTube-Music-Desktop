# Big Plan - YouTube Music Desktop

Visione generale delle feature da implementare per il client desktop YouTube Music su Windows.
Ogni sezione puo diventare un PRD separato per Ralph.

---

## Visione del Prodotto

**Obiettivo:** Creare un client desktop nativo per Windows basato su Electron che offra
un'esperienza YouTube Music integrata nel sistema operativo: controlli multimediali,
mini player, notifiche, integrazioni di sistema e aggiornamenti automatici.

**Target:** Utenti Windows che utilizzano YouTube Music via browser e desiderano
un'app dedicata con funzionalita desktop avanzate.

---

## Legenda Priorita

| Simbolo | Significato |
|---------|-------------|
| 🔴 | Critico - Funzionalita core |
| 🟠 | Alta - Valore aggiunto importante |
| 🟡 | Media - Nice to have |
| 🟢 | Bassa - Miglioramenti futuri |

---

## FASE 1: Core Shell & Browser Wrapper 🔴

**Branch:** `ralph/core-shell-window-manager`  
**Stato:** Pianificato  
**Complessita:** Bassa-Media

### Obiettivo
Bootstrap del progetto Electron con finestra principale, gestione stato finestra
e caricamento sicuro di `https://music.youtube.com`.

### User Stories (alto livello)
- [ ] Struttura base progetto Electron con `package.json`, script npm e entry `main.js`
- [ ] Separazione cartelle `app/main`, `app/preload`, `app/renderer`, `assets`, `config`
- [ ] WindowManager con salvataggio/ripristino dimensione e posizione finestra
- [ ] BrowserWrapper che carica YouTube Music con flag di sicurezza corretti
- [ ] Gestione navigazione esterna (apertura link nel browser di sistema)
- [ ] Content Security Policy/CSP base allineata ai domini YouTube Music

---

## FASE 2: Funzionalita Essenziali Player 🔴

**Branch:** `ralph/core-media-controls`  
**Stato:** Pianificato  
**Complessita:** Media

### Obiettivo
Integrare i controlli multimediali nativi del sistema operativo con il player YouTube Music.

### User Stories (alto livello)
- [ ] Modulo `mediaController` che collega gli eventi del player YouTube Music al main process
- [ ] Supporto MediaSession API per play/pause/next/previous
- [ ] Registrazione shortcut globali di default (Ctrl+Alt+P/N/B/Y, M)
- [ ] Possibilita di abilitare/disabilitare gli shortcut globali
- [ ] Mappatura shortcut configurabile con persistenza delle preferenze

---

## FASE 3: Tray, Notifiche & Mini Player 🟠

**Branch:** `ralph/tray-notifications-miniplayer`  
**Stato:** Pianificato  
**Complessita:** Media-Alta

### Obiettivo
Aggiungere integrazione con la system tray, notifiche native e mini player compatto.

### User Stories (alto livello)
- [ ] Icona tray con menu contestuale (Play/Pause, Next, Previous, Show, Quit)
- [ ] Notifiche native Windows al cambio brano (titolo, artista, copertina)
- [ ] Cache locale artwork per notifiche e mini player
- [ ] Finestra Mini Player always-on-top con controlli base e barra di progresso
- [ ] Toggle Mini Player via shortcut globale e menu tray

---

## FASE 4: Theme Engine & Ad Block UI 🟠

**Branch:** `ralph/themes-and-adblock-ui`  
**Stato:** Pianificato  
**Complessita:** Media

### Obiettivo
Offrire un'esperienza visiva coerente con supporto tema e riduzione degli elementi pubblicitari cosmetici.

### User Stories (alto livello)
- [ ] Tema light/dark/system basato su CSS variables
- [ ] Impostazione tema sincronizzata con nativeTheme di Windows in modalita "system"
- [ ] Opzione per abilitare/disabilitare un Ad Block UI cosmetico
- [ ] Script DOM injection per nascondere container pubblicitari, banner e overlay
- [ ] Gestione elementi caricati dinamicamente tramite MutationObserver

---

## FASE 5: Persistenza Configurazioni 🔴

**Branch:** `ralph/settings-persistence`  
**Stato:** Pianificato  
**Complessita:** Bassa-Media

### Obiettivo
Persistenza di tutte le preferenze utente in AppData tramite electron-store.

### User Stories (alto livello)
- [ ] Store configurazioni con percorso sicuro in `%AppData%`
- [ ] Salvataggio tema, preferenze tray (minimize/close to tray)
- [ ] Salvataggio abilita/disabilita notifiche e adBlock UI
- [ ] Persistenza scorciatoie globali configurate
- [ ] Persistenza stato finestra (`window`): dimensioni, posizione, fullscreen

---

## FASE 6: Discord Rich Presence 🟡

**Branch:** `ralph/discord-rich-presence`  
**Stato:** Pianificato  
**Complessita:** Media

### Obiettivo
Integrazione opzionale con Discord Rich Presence per mostrare il brano in ascolto.

### User Stories (alto livello)
- [ ] Integrazione libreria `discord-rpc` nel main process
- [ ] Stato "Listening to..." con dettagli brano, artista e album
- [ ] Configurazione per abilitare/disabilitare Discord RPC nelle impostazioni
- [ ] Gestione errori/disconnessione Discord senza impattare il player

---

## FASE 7: Auto Update & Packaging 🔴

**Branch:** `ralph/auto-update-and-packaging`  
**Stato:** Pianificato  
**Complessita:** Media-Alta

### Obiettivo
Configurare build, installer NSIS e aggiornamenti automatici via electron-updater.

### User Stories (alto livello)
- [ ] Configurazione Electron Builder con target NSIS per Windows
- [ ] Generazione `.exe` portabile e installer `YouTubeMusicDesktopSetup.exe`
- [ ] Integrazione `electron-updater` con GitHub Releases come canale principale
- [ ] Flusso `checkForUpdates` all'avvio con download in background
- [ ] Menu "Verifica aggiornamenti" manuale
- [ ] Installazione aggiornamenti tramite `quitAndInstall`

---

## FASE 8: Security Hardening 🔴

**Branch:** `ralph/security-hardening`  
**Stato:** Pianificato  
**Complessita:** Media

### Obiettivo
Applicare le best practice di sicurezza Electron e limitare la superficie di attacco.

### User Stories (alto livello)
- [ ] Verifica e enforcement di `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, `enableRemoteModule: false`
- [ ] Implementazione Content Security Policy allineata a YouTube Music
- [ ] Blocco navigazione verso domini non nella whitelist tramite `will-navigate` e `new-window`
- [ ] Revisione e limitazione dell'API esposta dal preload (contextBridge) al minimo necessario

---

## FASE 9: Performance & Ottimizzazioni 🟠

**Branch:** `ralph/performance-optimizations`  
**Stato:** Pianificato  
**Complessita:** Media

### Obiettivo
Ridurre l'impatto su RAM e CPU rispetto a una tipica app Electron.

### User Stories (alto livello)
- [ ] Disabilitazione DevTools in produzione
- [ ] Background throttling per renderer quando l'app e in background
- [ ] Lazy loading di moduli non critici (Discord RPC, updater)
- [ ] Politica LRU per la cache artwork con limite dimensione configurabile
- [ ] Verifica manuale metriche chiave (CPU, RAM, startup) durante il piano di test

---

## FASE 10: Piano di Test 🟠

**Branch:** `ralph/testing-plan`  
**Stato:** Pianificato  
**Complessita:** Bassa-Media

### Obiettivo
Definire e automatizzare dove possibile il piano di test funzionale e di performance.

### User Stories (alto livello)
- [ ] Checklist test funzionali per player, media keys, tray, notifiche, mini player, shortcut
- [ ] Script o documentazione per test regressione prima dei rilasci
- [ ] Linee guida per monitoraggio CPU/RAM/startup durante i test

---

## FASE 11: Distribuzione & Code Signing 🟠

**Branch:** `ralph/distribution-and-signing`  
**Stato:** Pianificato  
**Complessita:** Media

### Obiettivo
Distribuire il client in modo sicuro e affidabile con firma del codice.

### User Stories (alto livello)
- [ ] Configurazione canale GitHub Releases con changelog
- [ ] Integrazione con sito web/landing page per download diretto
- [ ] Configurazione certificato di Code Signing in Electron Builder
- [ ] Verifica comportamento con Windows SmartScreen e flusso installazione/disinstallazione

---

## Roadmap Suggerita

```
2026 Q1: Fasi 1-3 (Core shell, Media controls, Tray/Notifiche/Mini player)
2026 Q2: Fasi 4-7 (Theme/AdBlock, Persistenza, Discord RPC, Auto update/Packaging)
2026 Q3: Fasi 8-9 (Security hardening, Performance)
2026 Q4: Fasi 10-11 (Testing strutturato, Distribuzione e Code signing)
```

---

## Note Tecniche Generali

### Stack Tecnologico
- **Runtime:** Electron 28+ (Chromium + Node.js)
- **Backend:** Node.js 20 LTS (processo main)
- **Frontend:** HTML/CSS/JS (renderer webview YouTube Music)
- **Persistenza:** electron-store (configurazioni JSON in AppData)
- **Packaging:** Electron Builder + NSIS
- **Aggiornamenti:** electron-updater (GitHub Releases / CDN)

### Principi di Sviluppo
1. **SOLID/Modularita** - Moduli separati per window, tray, media, updater
2. **DRY** - Riutilizzo di helper comuni (config, logging, util)
3. **KISS** - Implementazioni semplici, senza over-engineering
4. **Security-first** - Flag Electron sicuri, CSP, IPC minimizzato

### Obiettivi di Performance
- CPU media in idle < 5%  
- CPU in riproduzione < 15%  
- RAM target < 250 MB in riproduzione standard  
- Tempo di avvio < 3 secondi su SSD

