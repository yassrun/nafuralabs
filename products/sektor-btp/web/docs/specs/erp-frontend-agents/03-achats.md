# Agent — Module Achats & Approvisionnement

> **Objet** : cycle achats complet — DA (demande achat) → AO (appel d'offres) → BC (bon de commande) → Contrat — avec référentiel fournisseurs.
> **Routes** : `/achats/demandes`, `/achats/appels-offres`, `/achats/commandes`, `/achats/contrats`, `/achats/fournisseurs`
> **Permission** : `achats.<entity>.*`

## 0. Pré-requis

[00-CONVENTIONS](00-CONVENTIONS.md), [00-MOCK-DATA-STRATEGY](00-MOCK-DATA-STRATEGY.md). Dépendances mock : chantiers (lookup), articles (lookup), fournisseurs (référentiel local).

## 1. Modèle de données

```ts
// applications/erp/achats/models/

export type DAStatus = 'BROUILLON' | 'SOUMISE' | 'APPROUVEE' | 'REJETEE' | 'CONVERTIE';
export type AOStatus = 'BROUILLON' | 'PUBLIEE' | 'CLOTUREE' | 'ATTRIBUEE' | 'INFRUCTUEUSE' | 'ANNULEE';
export type BCStatus = 'BROUILLON' | 'VALIDE' | 'ENVOYE' | 'ACCUSE_RECEPTION' | 'PARTIELLEMENT_LIVRE' | 'LIVRE' | 'FACTURE' | 'CLOTURE' | 'ANNULE';
export type ContratStatus = 'BROUILLON' | 'SIGNE' | 'EN_COURS' | 'ECHU' | 'RESILIE';

export interface DemandeAchat {
  id: string;
  numero: string;                    // DA-2026-0142
  chantierId?: string;
  chantierName?: string;
  dateBesoin: string;                // date limite de mise à dispo
  demandeurId: string;
  demandeurName?: string;
  motif?: string;
  status: DAStatus;
  approbateurId?: string;
  approbateurName?: string;
  approbationDate?: string;
  bcId?: string;                     // si convertie
  totalEstimeHt: number;
  notes?: string;
  lignes: DALigne[];
  createdAt: string;
}

export interface DALigne {
  id: string;
  daId: string;
  articleId: string;
  articleCode?: string;
  articleName?: string;
  quantite: number;
  uomCode?: string;
  prixEstimeHt?: number;
  totalEstimeHt?: number;
  notes?: string;
}

export interface AppelOffre {
  id: string;
  numero: string;                    // AO-2026-0089
  objet: string;
  chantierId?: string;
  fournisseurInvitesIds: string[];
  fournisseurInvitesNames?: string[];
  datePublication?: string;
  dateLimiteDepot: string;
  status: AOStatus;
  fournisseurAttribueId?: string;
  fournisseurAttribueName?: string;
  bcGenereId?: string;
  totalAttribueHt?: number;
  notes?: string;
  lignes: AOLigne[];
  reponses: AOReponse[];
}

export interface AOLigne {
  id: string;
  aoId: string;
  articleId: string;
  articleName?: string;
  quantite: number;
  uomCode?: string;
}

export interface AOReponse {
  id: string;
  aoId: string;
  fournisseurId: string;
  fournisseurName?: string;
  dateReponse: string;
  totalHt: number;
  delaiLivraisonJours: number;
  conditionsPaiement?: string;
  notes?: string;
  lignes: AOReponseLigne[];
  retenue: boolean;
}

export interface AOReponseLigne {
  id: string;
  reponseId: string;
  aoLigneId: string;
  prixUnitaireHt: number;
  totalHt: number;
  delaiSpecifique?: number;
}

export interface BonCommande {
  id: string;
  numero: string;                    // BC-2026-00387
  fournisseurId: string;
  fournisseurName?: string;
  chantierId?: string;
  chantierName?: string;
  daId?: string;
  aoId?: string;
  contratId?: string;
  rubrique?: 'MATERIAUX' | 'SOUS_TRAITANCE' | 'LOCATION_MATERIEL' | 'CARBURANT' | 'FRAIS_GENERAUX';
  dateCreation: string;
  dateLivraisonPrevue: string;
  conditionsPaiement: string;
  modeReglement?: 'VIREMENT' | 'CHEQUE' | 'EFFET' | 'ESPECES';
  totalHt: number;
  tvaTaux: number;
  totalTtc: number;
  status: BCStatus;
  validateurId?: string;
  validateurName?: string;
  validationDate?: string;
  totalLivreHt: number;              // calculé depuis réceptions liées
  totalFactureHt: number;            // calculé depuis factures fournisseurs liées
  notes?: string;
  lignes: BCLigne[];
}

export interface BCLigne {
  id: string;
  bcId: string;
  articleId: string;
  articleName?: string;
  quantite: number;
  quantiteLivree: number;            // cumul réceptions
  quantiteFacturee: number;
  uomCode?: string;
  prixUnitaireHt: number;
  totalHt: number;
  notes?: string;
}

export interface Contrat {
  id: string;
  numero: string;                    // CONTRAT-2026-012
  fournisseurId: string;
  fournisseurName?: string;
  type: 'CADRE' | 'ANNUEL' | 'PUNCTUEL';
  objet: string;
  dateDebut: string;
  dateFin: string;
  montantPlafondHt?: number;
  cumulBcEmisHt: number;
  conditionsPaiement: string;
  status: ContratStatus;
  documents?: { name: string; url: string }[];
}

export interface Fournisseur {
  id: string;
  code: string;
  raisonSociale: string;
  ice?: string;
  rc?: string;
  if?: string;
  patente?: string;
  adresse?: string;
  ville?: string;
  pays: string;                      // 'MA' par défaut
  contactPrincipalNom?: string;
  contactPrincipalTel?: string;
  contactPrincipalEmail?: string;
  conditionsPaiementParDefaut: string; // '30j fin de mois'
  modeReglementParDefaut?: string;
  delaiLivraisonMoyen?: number;
  rib?: string;
  banque?: string;
  categories: string[];              // ['Cimentier', 'Aciers', ...]
  notation?: 1 | 2 | 3 | 4 | 5;
  isActive: boolean;
  notes?: string;
}
```

## 2. Routes module

```ts
// applications/erp/achats/achats.routes.ts
export const ACHATS_ROUTES: Routes = [
  { path: 'achats/demandes',       loadChildren: () => import('../pages/achats/demandes/demandes.routes').then(m => m.DEMANDES_ROUTES) },
  { path: 'achats/appels-offres',  loadChildren: () => import('../pages/achats/appels-offres/ao.routes').then(m => m.AO_ROUTES) },
  { path: 'achats/commandes',      loadChildren: () => import('../pages/achats/commandes/bc.routes').then(m => m.BC_ROUTES) },
  { path: 'achats/contrats',       loadChildren: () => import('../pages/achats/contrats/contrat.routes').then(m => m.CONTRAT_ROUTES) },
  { path: 'achats/fournisseurs',   loadChildren: () => import('../pages/achats/fournisseurs/fournisseur.routes').then(m => m.FOURNISSEUR_ROUTES) },
];
```

## 3. Page `/achats/demandes` — Demandes d'Achat

### Listing

Colonnes : `numero`, `chantierCode`, `dateBesoin`, `demandeurName`, `nbLignes`, `totalEstimeHt`, `status`, `delaiAttente` (jours depuis SOUMISE).

Filtres : chantier, demandeur, status, dateBesoinRange. Chips : `À approuver`, `Mes demandes`, `Urgent` (dateBesoin < 7j).

CTA `+ Nouvelle demande`. Workflow : `BROUILLON → SOUMISE → APPROUVEE → CONVERTIE` (en BC) ou `REJETEE`.

### Detail / Saisie

Sections :
1. **Identité** — chantier (autocomplete), demandeur (auto user courant), date besoin.
2. **Lignes** — table éditable : article (autocomplete), quantité, unité (dérivé article), prix estimé HT, total HT.
3. **Justification** — motif obligatoire si total > seuil (configurable, V1 : 10 000 MAD).
4. **Pièces jointes** — upload images terrain.

Actions : `Soumettre`, `Approuver` (rôle approbateur uniquement), `Rejeter` (motif), `Convertir en BC` (post-approbation — ouvre form BC pré-rempli).

## 4. Page `/achats/appels-offres` — Appels d'Offres

### Listing

Colonnes : `numero`, `objet`, `chantierName`, `nbInvites`, `nbReponses`, `dateLimiteDepot`, `status`, `totalAttribueHt`.

Filtres : chantier, status, dateLimiteRange.

### Detail à onglets

1. **Identité** — objet, chantier, date publication, date limite dépôt, lignes (articles + qtés).
2. **Fournisseurs invités** — multi-select fournisseurs catégorisés. Bouton `Inviter` simule envoi email.
3. **Réponses** — table comparative des réponses :

```
Article         │ Sonasid    │ Riva Acier │ Maghreb Steel│ Recommandé
─────────────────┼────────────┼────────────┼──────────────┼───────────
Rond T12 (T)    │ 14 200 MAD │ 14 500 MAD │ 14 350 MAD   │ Sonasid ✓
Rond T16 (T)    │ 14 100 MAD │ 14 400 MAD │ 14 250 MAD   │ Sonasid ✓
TOTAL HT        │ 285 000   │ 290 600    │ 287 500      │
Délai (j)       │     7     │      5     │      6       │ Riva (5j)
```

Algorithme `Recommandé` : meilleur prix pondéré (70%) + meilleur délai (30%) — afficher tooltip explicatif.

4. **Attribution** — bouton `Attribuer à...` — choisit le fournisseur retenu, génère un BC en BROUILLON pré-rempli.

### Workflow

`BROUILLON → PUBLIEE → CLOTUREE (date limite passée) → ATTRIBUEE | INFRUCTUEUSE`.

## 5. Page `/achats/commandes` — Bons de Commande

### Listing

Colonnes : `numero`, `fournisseurName`, `chantierName`, `dateCreation`, `dateLivraisonPrevue`, `totalHt`, `totalLivrePercent`, `status`.

`totalLivrePercent = totalLivreHt / totalHt * 100`. Couleur progress : vert > 95%, bleu 30-95%, orange < 30%, rouge si en retard.

Filtres : fournisseur, chantier, status, rubrique, dateRange.

Chips : `À valider`, `En cours livraison`, `En retard livraison`, `À facturer` (livré et factureHt < totalHt).

### Detail

Sections :
1. **Identité** — numéro auto, fournisseur (autocomplete), chantier, rubrique, dates, conditions paiement, mode règlement.
2. **Lignes** — éditeur lignes (cf. `reception-lines-editor` pattern) : article, qté, qté livrée (read), qté facturée (read), PU HT, total HT.
3. **Totaux** — sticky : Total HT, TVA, Total TTC.
4. **Suivi** — onglet (en mode consultation) :
   - Réceptions liées (BL).
   - Factures fournisseurs liées.
   - Avancement % livré + % facturé.
5. **Documents** — upload BC signé, accusé réception fournisseur.
6. **Activité** — timeline.

### Workflow

```
BROUILLON ─(valider)─► VALIDE ─(envoyer)─► ENVOYE ─(AR fournisseur)─► ACCUSE_RECEPTION
ACCUSE_RECEPTION ─(1ère récept.)─► PARTIELLEMENT_LIVRE ─(toutes lignes livrées)─► LIVRE
LIVRE ─(facture reçue)─► FACTURE ─(payée)─► CLOTURE
* ─(annuler avec motif)─► ANNULE
```

Actions principales : `Valider`, `Envoyer fournisseur` (simule email), `Imprimer BC` (PDF officiel ICE/RC), `Dupliquer`, `Annuler`.

### Génération BC depuis DA / AO

- Depuis une DA `APPROUVEE` : pré-remplit fournisseur, lignes, chantier.
- Depuis une AO `ATTRIBUEE` : pré-remplit fournisseur retenu, lignes avec prix attribués.
- Lien retour : `Source: DA-...` / `AO-...` cliquable.

## 6. Page `/achats/contrats` — Contrats Fournisseurs

### Listing

Colonnes : `numero`, `fournisseurName`, `type`, `objet`, `dateDebut`, `dateFin`, `montantPlafondHt`, `cumulBcEmisHt`, `consommationPercent`, `status`.

Chips : `Actifs`, `À échéance < 30j`, `Échus à renouveler`.

### Detail

Sections : identité (numéro, fournisseur, type, objet, période), conditions financières (plafond, conditions paiement), documents (contrat signé), BC liés (table).

Workflow : `BROUILLON → SIGNE → EN_COURS → ECHU` ou `RESILIE`.

`consommationPercent = cumulBcEmisHt / montantPlafondHt * 100`.

## 7. Page `/achats/fournisseurs` — Référentiel

### Listing

Colonnes : `code`, `raisonSociale`, `ice`, `categories` (chips), `ville`, `notation` (étoiles), `nbBcAnnuels`, `montantBcAnnuel`, `delaiLivraisonMoyen`, `isActive`.

Filtres : catégories, ville, notation, isActive.

### Detail à onglets

1. **Identité** — raison sociale, ICE, RC, IF, Patente, adresse, ville, contact principal.
2. **Conditions** — paiement par défaut, mode règlement, RIB, banque, délai livraison moyen.
3. **Catégories** — chips multi-select (Cimentiers, Aciers, etc.).
4. **Notation** — étoiles + commentaires (1-5, basée sur historique livraisons).
5. **Historique BC** — table BC + cumul annuel + camembert répartition mensuelle.
6. **Documents** — KBIS / RC, attestations CNSS, IGR, RIB scanné.

CTA listing : `+ Nouveau fournisseur` (formulaire avec validation ICE format 15 chiffres).

## 8. Composants partagés module

```
applications/erp/achats/components/
├── achats-status-badge/         # mappe BCStatus/DAStatus/AOStatus → variant
├── bc-progress-cell/            # progression livraison/facturation
├── lignes-editor-achat/         # éditeur lignes avec auto-total
├── fournisseur-link/
├── ao-comparator-table/         # table comparative AO
└── achat-print-templates/
    ├── bc-print/                # template A4 BC
    ├── da-print/                # template DA
    └── ao-print/                # template AO public
```

## 9. Mock service

`applications/erp/achats/mock/achats-mock.service.ts` — orchestre :
- `demandesAchat$`, `appelsOffres$`, `bonsCommande$`, `contrats$`, `fournisseurs$`.
- 25-30 fournisseurs (cf. MOCK-DATA §Fournisseurs).
- ~40 BC répartis 6 mois (mix livrés/facturés/cours).
- ~15 DA dont 4 APPROUVEE non converties.
- ~12 AO dont 5 ATTRIBUEE.
- ~8 contrats cadres actifs.

## 10. Files to deliver

Structure complète par feature suivant pattern inventory :

```
applications/erp/achats/
├── achats.routes.ts
├── components/...
├── mock/{achats-mock.service.ts, seeds.ts}
└── models/index.ts

applications/erp/pages/achats/
├── demandes/
├── appels-offres/
├── commandes/
├── contrats/
└── fournisseurs/
   (chacun avec models/services/config/listing/detail/<entity>-listing/<entity>-detail/<entity>.routes.ts)
```

## 11. UX details transverses

- **Lien retour systématique** : un BC venant d'une DA affiche `Source: DA-2026-0142` cliquable.
- **Génération PDF** : BC, DA, AO disponibles en print A4 avec en-tête société + ICE/RC fournisseur destinataire.
- **Contrôle ICE** : validation format Maroc (15 chiffres) sur création fournisseur.
- **Auto-numérotation** : numéros séquentiels par type, format spec MOCK-DATA §Numérotation.
- **Tableau comparatif AO** : tri par colonne, surligne meilleur prix par ligne (vert).
- **Action de masse** sur BC : `Imprimer sélection`, `Envoyer (mail) sélection`, `Marquer livrés`.

## 12. DoD

- [ ] 5 features livrées (DA, AO, BC, Contrats, Fournisseurs) avec listing + détail + workflow.
- [ ] Mocks cohérents : DA → BC, AO → BC enchaînables.
- [ ] PDF print BC/DA/AO fonctionnels.
- [ ] Comparateur AO opérationnel avec recommandation.
- [ ] Lookups partagés (chantiers, articles, fournisseurs) consommés depuis services centraux.
- [ ] `achats.routes.ts` injecté dans `erp.routes.generated.ts`.
- [ ] Permissions par entité respectées.
- [ ] Validation ICE sur fournisseur.
- [ ] Notation fournisseur affichée par étoiles.
- [ ] Performance listings : 100+ enregistrements rendus < 500ms.
