# Wave 2 — Achats & Sous-traitance

## Findings traités

D'après `migration_plan.md` §3 et `00-MOCK-INVENTORY.md` §2.1 :

- 5 `*-api.service.ts` sous `pages/achats/` ont un `basePath: '/api/v1/achats/...'` mais **redirigent toutes leurs méthodes vers `AchatsMockService`** (Class B — mock-backed wrapper).
- Aucun domaine `backend/domains/achats` n'existe.
- 11 fichiers frontend injectent `AchatsMockService` directement (api, facades, pages, composants `matching.service.ts`).
- La logique métier critique (3-way matching, scoring AO, workflow DA→AO→BC→FF) est **codée côté frontend** dans `web/app/applications/erp/achats/services/matching.service.ts` → à déplacer côté backend.

## Goal

Créer le domaine `backend/domains/achats` couvrant :

1. Demandes d'achat (DA)
2. Appels d'offres achat (AO) + offres fournisseurs reçues
3. Bons de commande achat (BC)
4. Réceptions (lien BL)
5. Factures fournisseurs (FF) + 3-way matching
6. Contrats fournisseurs + sous-traitance Art. 187 CGI
7. Catalogue articles fournisseur (prix négociés)
8. Attestations légales (CNSS, fiscale, AMO, …)

Avec **zéro mock** côté frontend à la fin.

## Source-of-truth frontend

Cf. `00-MOCK-INVENTORY.md` §2.1 — 11 fichiers à nettoyer.

```
pages/achats/demandes/services/demande-api.service.ts          ← /api/v1/achats/demandes
pages/achats/appels-offres/services/ao-api.service.ts          ← /api/v1/achats/appels-offres
pages/achats/commandes/services/bc-api.service.ts              ← /api/v1/achats/bons-commande
pages/achats/contrats/services/contrat-api.service.ts          ← /api/v1/achats/contrats
pages/achats/fournisseurs/services/fournisseur-api.service.ts  ← /api/v1/achats/fournisseurs OU /api/v1/partners?role=FOURNISSEUR
```

> **Décision :** `fournisseurs` consomme `/api/v1/partners?role=FOURNISSEUR` (Wave 0 B-FND-02). Le service Angular peut garder le nom `FournisseurApiService` mais étendre un client basé sur `PartnerApiService`.

## Cible backend

```
backend/domains/achats/
```

### Entités à créer

| Entité | Description |
|---|---|
| `DemandeAchat` | DA (header) |
| `DemandeAchatLigne` | Ligne DA |
| `AppelOffreAchat` | AO achat (header) |
| `AppelOffreLigne` | Ligne AO (article × qté) |
| `OffreFournisseur` | Réponse d'un fournisseur à un AO |
| `OffreFournisseurLigne` | Ligne offre fournisseur (prix unitaire proposé) |
| `BonCommande` | BC (header) |
| `BonCommandeLigne` | Ligne BC |
| `Reception` | Bon de livraison reçu (header) |
| `ReceptionLigne` | Ligne reçue (lien `bonCommandeLigneId`) |
| `FactureFournisseur` | FF (header) |
| `FactureFournisseurLigne` | Ligne facture |
| `ContratFournisseur` | Contrat cadre |
| `ContratSousTraitance` | Contrat ST avec Art. 187 CGI |
| `CatalogueFournisseur` | Prix négocié article × fournisseur |
| `AttestationFournisseur` | Attestation légale (type + validité + scan) |
| `MatchingReception` | Lien 3-way (BC ↔ BL ↔ FF) |

## Tasks

### B-ACH-01 — Demandes d'achat (DA) + transitions

**Goal :** entités `DemandeAchat` + `DemandeAchatLigne` avec workflow.

**Workflow :**
```
BROUILLON ── /submit ──► SOUMIS ── /approve ──► APPROUVE
                              └── /reject ──► REJETE
APPROUVE ── /convert-to-ao ──► CONVERTIE
```

**Endpoints custom :**
```
POST /api/v1/achats/demandes/{id}/submit
POST /api/v1/achats/demandes/{id}/approve
POST /api/v1/achats/demandes/{id}/reject
POST /api/v1/achats/demandes/{id}/convert-to-ao
```

**Désinjection :**
- `pages/achats/demandes/services/demande-api.service.ts` → pure HTTP
- `pages/achats/demandes/services/demande.facade.ts` → retire `inject(AchatsMockService)` ; expose les transitions via `HttpClient`.

