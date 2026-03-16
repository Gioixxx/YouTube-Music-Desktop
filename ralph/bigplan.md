# Big Plan - TobaccoManagement Roadmap

Visione generale delle feature da implementare nel gestionale tabacchi.
Ogni sezione puo diventare un PRD separato per Ralph.

---

## Visione del Prodotto

**Obiettivo:** Creare il gestionale piu completo e intuitivo per tabaccherie italiane,
con focus su automazione, conformita normativa e analisi dati.

**Target:** Tabaccherie singole e catene di tabaccherie in Italia.

---

## Legenda Priorita

| Simbolo | Significato |
|---------|-------------|
| 🔴 | Critico - Funzionalita core |
| 🟠 | Alta - Valore aggiunto importante |
| 🟡 | Media - Nice to have |
| 🟢 | Bassa - Miglioramenti futuri |

---

## FASE 1: Notifiche e Avvisi 🔴

**Branch:** `ralph/notifications-system`
**Stato:** Completato
**Complessita:** Media (7 user stories)

### Obiettivo
Sistema di notifiche proattivo per avvisare l'utente di eventi importanti.

### User Stories
- [x] PRD creato
- [x] Modello Notification nel Domain
- [x] Repository e Service notifiche
- [x] NotificationViewModel
- [x] Icona campana nella toolbar con badge
- [x] Popup lista notifiche
- [x] Generazione automatica notifiche scorte basse
- [x] Check notifiche all'avvio

### Considerazioni Tecniche
- Usare pattern Observer per notifiche real-time
- Persistenza notifiche su SQLite
- Cleanup automatico notifiche vecchie (>30 giorni)

---

## FASE 2: Reportistica Avanzata 🔴

**Branch:** `ralph/advanced-reports`
**Stato:** Completato
**Complessita:** Alta (12-15 user stories)

### Obiettivo
Dashboard analitica con report dettagliati per decisioni informate.

### User Stories

**Report Vendite:**
- [x] Report vendite giornaliero con totali e dettagli
- [x] Report vendite settimanale con confronto settimana precedente
- [x] Report vendite mensile con trend
- [x] Report vendite per categoria prodotto
- [x] Report vendite per fascia oraria

**Grafici e Visualizzazioni:**
- [x]Grafico andamento vendite (linea temporale)
- [x] Grafico a torta categorie prodotti
- [x] Grafico confronto periodi
- [x] Heatmap vendite per giorno/ora

**Export:**
- [x] Export PDF report con logo tabaccheria
- [x] Export Excel per elaborazioni esterne
- [x] Stampa diretta report

**Analisi:**
- [x] Top 10 prodotti piu venduti
- [x] Prodotti con margine maggiore
- [x] Prodotti in calo vendite
- [x] Analisi stagionalita

### Considerazioni Tecniche
- Usare LiveCharts2 o OxyPlot per grafici WPF
- Cache report pesanti per performance
- Background worker per generazione report

---

## FASE 3: Sistema di Backup 🔴

**Branch:** `ralph/backup-system`
**Stato:** Completato
**Complessita:** Media (6-8 user stories)

### Obiettivo
Protezione dati con backup automatici e ripristino semplice.

### User Stories

**Backup Locale:**
- [x] Backup manuale database su richiesta
- [x] Backup automatico giornaliero
- [x] Configurazione cartella backup
- [x] Rotazione backup (mantieni ultimi N)

**Backup Cloud:**
- [x] Integrazione OneDrive
- [x] Integrazione Google Drive
- [x] Sync automatico su cloud
- [x] Notifica backup completato/fallito

**Ripristino:**
- [x] Lista backup disponibili
- [x] Preview contenuto backup
- [x] Ripristino da backup selezionato
- [x] Ripristino da cloud

**Scheduling:**
- [x] Configurazione orario backup automatico
- [x] Backup pre-aggiornamento app
- [x] Log storico backup

