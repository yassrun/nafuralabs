# Agent — RH · Congés & Absences

> **Objet** : demandes de congés, soldes par employé, calendrier équipe, validation hiérarchique.
> **Route** : `/rh/conges` · **Permission** : `rh.conge.*`

## 0. Pré-requis

[README rh](README.md), [01-rh-employes](01-rh-employes.md), [02-rh-pointage-planning](02-rh-pointage-planning.md).

## 1. Modèle

```ts
// applications/erp/rh/models/conge.model.ts

export type CongeType = 
  | 'CONGE_PAYE_ANNUEL' 
  | 'CONGE_SANS_SOLDE' 
  | 'RTT'                            // récupération heures sup
  | 'MARIAGE' 
  | 'NAISSANCE' 
  | 'DECES_FAMILLE' 
  | 'PATERNITE' 
  | 'MATERNITE' 
  | 'CIRCONCISION' 
  | 'ARRET_MALADIE' 
  | 'ACCIDENT_TRAVAIL' 
  | 'PELERINAGE' 
  | 'AUTRE';

export type CongeStatus = 'BROUILLON' | 'SOUMISE' | 'APPROUVEE_N1' | 'APPROUVEE_RH' | 'REJETEE' | 'ANNULEE' | 'PRISE';

export interface DemandeConge {
  id: string;
  numero: string;                     // CG-2026-0142
  employeId: string;
  employeName?: string;
  type: CongeType;
  dateDebut: string;
  dateFin: string;
  nbJoursOuvrables: number;           // calculé hors weekend/fériés
  motif?: string;
  
  // Workflow
  status: CongeStatus;
  approbateurN1Id?: string;
  approbateurN1Name?: string;
  dateApprobationN1?: string;
  approbateurRhId?: string;
  approbateurRhName?: string;
  dateApprobationRh?: string;
  motifRefus?: string;
  
  // Justificatif
  justificatifUrl?: string;
  
  // Période de remplacement
  remplacantId?: string;
  remplacantName?: string;
  
  notes?: string;
  createdAt: string;
}

export interface SoldeConge {
  employeId: string;
  exercice: number;                   // 2026
  acquis: number;                     // 18 jours/an au prorata d'ancienneté
  pris: number;
  enAttente: number;                  // demandes SOUMISE / APPROUVEE_N1
  restant: number;                    // acquis - pris - enAttente
  reportNAnt?: number;                // report N-1
  congesAdditionnels?: number;        // ancienneté (1.5j tous les 5 ans)
}
```

## 2. Routes

```ts
export const CONGES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./conges-listing/conges-listing.page').then(m => m.CongesListingPage) },
  { path: 'demande', loadComponent: () => import('./conge-demande/conge-demande.page').then(m => m.CongeDemandePage) },
  { path: 'demande/:id', loadComponent: () => import('./conge-demande/conge-demande.page').then(m => m.CongeDemandePage) },
  { path: 'soldes', loadComponent: () => import('./soldes-conges/soldes-conges.page').then(m => m.SoldesCongesPage) },
  { path: 'calendrier', loadComponent: () => import('./calendrier-conges/calendrier-conges.page').then(m => m.CalendrierCongesPage) },
];
```

## 3. Page principale `/rh/conges`

3 vues toggleables : `Demandes` (par défaut), `Calendrier équipe`, `Soldes`.

### Vue `Demandes` — Listing

| Key | Label | Type | Largeur |
|-----|-------|------|---------|
| `numero` | N° | text | 110px |
| `employeName` | Employé | link | 180px |
| `type` | Type | badge | 130px |
| `dateDebut` | Du | date | 100px |
| `dateFin` | Au | date | 100px |
| `nbJoursOuvrables` | Jours | number | 80px |
| `status` | Statut | badge | 130px |
| `approbateurN1Name` | Validé par N+1 | text | 140px |

Filtres : employé, type, status, dateRange, departmentId.

Chips : `À approuver (N+1)`, `À approuver (RH)`, `Mes demandes`, `Cette année`, `Refusées`, `À justifier` (ARRET_MALADIE sans justif).

CTA `+ Nouvelle demande`.

### Vue `Calendrier équipe`

Calendrier mensuel multi-employés (FullCalendar `resourceTimelineMonth`) :

