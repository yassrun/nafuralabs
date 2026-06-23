# Wave 3 — Chantiers

## Findings traités

D'après `migration_plan.md` §5 et `00-MOCK-INVENTORY.md` §2.3 :

- Module **pivot** consommé par Achats, Ventes, RH, HSE, Marchés, Inventory (magasin chantier).
- **6 mocks distincts** injectés dans 14 fichiers :
  - `ChantiersMockService` — listing, detail, create
  - `AttachementMockService` — attachements
  - `AvancementMockService` — avancements physiques
  - `DocumentsMockService` — documents
  - `SousTraitanceMockService` — sous-traitance
  - `PlanningMockFacade` — planning Gantt
- Plusieurs pages **bypassent** le pattern API service / facade et injectent le mock directement (`chantiers-listing.page.ts`, `chantier-detail.page.ts`, `chantier-create.page.ts`).
- Round 2 audit signale une **régression bloquante** : `/chantiers/:id` retourne « Chantier introuvable ». Cause potentielle : mismatch ID seed.

## Goal

Créer le domaine `backend/domains/chantiers` couvrant l'agrégat `Chantier` + ses entités liées + un read model `ChantierSummary` pour le drill-down.

C'est le **module pivot** : sa stabilité conditionne Wave 3 (Études), Wave 4 (RH/HSE) et Wave 5 (Marchés).

## Source-of-truth frontend

Cf. `00-MOCK-INVENTORY.md` §2.3 — 14 fichiers à nettoyer.

```
pages/chantiers/chantier-detail/chantier-detail.page.ts            ← inject ChantiersMockService directement
pages/chantiers/chantiers-listing/chantiers-listing.page.ts         ← inject ChantiersMockService directement
pages/chantiers/create/chantier-create.page.ts                      ← inject ChantiersMockService directement
pages/chantiers/avancements/services/avancement-api.service.ts      ← /api/v1/chantiers/avancements
pages/chantiers/situations/services/situation-api.service.ts        ← /api/v1/chantiers/situations
pages/chantiers/attachements/attachement-mock.service.ts            ← à remplacer
pages/chantiers/documents/services/documents-mock.service.ts        ← à remplacer
pages/chantiers/sous-traitance/services/sous-traitance-mock.service.ts  ← à remplacer
pages/chantiers/planning/services/planning-mock.facade.ts           ← à remplacer
```

## Cible backend

```
backend/domains/chantiers/
```

### Entités à créer

