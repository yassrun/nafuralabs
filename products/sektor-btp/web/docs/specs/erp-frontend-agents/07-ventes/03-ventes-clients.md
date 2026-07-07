# Agent — Ventes · Clients

> **Objet** : référentiel clients + historique commercial (CRM léger).
> **Route** : `/ventes/clients` · **Permission** : `ventes.client.*`

## 0. Pré-requis

[README ventes](README.md), [00-MOCK-DATA-STRATEGY §Clients](../00-MOCK-DATA-STRATEGY.md).

## 1. Modèle

```ts
// applications/erp/ventes/models/client.model.ts

export type ClientType = 'PUBLIC' | 'PRIVE_SA' | 'PRIVE_SARL' | 'PARTICULIER' | 'EEP' | 'AUTRE';
export type ClientStatus = 'PROSPECT' | 'ACTIF' | 'INACTIF' | 'BLACKLIST';

export interface Client {
  id: string;
  code: string;                        // CLI-001
  raisonSociale: string;
  type: ClientType;
  ice?: string;
  rc?: string;
  if?: string;
  patente?: string;
  rib?: string;
  banque?: string;
  adresse?: string;
  ville?: string;
  pays: string;                        // 'MA'
  
  // Contacts
  contactPrincipalNom?: string;
  contactPrincipalRole?: string;
  contactPrincipalTel?: string;
  contactPrincipalEmail?: string;
  contactsSecondaires?: ContactClient[];
  
  // Conditions commerciales
  conditionsPaiementParDefaut: string;
  delaiPaiementJoursParDefaut: number;
  modeReglementParDefaut?: string;
  remiseDefautPercent?: number;
  encoursAutorise?: number;            // limite crédit
  encoursActuel?: number;              // calculé : factures non payées TTC
  
  // Historique commercial agrégé
  caHistoriqueAnnuel?: number;
  nbChantiers?: number;
  nbFacturesEmises?: number;
  notation?: 1 | 2 | 3 | 4 | 5;
  
  status: ClientStatus;
  isActive: boolean;
  notes?: string;
  documents?: { name: string; url: string }[];
  createdAt: string;
}

export interface ContactClient {
  id: string;
  clientId: string;
  nom: string;
  prenom?: string;
  role: string;                        // "DG", "Directeur projet", "Comptable"
  tel?: string;
  email?: string;
  notes?: string;
}

export interface InteractionCommerciale {
  id: string;
  clientId: string;
  date: string;
  type: 'APPEL' | 'RDV' | 'EMAIL' | 'COURRIER' | 'AUTRE';
  objet: string;
  contactClientNom?: string;
  collaborateurId: string;
  collaborateurName?: string;
  notes: string;
  prochainContact?: string;
}
```

## 2. Routes

```ts
export const CLIENTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./client-listing/client-listing.page').then(m => m.ClientListingPage) },
  { path: 'new', loadComponent: () => import('./client-detail/client-detail.page').then(m => m.ClientDetailPage) },
  { path: ':id', loadComponent: () => import('./client-detail/client-detail.page').then(m => m.ClientDetailPage) },
];
```

## 3. Listing

### Colonnes

| Key | Label | Type | Largeur |
|-----|-------|------|---------|
| `code` | Code | text | 90px |
| `raisonSociale` | Raison sociale | text | flex |
| `type` | Type | badge | 110px |
| `ice` | ICE | text | 130px |
| `ville` | Ville | text | 110px |
| `caHistoriqueAnnuel` | CA annuel HT | currency | 140px |
| `nbChantiers` | Chantiers | number | 90px |
| `encoursActuel` | Encours TTC | currency + couleur | 140px |
| `notation` | Notation | stars (1-5) | 110px |
| `status` | Statut | badge | 100px |

Couleur `encoursActuel` : > `encoursAutorise` × 0.8 orange, > `encoursAutorise` rouge.

### Filtres

- `type`, `status`, `ville`, `notation`, `caRange`.

### Chips

- `Actifs`, `Top 10 CA`, `Encours dépassé`, `Prospects`, `Blacklist`.

### CTA

`+ Nouveau client` → form avec validation ICE 15 chiffres.

### Actions ligne

- `Voir fiche`.
- `Nouvelle interaction` → modal saisie.
- `Émettre offre` → ouvre `/etudes/devis/new?clientId=...`.

