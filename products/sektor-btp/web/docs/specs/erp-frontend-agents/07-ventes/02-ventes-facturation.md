# Agent — Ventes · Facturation (Factures + Avoirs + Retenues Garantie)

> **Objet** : émission factures clients (depuis situations), avoirs, et suivi des retenues garanties (caution 7%).
> **Routes** : `/ventes/factures`, `/ventes/avoirs`, `/ventes/retenues-garantie`
> **Permission** : `ventes.facture.*`, `ventes.avoir.*`, `ventes.retenueGarantie.*`

## 0. Pré-requis

[README ventes](README.md), [00-MOCK-DATA-STRATEGY](../00-MOCK-DATA-STRATEGY.md). Dépend du module **chantiers** (situations).

## 1. Modèle

```ts
// applications/erp/ventes/models/

export type FactureStatus = 'BROUILLON' | 'EMISE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'EN_LITIGE' | 'AVOIRISEE' | 'ANNULEE';

export interface FactureClient {
  id: string;
  numero: string;                      // FC-2026-00056
  type: 'SITUATION' | 'AVANCE' | 'ACOMPTE' | 'DECOMPTE_DEFINITIF' | 'DIVERSE';
  clientId: string;
  clientName?: string;
  bcClientId?: string;
  chantierId?: string;
  chantierCode?: string;
  situationId?: string;                // si type = SITUATION
  dateEmission: string;
  dateEcheance: string;
  modePaiement?: 'VIREMENT' | 'CHEQUE' | 'EFFET' | 'ESPECES';

  // Montants
  totalHt: number;
  retenueGarantieMontant: number;
  resorptionAvanceMontant?: number;
  netAPayerHt: number;
  tvaTaux: number;
  totalTva: number;
  netAPayerTtc: number;

  // Encaissements
  cumulEncaisseTtc: number;
  resteTtc: number;

  status: FactureStatus;
  motifLitige?: string;
  documents?: { name: string; url: string }[];
  notes?: string;
  lignes: FactureLigne[];
  encaissements: Encaissement[];
}

export interface FactureLigne {
  id: string;
  factureId: string;
  ordre: number;
  designation: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt: number;
}

export interface Encaissement {
  id: string;
  factureId: string;
  dateEncaissement: string;
  modePaiement: 'VIREMENT' | 'CHEQUE' | 'EFFET' | 'ESPECES' | 'COMPENSATION';
  reference?: string;                  // n° chèque, virement
  banque?: string;
  montantTtc: number;
  notes?: string;
}

export type AvoirStatus = 'BROUILLON' | 'EMIS' | 'IMPUTE' | 'REMBOURSE' | 'ANNULE';

export interface Avoir {
  id: string;
  numero: string;                      // AV-2026-0012
  factureOriginaleId: string;
  factureOriginaleNumero?: string;
  clientId: string;
  clientName?: string;
  dateEmission: string;
  motif: string;
  totalHt: number;
  tvaTaux: number;
  totalTtc: number;
  status: AvoirStatus;
  notes?: string;
  lignes: { designation: string; totalHt: number }[];
}

export type RetenueGarantieStatus = 'EN_COURS' | 'LIBERATION_DEMANDEE' | 'LIBEREE' | 'CONTESTEE';

export interface RetenueGarantie {
  id: string;
  chantierId: string;
  chantierCode?: string;
  clientName?: string;
  bcClientId: string;
  cumulRetenueHt: number;              // somme des retenues ponctionnées sur situations
  cumulLibereHt: number;
  resteARelibererHt: number;
  cautionBanqueId?: string;            // si remplacée par caution bancaire
  cautionBanque?: string;
  dateReceptionProvisoire?: string;
  dateReceptionDefinitive?: string;
  dateLiberationPrevue?: string;       // = dateReceptionProvisoire + 1 an
  status: RetenueGarantieStatus;
  notes?: string;
}
```

## 2. `/ventes/factures`

### Listing

Colonnes : `numero`, `type`, `clientName`, `chantierCode`, `dateEmission`, `dateEcheance`, `netAPayerTtc`, `cumulEncaisseTtc`, `resteTtc`, `delaiRetard` (j si dépassé), `status`.

