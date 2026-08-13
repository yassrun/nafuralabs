# Blueprint — framework agentique & Raster

**Statut :** figé (2026-08-13)  
**Discussion :** [`FRAMEWORK_VISION_STRUCTURE_V0.md`](FRAMEWORK_VISION_STRUCTURE_V0.md)  
**Framework agentique :** [`FRAMEWORK_DEVELOPPEMENT_AGENTIQUE_SPEC_DRIVEN_V1.md`](FRAMEWORK_DEVELOPPEMENT_AGENTIQUE_SPEC_DRIVEN_V1.md)

### Décisions figées (extrait)

- Raster ≠ framework. Raster = **lot · sous-lot · task**. Sous-lot Raster = **CH**.
- Lot = chapeau, **jamais `done`**. Sous-lot `done` ⇔ toutes ses tasks `done`.
- **`EVOL` : task obligatoire `update SPEC + UX`.** Sans elle, le sous-lot ne passe pas `done`.
- `INIT` : même obligation à la création. `CORRECTION` / `TECHNICAL` : pas cette task.

---

## 0. Deux systèmes — ne pas confondre

| | **Framework de dev agentique** | **Raster** |
|--|-------------------------------|------------|
| Rôle | Comment on **spécifie et change** le logiciel (contrat, CH, preuves) | Comment on **orchestre le travail** (backlog, sprint, scan) |
| Vocabulaire | SPEC, CH (`INIT`/`EVOL`/`CORRECTION`), canvas | **Lot · sous-lot · task** |
| Branchement | Lot framework → lot Raster (chapeau, **jamais done**). **CH** (`INIT`/`EVOL`/`CORRECTION`) → **sous-lot Raster** (parent des tasks). Task = task. |

Raster n’est **pas** le framework.  
**Sous-lot Raster ≠ sous-lot-contrat** du framework (celui-là est rare, autre SPEC). Ici : sous-lot Raster = **un CH**.

---

## 1. Vocabulaire

| Mot | Sens |
|-----|------|
| **SPEC** | Le **contrat**. Un document. Ce que l’app (ou le lot) fait, pour métier, testeurs, devs, agents. |
| **Lot** | Frontière durable. Cadrage / Socle / BC métier. = dossier + `SPEC.md`. |
| **Sous-lot** | Autre **contrat** dans un lot, seulement si flux indépendants (3 critères). Pas un sous-menu. |
| **CH** | Changement (`INIT` / `EVOL` / `CORRECTION`). Le devenir. |
| **Task** | Travail vérifiable. Le faire. Seule unité sprintable. |
| **Canvas** | Flux UX (états). **Pas** le contrat. |
| **Nav** | Carte des lots (1 item top-level = 1 lot métier). Sous-menus ≠ sous-lots. |

**SPEC = être · CH = devenir · TASK = faire.**  
Git = historique. Pas de numéro de version dans la SPEC.

---

## 2. Une app

```text
Cadrage [FRAMING]     → contrat de l’app (carte des lots, flux inter-lots)
Socle   [FOUNDATION]  → shell : nav, topbar, dashboard, admin, auth locale / PLATFORM
Lots    [BUSINESS]    → bounded contexts
```

Surfaces back / front / mobile = **la même app** (sauf autre cadrage).  
Dashboard, navbar, topbar, admin = **Socle**, pas des lots métier.  
Pilotage / analytics = **vues** (lecture), pas un BC.

Ajouter un BC : d’abord `EVOL` du Cadrage, puis `INIT` du lot.

---

## 3. Arbre d’un lot

```text
<projet>/raster/lots/<lot>/
├── SPEC.md                          # contrat — unique SSOT du lot
├── ux/                              # flux — hors contrat
│   └── <sous-menu>-wireframe.canvas.tsx
├── CH-00-INIT-<slug>/
│   ├── 00-PLAN.md
│   └── tasks/
│       ├── {ID}-update-spec-ux.md     # OBLIGATOIRE (crée SPEC + canvas)
│       └── {ID}-….md
├── CH-01-EVOL-<slug>/
│   ├── 00-PLAN.md
│   └── tasks/
│       ├── {ID}-update-spec-ux.md     # OBLIGATOIRE
│       └── {ID}-….md
├── CH-02-CORRECTION-<slug>/
│   ├── 00-PLAN.md
│   └── tasks/
└── CH-03-TECHNICAL-<slug>/
    ├── 00-PLAN.md
    └── tasks/
```

Pas de `tasks/` à la racine du lot. Pas de ticket `kind: lot`.

Sous-lot (rare) : même forme, sous `<lot>/<sous-lot>/` avec **son** `SPEC.md`.

---

## 4. Types de CH

| Type | SPEC | Code | C’est quoi |
|------|------|------|------------|
| `INIT` | **crée** `SPEC.md` | souvent oui | première vérité |
| `EVOL` | **patch** **toujours** | oui | le contrat change |
| `CORRECTION` | **non** | oui | le code rattrape une SPEC déjà juste |
| `TECHNICAL` | **non** | oui | refonte / perf / stack — **même** comportement |

Oubli de règle = **`EVOL`**. Bug qui change une règle = **`EVOL`**.  
Bug d’écart code ↔ SPEC = **`CORRECTION`**.  
Rename module, extraire un service, migrer Angular, sans changer une règle = **`TECHNICAL`**.

Si la « refonte » change un invariant / un flux métier → ce n’est plus technique, c’est un **`EVOL`**.

**Tout `EVOL` a forcément une task** `update SPEC + UX` (une task, les deux) :