## 4. Detail à onglets

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← CLI-001 OCP Promotion SA                  [PRIVE_SA] [ACTIF] ★★★★☆│
│                                                                      │
│ ICE : 001234567890123 │ Casablanca │ Encours : 2,4 M / 5 M MAD       │
│                                                                      │
│ ┌──────────┬──────────┬──────────┬──────────┐                       │
│ │ CA 2026  │ Chant.   │ Factures │ Délai    │                       │
│ │ 8,4 M    │   3 act. │   18     │ moy 47j  │                       │
│ └──────────┴──────────┴──────────┴──────────┘                       │
│                                                                      │
│ [Identité] [Contacts] [Conditions] [Chantiers] [Factures]           │
│ [Encaissements] [Interactions] [Documents] [Activité]               │
└──────────────────────────────────────────────────────────────────────┘
```

### Onglet `Identité`

Sections :
1. **Coordonnées légales** — raison sociale, type, ICE, RC, IF, Patente.
2. **Adresse** — adresse, ville, pays.
3. **Banque** — banque, RIB.

### Onglet `Contacts`

Liste contacts secondaires (table : nom, rôle, tel, email, notes). CTA `+ Ajouter contact`. Édition inline.

### Onglet `Conditions`

- Conditions paiement par défaut.
- Délai paiement.
- Mode règlement.
- Remise par défaut %.
- Encours autorisé.
- Notation (★ × 5 cliquables).

### Onglet `Chantiers`

Liste des chantiers du client. Colonnes : code, nom, statut, dateDebut, budgetHt, avancement %, marge %.

### Onglet `Factures`

Liste factures clients filtrées sur ce client. Footer sticky : Total HT facturé, Total TTC, Total encaissé, Reste dû, Délai moyen encaissement.

### Onglet `Encaissements`

Historique encaissements (date, mode, référence, banque, montant, facture liée).

### Onglet `Interactions`

Timeline des interactions commerciales. CTA `+ Nouvelle interaction`. Filtres par type.

### Onglet `Documents`

KBIS / RC, attestations diverses, contrats-cadres signés.

### Onglet `Activité`

Toutes activités confondues (création, modifications conditions, interactions, factures émises, encaissements...).

## 5. KPIs synthèse (header)

Calculés à la volée :

```ts
readonly stats = computed(() => {
  const factures = this.facturesClient();
  const chantiers = this.chantiersClient();
  return {
    caAnnuel: factures.filter(f => isThisYear(f.dateEmission)).reduce((s, f) => s + f.totalHt, 0),
    nbChantiersActifs: chantiers.filter(c => c.status === 'EN_COURS').length,
    nbFactures: factures.length,
    delaiMoyenEncaissement: this.calcDelaiMoyenEncaissement(),
    encoursActuel: factures.filter(f => f.status !== 'PAYEE').reduce((s, f) => s + f.resteTtc, 0),
  };
});
```

## 6. Composants

```
applications/erp/ventes/components/
├── client-status-badge/
├── client-link/
├── notation-stars/                    # interactive 1-5 étoiles
├── encours-indicator/                 # progress encours / autorisé
├── interaction-form-dialog/
└── client-print-fiche/                # fiche client A4
```

## 7. Mock seed

Les 10 clients du `00-MOCK-DATA-STRATEGY.md`. Étoffer chacun :
- 2-4 contacts secondaires.
- 5-15 interactions historiques (mix appels, RDV, emails).
- Factures liées (depuis seeds factures).
- Encaissements liés.
- 1-3 documents par client.

## 8. UX details

- **Validation ICE** : 15 chiffres, regex stricte. Avertissement si ICE déjà existant (doublon).
- **Encours visuel** : barre de progression dans listing et fiche header.
- **Notation interactive** : hover/click sur étoiles pour ajuster.
- **Recherche** : chercher par nom, code, ICE simultanément (debounce 300ms).
- **Lien profond chantiers et factures** : navigation rapide depuis la fiche.
- **Imprimer fiche client** : PDF récap commercial pour suivi commerce.

## 9. Files to deliver

```
applications/erp/pages/ventes/clients/
├── clients.routes.ts
├── models/{client.model.ts, interaction.model.ts, index.ts}
├── services/{client-api.service.ts, client.facade.ts, interaction.facade.ts, index.ts}
├── config/listing/...
├── config/detail/...
├── client-listing/...
├── client-detail/
│   ├── client-detail.page.{ts,html,scss}
│   └── tabs/{tab-identite,tab-contacts,tab-conditions,tab-chantiers,tab-factures,tab-encaissements,tab-interactions,tab-documents,tab-activite}.component.{ts,html,scss}
└── components/...
```

## 10. DoD

- [ ] Listing avec filtres et chips opérationnels.
- [ ] Création client : validation ICE format Maroc.
- [ ] Fiche à onglets fonctionnelle.
- [ ] KPIs header recalculés à toute mutation.
- [ ] Indicateur encours visuel.
- [ ] Interactions commerciales saisies et listées.
- [ ] Lookups partagés `clients` consommés depuis `shared/mock/global-lookups.service.ts`.
- [ ] Mock cohérent : tous chantiers, factures, situations remontent au bon client.
- [ ] PDF fiche client génère un A4 propre.
- [ ] Permissions par action.
