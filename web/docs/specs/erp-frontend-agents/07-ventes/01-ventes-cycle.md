# Agent — Ventes · Cycle Client (Offres + Commandes + Situations)

> **Objet** : cycle commercial client de l'offre à la commande, avec lien vers situations (qui sont partagées avec chantiers).
> **Routes** : `/ventes/offres`, `/ventes/commandes`, `/ventes/situations`
> **Permission** : `ventes.offre.*`, `ventes.commandeClient.*`

## 0. Pré-requis

[README ventes](README.md), [00-CONVENTIONS](../00-CONVENTIONS.md), [00-MOCK-DATA](../00-MOCK-DATA-STRATEGY.md). Dépend du module **études** (devis = source des offres) et du module **chantiers** (situations).

## 1. Concept

Une **offre commerciale** est l'engagement formel envoyé au client (= devis émis, version finale). Un **bon de commande client** (= ordre de service) acte la signature du marché et déclenche la création du chantier. Les **situations** (déjà en module chantiers) sont consultables aussi sous `/ventes/situations` (mêmes données, même page).

Note : ce module **n'a pas** d'éditeur de devis (déjà fait dans le module études). Il offre une vue commerciale orientée vente.

## 2. Modèle

```ts
// applications/erp/ventes/models/

export type OffreStatus = 'EMISE' | 'EN_NEGOCIATION' | 'GAGNEE' | 'PERDUE' | 'EXPIREE' | 'ANNULEE';

export interface Offre {
  id: string;
  numero: string;                      // OFF-2026-0042
  devisId: string;                     // référence devis source
  devisVersion: number;
  clientId: string;
  clientName?: string;
  contactClient?: string;
  objet: string;
  ville?: string;
  dateEmission: string;
  dateValidite: string;
  totalHt: number;
  totalTtc: number;
  status: OffreStatus;
  motifRefus?: string;
  bcClientId?: string;                 // si convertie en BC
  chantierId?: string;                 // si convertie en chantier
  notes?: string;
}

export type BCClientStatus = 'BROUILLON' | 'CONFIRME' | 'EN_COURS' | 'CLOTURE' | 'ANNULE';

export interface BonCommandeClient {
  id: string;
  numero: string;                      // BCC-2026-0028
  offreId?: string;
  clientId: string;
  clientName?: string;
  objet: string;
  marcheReference?: string;            // référence marché client
  dateSignature: string;
  dateOrdreService?: string;
  dateDemarrage: string;
  dateFinPrevue: string;
  totalHt: number;
  tvaTaux: number;
  totalTtc: number;
  conditionsPaiement: string;
  delaiPaiementJours: number;
  retenueGarantiePercent: number;
  avancePercent?: number;
  cautionRestitutionAvance?: string;   // banque
  status: BCClientStatus;
  chantierId?: string;
  documents?: { name: string; url: string }[];
  notes?: string;
}
```

## 3. `/ventes/offres`

### Listing

Colonnes : `numero`, `clientName`, `objet`, `dateEmission`, `dateValidite`, `totalHt`, `delaiRestant` (j), `status`.

Filtres : client, status, dateRange, montantRange.

Chips : `Émises`, `En négociation`, `À relancer` (EMISE > 14j sans réponse), `Gagnées`, `Perdues`, `Expirent < 7j`.

### Detail (read-only — création via module études)

Sections :
1. **Identité** — numéro, devis source (lien), client (lien), objet, ville, dates.
2. **Récap financier** — total HT, TVA, TTC, conditions de paiement, garanties.
3. **Lignes** — table read-only des lignes (issues du devis).
4. **Suivi commercial** — historique relances, contact client, notes commerciales.
5. **Documents** — copie du devis PDF, accusé réception client, échanges email.

### Workflow

```
EMISE ─(client négocie)─► EN_NEGOCIATION ─(versions devis successives)─► EMISE
EMISE/EN_NEGOCIATION ─(client signe)─► GAGNEE ─► [BC client + chantier générés]
EMISE/EN_NEGOCIATION ─(refus)─► PERDUE (motif)
* ─(date validité dépassée)─► EXPIREE
```

Actions :
- `Marquer gagnée` → wizard 2 étapes : (1) signer le BC (saisie marche reference, dates) → (2) confirmer création chantier.
- `Marquer perdue` → motif obligatoire.
- `Relancer client` → ouvre modal email / log relance dans timeline.
- `Prolonger validité` → décale dateValidite.

### Mock seed