```
┌────────────────────────────────────────────────────────────────────┐
│ Mai 2026                                                            │
│ Filtre: [Département ▾]  [Chantier ▾]                              │
├────────────────────────────────────────────────────────────────────┤
│ Employé          │ 1│2│3│4│5│6│7│8│9│10│11│12│13│14│15│16│17│18│..│
│ K. Alami         │  │  │  │  │██CG████│  │  │  │  │  │  │  │  │  │ │
│ H. Bennis        │  │  │  │  │  │  │  │  │██MAL│  │  │  │  │  │  │ │
│ S. Mansouri      │  │  │  │  │  │  │  │  │  │  │██CG██│  │  │  │ │
│ ...                                                                │
└────────────────────────────────────────────────────────────────────┘
```

Couleur par type. Barre verte (CP), orange (RTT), rouge (maladie), bleu (mariage/paternité), gris (CSS).

Détection conflits : si > 30% d'une équipe absente la même semaine → alerte.

### Vue `Soldes`

Listing par employé :

| Employé | Acquis | Pris | En attente | Restant | Report N-1 | Δ % usage |

Couleur restant : > 10j vert, 5-10j orange, < 5j rouge, < 0 rouge foncé.

Filtres : département, status employé.

Action ligne : `Saisir manuel ajustement` (admin RH).

## 4. Création demande

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouvelle demande de congé                                            │
│                                                                      │
│ Employé * (auto si employé saisit lui-même, RH peut choisir tous)   │
│ [▾ Karim Alami                                                    ]  │
│                                                                      │
│ Type *                                                               │
│ [▾ Congé payé annuel                                              ]  │
│                                                                      │
│ Du *               Au *                                              │
│ [📅 12/05/2026]    [📅 18/05/2026]                                  │
│                                                                      │
│ Nombre de jours ouvrables : 5 (sam 17 et dim 18 exclus)             │
│                                                                      │
│ Solde restant après cette demande : 7,5 j                           │
│                                                                      │
│ Motif (optionnel pour CP, requis pour autres)                        │
│ [Vacances familiales                                              ]  │
│                                                                      │
│ Remplaçant pendant l'absence                                         │
│ [▾ Hassan Bennis                                                  ]  │
│                                                                      │
│ Justificatif (requis pour MARIAGE, NAISSANCE, MALADIE, etc.)        │
│ [📎 Pas de fichier]                                                  │
│                                                                      │
│ [Annuler]                              [Enregistrer brouillon][Soum]│
└──────────────────────────────────────────────────────────────────────┘
```

### Validation

- Type CP : motif facultatif, pas de justif.
- Type MALADIE / ACCIDENT : justificatif (certificat médical) obligatoire.
- Calcul `nbJoursOuvrables` : exclut samedi (sauf BTP qui travaille samedi → revoir : par défaut **dimanche** + jours fériés Maroc).
- Si `nbJoursOuvrables > soldeRestant` pour CP → blocage avec message.
- Détection chevauchement avec autre demande approuvée du même employé → blocage.

### Workflow

```
BROUILLON ─(soumettre)─► SOUMISE
SOUMISE ─(approbé N+1)─► APPROUVEE_N1 ─(approbé RH)─► APPROUVEE_RH ─(date du jour ≥ dateDebut)─► PRISE
SOUMISE ou APPROUVEE_N1 ─(refus)─► REJETEE (motif)
* ─(annuler par employé)─► ANNULEE (avant prise effective)
```

Approbations :
- N+1 = manager direct (auto-déterminé depuis Employe.managerId).
- RH = collaborateur avec rôle/permission `rh.conge.approuver`.

### Actions

- `Soumettre` → bascule SOUMISE + notif N+1.
- `Approuver` (N+1 ou RH selon contexte).
- `Rejeter` → motif obligatoire.
- `Annuler` → si pas encore PRISE.
- `Imprimer fiche congé`.

## 5. Calculs soldes

```ts
// dans CongesFacade
calculSoldeAcquis(employe: Employe, exercice: number): number {
  const ancienneteAnnees = anciennetelEnAnnees(employe.dateAnciennete || employe.dateEmbauche);
  let acquis = 18;                  // base BTP Maroc
  // 1.5j supplémentaires tous les 5 ans
  acquis += Math.floor(ancienneteAnnees / 5) * 1.5;
  // prorata si embauché en cours d'année
  const dateEmb = parseISO(employe.dateEmbauche);
  if (dateEmb.getFullYear() === exercice) {
    const moisRestants = 12 - dateEmb.getMonth();
    acquis = (acquis * moisRestants) / 12;
  }
  return Math.round(acquis * 2) / 2; // arrondi 0.5
}

