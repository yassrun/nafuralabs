# Vision structure — framework agentique Nafura

**Statut :** brouillon de discussion  
**Canon figé :** [`PACT_BLUEPRINT.md`](PACT_BLUEPRINT.md) · [`RASTER_BLUEPRINT.md`](RASTER_BLUEPRINT.md) · vision workspace [`NAFURALABS.md`](NAFURALABS.md)  
**Brand (travail) :** **Pact** = framework · Raster = orchestrateur.  
**Lié à :** [`FRAMEWORK_DEVELOPPEMENT_AGENTIQUE_SPEC_DRIVEN_V1.md`](FRAMEWORK_DEVELOPPEMENT_AGENTIQUE_SPEC_DRIVEN_V1.md)  
**Date :** 2026-08-12

---

## 1. Décisions figées (session)

1. Aucun code sans spécification de changement approuvée.
2. **Lot Cadrage** = premier lot obligatoire de toute application (type `FRAMING`).
3. **Lot Socle** = deuxième lot obligatoire (type `FOUNDATION`, capacités transverses).
4. Puis lots métier = bounded contexts (`BUSINESS`).
5. Le Cadrage est un **lot vivant** : il subit des changements (`INITIALIZATION`, `EVOLUTION`, …).
6. Ajouter un BC (ex. HSE) = d’abord `EVOLUTION` du Cadrage, puis `INITIALIZATION` du lot métier.
7. Le Cadrage **n’a pas** à connaître tous les BC dès V1 — carte partielle + `TBD` OK.
8. **Éviter** le modèle actuel : produits qui consomment la platform via SDK monorepo in-process (`project(":platform:…")` / path aliases TS couplés).
9. **`nafura-platform` devient un produit pair**, au même niveau que Sektor et les autres apps.
10. **Tout projet** possède **`raster-src/`** (lots / tasks) — **obligatoire**. **`pact/`** seulement si app ou site.
11. Consommation platform = **hybride** : **API** + **packages versionnés** (`contracts-*` / `client-*` / `ui-*`).
12. **Monorepo polyrepo-ready** aujourd’hui ; **1 repo git / produit = option post-découplage**, pas prérequis.
13. Migration = **strangler à la racine** (nouveaux chemins, move produit par produit). **Pas** de dossier `nafuralabsv2/`.
14. **`raster/`** = **projet** Raster (`raster/raster-src/` + moteur INDEX/Sprint). Pas un orchestrateur hors projet.
15. **SPEC = être · CH = devenir · TASK = faire.** Pas de versioning manuel (git = historique).
16. Chaque lot a **un** artefact SSOT normalisé : `SPEC.md` (pas un `CADRAGE.md` parallèle, pas le PLAN du CH).
17. **Défaut Lot → Task.** Sous-lot seulement si ≥ 2 flux **indépendants** (3 critères). Jamais « au cas où ». App 1-BC : pas de sous-lot tant que le test échoue.
18. `EVOL` = la SPEC change **toujours**. `CORRECTION` = SPEC inchangée. Un « bug » qui change une règle de SPEC **est un EVOL**.

---

## 2. Structure cible (vision)

```text
nafuralabs/
├── raster/                       # projet Raster
│   ├── raster-src/
│   ├── pact/
│   └── t.mjs INDEX.tsv …
├── nafura-platform/
│   ├── raster-src/
│   └── pact/
├── sektor/
│   ├── raster-src/
│   └── pact/
├── ops/
│   └── raster-src/               # pas une app → pas de pact
├── compta/
└── perso/
```

**Règle :** `<projet>/raster-src/` = Raster du projet. `<projet>/pact/` = Pact si app/site.

**Démarrage strangler (2026-08-12) :**  
`nafura-platform/raster-src/` (`PLT-*`) — legacy code reste dans `platform/` ; autres apps encore en `products/*/docs/specs/lots/` (legacy indexé).

### Ordre structurel d’une app (ex. Sektor)

