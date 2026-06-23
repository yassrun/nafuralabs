# Agent — RH · Employés & Contrats

> **Objet** : référentiel employés (40) + dossier individuel + contrats CDI/CDD/intérim.
> **Route** : `/rh/employes` · **Permission** : `rh.employe.*`, `rh.contrat.*`

## 0. Pré-requis

[README rh](README.md), [00-MOCK-DATA-STRATEGY §Employés](../00-MOCK-DATA-STRATEGY.md).

## 1. Modèle

```ts
// applications/erp/rh/models/

export type Civilite = 'M' | 'MME' | 'MLLE';
export type SituationFamiliale = 'CELIBATAIRE' | 'MARIE' | 'DIVORCE' | 'VEUF';
export type CategorieBtp = 'OUVRIER_NON_QUALIFIE' | 'OUVRIER_QUALIFIE_OQ1' | 'OUVRIER_QUALIFIE_OQ2' | 'OUVRIER_HQ' | 'CHEF_EQUIPE' | 'CONTREMAITRE' | 'AGENT_MAITRISE' | 'TECHNICIEN' | 'INGENIEUR' | 'CADRE' | 'CADRE_DIRIGEANT';
export type EmployeStatus = 'ACTIF' | 'CONGE' | 'ARRET_MALADIE' | 'SUSPENDU' | 'INACTIF';

export interface Employe {
  id: string;
  matricule: string;                  // EMP-001
  civilite: Civilite;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance?: string;
  sexe: 'M' | 'F';
  nationalite: string;                // 'Marocaine' par défaut
  cin: string;                        // CIN Maroc (ex: 'BK123456')
  cnss?: string;                      // 9 chiffres
  amo?: string;
  cimrAdherent?: boolean;
  
  // Coordonnées
  adresse?: string;
  ville?: string;
  telephone?: string;
  telephoneUrgence?: string;
  email?: string;
  
  // Famille
  situationFamiliale: SituationFamiliale;
  nbEnfantsACharge: number;           // pour IGR
  
  // Poste
  poste: string;                      // 'Conducteur de travaux'
  category: CategorieBtp;
  departmentId?: string;
  departmentName?: string;
  managerId?: string;                 // employeId du n+1
  managerName?: string;
  dateEmbauche: string;
  dateAnciennete?: string;            // pour reprise ancienneté
  
  // Banque (pour paie)
  rib?: string;
  banque?: string;
  
  // Photo
  photoUrl?: string;
  
  // Statut
  status: EmployeStatus;
  isActive: boolean;
  
  notes?: string;
  documents?: EmployeDocument[];
}

export interface EmployeDocument {
  id: string;
  employeId: string;
  category: 'CIN' | 'PHOTO' | 'CV' | 'DIPLOME' | 'CONTRAT' | 'AVENANT' | 'CERTIFICAT_MEDICAL' | 'AUTRE';
  name: string;
  url: string;
  uploadedAt: string;
  notes?: string;
}

export type ContratType = 'CDI' | 'CDD' | 'INTERIM' | 'STAGE' | 'APPRENTISSAGE' | 'MISSION';
export type ContratStatus = 'BROUILLON' | 'ACTIF' | 'SUSPENDU' | 'TERMINE' | 'RESILIE';

export interface Contrat {
  id: string;
  numero: string;
  employeId: string;
  employeName?: string;
  type: ContratType;
  dateDebut: string;
  dateFin?: string;                   // pour CDD
  dureeMois?: number;                 // calculé pour CDD
  periodeEssaiJours?: number;
  
  poste: string;
  category: CategorieBtp;
  
  // Rémunération
  salaireBaseBrut: number;            // mensuel
  modeRemuneration: 'MENSUEL' | 'HORAIRE' | 'JOURNALIER';
  tauxHoraire?: number;
  primeAnciennetePercent?: number;
  primesFixes?: { libelle: string; montant: number; recurrence: 'MENSUELLE' | 'TRIMESTRIELLE' | 'ANNUELLE' }[];
  primeFinAnnee?: number;             // ~1 mois en BTP
  indemniteTransport?: number;
  indemnitePanier?: number;
  
  // Temps de travail
  heuresHebdo: number;                // 44h en BTP standard
  joursTravailHebdo: number;          // 6 jours typique
  
  // Avantages
  voitureFonction?: boolean;
  telephoneFonction?: boolean;
  mutuelleEntreprise?: boolean;
  
  // Lieu / chantier de rattachement
  chantierAffectePrincipalId?: string;
  lieuTravail?: string;
  
  status: ContratStatus;
  motifResiliation?: string;
  documents?: { name: string; url: string }[];
  notes?: string;
  createdAt: string;
}
```