calculSoldeRestant(employe: Employe, exercice: number): SoldeConge {
  const acquis = this.calculSoldeAcquis(employe, exercice);
  const reportN1 = this.reportNAnt(employe, exercice);
  const pris = this.demandes()
    .filter(d => d.employeId === employe.id 
              && d.status === 'PRISE' 
              && parseISO(d.dateDebut).getFullYear() === exercice)
    .reduce((s, d) => s + d.nbJoursOuvrables, 0);
  const enAttente = this.demandes()
    .filter(d => d.employeId === employe.id
              && (d.status === 'SOUMISE' || d.status === 'APPROUVEE_N1' || d.status === 'APPROUVEE_RH')
              && parseISO(d.dateDebut).getFullYear() === exercice)
    .reduce((s, d) => s + d.nbJoursOuvrables, 0);
  return { 
    acquis, 
    reportNAnt: reportN1, 
    pris, 
    enAttente, 
    restant: acquis + reportN1 - pris - enAttente 
  };
}
```

## 6. Composants

```
applications/erp/rh/components/
├── conge-status-badge/
├── conge-type-badge/
├── solde-progress-card/             # progress acquis vs pris
├── conges-calendar/                 # calendrier équipe
├── conge-form-dialog/
└── conge-print/                     # PDF fiche congé approuvée
```

## 7. Jours fériés Maroc 2026

Seed ces dates dans `applications/erp/rh/mock/jours-feries-ma.ts` :

```
2026-01-01  Nouvel an
2026-01-11  Manifeste de l'Indépendance
2026-03-21  Aïd el-Fitr (estimation lunaire)
2026-05-01  Fête du Travail
2026-05-28  Aïd el-Adha (estimation)
2026-06-18  1er Moharram (Nouvel an Hégire)
2026-07-30  Fête du Trône
2026-08-14  Récupération Oued Eddahab
2026-08-20  Révolution du Roi et du Peuple
2026-08-21  Fête de la Jeunesse
2026-08-26  Aïd el-Mawlid (estimation)
2026-11-06  Marche Verte
2026-11-18  Fête de l'Indépendance
```

À utiliser dans `nbJoursOuvrables` pour exclure les fériés des décomptes.

## 8. Mock seed

30+ demandes congés réparties 12 mois :
- 60% CONGE_PAYE_ANNUEL.
- 15% ARRET_MALADIE.
- 8% RTT.
- 17% autres (mariage, naissance, paternité, pèlerinage…).

Statuts : 5 BROUILLON/SOUMISE en cours, 8 APPROUVEE_RH à venir, 17 PRISE historiques.

Soldes calculés au 2026-05-08 cohérents.

## 9. Files to deliver

```
applications/erp/pages/rh/conges/
├── conges.routes.ts
├── models/, services/, config/...
├── conges-listing/...
├── conge-demande/
│   ├── conge-demande.page.{ts,html,scss}
│   └── components/calcul-jours-ouvrables/
├── soldes-conges/
│   └── soldes-conges.page.{ts,html,scss}
├── calendrier-conges/
│   └── calendrier-conges.page.{ts,html,scss}
└── components/conge-form-dialog/
```

## 10. DoD

- [ ] 3 vues opérationnelles : demandes, calendrier équipe, soldes.
- [ ] Création demande avec calcul auto jours ouvrables (exclut dimanche + fériés Maroc).
- [ ] Workflow 2 niveaux validation (N+1 + RH).
- [ ] Détection chevauchement et solde insuffisant.
- [ ] Calendrier équipe avec couleurs par type.
- [ ] Calcul solde correct (base + ancienneté + prorata + report).
- [ ] Mock seed cohérent (soldes en pris + en attente + restant = acquis + report).
- [ ] PDF fiche congé approuvée.
- [ ] Permissions par action.