### Considerazioni Tecniche
- SQLite backup via File.Copy o SQL VACUUM INTO
- API OneDrive/Google Drive per cloud
- Background service per scheduling
- Compressione ZIP backup

---

## FASE 4: Sincronizzazione Catalogo ADM 🔴

**Branch:** `ralph/adm-sync`
**Stato:** In corso
**Complessita:** Media

### Obiettivo
Aggiornamento automatico dei prezzi e dei nuovi prodotti dal listino ufficiale ADM o Logista.

### User Stories

**Parser Listino:**
- [x] Parser file Excel/CSV listino ufficiale ADM
- [x] Parser PDF listino Logista (PdfLogistaParserService)
- [ ] Mapping automatico prodotti esistenti via Codice AAMS
- [ ] Aggiornamento massivo prezzi di vendita
- [ ] Log variazioni di prezzo per l'utente
- [ ] Rilevamento nuovi prodotti inseriti a catalogo

**Download Automatizzato:**
- [x] Download listino Logista con credenziali
- [x] Salvataggio PDF listino scaricato
- [x] Import listino da file Excel/PDF
- [ ] Scheduling download automatico listino

---

## FASE 5: Gestione Gratta e Vinci e Valori 🔴

**Branch:** `ralph/scratch-cards`
**Stato:** Pianificato
**Complessita:** Alta

### Obiettivo
Gestione completa del magazzino e vendite per Gratta e Vinci e valori bollati.

### User Stories
- [x] Carico pacchi Gratta e Vinci (Codice pacco/range)
- [x] Attivazione pacchi e tracciamento vendite singole
- [x] Registrazione vincite pagate in cassa
- [x] Inventario fisico pacchi aperti/chiusi
- [x] Gestione valori bollati (marche da bollo, francobolli)

---

## FASE 6: Gestione Cassa e Chiusure 🔴

**Branch:** `ralph/cash-management`
**Stato:** In corso (Vendita base implementata)
**Complessita:** Media

### Obiettivo
Gestione completa fondo cassa, chiusure e quadratura.

### User Stories

**Vendita Base:**
- [x] Interfaccia vendita con lettura barcode
- [x] Ricerca prodotto e visualizzazione prezzo
- [x] Registrazione vendita con aggiornamento giacenza
- [x] Storico vendite giornaliere
- [x] Totali giornalieri

**Fondo Cassa:**
- [ ] Configurazione fondo cassa iniziale
- [ ] Apertura cassa giornaliera
- [ ] Prelievi e versamenti con causale
- [ ] Visualizzazione saldo cassa teorico

**Chiusura Giornaliera:**
- [ ] Wizard chiusura di cassa
- [ ] Conteggio fisico per taglio (monete, banconote)
- [ ] Calcolo differenza teorico/reale
- [ ] Note chiusura

**Report Cassa:**
- [ ] Storico chiusure
- [ ] Report differenze cassa
- [ ] Analisi trend differenze
- [ ] Export chiusure per commercialista

**Multi-operatore:**
- [ ] Chiusura per operatore
- [ ] Cambio turno con passaggio cassa
- [ ] Report per operatore

### Considerazioni Tecniche
- Entity CashSession per apertura/chiusura
- Entity CashMovement per prelievi/versamenti
- Blocco vendite senza cassa aperta (opzionale)

---

## FASE 7: Sicurezza e Audit Avanzato 🟠

**Branch:** `ralph/security-audit`
**Stato:** Completato
**Complessita:** Media

### Obiettivo
Controllo accessi granulare e tracciabilità totale delle operazioni sensibili.

### User Stories

**Autenticazione:**
- [x] Gestione Utenti (Create, Read, Update, Disable)
- [x] Gestione Ruoli (Amministratore, Operatore, Visualizzatore)
- [x] Permessi specifici per cancellazione vendite/modifica prezzi
- [x] Login con protezione e cambio password
- [x] Timeout sessione automatica