**Effort :** 2-3 j.h

---

### B-ACH-02 — Appels d'offres achat (AO) + offres fournisseurs

**Goal :** entités `AppelOffreAchat` + `AppelOffreLigne` + `OffreFournisseur` + `OffreFournisseurLigne`.

**Workflow AO :**
```
BROUILLON ── /publish ──► PUBLIE (envoyé aux fournisseurs)
PUBLIE ── /clore-reception ──► CLOTURE
CLOTURE ── /attribuer/{offreFournisseurId} ──► ATTRIBUE
```

**Endpoints custom :**
```
POST /api/v1/achats/appels-offres/{id}/publish
POST /api/v1/achats/appels-offres/{id}/clore-reception
POST /api/v1/achats/appels-offres/{id}/attribuer/{offreFournisseurId}
GET  /api/v1/achats/appels-offres/{id}/comparatif    ← scoring server-side
POST /api/v1/achats/appels-offres/{id}/scoring/recompute
```

**Scoring AO côté backend :** reprendre la logique de `web/app/applications/erp/achats/services/matching.service.ts` (composantes prix /50, délai /15, qualité /15, historique /10, art187 /10).

**Désinjection :**
- `pages/achats/appels-offres/services/ao-api.service.ts`
- `pages/achats/appels-offres/services/ao.facade.ts`
- `pages/achats/appels-offres/ao-comparatif/ao-comparatif.page.ts`

**Effort :** 3-4 j.h

---

### B-ACH-03 — Bons de commande achat (BC) + réceptions

**Goal :** entités `BonCommande` + `BonCommandeLigne` + `Reception` + `ReceptionLigne`.

**Workflow BC :**
```
BROUILLON ── /submit ──► SOUMIS ── /approve ──► APPROUVE
APPROUVE ── /send ──► ENVOYE (au fournisseur)
ENVOYE ──► RECU_PARTIEL (au moins 1 réception) ──► RECU_TOTAL
ENVOYE/RECU_PARTIEL ── /cancel ──► ANNULE
```

**Logique réception :**
- `Reception` créée pour 1 BC ou plusieurs lignes BC partielles
- Trigger : génération auto d'un mouvement `StockMovement` type RECEPTION (cf. Wave 1 B-INV-04).

**Endpoints custom :**
```
POST /api/v1/achats/bons-commande/{id}/submit / approve / send / cancel
POST /api/v1/achats/bons-commande/{id}/receptions   ← création réception partielle ou totale
GET  /api/v1/achats/bons-commande/{id}/receptions   ← liste réceptions
GET  /api/v1/achats/bons-commande/{id}/factures     ← factures matchées
```

**Désinjection :**
- `pages/achats/commandes/services/bc-api.service.ts`
- `pages/achats/commandes/services/bc.facade.ts`

**Effort :** 3-4 j.h

---

### B-ACH-04 — Contrats fournisseurs + Sous-traitance Art. 187

**Goal :** entités `ContratFournisseur` + `ContratSousTraitance`.

**Champs `ContratSousTraitance` spécifiques MA :**
```
art187_declare (boolean)
art187_valide_moa (boolean)
retenue_garantie_taux (numeric)
paiement_direct_moa (boolean)
```

**Endpoints :**
```
GET    /api/v1/achats/contrats?type=FOURNISSEUR | SOUS_TRAITANCE
POST   /api/v1/achats/contrats
PUT    /api/v1/achats/contrats/{id}
POST   /api/v1/achats/contrats/{id}/sign
POST   /api/v1/achats/contrats/{id}/terminate
GET    /api/v1/achats/contrats/{id}/situations    ← situations ST liées (cf. Marchés)
```

**Désinjection :** `pages/achats/contrats/services/contrat-api.service.ts` + `.facade.ts`.

**Effort :** 2-3 j.h

---

### B-ACH-05 — Catalogue articles fournisseur

**Goal :** entité `CatalogueFournisseur` (prix négocié article × fournisseur).

**Endpoints :**
```
GET  /api/v1/achats/catalogues?fournisseurId=...&itemId=...
POST /api/v1/achats/catalogues
PUT  /api/v1/achats/catalogues/{id}
DELETE /api/v1/achats/catalogues/{id}
POST /api/v1/achats/catalogues/import-excel    ← upload Excel/CSV
```

