# Agent — Chantiers · Situations de travaux

> **Objet** : situations cumulatives de travaux (méthode marocaine FFB) → factures progressives client. Au cœur du cycle financier BTP.
> **Route** : `/chantiers/situations` · **Permission** : `chantiers.situation.*`

## 0. Pré-requis

[README chantiers](README.md) — modèles `Situation`, `SituationLigne`. [00-MOCK-DATA-STRATEGY §TVA, §Numérotation](../00-MOCK-DATA-STRATEGY.md).

## 1. Concept métier (lecture obligatoire)

Une **situation de travaux** est un décompte cumulatif **par lot** des travaux exécutés à date, validé par le maître d'ouvrage (MOA). Mécanisme :

1. Chaque mois (ou rythme contractuel), conducteur travaux émet une situation N basée sur l'avancement réel.
2. La situation contient :
   - Cumul travaux à date (par lot, en MAD HT).
   - Cumul précédent (situation N-1).
   - **Travaux période** = cumul N - cumul N-1.
3. Retenues réglementaires :
   - **Retenue garantie 7%** sur le cumul (libérée à la réception définitive après 1 an).
   - **Retenue avance** (si avance perçue) — résorbée proportionnellement à l'avancement.
4. Le **net à payer** est facturé au MOA.
5. Workflow : `BROUILLON → SOUMISE → VALIDEE_MOA → FACTUREE → PAYEE`.

## 2. Routes

```ts
export const SITUATIONS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./situation-listing/situation-listing.page').then(m => m.SituationListingPage) },
  { path: 'new', loadComponent: () => import('./situation-detail/situation-detail.page').then(m => m.SituationDetailPage) },
  { path: ':id', loadComponent: () => import('./situation-detail/situation-detail.page').then(m => m.SituationDetailPage) },
];
```

## 3. Listing

### Colonnes

| Key | Label | Type | Largeur |
|-----|-------|------|---------|
| `numero` | N° situation | text | 130px |
| `chantierCode` | Chantier | link | 110px |
| `chantierName` | Désignation chantier | text | flex |
| `numeroOrdre` | N° ord. | number | 60px |
| `datePeriodeFin` | Période | date | 110px |
| `cumulCourantHt` | Cumul HT | currency | 130px |
| `travauxPeriodeHt` | Travaux période | currency | 130px |
| `retenueGarantieMontant` | Retenue 7% | currency (gris) | 110px |
| `netAPayerHt` | Net HT | currency (bold) | 130px |
| `netAPayerTtc` | Net TTC | currency (bold) | 130px |
| `status` | Statut | badge | 130px |
| `delaiAttente` | Attente MOA (j) | number + couleur | 90px |

`delaiAttente` calculé : si `status === 'SOUMISE'`, jours depuis `dateEmission`. Couleur : > 30j orange, > 60j rouge.

### Filtres

- `chantierId`, `status`, `dateRange`, `montantHtRange`.

### Filtres rapides

- `Brouillons`, `À valider`, `À facturer`, `En retard de paiement`, `Mes situations`.

### CTA

`+ Nouvelle situation` → modal sélection chantier + numéro ordre auto.

### Actions ligne

- `Imprimer décompte` — PDF complet du décompte de travaux.
- `Soumettre au MOA` (si BROUILLON).
- `Valider` (si SOUMISE — droit MOA simulé en V1 par admin).
- `Émettre la facture` (si VALIDEE_MOA) → crée une `FactureClient` en mode brouillon.

## 4. Detail — `SituationDetailPage`

### Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← SIT-CH-001-04   Résidence Yasmine — Période : 04/2026  [SOUMISE]      │
│                                                                          │
│  Chantier : CH-2026-001 │ N° ordre : 4/12 │ Émission : 02/05/2026       │
│                                                                          │
│  [⋯ Actions]   [Imprimer décompte]   [Soumettre]   [Valider]            │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌─ En-tête ────────────────────────────────────────────────────────┐    │
│ │ Période début │ 01/04/2026                                       │    │
│ │ Période fin   │ 30/04/2026                                       │    │
│ │ Cumul N-1     │ 8 450 000,00 MAD HT                              │    │
│ │ Cumul N       │ 9 875 000,00 MAD HT  (saisi)                     │    │
│ │ Travaux N     │ 1 425 000,00 MAD HT  (calc.)                     │    │
│ └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│ ┌─ Lots & avancement ──────────────────────────────────────────────┐    │
│ │ Lot │ Désignation       │ Unité │ Qté tot │ Qté cumul │ PU  │ Mtt │    │
│ │ 01  │ Gros œuvre infra  │  m³   │  1 200  │   1 200   │ 850 │ ...│    │
│ │ 02  │ Gros œuvre super  │  m³   │  1 600  │   1 250   │ 920 │ ...│    │
│ │ 03  │ Étanchéité        │  m²   │   680   │     85    │ 220 │ ...│    │
│ │ ...                                                                │    │
│ │ ────────────────────────────── Cumul N HT │ 9 875 000,00 │       │    │
│ └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│ ┌─ Décompte ───────────────────────────────────────────────────────┐    │
│ │ Cumul travaux exécutés HT             │   9 875 000,00 MAD       │    │
│ │ – Cumul situation N-1                 │   8 450 000,00 MAD       │    │
│ │   ▶ Travaux période HT                │   1 425 000,00 MAD       │    │
│ │ – Retenue garantie  (7%)              │      99 750,00 MAD       │    │
│ │ – Résorption avance (5%)              │      71 250,00 MAD       │    │
│ │   ▶ Net à payer HT                    │   1 254 000,00 MAD       │    │
│ │ + TVA 20%                             │     250 800,00 MAD       │    │
│ │   ▶ Net à payer TTC                   │   1 504 800,00 MAD       │    │
│ └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│ ┌─ Notes & documents ──────────────────────────────────────────────┐    │
│ │ Notes : ...                                                       │    │
│ │ PV joint : sit-04-pv.pdf                                          │    │
│ └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Sections

