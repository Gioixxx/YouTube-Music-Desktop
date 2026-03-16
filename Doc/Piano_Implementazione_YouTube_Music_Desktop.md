# PIANO DI IMPLEMENTAZIONE
## YouTube Music Desktop (.exe)

> Applicazione Desktop nativa per Windows basata su Electron + Node.js

| Versione | Data | Stato |
|----------|------|-------|
| 1.0.0 | Marzo 2026 | In Pianificazione |

---

## Indice

1. [Fase 1 – Architettura del Progetto](#fase-1--architettura-del-progetto)
2. [Fase 2 – Struttura del Progetto](#fase-2--struttura-del-progetto)
3. [Fase 3 – Core Application](#fase-3--core-application)
4. [Fase 4 – Funzionalità Essenziali](#fase-4--funzionalità-essenziali)
5. [Fase 5 – Funzioni Avanzate](#fase-5--funzioni-avanzate)
6. [Fase 6 – Persistenza Dati](#fase-6--persistenza-dati)
7. [Fase 7 – Auto Update](#fase-7--auto-update)
8. [Fase 8 – Ottimizzazione Prestazioni](#fase-8--ottimizzazione-prestazioni)
9. [Fase 9 – Packaging Windows](#fase-9--packaging-windows)
10. [Fase 10 – Sicurezza](#fase-10--sicurezza)
11. [Fase 11 – Piano di Test](#fase-11--piano-di-test)
12. [Fase 12 – Distribuzione](#fase-12--distribuzione)
13. [Riepilogo Funzionale](#riepilogo-funzionale)

---

## Fase 1 – Architettura del Progetto

> *Definizione dello stack tecnologico e delle dipendenze fondamentali.*

### 1.1 Stack Tecnologico

Il progetto si basa su un'architettura Electron con processo principale (main) e processo di rendering (renderer), comunicanti via IPC.

| Layer | Tecnologia | Ruolo |
|-------|-----------|-------|
| Runtime | Electron 28+ | Ambiente desktop cross-platform con Chromium + Node.js |
| Backend | Node.js 20 LTS | Logica main process, IPC, file system, networking |
| Frontend | HTML / CSS / JS | UI renderer, interfaccia utente, styling, interazioni |
| Packaging | Electron Builder | Generazione .exe, installer NSIS, auto-update |
| Persistenza | electron-store | Salvataggio configurazioni in AppData (JSON) |
| Aggiornamenti | electron-updater | Auto-update via GitHub Releases / CDN |

### 1.2 Dipendenze Opzionali (Versione Avanzata)

Per una futura evoluzione dell'interfaccia verso componenti reattivi:

- **React 18+** – rendering dichiarativo dell'interfaccia
- **Redux / Zustand** – state management centralizzato
- **discord-rpc** – integrazione Rich Presence su Discord

---

## Fase 2 – Struttura del Progetto

> *Organizzazione delle cartelle e dei moduli dell'applicazione.*

### 2.1 Albero delle Directory

La struttura segue il pattern di separazione main/renderer/preload tipico delle applicazioni Electron sicure:

| Percorso | Descrizione |
|----------|-------------|
| `youtube-music-desktop/` | Root del progetto |
| `├─ app/main/` | Processo principale Electron |
| `│  ├─ main.js` | Entry point, bootstrap dell'app |
| `│  ├─ windowManager.js` | Gestione finestre (creazione, fullscreen, restore) |
| `│  ├─ tray.js` | System tray icon e menu contestuale |
| `│  ├─ shortcuts.js` | Shortcut globali (globalShortcut API) |
| `│  ├─ mediaController.js` | Media Session, controlli play/pause/next |
| `│  ├─ notifications.js` | Notifiche native cambio brano |
| `│  ├─ miniPlayer.js` | Finestra mini player compatta |
| `│  ├─ adBlocker.js` | Rimozione elementi pubblicitari DOM |
| `│  ├─ themeManager.js` | Gestione temi (light/dark/system) |
| `│  ├─ cacheManager.js` | Cache locale artwork |
| `│  └─ updater.js` | Auto-update via electron-updater |
| `├─ app/renderer/` | Processo di rendering (UI) |
| `│  ├─ index.html` | Pagina host per YouTube Music |
| `│  ├─ styles.css` | Stili custom, temi, mini player |
| `│  └─ ui.js` | Logica UI lato renderer |
| `├─ app/preload/` | Bridge sicuro main↔renderer |
| `│  └─ preload.js` | contextBridge, espone API sicure |
| `├─ assets/icons/` | Icone app (.ico, .png, tray) |
| `├─ assets/images/` | Immagini statiche |
| `├─ config/settings.json` | Configurazione di default |
| `├─ package.json` | Dipendenze e script npm |
| `└─ builder.json` | Configurazione Electron Builder |

---

## Fase 3 – Core Application

> *Componenti fondamentali: Window Manager e Browser Wrapper.*

### 3.1 Window Manager

Modulo responsabile del ciclo di vita della finestra principale. Gestisce apertura, dimensionamento, fullscreen, minimizzazione e ripristino della sessione precedente.

#### Funzioni principali

- `createMainWindow()` – Crea la BrowserWindow con dimensioni salvate
- `restoreLastSession()` – Ripristina URL e posizione dalla sessione precedente
- `handleExternalLinks()` – Intercetta link esterni e li apre nel browser di sistema
- `saveWindowState()` – Salva posizione/dimensione su electron-store

### 3.2 Browser Wrapper

La finestra principale carica `https://music.youtube.com` tramite una webview configurata con le seguenti policy di sicurezza:

| Parametro | Valore | Motivazione |
|-----------|--------|-------------|
| contextIsolation | `true` | Isola il contesto JS del preload dal renderer |
| sandbox | `true` | Limita le API disponibili al renderer |
| nodeIntegration | `false` | Impedisce accesso diretto a Node dal renderer |
| enableRemoteModule | `false` | Disabilita il modulo remote deprecato |

---

## Fase 4 – Funzionalità Essenziali

> *Media Controls, Notifiche, System Tray e Global Shortcuts.*

### 4.1 Media Controls

Integrazione con la MediaSession API del sistema operativo per esporre i controlli multimediali nativi (overlay Windows, media keys della tastiera).

#### Azioni supportate

- **Play / Pause** – Toggle riproduzione
- **Next Track** – Brano successivo
- **Previous Track** – Brano precedente

#### Implementazione

Il modulo `mediaController.js` inietta script nel renderer tramite `webContents.executeJavaScript()` per intercettare gli eventi di riproduzione dalla pagina YouTube Music e sincronizzarli con la MediaSession API di Electron.

### 4.2 Notifiche Brano

Quando cambia la canzone in riproduzione, l'applicazione mostra una notifica nativa di Windows contenente:

- **Nome artista**
- **Titolo brano**
- **Copertina album** (scaricata e cachata localmente)

Utilizza l'API `Electron Notification` con supporto per icone personalizzate.

### 4.3 System Tray

Icona nella system tray (area notifiche di Windows) con menu contestuale:

| Azione | Comportamento |
|--------|--------------|
| Play / Pause | Toggle riproduzione del brano corrente |
| Next | Passa al brano successivo |
| Previous | Torna al brano precedente |
| Show App | Ripristina e porta in primo piano la finestra |
| Quit | Chiude completamente l'applicazione |

### 4.4 Global Shortcuts

Shortcut registrati globalmente tramite l'API `globalShortcut` di Electron, attivi anche quando l'app non ha il focus:

| Shortcut | Azione | Configurabile |
|----------|--------|---------------|
| `Ctrl + Alt + P` | Play / Pause | Sì |
| `Ctrl + Alt + N` | Next Track | Sì |
| `Ctrl + Alt + B` | Previous Track | Sì |
| `Ctrl + Alt + M` | Toggle Mini Player | Sì |
| `Ctrl + Alt + Y` | Mostra / Nascondi App | Sì |

---

## Fase 5 – Funzioni Avanzate

> *Rich Presence, Mini Player, Theme Engine, Ad Block UI e Cache Artwork.*

### 5.1 Discord Rich Presence

Integrazione opzionale con Discord tramite la libreria discord-rpc. Mostra lo stato di ascolto nel profilo Discord dell'utente:

- **Stato:** "Listening to..."
- **Dettagli:** Nome brano, artista, album
- **Immagine:** Copertina album (se disponibile)

### 5.2 Mini Player

Finestra compatta (340×130 px) sempre in primo piano con:

- Copertina album in miniatura
- Titolo brano e artista
- Controlli Play/Pause, Next, Previous
- Barra di progresso del brano

Toggle attivabile tramite `Ctrl+Alt+M` o dal menu tray.

### 5.3 Theme Engine

Tre modalità di tema con supporto per CSS custom properties:

- **Light** – Sfondo chiaro, testi scuri
- **Dark** – Sfondo scuro, testi chiari
- **System** – Segue il tema di Windows (nativeTheme API)

Il tema viene iniettato via CSS variables nel renderer e applicato anche al Mini Player.

### 5.4 Ad Block UI (Cosmetico)

Filtraggio cosmetico degli elementi pubblicitari nella pagina YouTube Music tramite DOM injection. Non blocca le richieste di rete, ma nasconde:

- `ad-container` – Container pubblicitari
- `banner` – Banner promozionali
- Elementi overlay e popup promozionali

Implementato tramite `MutationObserver` per gestire elementi caricati dinamicamente.

### 5.5 Cache Artwork

Download e cache locale delle copertine album per uso offline in notifiche e mini player:

- **Percorso:** `{AppData}/cache/artwork/`
- **Formato:** JPEG/PNG, ridimensionate
- **Limite:** 100 MB configurabile
- **Pulizia:** LRU automatica al superamento del limite

---

## Fase 6 – Persistenza Dati

> *Configurazioni utente salvate localmente.*

Tutte le configurazioni sono salvate in `AppData` tramite electron-store in formato JSON:

| Chiave | Tipo | Default |
|--------|------|---------|
| theme | string | `"system"` |
| startMinimized | boolean | `false` |
| minimizeToTray | boolean | `true` |
| closeToTray | boolean | `true` |
| showNotifications | boolean | `true` |
| enableGlobalShortcuts | boolean | `true` |
| enableDiscordRPC | boolean | `false` |
| adBlockUI | boolean | `true` |
| shortcuts | object | (vedi config/settings.json) |
| window | object | 1280×800, centrata |

---

## Fase 7 – Auto Update

> *Sistema di aggiornamento automatico trasparente per l'utente.*

### 7.1 Libreria

`electron-updater` integrato con Electron Builder per distribuzione seamless.

### 7.2 Canali di Distribuzione

- **GitHub Releases** – Hosting primario dei binari
- **Server CDN** – Alternativa per distribuzione ad alto traffico

### 7.3 Flusso di Aggiornamento

1. All'avvio, l'app verifica la disponibilità di aggiornamenti (`checkForUpdates`)
2. Se disponibile, scarica il pacchetto in background (`download`)
3. Notifica l'utente del completamento
4. Al riavvio, installa l'aggiornamento (`quitAndInstall`)

L'utente può anche verificare manualmente dal menu Impostazioni.

---

## Fase 8 – Ottimizzazione Prestazioni

> *Riduzione dell'impatto su RAM e CPU tipico delle app Electron.*

Le applicazioni Electron sono note per il consumo elevato di risorse. Le seguenti ottimizzazioni mitigano il problema:

| Ottimizzazione | Dettaglio |
|----------------|-----------|
| Disabilitare DevTools | In produzione, rimuovere accesso agli strumenti sviluppatore |
| Background Throttling | Limitare l'attività del renderer quando l'app è in background |
| Limitare processi renderer | Un solo processo renderer attivo (no tab multipli) |
| Lazy Loading moduli | Caricare Discord RPC, updater solo quando necessari |
| Cache intelligente | Limitare dimensione cache artwork con policy LRU |
| Garbage Collection | Forzare GC periodico su oggetti DOM iniettati |

---

## Fase 9 – Packaging Windows

> *Build e distribuzione dell'eseguibile .exe per Windows.*

### 9.1 Tool di Build

**Electron Builder** con target NSIS per generare un installer professionale.

### 9.2 Output

- `YouTubeMusicDesktop.exe` – Eseguibile portabile
- `YouTubeMusicDesktopSetup.exe` – Installer con wizard

### 9.3 Funzionalità Installer NSIS

- Icona desktop automatica
- Voce nel menu Start
- Scelta della directory di installazione
- Supporto auto-update integrato
- Disinstallazione pulita con opzione rimozione AppData

---

## Fase 10 – Sicurezza

> *Hardening dell'applicazione Electron contro vulnerabilità comuni.*

### 10.1 Configurazioni Electron

Tutte le best practice di sicurezza Electron sono applicate:

- `contextIsolation: true` – Isola contesto preload dal renderer
- `sandbox: true` – Sandboxing del processo renderer
- `nodeIntegration: false` – Nessun accesso Node.js nel renderer
- `enableRemoteModule: false` – Modulo remote disabilitato

### 10.2 Content Security Policy

Header CSP restrittivo che permette solo connessioni verso i domini YouTube Music:

- `default-src 'self' https://music.youtube.com`
- `script-src 'self' https://music.youtube.com`
- Blocco navigazione verso siti esterni non autorizzati

### 10.3 Validazione Navigazione

Il modulo `windowManager.js` intercetta tutti gli eventi `will-navigate` e `new-window` per impedire la navigazione verso domini non nella whitelist.

---

## Fase 11 – Piano di Test

> *Verifica completa di tutte le funzionalità e monitoraggio prestazioni.*

### 11.1 Test Funzionali

| Area | Test | Priorità |
|------|------|----------|
| Player | Riproduzione, pausa, skip, seek | 🔴 Critico |
| Media Keys | Tastiera multimediale, overlay Windows | 🔴 Critico |
| System Tray | Menu contestuale, doppio click | 🟡 Alto |
| Notifiche | Cambio brano, artwork, click | 🟡 Alto |
| Mini Player | Toggle, controlli, always-on-top | 🟡 Alto |
| Shortcuts | Tutti gli shortcut globali | 🟡 Alto |
| Finestra | Minimize, restore, fullscreen, close-to-tray | 🟢 Medio |
| Temi | Switch light/dark/system | 🟢 Medio |
| Auto Update | Check, download, install | 🟢 Medio |

### 11.2 Monitoraggio Prestazioni

Metriche da monitorare durante i test di performance:

- **CPU** – Utilizzo medio < 5% in idle, < 15% in riproduzione
- **RAM** – Target < 250 MB in riproduzione standard
- **Network** – Nessun traffico non necessario (no telemetria)
- **Startup** – Tempo di avvio < 3 secondi su SSD

---

## Fase 12 – Distribuzione

> *Canali di distribuzione e firma del codice.*

### 12.1 Canali

- **GitHub Releases** – Distribuzione primaria con changelog automatico
- **Sito web dedicato** – Landing page con download diretto

### 12.2 Code Signing

Per evitare warning SmartScreen di Windows, il binario deve essere firmato con un Code Signing Certificate valido:

- Certificato EV (Extended Validation) consigliato per reputazione immediata
- Configurazione in Electron Builder tramite campo `win.certificateFile`
- Timestamp server per validità a lungo termine

---

## Riepilogo Funzionale

> *Checklist completa delle funzionalità del client finale.*

| Funzionalità | Fase | Priorità |
|-------------|------|----------|
| Player completo YouTube Music | Fase 3 | 🔴 Critico |
| Media Keys (tastiera multimediale) | Fase 4 | 🔴 Critico |
| System Tray icon con menu | Fase 4 | 🟡 Alto |
| Notifiche native cambio brano | Fase 4 | 🟡 Alto |
| Global Shortcuts configurabili | Fase 4 | 🟡 Alto |
| Mini Player compatto | Fase 5 | 🟡 Alto |
| Discord Rich Presence | Fase 5 | 🟢 Medio |
| Theme Engine (Light/Dark/System) | Fase 5 | 🟢 Medio |
| Ad Block UI cosmetico | Fase 5 | 🟢 Medio |
| Cache artwork locale | Fase 5 | 🟢 Medio |
| Persistenza configurazioni | Fase 6 | 🟡 Alto |
| Auto Update trasparente | Fase 7 | 🟡 Alto |
| Ottimizzazione RAM/CPU | Fase 8 | 🟡 Alto |
| Installer Windows NSIS | Fase 9 | 🔴 Critico |
| Hardening sicurezza Electron | Fase 10 | 🔴 Critico |
| Code Signing certificato | Fase 12 | 🟡 Alto |