```text
1. Lot Cadrage     [FRAMING]      ← premier requis
2. Lot Socle       [FOUNDATION]   ← transverse
3. Lots métier     [BUSINESS]     ← bounded contexts (+ sous-lots optionnels)
```

### Ordre temporel d’init

```text
CHG Cadrage INITIALIZATION
→ CHG Socle INITIALIZATION
→ CHG Lot métier 1 INITIALIZATION
→ …
```

---

## 3. Artefact SSOT — `SPEC.md`

Un lot **DOIT** avoir exactement un fichier :

```text
<projet>/raster-src/lots/<lot-slug>/
├── SPEC.md                                    # SSOT — le lot *est* ce dossier
├── CH-00-INIT-<slug>/
│   ├── 00-PLAN.md                             # crée la SPEC à la clôture
│   └── tasks/
│       └── {ID}-….md
├── CH-01-EVOL-<slug>/                         # change le comportement attendu
│   ├── 00-PLAN.md
│   └── tasks/
│       └── {ID}-….md
└── CH-02-CORRECTION-<slug>/                   # réaligne le code sur la SPEC déjà vraie
    ├── 00-PLAN.md
    └── tasks/
        └── {ID}-….md
```

Pas de `tasks/` au niveau du lot. Pas de ticket `kind: lot`.  
Raster INDEX dérive l’arbre du **chemin** (`lots/socle/CH-01-EVOL-…/tasks/`).

Types de CH (alignés framework V1) : `INIT` · `EVOL` · `CORRECTION` (+ plus tard `TECHNICAL` / `COMPLIANCE` / `RETIREMENT`).

| Type | SPEC | Code |
|------|------|------|
| `INIT` | **crée** `SPEC.md` à la clôture | souvent oui (sauf cadrage) |
| `EVOL` | **patch** `SPEC.md` à la clôture — **toujours** | oui (sauf cadrage / ADR) |
| `CORRECTION` | **pas** de patch SPEC | oui — le code rattrape une SPEC déjà juste |

**Règle de triage :** si le correctif **touche une règle** de la SPEC (comportement attendu, invariant, contrat) → ce n’est **pas** une `CORRECTION`, c’est un `EVOL`.  
`CORRECTION` = écart implémentation ↔ SPEC inchangée (bug, timeout, retry, mapping faux).

| Artefact | Question | Vit après clôture du CH ? |
|----------|----------|---------------------------|
| `SPEC.md` | Que sait faire ce lot **maintenant** ? | **oui** — seule vérité |
| `CH-nn/00-PLAN.md` | Que transforme-t-on **dans ce changement** ? | historique git ; plus lu comme vérité |
| `tasks/*.md` | Quel résultat vérifiable ? | historique / sprint |

**INIT (`CH-00`)** : pas encore de `SPEC.md` → le PLAN crée la SPEC à la clôture.  
**EVOL** : PLAN = delta ; tasks = code + preuves ; **DoD du CH** = `SPEC.md` patché (`SPEC := SPEC ⊕ delta`).  
Code sans patch SPEC = interdit. SPEC sans code = OK (cadrage, ADR, frontières).

**Interdit :** numéro de version dans la SPEC (`cadrage_version: 0.1`). Statut seulement : `draft` \| `approved`.

### Schéma `SPEC.md` — lot `FRAMING` (Cadrage)

Les blocs §3.1. Un agent de spec lit **uniquement** ce fichier (+ CH ouvert s’il y en a un).

### Schéma `SPEC.md` — lot `FOUNDATION` / `BUSINESS`

Objectif : **décrire le lot**, lisible humain **et** agent. Pas un roman, pas un dump d’écrans.

**Budget :** lot ~80–200 lignes. Au-delà → sous-lots (leurs `SPEC.md` portent la densité).  
**Règles :** numérotées, 1 phrase, testables (`INV-03`, `R-12`).  
**UX :** la SPEC **nomme** le flux + pointe le canvas ; elle n’inline pas le wireframe.

