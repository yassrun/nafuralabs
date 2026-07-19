# Wave 2 — Ventes & Facturation

## Findings traités

D'après `migration_plan.md` §4 et `00-MOCK-INVENTORY.md` §2.2 :

- 5 `*-api.service.ts` sous `pages/ventes/` ont un `basePath: '/api/v1/ventes/...'` mais redirigent vers `VentesMockService`.
- Aucun domaine `backend/domains/ventes` n'existe.
- Logique métier critique (calculs HT/TVA/TTC, RG, RAS 5%, statuts dérivés) est dans le frontend et les helpers de `VentesMockService`.
- La page `pages/ventes/retenues-garantie` a son **propre** mock `retenues-garantie-mock.facade.ts`.

## Goal

Créer le domaine `backend/domains/ventes` couvrant :

1. Clients (alias filtré de `Partner` Wave 0).
2. Offres commerciales (devis ventes).
3. Bons de commande clients (BCC).
4. Factures clients (vente + situation marché).
5. Avoirs (notes de crédit).
6. Retenues de garantie (suivi cumul + restitution).

Avec **zéro mock** côté frontend à la fin.

## Source-of-truth frontend

Cf. `00-MOCK-INVENTORY.md` §2.2 — 10 fichiers à nettoyer.

```
pages/ventes/clients/services/client-api.service.ts                  ← /api/v1/partners?role=CLIENT
pages/ventes/offres/services/offre-api.service.ts                    ← /api/v1/ventes/offres
pages/ventes/bons-commandes-clients/services/bcc-api.service.ts      ← /api/v1/ventes/bons-commande-client
pages/ventes/factures/services/facture-api.service.ts                ← /api/v1/ventes/factures
pages/ventes/avoirs/services/avoir-api.service.ts                    ← /api/v1/ventes/avoirs
pages/ventes/retenues-garantie/retenues-garantie-mock.facade.ts      ← /api/v1/ventes/retenues-garantie
```

## Cible backend

```
backend/domains/ventes/
```

### Entités à créer

| Entité | Description |
|---|---|
| `Offre` | Offre commerciale (header) |
| `OffreLigne` | Ligne offre (article + qté + prix) |
| `BonCommandeClient` | BCC (header) |
| `BonCommandeClientLigne` | Ligne BCC |
| `FactureClient` | Facture vente (header) |
| `FactureClientLigne` | Ligne facture |
| `Avoir` | Note de crédit (header) |
| `AvoirLigne` | Ligne avoir |
| `RetenueGarantie` | Suivi RG par marché/facture |

> **Pas de `Client` entité** — on filtre `Partner` par rôle CLIENT (Wave 0). Le service frontend `ClientApiService` consomme `/api/v1/partners?role=CLIENT`.

## Tasks

### B-VEN-01 — Clients (alias Partner CLIENT)

**Goal :** ne pas dupliquer Partner, mais offrir un endpoint pratique pour le frontend ventes.

**Décision :** soit on consomme `/api/v1/partners?role=CLIENT` directement (préféré), soit on crée un alias `/api/v1/ventes/clients` qui redirige.

**Recommandation :** garder le service Angular `ClientApiService` mais override `basePath` à `/api/v1/partners`, et `searchFields` filtré par rôle via query param.

**À faire frontend uniquement :**
```typescript
@Injectable({ providedIn: 'root' })
export class ClientApiService extends FeatureApiService<Client, ClientCreate, ClientUpdate> {
  protected override basePath = '/api/v1/partners';
  protected override searchFields = ['code', 'raisonSociale', 'ice'];
  protected override defaultQuery = { role: 'CLIENT' };
}
```

(Le `FeatureApiService` doit supporter `defaultQuery` — à ajouter si manquant côté `@lib/anatomy`.)

**Effort :** 1-2 j.h

---

### B-VEN-02 — Offres commerciales + transitions

**Goal :** entités `Offre` + `OffreLigne`.

**Workflow :**
```
BROUILLON ── /submit ──► SOUMIS
SOUMIS    ── /accept ──► ACCEPTE ── /convert-to-bcc ──► CONVERTI
SOUMIS    ── /reject ──► REJETE
SOUMIS/ACCEPTE ── /cancel ──► ANNULE
```

**Endpoints custom :**
```
POST /api/v1/ventes/offres/{id}/submit
POST /api/v1/ventes/offres/{id}/accept
POST /api/v1/ventes/offres/{id}/reject
POST /api/v1/ventes/offres/{id}/cancel
POST /api/v1/ventes/offres/{id}/convert-to-bcc
GET  /api/v1/ventes/offres/{id}/pdf
```

**Calculs server-side :** total HT = somme lignes, TVA selon taux ligne, TTC, joursValidite (auto).

**Désinjection :** `pages/ventes/offres/services/offre-api.service.ts` + `.facade.ts`.

**Effort :** 2-3 j.h

---

### B-VEN-03 — Bons de commande clients (BCC)

**Goal :** entités `BonCommandeClient` + `BonCommandeClientLigne`.

**Workflow :**
```
BROUILLON ── /confirm ──► CONFIRME ── /convert-to-facture ──► FACTURE
```

**Endpoints :**
```
POST /api/v1/ventes/bons-commande-client/{id}/confirm
POST /api/v1/ventes/bons-commande-client/{id}/convert-to-facture
```