**Audit:**
- [x] Tracciamento operazioni sensibili (AuditLog)
- [x] Audit log visualizzabile in UI con filtri
- [x] Associazione UserId ai log per accountability

### Considerazioni Tecniche
- Entity User con ruoli e permessi
- Enum Permission per permessi granulari
- Entity AuditLog per tracciamento operazioni
- Middleware/Service per logging automatico

---

## FASE 8: Gestione Fornitori 🟠

**Branch:** `ralph/suppliers-management`
**Stato:** In corso (Logista implementato)
**Complessita:** Media (8-10 user stories)

### Obiettivo
Gestione completa fornitori con storico ordini e riordino intelligente.

### User Stories

**Ordini Logista:**
- [x] Download listino PDF da portale Logista
- [x] Parser PDF listino per estrazione prodotti
- [x] Creazione ordine da listino scaricato
- [x] Storico ordini per fornitore
- [x] Stato ordine (bozza, inviato, ricevuto, parziale)
- [x] Download fattura ordine da portale
- [x] Salvataggio PDF fattura associato all'ordine
- [x] View per gestione ordini Logista

**Suggerimenti Riordino:**
- [x] Calcolo stock di sicurezza dinamico
- [x] Analisi storico vendite per previsione domanda
- [x] Servizio suggerimento ordini automatico
- [x] Visualizzazione suggerimenti in UI

**CRUD Fornitori (Generico):**
- [ ] Anagrafica fornitore (nome, P.IVA, contatti, note)
- [ ] Lista fornitori con ricerca e filtri
- [ ] Dettaglio fornitore con storico
- [ ] Import fornitori da CSV

**Associazioni:**
- [ ] Associazione prodotti-fornitori (molti a molti)
- [ ] Prezzo di acquisto per fornitore
- [ ] Fornitore preferito per prodotto
- [ ] Tempi di consegna stimati

**Automazione:**
- [ ] Generazione automatica ordine da suggerimenti
- [ ] Alert prodotti da riordinare

### Considerazioni Tecniche
- Relazione molti-a-molti Product-Supplier
- Entity per Order e OrderItem
- Integrazione con sistema notifiche

---

## FASE 9: Gestione Resi e Scarti 🟠

**Branch:** `ralph/returns-management`
**Stato:** Pianificato
**Complessita:** Bassa

### Obiettivo
Gestione formale dei prodotti resi ai fornitori o scartati.

### User Stories
- [ ] Registrazione reso a fornitore (es. tabacchi danneggiati)
- [ ] Gestione scarti per fine validità o pacchi invendibili
- [ ] Movimentazione stock negativa dedicata
- [ ] Report periodico resi per contabilità

---

## FASE 10: Gestione Clienti e Fidelizzazione 🟠

**Branch:** `ralph/customers-loyalty`
**Stato:** Pianificato
**Complessita:** Alta (10-12 user stories)

### Obiettivo
Sistema di fidelizzazione clienti con punti e promozioni.

### User Stories

**Anagrafica Clienti:**
- [ ] CRUD cliente (nome, telefono, email, note)
- [ ] Tessera fedelta con codice/barcode
- [ ] Storico acquisti per cliente
- [ ] Preferenze cliente

**Sistema Punti:**
- [ ] Configurazione regole accumulo punti
- [ ] Accumulo automatico punti su vendita
- [ ] Visualizzazione saldo punti
- [ ] Storico movimenti punti

**Premi e Promozioni:**
- [ ] Catalogo premi riscattabili
- [ ] Riscatto premio con punti
- [ ] Promozioni temporanee (2x punti, sconto)
- [ ] Promozioni per categoria/prodotto

**Comunicazione:**
- [ ] Export lista clienti per marketing
- [ ] Segmentazione clienti (top spender, dormienti)
- [ ] Template messaggi promozionali

### Considerazioni Tecniche
- Entity Customer con relazione a Sales
- Entity LoyaltyTransaction per movimenti punti
- Privacy: consenso GDPR per dati cliente