| # | Bloc | Contenu | Interdit |
|---|------|---------|----------|
| 0 | En-tête | `lot`, `type`, `status: draft\|approved` | n° de version |
| 1 | Mission | 5 lignes max | historique projet |
| 2 | Frontières | `owns` / `not_owns` | le métier du voisin |
| 3 | Vocabulaire | table terme → 1 ligne | synonymes flous |
| 4 | Acteurs | rôles **de ce lot** | org chart |
| 5 | Cycle de vie | états + transitions (mermaid court) | tous les edge-cases UI |
| 6 | Sous-lots | index + lien SPEC | sous-lot vide |
| 7 | Invariants | `INV-n` testables | « en général » |
| 8 | Règles | `R-n` groupées ; le trop-plein va au sous-lot | SQL, stack |
| 9 | Contrats | `publie` / `consomme` (noms + champs clés) | proto OpenAPI complet |
| 10 | Flux UX | nom, acteur, **chemin canvas**, états (vide/load/erreur) | pixels, Figma |
| 11 | Données | agrégats, id, cardinalités | schéma Liquibase |
| 12 | AI + fallback | si AI-first : ce que l’IA fait + **repli manuel** | prompts |
| 13 | Hors-scope | garde-fou | — |
| 14 | Open questions | bloquantes = pas `approved` | — |

**UX :** `ux/<flux>-wireframe.canvas.tsx` à côté du lot / sous-lot. La SPEC dit *quel* flux et *quels* états ; le canvas *montre*.

---

#### Exemple — lot `etude` (carte, pas le drawer)

```yaml
---
kind: spec
lot: etude
type: BUSINESS
status: draft
---
```

**Mission :** produire une offre chiffrée (CPS / bordereau) jusqu’à acceptation.  
**Owns :** dossier étude, versions, chiffrage, documents d’offre.  
**Not owns :** chantier, facture client, stock.

**Cycle :** `brouillon → chiffrage → émise → acceptée | refusée | abandonnée`

**Sous-lots (si 3 critères OK) :** `parcours` · `chiffrage` · `documents`

**INV-01** Une étude acceptée n’est plus éditable (nouvelle version = EVOL/INIT version).  
**INV-02** Structure figée après import CPS : pas de retouche du lien lots/postes.  
**Publie :** `EtudeAcceptee { etude_id, client_id, montant_ht }` → Cadrage : crée chantier.  
**UX :** parcours création → `ux/etude-parcours-wireframe.canvas.tsx` (états : vide, import CPS, erreur 500 replace).  
**AI :** extraction CPS en premier ; saisie manuelle toujours possible.

Les règles du drawer (estimé vs décomposé, unité, commentaires) → **`chiffrage/SPEC.md`**, pas ici.

#### Exemple — lot `chantier` (plusieurs flux → sous-lots)

Carte seulement : fiche, pointage, ST, planning = 4 sous-lots.  
`SPEC.md` chantier = cycle de vie chantier + contrats (`consomme EtudeAcceptee`) + index.  
Règles d’infalsifiabilité du pointage → `rh-pointage/SPEC.md`.

---

## 3.1. Contenu normalisé du lot Cadrage

Optimisé pour être **lu par les agents de spec**, qui dérivent ensuite Socle + lots métier.

### Obligatoire

| Bloc | Rôle |
| --- | --- |
| Identité | `application_id`, nom, domaine |
| Finalité | ce que l’app doit permettre |
| Hors-scope | garde-fou anti-dérive |
| Acteurs | rôles principaux |
| Carte des lots | Socle + BC **connus** (`PLANNED` \| `ACTIVE` \| `TBD`) |
| Frontières connues | `owns` / `not_owns` par lot listé |
| Socle attendu | capacités + mode `LOCAL` \| `PLATFORM` \| `EXTERNAL` |
| Invariants applicatifs | règles cross-lots |
| Intégration inter-lots | style de contrats |
| Contraintes héritées | entreprise / solution / conformité |
| Ordre d’init | séquence de démarrage |
| Open questions | ambiguïtés ; bloquantes = pas d’APPROVED |

