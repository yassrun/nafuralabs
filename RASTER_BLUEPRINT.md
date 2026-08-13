# Blueprint — Raster

**Statut :** figé (2026-08-13)  
**Raster** = comment on **orchestre le travail** (lot · sous-lot · task). Vit **seul** (compta, perso…). Peut se **brancher** sur Pact : [`PACT_BLUEPRINT.md`](PACT_BLUEPRINT.md).  
Contrat agents : [`raster/AGENTS.md`](raster/AGENTS.md).

---

## Raster est un projet

`nafuralabs/` = dossier de **projets**. **`raster/`** n’est pas un moteur hors-projet : c’est le **projet Raster**.

| Dossier | Rôle |
|---------|------|
| **`raster/`** | Projet Raster (app + moteur INDEX / Sprint / CLI) |
| **`<projet>/raster-src/`** | Fichiers Raster de **ce** projet — **obligatoire** (y compris `raster/raster-src/`) |
| **`<projet>/pact/`** | Pact — **si app ou site** |
| **`<projet>/ops/`** | Ops — **obligatoire si Pact** — [`OPS_BLUEPRINT.md`](OPS_BLUEPRINT.md) |

```text
nafuralabs/
├── raster/                         # projet Raster
│   ├── raster-src/                 # lots · sous-lots · tasks
│   ├── pact/
│   └── ops/
├── nafura-platform/
│   ├── raster-src/
│   ├── pact/
│   └── ops/                        # infra lab (cluster, IAM, Vault, nlops)
├── sektor/
│   ├── raster-src/
│   ├── pact/
│   └── ops/                        # overlay / images Sektor seulement
└── compta/
    └── raster-src/
```

Canon tasks : `<projet>/raster-src/lots/…/tasks/*.md`.  
Legacy encore indexé : `<projet>/raster/lots/` · `products/<app>/docs/specs/lots/`.

---

## Vocabulaire

Raster **prend** : **lot · sous-lot · task**.

| | Rôle | `done` ? |
|--|------|----------|
| **Lot** | Chapeau vivant | **jamais** |
| **Sous-lot** | Groupe de tasks | oui ⇔ **toutes** ses tasks `done` |
| **Task** | Seule unité sprintable | oui, une par une |

Parent des tasks = le **sous-lot**, pas le lot.

### Projection Pact (si branché) — mapping, pas identité

| Raster | ← | Pact |
|--------|---|------|
| lot | | **socle** ou **BC** |
| sous-lot | | **change** (`INIT` / `EVOL` / …) |
| task | | work du change |

Phrase : *on ouvre un EVOL sur le BC RH ; Raster le projette en sous-lot.*

`EVOL` / `INIT` (côté Pact) : task obligatoire `update SPEC + UX`. Sans elle, le sous-lot ne passe pas `done`.  
`CORRECTION` / `TECHNICAL` : pas cette task.

---

## Mécanisme

```text
sektor
└── rh                                    # LOT — jamais done
    ├── CH-00-INIT-referentiel-temps      # sous-lot
    │   ├── SEKTOR-20  fiche employé
    │   ├── SEKTOR-21  congés
    │   ├── SEKTOR-22  planning
    │   └── SEKTOR-23  pointage
    ├── CH-01-EVOL-justificatif-maladie
    │   ├── SEKTOR-24-update-spec-ux      # obligatoire si EVOL
    │   └── SEKTOR-25-code
    └── CH-02-CORRECTION-pointage-double
        └── SEKTOR-26
```

`CH-00` → `done` seulement si 20–23 sont `done`. `rh` reste le chapeau.

### Ce que Raster indexe

| | Backlog / Sprint ? |
|--|-------------------|
| **Task** | oui |
| **Lot / sous-lot** | chapeaux d’arbre, pas sprintables |
| SPEC, PLAN, canvas | **non** — Pact |

Arbre Backlog = projet → lot → (sous-lot) → tasks.

Raster **synchronise** : scan `**/raster-src/lots/**/tasks/*.md` → INDEX / Sprint / Backlog. Il ne possède pas les tasks.

| Source | Comment |
|--------|---------|
| Inbox | `raster/inbox.md` → promote vers un lot du projet |
| Agent | écrit lot / sous-lot / task **sur le projet** |
| Fichier créé | visible au **sync** |

- Sprint = `sprint:` sur une **task** seulement.  
- `type:` **spec** (contrat) · **feature** / **bug** (runnable) · **physical**. DOR/DOD dans `pact/work/SPEC.md`.  
- `review` = QA (feature/bug) ; `done` = **me**.  
- Status au Check progress (à deux).  
- Pas d’`estimate`.  
- IDs par projet (`SEKTOR`, `RAS`, `PLT`, `OPS`, …).  
- `done` → archive projet.

Walker : tout `<projet>/raster-src/lots/` (peers, y compris `raster/raster-src/`).