---

## FASE 11: Integrazione Bilancia e Dispositivi 🟡

**Branch:** `ralph/hardware-integration`
**Stato:** Futuro
**Complessita:** Alta

### Obiettivo
Integrazione con hardware comune in tabaccheria.

### User Stories

**Bilancia:**
- [ ] Lettura peso da bilancia seriale
- [ ] Calcolo prezzo prodotti a peso
- [ ] Calibrazione bilancia

**Lettore Barcode:**
- [ ] Supporto scanner USB/seriale
- [ ] Ricerca prodotto da barcode
- [ ] Aggiunta rapida a vendita

**Stampante Scontrini:**
- [ ] Configurazione stampante termica
- [ ] Stampa scontrino vendita
- [ ] Stampa report su stampante termica

**Cassetto Cassa:**
- [ ] Apertura automatica cassetto
- [ ] Apertura manuale con log

### Considerazioni Tecniche
- Comunicazione seriale (System.IO.Ports)
- Driver stampante ESC/POS
- Astrazione hardware per testabilita

---

## FASE 12: Integrazione Fatturazione Elettronica 🟠

**Branch:** `ralph/e-invoicing`
**Stato:** In corso
**Complessita:** Alta

### Obiettivo
Generazione fatture elettroniche e corrispettivi telematici.

### User Stories

**Autenticazione AdE:**
- [x] Autenticazione Fisconline a 6 step
- [x] Gestione sessione con timeout
- [x] Token B2B per API successive

**Download Fatture:**
- [x] Download lista fatture ricevute
- [x] Download lista fatture emesse
- [x] Download file XML/P7M fattura
- [x] Download metadati e notifiche SDI
- [x] Parsing XML fattura (FatturaPaParserService)
- [x] View per visualizzazione fatture AdE

**Fatture Elettroniche:**
- [ ] Generazione XML FatturaPA
- [ ] Validazione XML pre-invio
- [ ] Invio a SDI (tramite intermediario)
- [ ] Ricezione notifiche SDI
- [ ] Conservazione digitale a norma

**Corrispettivi Telematici:**
- [ ] Integrazione RT (Registratore Telematico)
- [ ] Invio corrispettivi giornalieri
- [ ] Gestione anomalie invio
- [ ] Storico invii

**Anagrafica Fiscale:**
- [x] Dati fiscali tabaccheria (ShopProfile)
- [x] Gestione aliquote IVA
- [ ] Codici natura IVA
- [ ] Ritenute e contributi

### Considerazioni Tecniche
- Libreria per generazione XML FatturaPA
- Certificati digitali per firma
- Integrazione con intermediario SDI (Aruba, Infocert)
- Normativa AAMS per tabacchi

---

## FASE 13: Multi-Negozio 🟡

**Branch:** `ralph/multi-store`
**Stato:** Futuro
**Complessita:** Molto Alta

### Obiettivo
Gestione centralizzata di piu punti vendita.

### User Stories

**Gestione Negozi:**
- [ ] Anagrafica punto vendita
- [ ] Configurazione per negozio (listini, soglie)
- [ ] Dashboard multi-negozio
- [ ] Switch rapido tra negozi

**Inventario Distribuito:**
- [ ] Giacenze per negozio
- [ ] Trasferimenti tra negozi
- [ ] Richieste di trasferimento
- [ ] Storico movimenti inter-negozio

**Report Consolidati:**
- [ ] Vendite aggregate tutti i negozi
- [ ] Confronto performance negozi
- [ ] Classifica negozi per fatturato
- [ ] Report per singolo negozio

**Sincronizzazione:**
- [ ] Database centralizzato o sync
- [ ] Gestione conflitti
- [ ] Modalita offline

### Considerazioni Tecniche
- Architettura: DB centrale vs sync P2P
- Considerare migrazione a SQL Server
- API REST per comunicazione
- Gestione conflitti merge

---

## FASE 14: App Mobile Companion 🟢

