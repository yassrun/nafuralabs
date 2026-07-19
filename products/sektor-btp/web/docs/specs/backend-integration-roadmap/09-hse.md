# Wave 4 — Qualité & HSE

## Findings traités

D'après `migration_plan.md` §8 et `00-MOCK-INVENTORY.md` §2.6 :

- 4 `*-api.service.ts` (`incident`, `nc`, `inspection`, `formation`) redirigent vers `HseMockService`.
- Un mock supplémentaire `HseExtendedMockService` couvre DUER/PPSPS/PHS/registres-légaux/visites-médicales.
- 16 fichiers frontend injectent un de ces deux mocks.
- Round 2 audit signale que la route `/qualite` retourne **404** au runtime → cause potentielle : alias manquant `/qualite` ↔ `/hse` ou `HSE_ROUTES` non importé.

## Goal

Créer `backend/domains/hse` pour :

1. Incidents / accidents — workflow + déclaration CNSS DAT.
2. Non-conformités + CAPA.
3. Inspections + audits HSE.
4. Formations HSE.
5. EPI dotation + renouvellement.
6. PPSPS + PHS (documents par chantier / société).
7. Visites médicales.
8. Registres légaux.
9. DUER (Document Unique).
10. KPIs HSE (TF1/TF2/TG/Bird) — read model.

## Source-of-truth frontend

Cf. `00-MOCK-INVENTORY.md` §2.6 — 16 fichiers à nettoyer.

```
pages/hse/incidents/services/incident-api.service.ts            ← /api/v1/hse/incidents
pages/hse/non-conformites/services/nc-api.service.ts            ← /api/v1/hse/non-conformites
pages/hse/inspections/services/inspection-api.service.ts        ← /api/v1/hse/inspections
pages/hse/formations/services/formation-api.service.ts          ← /api/v1/hse/formations
pages/hse/{duer,phs,ppsps,registres-legaux,visites-medicales}/  ← read endpoints + CRUD limité
pages/hse/tableau-bord-hse/                                     ← read endpoint KPIs
```

## Cible backend

```
backend/domains/hse/
```

### Entités à créer