| Entité | Description |
|---|---|
| `Chantier` | Aggregate root (header) |
| `Lot` | Lot / phase (hiérarchie 2 niveaux) |
| `PosteBudgetaire` | Poste de budget (ligne dans lot) |
| `BudgetChantier` | Budget (prévisionnel + révisé) — table head |
| `BudgetLigne` | Ligne budget par poste |
| `BudgetRealisation` | Réalisé matière/MO/matériel/ST par poste (read model) |
| `AvancementPhysique` | Saisie avancement par lot/poste |
| `SituationTravaux` | Situation (header) |
| `SituationLigne` | Ligne situation (lien `posteBudgetaireId` + qté + prix) |
| `SousTraitanceChantier` | Lien Chantier ↔ Contrat ST (Wave 2 Achats) |
| `DocumentChantier` | Document attaché (type, version, URL stockage) |
| `JournalChantier` | Entrée journal (date + auteur + texte + photos) |
| `AttachementChantier` | Attachement (bon d'attachement) signé MOE/MOA |
| `PhotoChantier` | Photo (URL stockage + lat/lng/EXIF/zone) |
| `EquipeChantier` | Équipe (chef, conducteur, ingénieur, …) |
| `MembreEquipe` | Lien `EmployeId` (Wave 4 RH) + rôle |
| `RisqueChantier` | Registre risques (criticité = proba × gravité) |
| `MeteoChantier` | Météo journalière (intempéries) — read model |

## Tasks

### B-CHA-01 — Aggregate `Chantier` + status

**Goal :** créer l'entité root + le CRUD socle.

**Champs `Chantier` :**
```
id, tenant_id, code (CH-2026-XXX), label, description,
client_id (Partner Wave 0), marche_numero, type_ccag_t (TRAVAUX/SERVICE/FOURNITURE),
moa_id, moe_id, bet_id (3 références Partner),
adresse, latitude, longitude,
date_demarrage, duree_mois, date_fin_prevue, date_fin_reelle,
montant_ht, taux_tva, taux_rg, taux_ras, taux_avance,
status (BROUILLON/EN_PREPARATION/EN_COURS/SUSPENDU/RECEPTIONNE_PROVISOIRE/RECEPTIONNE_DEFINITIF/CLOS),
chef_chantier_user_id, conducteur_travaux_user_id, ingenieur_user_id,
societe_id (multi-société),
created_at, updated_at
```

**Workflow :**
```
BROUILLON ── /demarrer ──► EN_COURS
EN_COURS ── /suspendre ──► SUSPENDU ── /reprendre ──► EN_COURS
EN_COURS ── /reception-provisoire ──► RECEPTIONNE_PROVISOIRE
RECEPTIONNE_PROVISOIRE ── /reception-definitive ──► RECEPTIONNE_DEFINITIF
RECEPTIONNE_DEFINITIF ── /clore ──► CLOS
```

**Endpoints :**
```
GET    /api/v1/chantiers?status=...&clientId=...&societeId=...
GET    /api/v1/chantiers/lookup
POST   /api/v1/chantiers
PUT    /api/v1/chantiers/{id}
DELETE /api/v1/chantiers/{id}              ← uniquement BROUILLON
POST   /api/v1/chantiers/{id}/demarrer / suspendre / reprendre / reception-provisoire / reception-definitive / clore
```

**Seeds (Liquibase context="seed-demo") :** reprendre `SEED_CHANTIERS` Round 1 (6 chantiers `ch-001` → `ch-006`).

**Désinjection :**
- `pages/chantiers/chantiers-listing/chantiers-listing.page.ts`
- `pages/chantiers/chantier-detail/chantier-detail.page.ts`
- `pages/chantiers/create/chantier-create.page.ts`

**Effort :** 3-4 j.h

---

### B-CHA-02 — Lots / phases / postes budgétaires

**Goal :** hiérarchie `Lot > PosteBudgetaire` rattachée à un chantier.

**Endpoints :**
```
GET    /api/v1/chantiers/{id}/lots
POST   /api/v1/chantiers/{id}/lots
GET    /api/v1/lots/{id}/postes-budgetaires
POST   /api/v1/lots/{id}/postes-budgetaires
PUT    /api/v1/postes-budgetaires/{id}
```

**Effort :** 2-3 j.h

---

### B-CHA-03 — Budget chantier (prévisionnel / révisé / réalisé)

**Goal :** entité `BudgetChantier` + `BudgetLigne` + read model `BudgetRealisation`.

**Logique réalisation :**
- `realise_matieres` : somme `StockMovement` type SORTIE par poste (lien `posteBudgetaireId` sur ligne mouvement).
- `realise_mo` : somme `PointageChantier` × taux horaire (Wave 4 RH).
- `realise_materiel` : somme `PointageEngin` × taux horaire engin (Wave 1 Inventory matériel ou backlog).
- `realise_st` : somme situations ST validées (Wave 2 Achats).

**Endpoints :**
```
GET /api/v1/chantiers/{id}/budget
GET /api/v1/chantiers/{id}/budget/realisation       ← read model
GET /api/v1/chantiers/{id}/budget/marges            ← marges par poste
POST /api/v1/chantiers/{id}/budget/refresh-realisation
```

**Tests unitaires obligatoires :** `BudgetMargesServiceTest` (cf. bug Round 2 `3.250 %` à corriger en passant).

**Effort :** 2-3 j.h

---

### B-CHA-04 — Avancements physiques

**Goal :** entité `AvancementPhysique` (saisie chef chantier).

**Endpoints :**
```
GET    /api/v1/chantiers/{id}/avancements
POST   /api/v1/chantiers/{id}/avancements              ← saisie multi-lignes
PUT    /api/v1/avancements/{id}
POST   /api/v1/avancements/{id}/valider                ← passage validé → input pour situation
GET    /api/v1/chantiers/{id}/avancements/dernier      ← dernier avancement par poste
```

**Désinjection :**
- `pages/chantiers/avancements/services/avancement-api.service.ts`
- `pages/chantiers/avancements/services/avancement.facade.ts`

**Effort :** 2 j.h

---

### B-CHA-05 — Situations + génération depuis avancements

**Goal :** entité `SituationTravaux` + génération auto depuis avancements validés.

**Endpoints :**
```
POST   /api/v1/chantiers/{id}/situations/generate?numero=N    ← brouillon depuis avancements
POST   /api/v1/situations/{id}/submit                          ← passage SOUMISE
POST   /api/v1/situations/{id}/accept-moa                      ← acceptée MOA
POST   /api/v1/situations/{id}/convert-to-facture              ← crée FactureClient type SITUATION (Wave 2 Ventes)
```

**Tests unitaires obligatoires :** `SituationGenerationServiceTest`.

**Désinjection :**
- `pages/chantiers/situations/services/situation-api.service.ts`
- `pages/chantiers/situations/services/situation.facade.ts`

**Effort :** 2-3 j.h

---

### B-CHA-06 — Sous-traitance chantier

**Goal :** lien Chantier ↔ Contrat ST (`ContratSousTraitance` de Wave 2 Achats).

**Endpoints :**
```
GET    /api/v1/chantiers/{id}/sous-traitances
POST   /api/v1/chantiers/{id}/sous-traitances           ← lien existant ou création contrat
GET    /api/v1/chantiers/{id}/sous-traitances/synthese  ← cumul situations ST + RG
```

**Désinjection :** `pages/chantiers/sous-traitance/sous-traitance-listing/sous-traitance-listing.page.ts`.

**Effort :** 1-2 j.h

---

### B-CHA-07 — Documents + journal + attachements (e-signature)

**Goal :** entités `DocumentChantier`, `JournalChantier`, `AttachementChantier`.

**Workflow attachement (e-signature MOE/MOA) :**
```
BROUILLON ── /soumettre-signature ──► EN_ATTENTE_MOE
EN_ATTENTE_MOE ── /signer/{token} ──► SIGNE_MOE ── /soumettre-moa ──► EN_ATTENTE_MOA
EN_ATTENTE_MOA ── /signer/{token} ──► SIGNE_MOA ── /clore ──► CLOS
```

**Token signature :** JWT `audience=sign` valide 7 jours, sans login utilisateur (page publique `/sign/:token`).

**Endpoints :**
```
GET/POST/PUT/DELETE  /api/v1/chantiers/{id}/documents
GET/POST             /api/v1/chantiers/{id}/journal
GET/POST             /api/v1/chantiers/{id}/attachements
POST                 /api/v1/attachements/{id}/soumettre-signature
GET                  /api/v1/sign/{token}                ← public
POST                 /api/v1/sign/{token}                ← submit signature (canvas base64 + ip + ua)
```

**Désinjection :**
- `pages/chantiers/attachements/**`
- `pages/chantiers/documents/documents-listing/documents-listing.page.ts`

**Effort :** 1-2 j.h

---

### B-CHA-08 — Photos géolocalisées

**Goal :** entité `PhotoChantier` avec lat/lng/EXIF/zone.

**Endpoints :**
```
GET    /api/v1/chantiers/{id}/photos?zone=...&date=...
POST   /api/v1/chantiers/{id}/photos                    ← upload multipart (compression server-side optionnelle)
DELETE /api/v1/photos/{id}
GET    /api/v1/photos/{id}/url                          ← URL signée objet stockage
```

**Effort :** 1 j.h

---

### B-CHA-09 — Read model `ChantierSummary`

**Goal :** endpoint d'agrégat pour la fiche détail (12 onglets Round 2 M-CHA-03).

**Endpoint :**
```
GET /api/v1/chantiers/{id}/summary
→ {
    chantier: { … },
    equipe: { chef, conducteur, ingenieur, membres },
    budget: { prevu, revise, realise, marge },
    avancement: { pourcentageGlobal, derniereSituation, dernierAvancement },
    finance: { caCumule, encaisseCumule, rgImmobilisee, restantsApayes },
    achats: { bcEnCours, bcReceptionnes, ffMatching },
    stock: { valorisationMagasinChantier, mouvementsRecents },
    rh: { nbPersonnesActives, pointagesDernier7Jours },
    hse: { nbIncidents12mois, nbNc, formationsAJour },
    alertes: [ ... ]
  }
```

> Implémenté par 1 service backend `ChantierSummaryService` qui orchestre ses appels aux services internes des autres domaines (via repositories partagés ou client interne).

**Effort :** 1-2 j.h

---

### B-CHA-10 — Désinjection `ChantiersMockService` (pages listing/detail)

**Goal :** terminer la suppression des injections directes dans les pages.

**À faire :**

1. Refactorer `chantiers-listing.page.ts` pour consommer `ChantierFacade.listChantiers$`.
2. Refactorer `chantier-detail.page.ts` pour consommer `ChantierFacade.getChantier(id) + getSummary(id)`.
3. Fix de la régression Round 2 M-CHA-01 (« Chantier introuvable ») en passant : tester avec les 6 chantiers SEED.
4. Refactorer `chantier-create.page.ts` pour utiliser `ChantierFacade.create()`.

**Acceptance criteria :**
- [ ] `grep "ChantiersMockService\|AttachementMockService\|AvancementMockService\|DocumentsMockService\|SousTraitanceMockService\|PlanningMockFacade" web/app/applications/erp/pages/chantiers/` → vide.
- [ ] Les 6 fiches chantier seed sont accessibles via `/chantiers/ch-001..ch-006`.

**Effort :** 1-2 j.h

## Frontend cleanup

```bash
grep -rE "inject\((ChantiersMockService|AttachementMockService|AvancementMockService|DocumentsMockService|SousTraitanceMockService|PlanningMockFacade)\)" \
  web/app/applications/erp/chantiers/ \
  web/app/applications/erp/pages/chantiers/ \
  web/app/applications/erp/shell/ \
  2>/dev/null
# (vide attendu)
```

## Testing

| Test | Type | Périmètre |
|---|---|---|
| `ChantierServiceTest` | JUnit | transitions + seeds |
| `BudgetMargesServiceTest` | JUnit | calcul marges (fix bug `3.250 %`) |
| `SituationGenerationServiceTest` | JUnit | génération depuis avancements |
| `ChantierSummaryServiceTest` | JUnit | agrégat complet |
| `AttachementSignatureServiceTest` | JUnit | tokens JWT + hash |
| `chantiers-flow.e2e.spec.ts` | Playwright | listing → detail (6 seeds) → wizard création → fiche complète |

## Dependencies

- **Wave 0** : `partner` (CLIENT, MOA, MOE, BET, ST).
- **Wave 1 Inventory** : `Warehouse` type CHANTIER, `StockMovement`.
- **Wave 1 Finance** : `Reglement` pour règlements situations.
- **Wave 2 Achats** : `ContratSousTraitance` pour B-CHA-06.
- **Wave 2 Ventes** : `FactureClient` pour B-CHA-05 (conversion situation → facture).

## Definition of Done — Chantiers

- [ ] B-CHA-01 → B-CHA-10 toutes `[x]`
- [ ] 6 mocks Chantiers quarantinés (ChantiersMock, Attachement, Avancement, Documents, SousTraitance, PlanningMockFacade)
- [ ] `00-PROGRESS.md` à jour