1. **En-tête** — chantier (lock après émission), période début/fin, cumul N-1 (read-only auto, dérivé de la situation précédente), cumul N saisi.
2. **Lots & avancement** — table éditable des lots du chantier. Colonnes : code lot, désignation, unité, qté totale (read), qté cumulée (saisie ou auto depuis avancements), PU (read), montant HT cumulé (calc).
3. **Décompte** — calculé en temps réel, sticky en bas pendant édition.
4. **Notes & documents** — textarea + upload PV de validation MOA.

### Création (`/situations/new`)

1. Modal initial : sélectionner chantier → calcul auto du `numeroOrdre` (= max existant + 1) et du cumul N-1.
2. Pré-remplissage : qté cumulée = qté cumulée d'avancement la plus récente pour chaque lot.
3. User ajuste si nécessaire avant validation.

### Workflow & actions

| Action | De → Vers | Conditions |
|--------|-----------|-----------|
| `Soumettre` | BROUILLON → SOUMISE | Cumul > N-1, au moins 1 lot avec avancement |
| `Valider MOA` | SOUMISE → VALIDEE_MOA | PV uploadé recommandé (warning si absent) |
| `Émettre facture` | VALIDEE_MOA → FACTUREE | Crée `FactureClient` en BROUILLON |
| `Marquer payée` | FACTUREE → PAYEE | Lien règlement (en V2 avec module finance) |
| `Rejeter` | SOUMISE → BROUILLON | Motif obligatoire |

## 5. Calculs dérivés

```ts
// SituationFacade
readonly situation = signal<Situation | null>(null);

readonly travauxPeriodeHt = computed(() => {
  const s = this.situation();
  return s ? s.cumulCourantHt - s.cumulPrecedentHt : 0;
});

readonly retenueGarantieMontant = computed(() => {
  const t = this.travauxPeriodeHt();
  const taux = this.situation()?.retenueGarantiePercent ?? 7;
  return +(t * taux / 100).toFixed(2);
});

readonly resorptionAvance = computed(() => {
  const s = this.situation();
  if (!s?.retenueAvancePercent) return 0;
  return +(this.travauxPeriodeHt() * s.retenueAvancePercent / 100).toFixed(2);
});

readonly netAPayerHt = computed(() =>
  this.travauxPeriodeHt() - this.retenueGarantieMontant() - this.resorptionAvance()
);

readonly netAPayerTtc = computed(() => {
  const tva = this.situation()?.tvaTaux ?? 20;
  return +(this.netAPayerHt() * (1 + tva / 100)).toFixed(2);
});
```

## 6. Mock seed

3-7 situations par chantier en cours :
- N°1 : 1-2 mois après démarrage (~5-15% avancement).
- Suivantes : tous les 30-45 jours.
- Statuts variés : 1 BROUILLON courant, 1 SOUMISE en attente, plusieurs VALIDEE_MOA / FACTUREE / PAYEE.

Cohérence : la N° suivante reprend bien le cumul N-1 = cumulCourant N-1.

## 7. Files to deliver

```
applications/erp/pages/chantiers/situations/
├── situations.routes.ts
├── models/index.ts (réexport)
├── services/{situation-api.service.ts, situation.facade.ts, index.ts}
├── config/listing/{columns,filters,routes,config,index}.ts
├── config/detail/{fields,sections,routes,config,index}.ts
├── situation-listing/...
├── situation-detail/
│   ├── situation-detail.page.{ts,html,scss}
│   ├── components/
│   │   ├── decompte-card/         # bloc décompte sticky
│   │   ├── lots-saisie-table/     # éditeur de lignes
│   │   └── pv-uploader/
│   └── index.ts
└── components/
    └── decompte-print/            # template A4 imprimable
```

## 8. UX details

- **Décompte sticky** en bas pendant la saisie des lots (mobile : drawer permanent).
- **Cumul N-1 verrouillé** (lecture seule, derive depuis situation précédente du même chantier).
- **Bouton `Reprendre depuis avancements`** : pré-remplit qtés cumulées avec dernières saisies d'avancement.
- **PDF imprimé** = décompte officiel, en-tête société + chantier + N° ordre + signature MOA + cachet.
- **Alerte rouge** si l'utilisateur baisse un cumul vs N-1 (régression non autorisée).
- **Mention légale** automatique sur PDF : "Retenue garantie 7% conformément à l'article ... du marché".

## 9. DoD

- [ ] Listing avec filtres rapides et chips opérationnels.
- [ ] Création situation : sélection chantier → numéro auto, cumul N-1 auto, lots pré-remplis.
- [ ] Saisie cumul : recalcule décompte temps réel.
- [ ] Workflow complet testé : BROUILLON → ... → PAYEE.
- [ ] Émission facture crée bien une `FactureClient` BROUILLON visible côté ventes (lien V2 OK).
- [ ] PDF décompte génère un A4 propre.
- [ ] Mock cohérent : aucune situation orpheline, séquences `numeroOrdre` continues.
