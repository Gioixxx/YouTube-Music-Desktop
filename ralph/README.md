# Ralph - Sviluppo Autonomo per TobaccoManagement

Sistema di sviluppo autonomo iterativo per il gestionale tabacchi.
Adattato per Windows/PowerShell e progetti .NET WPF.

> **USARE CON CAUTELA** - Ralph esegue modifiche al codice in autonomia.
> Assicurarsi di avere un backup o commit prima di eseguire.

## Come funziona

1. **prd.json** - Definisce le user stories da implementare
2. **progress.txt** - Traccia il lavoro completato tra iterazioni
3. **ralph.ps1** - Esegue Claude in loop fino al completamento del PRD
4. **ralph-once.ps1** - Esegue una singola iterazione

## Utilizzo

### Singola iterazione
```powershell
cd ralph
.\ralph-once.ps1
```

### Loop completo (N iterazioni)
```powershell
cd ralph
.\ralph.ps1 -Iterations 10
```

## Struttura PRD

```json
{
  "project": "TobaccoManagement",
  "branchName": "ralph/feature-name",
  "description": "Descrizione della feature",
  "userStories": [
    {
      "id": "US-001",
      "title": "Titolo storia",
      "description": "Come [utente], voglio [feature] per [beneficio]",
      "acceptanceCriteria": ["Criterio 1", "Criterio 2", "Build passa"],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

## Regole importanti

1. **Una storia per iterazione** - Ralph lavora su una sola user story alla volta
2. **Storie piccole** - Ogni storia deve essere completabile in una sessione
3. **Ordine dipendenze** - Le storie devono essere ordinate: Domain > Infrastructure > Application > UI
4. **Build obbligatorio** - Ogni iterazione deve verificare che il build passi

## Skills disponibili

- `skills/prd.md` - Template per creare PRD strutturati
- `skills/prd-to-ralph.md` - Guida per convertire PRD in formato Ralph

## Credits

Basato sul lavoro di Matt Pocock e la community.
Adattato per progetti .NET WPF su Windows.