| Entité | Description |
|---|---|
| `Incident` | Incident / accident |
| `IncidentTemoin` | Témoin d'incident |
| `IncidentAction` | Action corrective (plan d'action) |
| `NonConformite` | NC |
| `Capa` | Plan CAPA (Corrective + Preventive Action) |
| `Inspection` | Inspection HSE |
| `AuditHse` | Audit HSE checklist |
| `AuditHseLigne` | Ligne d'audit |
| `FormationHse` | Formation suivie |
| `EpiDotation` | Dotation EPI (employé + EPI + date) |
| `Ppsps` | PPSPS par chantier |
| `PpspsSection` | Section PPSPS (8 sections types) |
| `Phs` | PHS générique société |
| `VisiteMedicale` | Visite médicale (employé + date + résultat) |
| `RegistreLegal` | Registre légal (type + obligations) |
| `Duer` | Document Unique d'Évaluation des Risques |
| `DuerRisque` | Risque dans DUER |

## Tasks

### B-HSE-01 — Incidents + CNSS DAT

**Goal :** entité `Incident` + workflow + déclaration CNSS DAT (AT).

**Champs :**
```
id, tenant_id, numero, chantier_id, employe_id,
date_heure, lieu, type (AT/MP/INCIDENT/PRESQU_ACCIDENT/ENVIRONNEMENT),
gravite (LEGER/MODERE/GRAVE/CRITIQUE), description, photos[],
temoins[], status (OUVERT/INVESTIGATION/CLOS),
cnss_dat_declare (boolean), cnss_dat_xml_url (objet stockage),
ijss_montant, ijss_periode,
created_at, updated_at
```

**Workflow :**
```
OUVERT ── /investiguer ──► INVESTIGATION ── /clore ──► CLOS
```

**Endpoints custom :**
```
POST /api/v1/hse/incidents/{id}/investiguer
POST /api/v1/hse/incidents/{id}/clore
POST /api/v1/hse/incidents/{id}/declarer-cnss-dat        ← génère XML CNSS DAT + alerte 48h
POST /api/v1/hse/incidents/{id}/actions                  ← plan d'action
POST /api/v1/hse/incidents/{id}/temoins
```

**Logique CNSS DAT :** si `type ∈ {AT, MP}` → alerte automatique 48h (job `@Scheduled`), génération XML format CNSS DAT.

**Désinjection :**
- `pages/hse/incidents/incident-detail/incident-detail.page.ts`
- `pages/hse/incidents/services/incident-api.service.ts` + `.facade.ts`

**Effort :** 2-3 j.h

---

### B-HSE-02 — Non-conformités + CAPA

**Goal :** entités `NonConformite` + `Capa`.

**Workflow NC :**
```
OUVERTE ── /assigner ──► ASSIGNEE ── /traiter ──► EN_TRAITEMENT ── /verifier ──► VERIFIEE ── /cloturer ──► CLOTUREE
```

**Endpoints :**
```
POST /api/v1/hse/non-conformites/{id}/assigner / traiter / verifier / cloturer
POST /api/v1/hse/non-conformites/{id}/capa            ← création action corrective
```

**Désinjection :**
- `pages/hse/non-conformites/services/nc-api.service.ts` + `.facade.ts`

**Effort :** 1-2 j.h

---

### B-HSE-03 — Inspections + audits

**Goal :** entités `Inspection` + `AuditHse` + `AuditHseLigne`.

**Endpoints :**
```
GET/POST/PUT  /api/v1/hse/inspections
GET           /api/v1/hse/audits
POST          /api/v1/hse/audits
GET           /api/v1/hse/audits/{id}/lignes
POST          /api/v1/hse/audits/{id}/lignes
POST          /api/v1/hse/audits/{id}/cloturer           ← génère NC depuis lignes "non"
GET           /api/v1/hse/audit-templates                ← templates configurables
```

**Désinjection :**
- `pages/hse/inspections/services/inspection-api.service.ts` + `.facade.ts`

**Effort :** 1-2 j.h

---

### B-HSE-04 — Formations HSE

**Goal :** entité `FormationHse`.

**Endpoints :**
```
GET/POST/PUT/DELETE /api/v1/hse/formations
POST                /api/v1/hse/formations/{id}/cloturer
GET                 /api/v1/hse/formations/expirant?days=30
```

**Désinjection :** `pages/hse/formations/services/formation-api.service.ts` + `.facade.ts`.

**Effort :** 1 j.h

---

### B-HSE-05 — EPI dotation

**Goal :** entité `EpiDotation`.

**Logique :**
- Attribution `EpiDotation` → trigger `StockMovement` SORTIE (Wave 1 Inventory).
- Alerte J-30 expiration.

**Endpoints :**
```
GET/POST/PUT/DELETE /api/v1/hse/epi-dotations?employeId=...
GET                 /api/v1/hse/epi-dotations/expirant?days=30
```

**Effort :** 1 j.h

---

### B-HSE-06 — PPSPS + PHS

**Goal :** entités `Ppsps` + `PpspsSection` + `Phs`.

**PPSPS :** 8 sections types (administratif, ouvrage, prévention, organisation, technique, DUER, secours, coactivité).

**Endpoints :**
```
GET   /api/v1/hse/ppsps?chantierId=...
POST  /api/v1/hse/ppsps
GET   /api/v1/hse/ppsps/{id}/sections
POST  /api/v1/hse/ppsps/{id}/sections
GET   /api/v1/hse/ppsps/{id}/pdf
POST  /api/v1/hse/ppsps/{id}/versions

GET/POST  /api/v1/hse/phs
GET       /api/v1/hse/phs/{id}/pdf
```

**Désinjection :**
- `pages/hse/ppsps/ppsps-listing.page.ts`
- `pages/hse/phs/phs-listing.page.ts`

**Effort :** 1-2 j.h

---

### B-HSE-07 — Visites médicales

**Goal :** entité `VisiteMedicale`.

**Endpoints :**
```
GET/POST/PUT/DELETE /api/v1/hse/visites-medicales?employeId=...
GET                 /api/v1/hse/visites-medicales/echeances?days=60
```

**Logique :** si `resultat = INAPTE` → blocage `Pointage` employé (Wave 4 RH).

**Désinjection :**
- `pages/hse/visites-medicales/visites-medicales-listing.page.ts`
- `pages/hse/services/hse-visite-medicale-planning.service.ts`

**Effort :** 1 j.h

---

### B-HSE-08 — Registres légaux

**Goal :** entité `RegistreLegal` (type + obligations + dernière mise à jour).

**Endpoints :**
```
GET/POST/PUT/DELETE /api/v1/hse/registres-legaux?chantierId=...
```

**Désinjection :** `pages/hse/registres-legaux/registres-legaux.page.ts`.

**Effort :** 1 j.h

---

### B-HSE-09 — DUER

**Goal :** entités `Duer` + `DuerRisque` (matrice 5×5 = proba × gravité).

**Endpoints :**
```
GET   /api/v1/hse/duer?chantierId=... | ?societeId=...
POST  /api/v1/hse/duer
GET   /api/v1/hse/duer/{id}/risques
POST  /api/v1/hse/duer/{id}/risques
GET   /api/v1/hse/duer/{id}/pdf
```

**Désinjection :** `pages/hse/duer/duer-listing.page.ts`.

**Effort :** 1 j.h

---

### B-HSE-10 — Read model `HseKpi`

**Goal :** endpoint d'agrégat KPIs (TF1/TF2/TG/Bird).

**Formules :**
- TF1 = (AT avec arrêt × 1_000_000) / heures travaillées
- TF2 = (tous AT × 1_000_000) / heures travaillées
- TG = (jours arrêt × 1000) / heures travaillées
- Pyramide Bird = ratio incidents/presqu'accidents/AT/AT avec arrêt

**Endpoint :**
```
GET /api/v1/hse/kpis?from=2026-01-01&to=2026-12-31&chantierId=...
→ { tf1, tf2, tg, joursSansAccident, pyramideBird, evolutionMensuelle: [...] }
```

**Désinjection :** `pages/hse/tableau-bord-hse/tableau-bord-hse.page.ts`.

**Effort :** 1-2 j.h

## Frontend cleanup

```bash
grep -rE "inject\((HseMockService|HseExtendedMockService)\)" \
  web/app/applications/erp/hse/ \
  web/app/applications/erp/pages/hse/ \
  2>/dev/null
# (vide attendu)
```

**Bonus Round 2 :** profiter de cette wave pour fixer la route `/qualite` 404 en ajoutant un alias dans le routing Angular.

## Testing

| Test | Type | Périmètre |
|---|---|---|
| `IncidentServiceTest` | JUnit | workflow + déclaration CNSS DAT |
| `NcServiceTest` | JUnit | workflow CAPA |
| `AuditHseServiceTest` | JUnit | génération NC depuis lignes |
| `HseKpiServiceTest` | JUnit | TF1/TF2/TG (formules vérifiées) |
| `hse-flow.e2e.spec.ts` | Playwright | incident AT → CNSS DAT XML + alerte 48h |

## Dependencies

- **Wave 3 Chantiers** : `Chantier`.
- **Wave 4 RH** : `Employe` (pour incidents + visites médicales + dotations EPI).
- **Wave 1 Inventory** : `StockMovement` (sortie EPI).

## Definition of Done — HSE

- [ ] B-HSE-01 → B-HSE-10 toutes `[x]`
- [ ] `grep HseMockService|HseExtendedMockService` → vide
- [ ] Les 2 mocks HSE supprimés
- [ ] Route `/qualite` ne retourne plus 404
- [ ] `00-PROGRESS.md` à jour