15 offres réparties dans tous les statuts, certaines liées à chantiers existants du seed (ex: l'offre OFF-2025-0019 → CH-2025-001 Yasmine).

## 4. `/ventes/commandes`

### Listing

Colonnes : `numero`, `clientName`, `objet`, `marcheReference`, `dateSignature`, `dateDemarrage`, `dateFinPrevue`, `totalHt`, `chantierCode`, `status`.

Filtres : client, status, dateRange.

Chips : `À confirmer`, `En cours exécution`, `À démarrer < 30j`, `Clôturés`.

### Detail à onglets

1. **Identité** — numéro, offre source (lien), client (lien), objet, références marché, dates.
2. **Conditions financières** — total HT, TVA, TTC, conditions de paiement, délai paiement (60j fin de mois typique), retenue garantie, avance, caution restitution avance.
3. **Chantier** — chantier généré (lien vers fiche chantier complète).
4. **Avenants** — table des avenants signés (montant, motif, date).
5. **Suivi exécution** — synthèse :
   - Avancement chantier %,
   - Cumul situations émises HT,
   - Cumul facturé HT,
   - Cumul encaissé TTC,
   - Reste à facturer,
   - Retenue garantie cumulée (chiffre + statut libération).
6. **Documents** — BC client signé scanné, ordre de service, cautions bancaires.
7. **Activité** — timeline.

### Workflow

```
BROUILLON ─(confirmer signature)─► CONFIRME ─(chantier démarré)─► EN_COURS
EN_COURS ─(toutes situations payées + caution libérée)─► CLOTURE
* ─(annuler)─► ANNULE (motif obligatoire, libère caution si applicable)
```

Actions :
- `Confirmer & créer chantier` → si pas de chantier déjà créé via flow offre, génère le chantier.
- `Ajouter avenant` → modal saisie (montant, motif, document).
- `Imprimer ordre de service`.
- `Clôturer` → vérifie pré-conditions (toutes situations PAYEE + caution libérée).

## 5. `/ventes/situations`

→ Proxy vers la page de l'agent [04-chantiers-situations](../02-chantiers/04-chantiers-situations.md). **Pas de double implémentation** — même route, même page.

Différence : si on accède via `/ventes/situations`, le filtre par défaut est **toutes les situations émises ou facturées** (perspective vente). Si via `/chantiers/situations`, le filtre par défaut est **toutes** (perspective chantier).

Astuce d'implémentation : utiliser un `queryParam` `?context=ventes` pour ajuster les filtres rapides par défaut.

## 6. Composants partagés ventes

```
applications/erp/ventes/components/
├── ventes-status-badge/
├── client-link/
├── offre-print/                  # template PDF offre commerciale
├── bcc-print/                    # template PDF ordre de service
├── delai-paiement-cell/
└── relance-dialog/
```

## 7. UX details

- **Suivi délai paiement** sur chaque BC : alerte si dateDemarrage + delaiPaiementJours < today et statut < CLOTURE.
- **Page offre + BC** mêlent données read-only depuis le devis source — pas d'éditeur de lignes ici.
- **Marquer gagnée** : wizard fluide qui guide vers création BC + chantier sans repousser le commercial à 3 onglets.
- **Avenants** : auto-incrémente `BonCommandeClient.totalHt` et propage au chantier (avec confirmation).

## 8. Files to deliver

```
applications/erp/pages/ventes/
├── offres/
│   ├── offres.routes.ts
│   ├── models/
│   ├── services/
│   ├── config/listing/...
│   ├── config/detail/...
│   ├── offre-listing/
│   ├── offre-detail/
│   └── components/marquer-gagnee-wizard/
└── commandes/
    ├── cmd-clients.routes.ts
    ├── models/
    ├── services/
    ├── config/...
    ├── bcc-listing/
    ├── bcc-detail/
    │   └── tabs/{tab-identite,tab-financier,tab-chantier,tab-avenants,tab-suivi,tab-documents,tab-activite}.component.{ts,html,scss}
    └── components/
        ├── avenant-dialog/
        └── suivi-execution-card/
```

## 9. DoD

- [ ] Listing offres + filtres + chips + detail read-only OK.
- [ ] Listing BC clients + detail à onglets + suivi exécution réel (calcul depuis chantiers + factures + situations).
- [ ] Workflow `Marquer gagnée` génère BC + chantier cohérents.
- [ ] Avenants tracés et propagés.
- [ ] PDF offre + BC clients génèrent A4 propres.
- [ ] Permissions appliquées.
- [ ] Mock cohérent : chaque chantier actif a un BC client, chaque BC a une offre source.
