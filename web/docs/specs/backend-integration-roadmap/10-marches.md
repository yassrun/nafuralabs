# Wave 5 — Marchés BTP

## Findings traités

D'après `migration_plan.md` §9 et `00-MOCK-INVENTORY.md` §2.7 :

- **Aucun `*-api.service.ts`** sous `pages/marches/` — les pages **bypassent** complètement le pattern API service.
- 12 fichiers (pages contrats, avenants, cautions, factures, DGD, OS, pénalités, révisions-prix) injectent directement `MarchesMockService`.
- Logique métier critique (DGD, formule K, propagation avenant) est dans `web/app/applications/erp/pages/marches/services/marches-mock.service.ts` → à descendre côté backend.
- Sidebar a un doublon **Marchés BTP** / **Marchés & Facturation** que la roadmap Round 2 Task 07 prévoit de fusionner.

## Goal

Créer `backend/domains/marches` pour :

1. Contrats marché (master + lignes BPU).
2. Avenants (workflow signature + propagation impact).
3. Cautions bancaires (provisoire/définitive/RG + workflow).
4. Factures marché (situations + DGD).
5. Révisions de prix (formule K + indices BTP).
6. Pénalités.
7. Ordres de service (OS).
8. Réceptions provisoire / définitive.

## Source-of-truth frontend

Cf. `00-MOCK-INVENTORY.md` §2.7 — 12 fichiers à nettoyer.

Aucun `*-api.service.ts` existant → il faut **créer** un service Angular pour chaque sous-module marchés :

```
pages/marches/contrats/services/contrat-marche-api.service.ts        ← /api/v1/marches/contrats
pages/marches/avenants/services/avenant-api.service.ts               ← /api/v1/marches/avenants
pages/marches/cautions/services/caution-api.service.ts               ← /api/v1/marches/cautions
pages/marches/factures/services/facture-marche-api.service.ts        ← /api/v1/marches/factures
pages/marches/dgd/services/dgd-api.service.ts                        ← /api/v1/marches/dgd
pages/marches/os/services/os-api.service.ts                          ← /api/v1/marches/os
pages/marches/penalites/services/penalite-api.service.ts             ← /api/v1/marches/penalites
pages/marches/revisions-prix/services/revision-prix-api.service.ts   ← /api/v1/marches/revisions-prix
```

## Cible backend

```
backend/domains/marches/
```

### Entités à créer

| Entité | Description |
|---|---|
| `ContratMarche` | Contrat marché (master, lien `chantier_id`) |
| `ContratMarcheLigne` | Ligne BPU/PUF/PGF |
| `Avenant` | Avenant (impact montant + délai) |
| `Caution` | Caution bancaire (PROVISOIRE/DEFINITIVE/RG/AVANCE) |
| `FactureMarche` | Facture marché (situations rattachées) |
| `Dgd` | Décompte Général Définitif |
| `OrdreService` | OS (COMMENCEMENT/ARRET/REPRISE/MODIFICATION/NOTIFICATION) |
| `Penalite` | Pénalité (retard, qualité, autre) |
| `RevisionPrix` | Révision prix (formule K + indices) |
| `IndiceBtp` | Référentiel indices BTP01..BTPxx mensuels |
| `Reception` | Réception provisoire / définitive |
| `ReserveReception` | Réserve à lever |

## Tasks

### B-MAR-01 — Contrats marché + BPU

**Goal :** entité `ContratMarche` + `ContratMarcheLigne`.

**Champs `ContratMarche` :**
```
id, tenant_id, numero, chantier_id, client_id (MOA),
type_marche (FORFAITAIRE / BPU / METRE_QUANTITATIF),
type_ccag_t (TRAVAUX / SERVICE / FOURNITURE),
date_notification, date_demarrage, duree_mois,
montant_ht, taux_tva, taux_rg, taux_ras, taux_avance,
status (BROUILLON / NOTIFIE / EN_COURS / RECEPTION_PROVISOIRE / RECEPTION_DEFINITIVE / CLOS),
created_at, updated_at
```

**Endpoints :**
```
GET    /api/v1/marches/contrats
POST   /api/v1/marches/contrats
POST   /api/v1/marches/contrats/{id}/notifier        ← notification au titulaire
POST   /api/v1/marches/contrats/{id}/cloturer
GET    /api/v1/marches/contrats/{id}/lignes          ← BPU
POST   /api/v1/marches/contrats/{id}/lignes
```