- patch `SPEC.md` (le contrat change **toujours**)
- mettre à jour le(s) canvas du flux touché ; si aucun écran ne bouge → AC UX = *inchangé* (c’est tranché, pas oublié)

Sans cette task, le sous-lot EVOL **ne peut pas** passer `done`.  
`INIT` : la même obligation à la création (`SPEC.md` + canvas).  
`CORRECTION` / `TECHNICAL` : **pas** cette task (SPEC inchangée).

(Plus tard, même famille : `COMPLIANCE`, `RETIREMENT` — framework V1.)

---

## 5. Ce que raconte la SPEC (contrat)

Un fichier. Pas un dossier de chapitres.

1. Intention  
2. Ce que l’app fait  
3. Limites (`owns` / `not_owns`)  
4. Intervenants (rôles métier)  
5. Données (objets, id, obligations)  
6. États (transitions autorisées)  
7. Règles (`INV-n`, `R-n`) — **validateurs inclus**  
8. Liens (`publie` / `consomme`)

**Pas dans la SPEC :** stack, SQL, tickets, sprint, historique CH, pixels, **wireframes**.  
La SPEC **pointe** vers `ux/*.canvas.tsx`. Conflit canvas ↔ SPEC → **SPEC**.

Sous-menus (nav) = découpage d’écran du **même** contrat. Ex. RH : Employés, Congés, Planning, Pointage → **1 SPEC**, 4 canvas.

---

## 6. Nav = lots

1 entrée top-level par lot métier. Socle = dashboard + admin (souvent topbar).  
Raccourci UX (ex. heures sur fiche chantier) ≠ 2ᵉ owner.

---

## 7. Raster (orchestrateur — pas le framework)

Raster **prend** : **lot · sous-lot · task**.

| Raster | Framework | Done ? |
|--------|-----------|--------|
| **Lot** (ex. RH) | le lot | **jamais** — chapeau vivant des sous-lots |
| **Sous-lot** | le **CH** (`INIT` / `EVOL` / `CORRECTION` / `TECHNICAL`) | **oui** ⇔ **toutes** ses tasks `done` |
| **Task** | la task | oui, une par une |

Parent des tasks = le sous-lot (l’évol / l’init / la correction), **pas** le lot RH.

```text
sektor
└── rh                                    # LOT — chapeau, jamais done
    ├── CH-00-INIT-referentiel-temps      # sous-lot Raster
    │   ├── SEKTOR-20  fiche employé
    │   ├── SEKTOR-21  congés
    │   ├── SEKTOR-22  planning
    │   └── SEKTOR-23  pointage
    ├── CH-01-EVOL-justificatif-maladie   # sous-lot Raster
    │   ├── SEKTOR-24-update-spec-ux      # obligatoire
    │   └── SEKTOR-25-code-justificatif
    └── CH-02-CORRECTION-pointage-double  # sous-lot Raster
        └── SEKTOR-26
```

`CH-00` → `done` seulement si 20, 21, 22, 23 sont `done`.  
`rh` reste le chapeau.

| Chemin | Rôle |
|--------|------|
| `raster/` **racine** | Scan + INDEX + Sprint + Backlog + CLI |
| `<projet>/raster/` | Fichiers du projet (tout projet NafuraLabs, IT ou non) |

**Tout projet** a des lots → (sous-lots ?) → tasks. Ex. `accounting/` comme Sektor.

Raster **synchronise** : il scanne `**/raster/lots/**/tasks/*.md` et régénère le backlog. Il ne possède pas les tasks.

| Source | Comment |
|--------|---------|
| Capture / inbox | promote → task **sur le projet** |
| Agent / prompt | écrit lot / sous-lot / task **sur le projet** |
| Fichier créé sur le projet | visible au **sync** |

### Ce que Raster indexe

| | Backlog / Sprint ? |
|--|-------------------|
| **Task** | oui — seule unité sprintable |
| **Lot / sous-lot** | chapeaux d’arbre (chemin), pas sprintables |
| SPEC, PLAN de CH, canvas | **non** — framework |

Arbre Backlog = projet → lot → (sous-lot) → tasks.

```text
accounting
└── fiscal
    └── ACC-12  task
sektor
└── rh
    └── SEKTOR-12  task
```

Walker : tout `<projet>/raster/lots/` (peer racine ou `products/<app>/`).  
`raster/` racine = orchestrateur, **pas** un projet scanné.

- Sprint = `sprint:` sur une **task** seulement.  
- Status au Check progress (à deux).  
- Pas d’`estimate`.  
- IDs par projet (`SEKTOR`, `PLT`, `ACC`, …).  
- Inbox : `raster/inbox.md` → promote vers un lot du projet.  
- `done` → archive projet.

---

## 8. Exemple RH (Sektor)

Lot unique. Pas de sous-lot tant que le contrat tient.

```text
sektor/raster/lots/rh/
├── SPEC.md
├── ux/
│   ├── employes-contrats-wireframe.canvas.tsx
│   ├── conges-wireframe.canvas.tsx
│   ├── planning-equipes-wireframe.canvas.tsx
│   └── pointage-wireframe.canvas.tsx
└── CH-00-INIT-referentiel-temps/
    ├── 00-PLAN.md
    └── tasks/
```

Nav : **RH** (employés, congés, planning, pointage) · **Paie** à part.  
Pointage = master RH ; Chantier = vue heures (consomme).

---

## 9. Platform

`nafura-platform/` à la racine. Consommation **hybride** : API + packages `contracts-*` / `client-*` / `ui-*`.  
Monorepo polyrepo-ready. Pas de `nafuralabsv2/`. Strangler : nouveau chemin, move, puis drop legacy `platform/`.