### Recommandé

Vocabulaire global · Décisions solution · Sources · Risques

### Interdit dans le Cadrage

Screens / wireframes détaillés · découpage BE/FE/DB · specs profondes d’un BC · stack/SQL · BC inventés

### Critère « Cadrage suffisant »

L’agent de spec peut, sans inventer :

1. produire l’`INITIALIZATION` du Socle ;
2. produire l’`INITIALIZATION` des BC déjà `PLANNED` ;
3. bloquer proprement si `TBD` ou open question critique.

---

## 4. Platform — archi figée (hybride)

**Aujourd’hui (à éliminer progressivement) :**

- Backend : Gradle `implementation project(":platform:…")`
- Frontend : aliases `@platform/*` → `platform/web/`
- Infra partagée OK (Keycloak, Postgres, …) mais SDK in-process couplé

**Cible :**

```text
nafura-platform/
├── raster-src/
├── pact/
├── services/
│   └── platform-api/    # 1 service au départ
└── packages/
    ├── java/            # Maven versionnés
    └── js/              # npm @nafura/* versionnés
```

### Lots platform (carte)

Cadrage · Socle · Identity · Tenancy · Documents · Collaboration · AI · Admin · Experience

### Packages — 3 familles seulement

| Famille | Rôle | Interdit |
|---------|------|----------|
| `contracts-*` | DTOs / OpenAPI / erreurs | logique, réseau |
| `client-*` | HTTP + auth/tenant headers | règles métier app |
| `ui-*` | design system, shell injectable | routes métier hardcodées |

**Interdit :** starters framework épais qui embarquent le domaine platform dans la JVM de l’app.

### Déclaration côté app consommatrice

```yaml
foundation_capabilities:
  - id: authn
    mode: PLATFORM_CONSUMED
    via: { api: platform-identity, client: "@nafura/client-identity" }
  - id: design-system
    mode: PLATFORM_CONSUMED
    via: { package: "@nafura/ui" }
```

### Preuve de conso

Build app = deps **versionnées** (Maven/npm), pas source monorepo. Lab local = registry / publish local versionné — pas path alias.

**Cadrage platform en cours :** `CH-00` ouvert — PLAN = delta INIT. `SPEC.md` n’existe **qu’après** clôture / APPROVED de `PLT-02`.

---

## 5. Découpage — lots vs sous-lots

**Lot métier** = bounded context (frontière de langage + responsabilité).  
**Sous-lot** = capacité **durable** *dans* un BC, optionnelle.  
**Task** = résultat vérifiable. Ce n’est pas un sous-lot.

Un flux est **indépendant** (donc candidat sous-lot) si **les 3** sont vrais :

1. Autre famille de règles / écrans (pas le même roman métier)
2. Livrable **sans** l’autre flux
3. Un agent peut l’exécuter **sans** lire les tasks de l’autre

Sinon : tasks **dans le CH**, jamais un dossier `tasks/` collé au lot.

Chaque lot a `SPEC.md`. Un sous-lot, **s’il existe**, a le sien. Un CH cible **un** lot **ou** **un** sous-lot.

### A. App 1 contexte — `conges`

```text
conges/raster/lots/
├── cadrage/
│   ├── SPEC.md
│   └── CH-00-INIT-initier-le-cadrage/
│       ├── 00-PLAN.md
│       └── tasks/
│           └── CNG-02-premiere-version.md
├── socle/
│   ├── SPEC.md
│   ├── CH-00-INIT-initier-le-socle/
│   │   ├── 00-PLAN.md
│   │   └── tasks/
│   │       └── CNG-11-socle-auth-platform.md
│   ├── CH-01-EVOL-ajout-documents-ged/
│   │   ├── 00-PLAN.md
│   │   └── tasks/
│   │       └── CNG-12-ged-documents.md
│   └── CH-02-CORRECTION-upload-timeout/
│       ├── 00-PLAN.md
│       └── tasks/
│           └── CNG-13-fix-upload-timeout.md
└── conges/
    ├── SPEC.md
    └── CH-00-INIT-demandes-de-conges/
        ├── 00-PLAN.md
        └── tasks/
            ├── CNG-21-demander.md
            ├── CNG-22-valider.md
            └── CNG-23-soldes.md
```