Filtres : client, type, status, dateRange, montantRange, chantier, modePaiement.

Chips : `Brouillons`, `À encaisser`, `En retard`, `Payées ce mois`, `En litige`, `Mes factures`.

### Detail

Sections :
1. **Identité** — numéro, type (situation/avance/acompte/définitif/diverse), client (lien), chantier (lien), BC client (lien), situation source (lien), dates.
2. **Lignes** — table read-only si type SITUATION (issu de la situation), éditable si DIVERSE.
3. **Décompte** — sticky : Total HT, retenues, Net à payer HT, TVA, Net TTC.
4. **Encaissements** — table : date, mode, référence, banque, montant. CTA `+ Enregistrer encaissement`.
5. **Documents** — facture PDF, accusé réception client, bordereau bancaire.
6. **Activité** — timeline (création, émission, encaissements partiels, clôture).

### Workflow

```
BROUILLON ─(émettre)─► EMISE ─(encaissement < total)─► PARTIELLEMENT_PAYEE ─(complet)─► PAYEE
EMISE/PARTIELLEMENT_PAYEE ─(litige client)─► EN_LITIGE ─(résolu)─► EMISE
EMISE/PARTIELLEMENT_PAYEE ─(avoir total)─► AVOIRISEE
* ─(annuler avant émission)─► ANNULEE
```

Actions :
- `Émettre` → bascule EMISE, génère PDF officiel + envoie email mock.
- `+ Encaissement` → modal saisie + recalcul `cumulEncaisseTtc`.
- `Imprimer facture` → PDF officiel A4 (en-tête société + cachet + références fiscales).
- `Créer avoir` → ouvre form avoir pré-rempli.
- `Marquer en litige` → motif obligatoire.

### Création facture

3 sources possibles :

1. **Depuis situation** : action `Émettre la facture` sur une situation `VALIDEE_MOA`. Pré-remplit tout.
2. **Avance** : modal sur fiche chantier `Demander avance` (par défaut 20% du marché).
3. **Diverse** : `+ Nouvelle facture` direct (cas rares — autre que travaux).

### Mock seed

25 factures réparties 6 mois :
- Mix de types (majorité SITUATION).
- Statuts variés (5 BROUILLON, 8 EMISE, 5 PARTIELLEMENT_PAYEE, 5 PAYEE, 1 EN_LITIGE, 1 AVOIRISEE).
- Encaissements liés cohérents.

## 3. `/ventes/avoirs`

### Listing

Colonnes : `numero`, `factureOriginaleNumero`, `clientName`, `dateEmission`, `motif`, `totalTtc`, `status`.

Filtres : client, dateRange, status.

### Detail

Sections :
1. **Identité** — numéro, facture d'origine (lien), client, date, motif (textarea obligatoire).
2. **Lignes** — soit reprise totale (toutes lignes facture origine), soit partielle (sélection).
3. **Récap** — total HT, TVA, TTC.

### Workflow

```
BROUILLON ─(émettre)─► EMIS ─(imputation auto)─► IMPUTE
EMIS ─(remboursement)─► REMBOURSE
* ─(annuler)─► ANNULE
```

Sur émission :
- Si `IMPUTE` : déduit du `cumulEncaisseTtc` de la facture d'origine, statut facture peut basculer `AVOIRISEE`.
- Si `REMBOURSE` : génère décaissement (lien finance V2 — V1 OK on note juste).

## 4. `/ventes/retenues-garantie`

Vue dédiée car c'est un suivi métier critique (caution 7% bloquée 1 an).

### Page `RetenuesGarantiePage` (single page, pas de detail dédié)

Listing avec colonnes :

| Key | Label | Type | Largeur |
|-----|-------|------|---------|
| `chantierCode` | Chantier | link | 110px |
| `clientName` | Client | text | 160px |
| `cumulRetenueHt` | Retenue cumulée | currency | 140px |
| `cumulLibereHt` | Déjà libéré | currency | 140px |
| `resteARelibererHt` | Reste à libérer | currency | 140px |
| `dateReceptionProvisoire` | Récept. provisoire | date | 130px |
| `dateLiberationPrevue` | Libération prévue | date | 130px |
| `delaiRestant` | Délai restant | days + couleur | 110px |
| `status` | Statut | badge | 130px |

