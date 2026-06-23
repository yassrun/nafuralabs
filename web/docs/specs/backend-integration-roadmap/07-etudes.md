# Wave 3 — Études & Soumissions

## Findings traités

D'après `migration_plan.md` §6 et `00-MOCK-INVENTORY.md` §2.4 :

- 4 `*-api.service.ts` sous `pages/etudes/` redirigent vers `EtudesMockService`.
- Aucun domaine `backend/domains/etudes` n'existe.
- 11 fichiers (api, facades, pages, composants `dpgf-editor`, `metre-table-editor`) injectent `EtudesMockService`.
- Les calculs DPU (déboursé sec → FG → marge → PV) et la génération DPGF sont **dans le frontend** → à descendre côté backend.

## Goal

Créer `backend/domains/etudes` pour :

1. Bibliothèque prix + ouvrages (catalogue d'ouvrages réutilisables).
2. Métrés (saisie quantitative).
3. DPGF (Décomposition Prix Global et Forfaitaire) — hiérarchie LOT > SOUS_LOT > ARTICLE.
4. DPU (Décomposition Prix Unitaire) — composants MATIERE/MO/MATERIEL/ST.
5. Appels d'offres clients (AOC).
6. Devis (génération depuis DPGF, versioning, calculs server-side).

## Source-of-truth frontend

Cf. `00-MOCK-INVENTORY.md` §2.4 — 11 fichiers à nettoyer.

```
pages/etudes/bibliotheque-prix/services/ouvrage-api.service.ts     ← /api/v1/etudes/ouvrages
pages/etudes/metres/services/metre-api.service.ts                  ← /api/v1/etudes/metres
pages/etudes/devis/services/devis-api.service.ts                   ← /api/v1/etudes/devis
pages/etudes/appels-offres-clients/services/aoc-api.service.ts     ← /api/v1/etudes/aoc
etudes/components/dpgf-editor/                                     ← injection mock à retirer
etudes/components/metre-table-editor/                              ← injection mock à retirer
```

## Cible backend

```
backend/domains/etudes/
```

### Entités à créer

| Entité | Description |
|---|---|
| `Ouvrage` | Bibliothèque ouvrages (réutilisable) |
| `BibliothequePrix` | Catalogue prix unitaires |
| `PrixDPU` | Décomposition prix unitaire (lié à un Ouvrage ou article) |
| `ComposantDPU` | Composant DPU (MATIERE/MO/MATERIEL/ST + qté + PU) |
| `Metre` | Métré (header) |
| `MetreLigne` | Ligne métré (article × qté × unité) |
| `DPGF` | Décomposition Prix Global Forfaitaire (header) |
| `NoeudDPGF` | Nœud hiérarchique (LOT/SOUS_LOT/ARTICLE) |
| `AppelOffreClient` | AO client (header) |
| `Devis` | Devis (header) |
| `DevisLigne` | Ligne devis |

## Tasks

### B-ETU-01 — Bibliothèque prix + ouvrages

**Goal :** entités `Ouvrage`, `BibliothequePrix`.

**Endpoints :**
```
GET    /api/v1/etudes/ouvrages
GET    /api/v1/etudes/ouvrages/lookup
POST/PUT/DELETE /api/v1/etudes/ouvrages
POST   /api/v1/etudes/ouvrages/import-excel
GET    /api/v1/etudes/bibliotheque-prix
```

**Désinjection :** `pages/etudes/bibliotheque-prix/services/ouvrage-api.service.ts`.

**Effort :** 2 j.h

---

### B-ETU-02 — Métrés (CRUD + lignes)

**Goal :** entités `Metre` + `MetreLigne`.

**Endpoints :**
```
GET    /api/v1/etudes/metres
POST   /api/v1/etudes/metres
GET    /api/v1/etudes/metres/{id}/lignes
POST   /api/v1/etudes/metres/{id}/lignes
PUT    /api/v1/etudes/metre-lignes/{id}
DELETE /api/v1/etudes/metre-lignes/{id}
```

**Désinjection :**
- `pages/etudes/metres/services/metre-api.service.ts`
- `etudes/components/metre-table-editor/`

**Effort :** 1-2 j.h

---

### B-ETU-03 — DPGF (LOT > SOUS_LOT > ARTICLE)

**Goal :** entités `DPGF` + `NoeudDPGF` (auto-référente pour hiérarchie 3 niveaux).

**Endpoints :**
```
GET    /api/v1/etudes/dpgf
POST   /api/v1/etudes/dpgf                            ← création depuis métré (`fromMetreId`)
GET    /api/v1/etudes/dpgf/{id}/arbre                 ← arbre complet
POST   /api/v1/etudes/dpgf/{id}/noeuds                ← ajout nœud
PUT    /api/v1/etudes/dpgf-noeuds/{id}
DELETE /api/v1/etudes/dpgf-noeuds/{id}
GET    /api/v1/etudes/dpgf/{id}/totaux                ← agrégats LOT
GET    /api/v1/etudes/dpgf/{id}/pdf
```

**Désinjection :** `etudes/components/dpgf-editor/` + `pages/etudes/metres/metre-dpgf/metre-dpgf.page.ts`.

**Tests unitaires :** `DPGFAgregationServiceTest` (rollup totaux LOT).

**Effort :** 2-3 j.h

---

### B-ETU-04 — DPU + composants

**Goal :** entités `PrixDPU` + `ComposantDPU` avec calcul déboursé sec → PV.

**Logique calcul (descendue côté backend) :**
```
debourse_sec = somme(composants.qte * composants.prix_unitaire)
prix_vente_ht = debourse_sec * (1 + frais_generaux_pct) * (1 + marge_pct)
```

**Endpoints :**
```
GET    /api/v1/etudes/dpu?ouvrageId=...
POST   /api/v1/etudes/dpu
PUT    /api/v1/etudes/dpu/{id}
GET    /api/v1/etudes/dpu/{id}/composants
POST   /api/v1/etudes/dpu/{id}/composants
POST   /api/v1/etudes/dpu/{id}/recompute              ← recalcul DS / PV
POST   /api/v1/etudes/dpu/{id}/versions               ← snapshot version
```

**Tests unitaires obligatoires :** `DPUCalculatorTest` (déboursé sec + FG + marge).

**Effort :** 2 j.h

---

### B-ETU-05 — Appels d'offres clients (AOC)

**Goal :** entité `AppelOffreClient`.

**Endpoints :**
```
GET    /api/v1/etudes/aoc?status=...
POST   /api/v1/etudes/aoc
PUT    /api/v1/etudes/aoc/{id}
POST   /api/v1/etudes/aoc/{id}/marquer-gagne           ← bouton « Marché remporté »
POST   /api/v1/etudes/aoc/{id}/marquer-perdu
POST   /api/v1/etudes/aoc/{id}/convert-to-chantier     ← création chantier (Wave 3 Chantiers)
```

**Désinjection :**
- `pages/etudes/appels-offres-clients/services/aoc-api.service.ts`
- `pages/etudes/appels-offres-clients/services/aoc.facade.ts`

**Effort :** 1-2 j.h

---

### B-ETU-06 — Devis (génération DPGF + versioning + calculs)

**Goal :** entité `Devis` avec génération auto depuis DPGF et versioning.

**Endpoints :**
```
GET    /api/v1/etudes/devis
POST   /api/v1/etudes/devis/from-dpgf?dpgfId=...      ← génération auto
PUT    /api/v1/etudes/devis/{id}
POST   /api/v1/etudes/devis/{id}/versions             ← snapshot version
GET    /api/v1/etudes/devis/{id}/versions
POST   /api/v1/etudes/devis/{id}/submit               ← passage à offre commerciale Ventes
POST   /api/v1/etudes/devis/{id}/marquer-gagne        ← création chantier + offre validée
```

**Désinjection :**
- `pages/etudes/devis/services/devis-api.service.ts` + `.facade.ts`
- `pages/etudes/devis/devis-from-dpgf/devis-from-dpgf.page.ts`

**Tests unitaires :** `DevisGenerationServiceTest` (depuis DPGF) + `DevisVersioningTest`.

**Effort :** 2-3 j.h

## Frontend cleanup

```bash
grep -rE "inject\(EtudesMockService\)" \
  web/app/applications/erp/etudes/ \
  web/app/applications/erp/pages/etudes/ \
  2>/dev/null
# (vide attendu)
```

## Testing

| Test | Type | Périmètre |
|---|---|---|
| `OuvrageServiceTest` | JUnit | CRUD + import Excel |
| `DPUCalculatorTest` | JUnit | DS / FG / marge |
| `DPGFAgregationServiceTest` | JUnit | rollup LOT |
| `DevisGenerationServiceTest` | JUnit | génération depuis DPGF |
| `etudes-flow.e2e.spec.ts` | Playwright | Métré → DPGF → DPU → Devis → AOC gagné → Chantier |

## Dependencies

- **Wave 0** : `partner` (clients pour AOC).
- **Wave 1 Inventory** : `Item` (articles ouvrages).
- **Wave 3 Chantiers** : pour la conversion AOC gagné → Chantier.

## Definition of Done — Études

- [ ] B-ETU-01 → B-ETU-06 toutes `[x]`
- [ ] `grep EtudesMockService` → vide
- [ ] `EtudesMockService` quarantiné
- [ ] `00-PROGRESS.md` à jour