Pas de sous-lots. Pas de `CNG-01-lot-*.md`.

### B. CBS — extrait `lending` (même forme)

```text
cbs/raster/lots/
├── cadrage/
│   ├── SPEC.md
│   └── CH-00-INIT-initier-le-cadrage/
│       ├── 00-PLAN.md
│       └── tasks/
│           └── CBS-02-premiere-version.md
├── socle/
│   ├── SPEC.md
│   └── CH-00-INIT-initier-le-socle/
│       ├── 00-PLAN.md
│       └── tasks/
│           └── CBS-11-posting.md
└── lending/
    ├── SPEC.md
    ├── origination/
    │   ├── SPEC.md
    │   ├── CH-00-INIT-octroi/
    │   │   ├── 00-PLAN.md
    │   │   └── tasks/
    │   │       └── CBS-42-dossier-credit.md
    │   └── CH-01-EVOL-comptes-joints/
    │       ├── 00-PLAN.md
    │       └── tasks/
    │           └── CBS-47-emprunteur-joint.md
    └── collections/
        ├── SPEC.md
        └── CH-00-INIT-recouvrement/
            ├── 00-PLAN.md
            └── tasks/
                └── CBS-46-impayes.md
```

### Ce qui n’est jamais un lot / sous-lot

| Non | Pourquoi |
|-----|----------|
| `backend` / `frontend` / `mobile` | surfaces |
| `sprint-3` / `v2` | temps (c’est un CH) |
| `api-gateway` | techno |
| sous-lot vide « pour plus tard » | interdit |

---

## 6. Sektor — notes d’alignement menu ERP

Source menu : `products/sektor-btp/web/app/shell/erp-nav.generated.ts`

Zones : work · operations · business · people · pilotage

Modules menu : Dashboard · Chantiers · Achats · Stock · Matériel · Études · Marchés & facturation · Finance · RH · HSE · Pilotage · Analytics

**Rappel :** menu ≠ lots. Le Cadrage décide les BC.

Écart Raster actuel (`etude`, `marche`, `chantier`, `appro`, `finance`) vs menu : Matériel, RH, HSE, Pilotage absents ou non formalisés ; Achats/Stock séparés au menu mais fondus dans `appro`.

Open questions Sektor :

- Stock = BC séparé ou sous-lot d’Appro ?
- Pilotage/Analytics = BC ou vues en lecture ?
- Facturation client = Marché ou Finance ?

---

## 7. Suite à discuter

- [x] Mode de consommation `nafura-platform` → **hybride API + packages**
- [x] Migration → **strangler** (pas `nafuralabsv2/`) ; monorepo polyrepo-ready
- [x] Tout projet a un `<projet>/raster-src/` — canon ; `pact/` si app/site ; legacy `docs/specs/lots` encore indexé
- [x] Artefact SSOT = `SPEC.md` par lot ; CH/PLAN = delta ; tasks = faire
- [x] Découpage : Lot = BC ; sous-lot = flux indépendants (CBS vs app 1-contexte)
- [ ] Convention d’IDs (`PLT-*` ok ; `CH-00` vs `CHG-CAD-00x` ?)
- [ ] Place du Socle dans l’arbre (`lot-socle` vs capacités dans platform)
- [ ] Migration code `platform/` → `services/` + `packages/`
- [ ] Figer le template YAML du lot Cadrage dans le framework V1 (amendement)
- [ ] Open questions cadrage platform (Q2 Identity vs Experience, Q3 Keycloak)
- [ ] Migrer les apps `products/*` de `docs/specs/lots` → `<app>/raster/lots`

---

*Document de travail — continuer la discussion ici.*