## 2. Routes

```ts
export const EMPLOYES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./employe-listing/employe-listing.page').then(m => m.EmployeListingPage) },
  { path: 'new', loadComponent: () => import('./employe-detail/employe-detail.page').then(m => m.EmployeDetailPage) },
  { path: ':id', loadComponent: () => import('./employe-detail/employe-detail.page').then(m => m.EmployeDetailPage) },
  { path: ':id/contrats', loadComponent: () => import('./contrats/contrats-employe.page').then(m => m.ContratsEmployePage) },
];
```

## 3. Listing employés

### Colonnes

| Key | Label | Type | Largeur |
|-----|-------|------|---------|
| `photoUrl` | — | avatar | 50px |
| `matricule` | Matricule | text | 100px |
| `nom` | Nom | text | 130px |
| `prenom` | Prénom | text | 130px |
| `poste` | Poste | text | 180px |
| `category` | Catégorie | badge | 130px |
| `departmentName` | Département | text | 140px |
| `dateEmbauche` | Embauche | date | 110px |
| `anciennete` | Ancienneté | calc (Xa Ym) | 100px |
| `contratActuelType` | Contrat | badge | 100px |
| `status` | Statut | badge | 110px |

### Filtres

- `category`, `departmentId`, `status`, `contratType`, `dateEmbaucheRange`, `chantierAffectePrincipalId`.

### Chips

- `Tous actifs`, `Direction & encadrement`, `Conducteurs travaux`, `Chefs chantier`, `Ouvriers`, `CDD à échéance < 30j`, `Embauchés cette année`.

### CTA

`+ Nouvel employé` → wizard 4 étapes.

### Actions ligne

- Click → fiche employé.
- `Imprimer fiche`.
- `Nouveau contrat` (avenant).
- `Désactiver` (départ).

## 4. Création employé — wizard 4 étapes

**Étape 1 — Identité civile**
- Civilité, nom, prénom, sexe, date+lieu naissance, nationalité, CIN, CNSS.
- Photo (upload).

**Étape 2 — Coordonnées & famille**
- Adresse, ville, téléphone, téléphone urgence, email.
- Situation familiale, nombre d'enfants à charge.

**Étape 3 — Poste & affectation**
- Poste, catégorie BTP, département, manager (autocomplete employés), chantier affecté principal.
- Date d'embauche, date d'ancienneté (si reprise).

**Étape 4 — Contrat initial**
- Type contrat (CDI / CDD / Intérim / Stage…).
- Salaire base brut, mode rémunération.
- Heures hebdo (44h défaut), jours travail/semaine.
- Indemnités (transport, panier).
- Période d'essai jours.
- RIB, banque.

À la création :
- Génère `Employe` + `Contrat` ACTIF + matricule auto (`EMP-NNN`).
- Initialise solde congés (cf. spec congés).

## 5. Fiche employé

### Header

```
┌──────────────────────────────────────────────────────────────────────┐
│ [📷] Karim ALAMI    EMP-018    [CONTREMAITRE]  [ACTIF] CDI           │
│      Conducteur de travaux | Exploitation | CH-2026-001 (princ.)     │
│                                                                      │
│ ┌──────────┬──────────┬──────────┬──────────┐                       │
│ │ Anciennté│ Salaire  │ Solde    │ Pointage │                       │
│ │  4a 7m   │ 18,500   │ 12,5 j   │ 100% ce m│                       │
│ └──────────┴──────────┴──────────┴──────────┘                       │
│                                                                      │
│ [Identité] [Contrats] [Pointage] [Congés] [Paie] [Documents] [Activ.]│
└──────────────────────────────────────────────────────────────────────┘
```

### Onglet `Identité`

- État civil.
- Coordonnées.
- Famille.
- Banque (pour paie).
- Affectation actuelle (poste, département, manager, chantier).

### Onglet `Contrats`

Liste des contrats successifs (CDD → CDI, avenants…).

CTA `+ Nouveau contrat` (= avenant).

Fiche contrat = mini-page : type, période, rémunération, conditions.