Couleur `delaiRestant` : > 60j gris, 0-60j orange, < 0j rouge (à libérer).

Filtres : client, status, chantier.

Chips : `À libérer < 30j`, `À libérer maintenant`, `Avec caution bancaire`, `Libérées 12 mois`.

Actions ligne :
- `Demander libération` (status EN_COURS et délai écoulé) → bascule LIBERATION_DEMANDEE + génère document de demande.
- `Marquer libérée` (status LIBERATION_DEMANDEE) → dateLiberation + ajoute mouvement finance.
- `Remplacer par caution bancaire` → modal saisie banque + montant + n° caution.

### Carte synthèse en haut de page

```
┌────────────────────────────────────────────────────────────┐
│ Retenues garanties — vue consolidée                        │
│                                                            │
│ Total bloqué : 1 240 000 MAD HT                            │
│ ▶ A libérer < 30j : 187 000 MAD (3 chantiers)              │
│ ▶ Couverte par caution bancaire : 420 000 MAD              │
│ ▶ Libérée cette année : 540 000 MAD                        │
└────────────────────────────────────────────────────────────┘
```

### Mock seed

12 retenues garanties (1 par chantier qui en a une) :
- 8 EN_COURS (chantiers actifs ou récemment livrés).
- 2 LIBERATION_DEMANDEE.
- 2 LIBEREE (chantiers terminés > 1 an).

## 5. Composants partagés

```
applications/erp/ventes/components/
├── facture-status-badge/
├── facture-print/                # template PDF facture officielle
├── avoir-print/
├── encaissement-form-dialog/
├── retenue-summary-card/
└── delai-echeance-cell/
```

## 6. UX details

- **PDF facture** : conforme exigences fiscales Maroc — en-tête (raison sociale, ICE, RC, IF, Patente, CNSS), client (raison sociale + ICE), n° facture, date, lignes, HT, TVA détaillée par taux, TTC, mention "Facturé en MAD", mode paiement, banque + RIB. Cachet société.
- **Imprimer relance** : possible depuis listing avec bouton `Relancer sélection` → génère lettre de relance par client avec liste factures impayées.
- **Auto-mise à jour situation** : sur émission facture, situation source bascule `FACTUREE`. Sur encaissement complet, situation `PAYEE`.
- **Cohérence retenue garantie** : chaque facture de type SITUATION ponctionne automatiquement 7% qui s'agrège dans la `RetenueGarantie` du chantier.
- **Balance âgée** (V2) : tableau client × tranche âge factures (0-30j, 31-60j, 61-90j, > 90j).

## 7. Files to deliver

```
applications/erp/pages/ventes/
├── factures/
│   ├── factures.routes.ts
│   ├── models/, services/, config/...
│   ├── facture-listing/, facture-detail/
│   └── components/encaissement-dialog/
├── avoirs/
│   ├── avoirs.routes.ts
│   ├── models/, services/, config/...
│   ├── avoir-listing/, avoir-detail/
└── retenues-garantie/
    ├── retenues-garantie.page.{ts,html,scss}
    ├── retenues-garantie-mock.facade.ts
    └── components/{retenue-summary-card,liberation-dialog,caution-bancaire-dialog}/
```

## 8. DoD

- [ ] Factures : listing + détail + workflow + PDF officiel marocain.
- [ ] Encaissements partiels et multiples par facture.
- [ ] Avoirs : workflow complet + impact sur facture origine.
- [ ] Retenues garantie : vue consolidée + libération + caution bancaire.
- [ ] Lien bidirectionnel facture ↔ situation propagé (mocké).
- [ ] Mock cohérent : encaissements n'excèdent jamais TTC, avoirs ≤ facture origine.
- [ ] Permissions par entité.
- [ ] Performance : 100+ factures rendues < 800ms.