**Branch:** `ralph/mobile-app`
**Stato:** In corso (Backend parziale)

### Obiettivo
App mobile per monitoraggio e operazioni base da remoto.

### User Stories

**Backend Mobile:**
- [x] Entity MobileDevice per gestione dispositivi
- [x] MobileDeviceRepository per persistenza
- [ ] API per registrazione dispositivo
- [ ] Notifiche push (backend)

**Frontend Mobile:**
- [ ] Dashboard vendite real-time
- [ ] Notifiche push scorte basse
- [ ] Consultazione giacenze
- [ ] Approvazione ordini fornitori
- [ ] Report giornaliero push

---

## FASE 15: Intelligenza Artificiale e Previsioni 🟢

**Branch:** `ralph/ai-forecasting`
**Stato:** In corso (Parzialmente implementato)

### Obiettivo
Previsioni intelligenti per ottimizzare gestione.

### User Stories

**Previsione Vendite:**
- [x] Calcolo stock di sicurezza dinamico
- [x] Analisi storico vendite (OrderHistoryAnalysisService)
- [x] Previsione domanda con algoritmi di smoothing
- [x] Suggerimento quantità riordino ottimale
- [ ] Previsione vendite prossima settimana

**Machine Learning:**
- [ ] Identificazione anomalie vendite
- [ ] Clustering clienti automatico
- [ ] Ottimizzazione prezzi

---

## FASE 16: Documentazione e Assistente IA 🔴

**Branch:** `ralph/doc-ai-integration`
**Stato:** In corso
**Complessita:** Media (6 user stories)

### Obiettivo
Integrare i file di documentazione Markdown nell'app e usarli come base di conoscenza per l'IA.

### User Stories
- [x] PRD aggiornato con US-043 e US-044
- [x] Integrazione LLamaSharp per modello locale GGUF (US-040)
- [x] UI dialog per configurazione modello locale (US-041)
- [x] Download modello GGUF consigliato (US-042)
- [x] Visualizzatore Markdown WPF (Markdig)
- [x] HelpViewModel e navigazione sidebar
- [x] DocumentationPlugin per Semantic Kernel (RAG)
- [x] Test risposte IA basate su doc
- [x] Spiegazione IA in linguaggio naturale dei suggerimenti ordine (US-045)
- [x] Sintesi esecutiva IA del report vendite (US-046)
- [x] Suggerimenti automatici eventi calendario da pattern ordini (US-047)
- [ ] Helpdesk contestuale basato sulla schermata attiva (US-048)

---

## Roadmap Suggerita

```
2025:    Fasi 1-3 (Notifiche, Report, Backup) - COMPLETAMENTO
2026 Q1: Fasi 4-7 (ADM Sync, Gratta e Vinci, Cassa base, Sicurezza)
2026 Q2: Fasi 8-10 (Fornitori, Fatturazione, AI Previsioni)
2026 Q3: Fasi 11-12 (Hardware, Fatturazione avanzata)
2026+:   Fasi 13-16 (Multi-negozio, Mobile, Documentazione IA)
```

---

## Note Tecniche Generali

### Stack Tecnologico
- **Frontend:** WPF con MVVM (CommunityToolkit.Mvvm)
- **Database:** SQLite (locale) / SQL Server (multi-negozio)
- **ORM:** Entity Framework Core
- **Report:** QuestPDF, LiveCharts2
- **Hardware:** System.IO.Ports, ESC/POS

### Principi di Sviluppo
1. **SOLID** - Codice manutenibile e testabile
2. **DRY** - Riutilizzo tramite servizi condivisi
3. **KISS** - Semplicita prima di tutto
4. **Mobile-first thinking** - UI responsive e touch-friendly

### Conformita e Normative
- **GDPR** - Gestione dati clienti
- **AAMS** - Normativa tabacchi e valori bollati
- **Agenzia Entrate** - Fatturazione elettronica e corrispettivi