### Onglet `Pointage`

- Calendrier des 30 derniers jours avec présences/absences.
- Cumul mois courant : J travaillés, heures sup, absences justifiées/injustifiées.
- Lien vers `/rh/pointage` filtré sur cet employé.

### Onglet `Congés`

- Solde acquis / pris / restant.
- Liste demandes en cours et historique.
- CTA `Saisir absence`.

### Onglet `Paie`

- 6 derniers bulletins (lien vers PDF).
- Variables individuelles (primes ponctuelles, retenues exceptionnelles).

### Onglet `Documents`

GED individuelle : CIN scannée, CV, diplômes, contrats signés, certificats médicaux, attestations CNSS/AMO, photos.

### Onglet `Activité`

Timeline événements RH : embauche, avenants, changement chantier affecté, congés, accidents, formations.

## 6. Composants

```
applications/erp/rh/components/
├── employe-avatar/                  # avatar avec initiales si pas de photo
├── employe-link/
├── category-btp-badge/              # couleur par catégorie
├── contrat-status-badge/
├── anciennete-cell/                 # affiche "4a 7m"
├── employe-print-fiche/             # PDF fiche complète
└── contrat-print/                   # PDF contrat
```

## 7. Mock seed

40 employés répartis :

| # | Catégorie | Salaire brut MAD | Notes |
|---|-----------|------------------|-------|
| 1 | CADRE_DIRIGEANT | 45,000 | DG (Yassine) |
| 2 | CADRE | 32,000 | DAF |
| 3 | CADRE | 28,000 | Resp. exploitation |
| 4 | CADRE | 26,000 | Resp. études |
| 5-12 | INGENIEUR / TECHNICIEN | 12,000-18,000 | Conducteurs travaux + études |
| 13-20 | AGENT_MAITRISE / CONTREMAITRE | 8,000-12,000 | Chefs chantier + chefs équipe |
| 21-30 | OUVRIER_HQ / OUVRIER_QUALIFIE_OQ2 | 4,500-7,500 | Maçons, coffreurs, ferrailleurs spé |
| 31-40 | OUVRIER_QUALIFIE_OQ1 / OUVRIER_NON_QUALIFIE | 2,800-4,500 | Manœuvres, aide-maçons |

CDI 28, CDD 8, intérim 4. Affectations cohérentes aux chantiers actifs.

## 8. Files to deliver

```
applications/erp/rh/
├── rh.routes.ts
├── components/...
├── mock/{rh-mock.service.ts, paie-calculator.ts, seeds.ts}
└── models/index.ts

applications/erp/pages/rh/employes/
├── employes.routes.ts
├── models/, services/, config/...
├── employe-listing/...
├── employe-detail/
│   ├── employe-detail.page.{ts,html,scss}
│   └── tabs/{tab-identite,tab-contrats,tab-pointage,tab-conges,tab-paie,tab-documents,tab-activite}.component.{ts,html,scss}
├── employe-create-wizard/
│   ├── employe-create-wizard.page.{ts,html,scss}
│   └── steps/{step-identite,step-coords,step-poste,step-contrat}.component.{ts,html,scss}
└── contrats/
    ├── contrat-form-dialog/         # création avenant
    └── contrat-print/
```

## 9. UX details

- **Avatar avec initiales** quand pas de photo (généré par couleur dérivée du matricule).
- **Recherche** rapide top : tape le nom ou matricule, autocomplete avec photos.
- **CDD à échéance** : alerte 30j et 14j avant fin.
- **Photo upload** : crop carré + compression auto.
- **CIN format** : validation 1-2 lettres + 5-7 chiffres (pattern Maroc).
- **CNSS format** : 9 chiffres exactement.
- **RIB** : 24 chiffres, pattern `bb bbb tttttttttt mm`.

## 10. DoD

- [ ] Listing 40 employés avec filtres et chips.
- [ ] Wizard création 4 étapes avec validations Maroc (CIN, CNSS).
- [ ] Fiche employé à onglets fonctionnelle.
- [ ] Création avenant (nouveau contrat) sur employé existant.
- [ ] Lookups `employees`, `managers` partagés via shared/mock.
- [ ] Mock seed 40 employés cohérents (salaires marché Maroc).
- [ ] PDF fiche employé propre.
- [ ] Permissions `consulterDossier` distincte du `read` simple.