**Désinjection :**
- `pages/marches/contrats/contrat-detail/contrat-detail.page.ts`
- `pages/marches/contrats/contrat-listing/contrat-listing.page.ts`

**Effort :** 2-3 j.h

---

### B-MAR-02 — Avenants (workflow + propagation impact)

**Goal :** entité `Avenant`.

**Workflow :**
```
BROUILLON ── /soumettre-moa ──► EN_SIGNATURE
EN_SIGNATURE ── /signer ──► SIGNE ── /propager-impact ──► APPLIQUE
                          └ /annuler ──► ANNULE
```

**Propagation impact :** lorsque `propager-impact` est appelé, le service met à jour :
- `Chantier.montant_ht` (+ delta montant avenant)
- `Chantier.duree_mois` (+ delta jours / 30)
- `BudgetChantier.montant_revise` (recalcul)
- Échéancier cautions (recalculé)

**Endpoints :**
```
POST /api/v1/marches/avenants
POST /api/v1/marches/avenants/{id}/soumettre-moa
POST /api/v1/marches/avenants/{id}/signer
POST /api/v1/marches/avenants/{id}/propager-impact
POST /api/v1/marches/avenants/{id}/annuler
GET  /api/v1/marches/avenants/{id}/impact-simulation  ← preview impact sans appliquer
```

**Désinjection :**
- `pages/marches/avenants/avenant-detail/avenant-detail.page.ts`
- `pages/marches/avenants/avenant-listing/avenant-listing.page.ts`

**Tests unitaires :** `AvenantPropagationServiceTest`.

**Effort :** 2 j.h

---

### B-MAR-03 — Cautions bancaires

**Goal :** entité `Caution` avec types et workflow.

**Champs :**
```
id, tenant_id, numero, contrat_marche_id, type (PROVISOIRE/DEFINITIVE/RG/AVANCE),
banque_partner_id, montant, date_emission, date_expiration,
status (ACTIVE / RENOUVELEE / MAINLEVEE / EXPIRE),
scan_url, created_at, updated_at
```

**Workflow :**
```
ACTIVE ── /alerter-expiration (cron J-30/J-7) ──► ACTIVE (alerte)
ACTIVE ── /renouveler ──► ACTIVE (nouveau enregistrement)
ACTIVE ── /demander-mainlevee (après DGD) ──► EN_MAINLEVEE ──► MAINLEVEE
```

**Endpoints :**
```
POST /api/v1/marches/cautions
POST /api/v1/marches/cautions/{id}/renouveler
POST /api/v1/marches/cautions/{id}/demander-mainlevee
POST /api/v1/marches/cautions/{id}/mainlever
GET  /api/v1/marches/cautions/expirant?days=30
```

**Désinjection :** `pages/marches/cautions/caution-listing/caution-listing.page.ts`.

**Effort :** 1-2 j.h

---

### B-MAR-04 — Factures marché + DGD

**Goal :** entité `FactureMarche` (rattache N situations Wave 3) + entité `Dgd`.

**Logique DGD :**
```
DGD.cumul_situations = somme(facture_marche.montant_ht VALIDEE)
DGD.cumul_rg = somme(retenues_garantie immobilisées)
DGD.cumul_penalites = somme(penalite VALIDEE)
DGD.cumul_revisions = somme(revision_prix APPLIQUEE)
DGD.net_a_payer = cumul_situations + cumul_revisions - cumul_rg - cumul_penalites - cumul_avances
```

**Workflow DGD :**
```
BROUILLON ── /soumettre-moa ──► SOUMIS_MOA ── /notifier ──► NOTIFIE ── /marquer-paye ──► PAYE
```

**Endpoints :**
```
GET    /api/v1/marches/factures
POST   /api/v1/marches/factures
POST   /api/v1/marches/factures/{id}/valider           ← crée FactureClient (Wave 2 Ventes)

POST   /api/v1/marches/contrats/{id}/dgd/generate     ← génération auto (post réception définitive)
GET    /api/v1/marches/dgd
POST   /api/v1/marches/dgd/{id}/soumettre-moa / notifier / marquer-paye
GET    /api/v1/marches/dgd/{id}/pdf
```

**Tests unitaires obligatoires :** `DgdCalculatorTest`.