**Logique BC :** à la création d'une ligne BC avec un article + fournisseur, le service backend pré-remplit le prix depuis le catalogue.

**Effort :** 1-2 j.h

---

### B-ACH-06 — Attestations légales (workflow validité)

**Goal :** entité `AttestationFournisseur` avec 8 types (CNSS, FISCALE, AMO, RC, IF, ICE, PATENTE, RIB).

**Champs :**
```
id, tenant_id, partner_id, type, date_emission, date_expiration,
scan_url (objet stockage), status (VALIDE, EXPIRE_BIENTOT, EXPIRE),
created_at, updated_at
```

**Logique :** job `@Scheduled(cron = "0 0 1 * * *")` recalcule `status` quotidiennement.

**Endpoints :**
```
GET    /api/v1/achats/attestations?partnerId=...&status=...
POST   /api/v1/achats/attestations
PUT    /api/v1/achats/attestations/{id}
DELETE /api/v1/achats/attestations/{id}
GET    /api/v1/partners/{partnerId}/attestations-status     ← agrégat 8 chips
```

**Règle blocage règlement (configurable) :** si fiscale + CNSS sont EXPIRE → endpoint paiement refuse.

**Effort :** 1-2 j.h

---

### B-ACH-07 — 3-way matching BC ↔ BL ↔ FactureFournisseur

**Goal :** entités `FactureFournisseur` + `FactureFournisseurLigne` + `MatchingReception`.

**Logique :**
- Une FF référence 1 ou plusieurs `bonCommandeId`.
- Pour chaque ligne FF, vérification automatique vs ligne BC vs ligne Réception correspondante.
- Tolérances configurables (±2% prix, ±5% qté).
- Statut FF = `ECART_BLOQUE` si écart hors tolérance → validation impossible.

**Endpoints :**
```
GET    /api/v1/achats/factures-fournisseurs
POST   /api/v1/achats/factures-fournisseurs
POST   /api/v1/achats/factures-fournisseurs/{id}/matching/recompute
POST   /api/v1/achats/factures-fournisseurs/{id}/validate     ← refuse si ECART_BLOQUE
POST   /api/v1/achats/factures-fournisseurs/{id}/comptabiliser ← génère écriture
GET    /api/v1/achats/factures-fournisseurs/{id}/matching
```

**Tests unitaires obligatoires :** `MatchingServiceTest` (`pages/achats/.../matching.service.ts` → portage Java exact).

**Désinjection :**
- `pages/finance/factures-fournisseurs/ff-listing/ff-listing.page.ts`
- `pages/finance/factures-fournisseurs/ff-detail/ff-detail.page.ts`
- `web/app/applications/erp/achats/services/matching.service.ts` (reste comme orchestrateur frontend pur, sans `inject(AchatsMockService)`).

**Effort :** 2-3 j.h

## Frontend cleanup

```bash
grep -rE "inject\(AchatsMockService\)" \
  web/app/applications/erp/achats/ \
  web/app/applications/erp/pages/achats/ \
  web/app/applications/erp/pages/finance/factures-fournisseurs/ \
  2>/dev/null
# (vide attendu)
```

## Testing

| Test | Type | Périmètre |
|---|---|---|
| `DemandeAchatServiceTest` | JUnit | transitions DA |
| `AppelOffreServiceTest` | JUnit | scoring + attribution |
| `BonCommandeServiceTest` | JUnit | transitions + génération réception |
| `ReceptionServiceTest` | JUnit | impact stock |
| `MatchingServiceTest` | JUnit | 3-way + tolérances |
| `AttestationServiceTest` | JUnit | statut + blocage règlement |
| `achats-flow.e2e.spec.ts` | Playwright | DA → AO → BC → Réception → FF (matching OK) |

## Dependencies

- **Wave 0** : `partner` (FOURNISSEUR).
- **Wave 1 Inventory** : `Item`, `Warehouse`, `StockMovement` (réceptions).
- **Wave 1 Finance** : `PaymentMode`, `JournalEntry` (comptabilisation FF), `Reglement` (paiement fournisseur).

## Definition of Done — Achats

- [ ] B-ACH-01 → B-ACH-07 toutes `[x]`
- [ ] `grep AchatsMockService` → vide
- [ ] `AchatsMockService` quarantiné
- [ ] `00-PROGRESS.md` à jour