**Désinjection :** `pages/ventes/bons-commandes-clients/services/bcc-api.service.ts` + `.facade.ts`.

**Effort :** 2-3 j.h

---

### B-VEN-04 — Factures clients (HT/TVA/TTC/RG/RAS server-side)

**Goal :** entité `FactureClient` avec calculs financiers MA descendus côté backend.

**Champs :**
```
id, tenant_id, numero, client_id, chantier_id (nullable), marche_id (nullable),
type (VENTE | SITUATION), date_emission, date_echeance,
montant_ht, montant_tva, montant_ttc,
taux_rg (numeric), montant_rg, montant_ras (5%),
status (BROUILLON/SOUMISE/VALIDEE/PAYEE/PARTIELLEMENT_PAYEE/IMPAYEE/ANNULEE),
joursRetard (computed),
hash_efacture (DGI 2026-2027 — préparation),
qr_code_data (DGI),
created_at, updated_at
```

**Workflow :**
```
BROUILLON ── /submit ──► SOUMISE ── /validate ──► VALIDEE ── /comptabiliser ──► (écriture)
VALIDEE ── /settle (partial/full règlement) ──► PARTIELLEMENT_PAYEE / PAYEE
```

**Endpoints :**
```
POST /api/v1/ventes/factures/{id}/submit / validate / cancel / comptabiliser
POST /api/v1/ventes/factures/{id}/recalc-totals     ← debug/admin
GET  /api/v1/ventes/factures/{id}/pdf
GET  /api/v1/ventes/factures/{id}/qr-data           ← e-facture DGI
GET  /api/v1/ventes/factures/en-retard?days=30
```

**Logique RAS 5% :** si `marche_id` rempli et le marché est public → `montant_ras = HT × 5%`, comptabilisation 4453 (cf. Wave 1 Finance B-FIN-03).

**Tests unitaires obligatoires :** `FactureCalculatorTest` (montants), `RetenueSourceServiceTest` (RAS), `FactureWorkflowTest`.

**Désinjection :** `pages/ventes/factures/services/facture-api.service.ts` + `.facade.ts`.

**Effort :** 3-4 j.h

---

### B-VEN-05 — Avoirs

**Goal :** entités `Avoir` + `AvoirLigne` (notes de crédit liées à facture origine).

**Workflow :**
```
BROUILLON ── /validate ──► VALIDE ── /comptabiliser ──► (écriture inverse)
```

**Endpoints :**
```
GET    /api/v1/ventes/avoirs
POST   /api/v1/ventes/avoirs
POST   /api/v1/ventes/avoirs/{id}/validate
POST   /api/v1/ventes/avoirs/{id}/comptabiliser
GET    /api/v1/ventes/factures/{factureId}/avoirs
```

**Désinjection :** `pages/ventes/avoirs/services/avoir-api.service.ts` + `.facade.ts`.

**Effort :** 1-2 j.h

---

### B-VEN-06 — Retenues de garantie (suivi cumul + restitution)

**Goal :** entité `RetenueGarantie` qui agrège les retenues par marché et suit la restitution.

**Logique :**
- Une situation/facture marché impacte une `RetenueGarantie` (cumul).
- `RetenueGarantie.statut` ∈ {IMMOBILISEE, DEMANDE_RESTITUTION, RESTITUEE_PARTIEL, RESTITUEE_TOTAL}.
- Endpoint `restituer` génère un règlement client (cf. Wave 1 Finance).

**Endpoints :**
```
GET    /api/v1/ventes/retenues-garantie?marcheId=...&statut=...
POST   /api/v1/ventes/retenues-garantie/{id}/restituer?montant=...
GET    /api/v1/ventes/retenues-garantie/{id}/historique
GET    /api/v1/ventes/retenues-garantie/synthese?clientId=...
```

**Désinjection :** `pages/ventes/retenues-garantie/retenues-garantie-mock.facade.ts` → nouveau `retenues-garantie.facade.ts`.

**Effort :** 1-2 j.h

## Frontend cleanup

```bash
grep -rE "inject\(VentesMockService\)" \
  web/app/applications/erp/ventes/ \
  web/app/applications/erp/pages/ventes/ \
  2>/dev/null
# (vide attendu)
```

## Testing

| Test | Type | Périmètre |
|---|---|---|
| `OffreServiceTest` | JUnit | calculs + transitions |
| `FactureCalculatorTest` | JUnit | HT/TVA/TTC + RG + RAS |
| `FactureWorkflowTest` | JUnit | submit/validate/comptabiliser |
| `AvoirServiceTest` | JUnit | écriture inverse |
| `RetenueGarantieServiceTest` | JUnit | cumul + restitution |
| `ventes-flow.e2e.spec.ts` | Playwright | Offre → BCC → Facture → Règlement → Avoir partiel |

## Dependencies

- **Wave 0** : `partner` (CLIENT), `currency`.
- **Wave 1 Inventory** : `Item` (lignes facture).
- **Wave 1 Finance** : `PaymentMode`, `JournalEntry` (comptabilisation), `Reglement`.

## Definition of Done — Ventes

- [ ] B-VEN-01 → B-VEN-06 toutes `[x]`
- [ ] `grep VentesMockService` → vide
- [ ] `VentesMockService` quarantiné
- [ ] `00-PROGRESS.md` à jour