**Désinjection :**
- `pages/marches/factures/**`
- `pages/marches/dgd/dgd-listing.page.ts`

**Effort :** 2-3 j.h

---

### B-MAR-05 — Révisions prix (formule K)

**Goal :** entité `RevisionPrix` + référentiel `IndiceBtp`.

**Formule K (variante par CCAG-T) :**
```
K = (a0 + a1 * Mi/M0 + a2 * S1i/S10 + a3 * S2i/S20 + ...) / (a0 + a1 + a2 + a3 + ...)
```
Où `Mi`, `S1i`, etc. sont des indices mensuels publiés par ANP/HCP.

**Endpoints :**
```
GET    /api/v1/marches/revisions-prix?contratId=...
POST   /api/v1/marches/revisions-prix/calculer        ← calcul K pour 1 période
POST   /api/v1/marches/revisions-prix/{id}/appliquer  ← matérialise sur situation

GET    /api/v1/marches/indices-btp?periode=2026-04
POST   /api/v1/marches/indices-btp/import-csv          ← import mensuel ANP/HCP
```

**Tests unitaires obligatoires :** `RevisionPrixServiceTest` (formule K).

**Désinjection :** `pages/marches/revisions-prix/revisions-prix.page.ts`.

**Effort :** 1-2 j.h

---

### B-MAR-06 — Pénalités

**Goal :** entité `Penalite`.

**Endpoints :**
```
GET    /api/v1/marches/penalites?contratId=...
POST   /api/v1/marches/penalites
POST   /api/v1/marches/penalites/{id}/valider          ← intègre au DGD
```

**Désinjection :** `pages/marches/penalites/penalites.page.ts`.

**Effort :** 1 j.h

---

### B-MAR-07 — Ordres de service (OS)

**Goal :** entité `OrdreService` (types : COMMENCEMENT/ARRET/REPRISE/MODIFICATION/NOTIFICATION).

**Endpoints :**
```
GET    /api/v1/marches/os?contratId=...
POST   /api/v1/marches/os
POST   /api/v1/marches/os/{id}/notifier
GET    /api/v1/marches/os/{id}/pdf
```

**Logique :** OS d'arrêt déclenche `Chantier.status = SUSPENDU` (Wave 3 Chantiers).

**Désinjection :** `pages/marches/os/os-listing.page.ts`.

**Effort :** 1 j.h

---

### B-MAR-08 — Réceptions provisoire / définitive

**Goal :** entités `Reception` + `ReserveReception`.

**Endpoints :**
```
POST   /api/v1/marches/contrats/{id}/reception-provisoire
POST   /api/v1/marches/contrats/{id}/reception-definitive
GET    /api/v1/receptions/{id}/reserves
POST   /api/v1/receptions/{id}/reserves
POST   /api/v1/reserves/{id}/lever
```

**Logique :** réception définitive → trigger génération DGD (B-MAR-04).

**Désinjection :** dépend de Wave 3 Chantiers.

**Effort :** 1-2 j.h

## Frontend cleanup

```bash
grep -rE "inject\(MarchesMockService\)" \
  web/app/applications/erp/pages/marches/ \
  2>/dev/null
# (vide attendu)
```

## Testing

| Test | Type | Périmètre |
|---|---|---|
| `ContratMarcheServiceTest` | JUnit | CRUD + transitions |
| `AvenantPropagationServiceTest` | JUnit | impact budget + délai |
| `DgdCalculatorTest` | JUnit | net à payer |
| `RevisionPrixServiceTest` | JUnit | formule K |
| `CautionServiceTest` | JUnit | workflow renouvellement / mainlevée |
| `marches-flow.e2e.spec.ts` | Playwright | Contrat → Avenant signé → propagation → Situation → Facture → Pénalité → DGD |

## Dependencies

- **Wave 0** : `partner` (client MOA, banques pour cautions).
- **Wave 2 Ventes** : `FactureClient` (factures marché en aval).
- **Wave 3 Chantiers** : `Chantier` (lien obligatoire), `SituationTravaux`.

## Definition of Done — Marchés

- [ ] B-MAR-01 → B-MAR-08 toutes `[x]`
- [ ] `grep MarchesMockService` → vide
- [ ] `MarchesMockService` supprimé
- [ ] Doublon sidebar "Marchés BTP" / "Marchés & Facturation" fusionné (Round 2 Task 07.0)
- [ ] `00-PROGRESS.md` à jour
