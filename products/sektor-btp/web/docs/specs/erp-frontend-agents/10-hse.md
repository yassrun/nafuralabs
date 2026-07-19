# Agent — Qualité, Hygiène, Sécurité, Environnement (HSE)

> **Objet** : module HSE BTP — incidents, non-conformités, inspections, formations sécurité. Critique réglementaire et image marque.
> **Routes** : `/hse/incidents`, `/hse/non-conformites`, `/hse/inspections`, `/hse/formations`
> **Permission** : `hse.<entity>.*`

## 0. Pré-requis

[00-CONVENTIONS](00-CONVENTIONS.md), [00-MOCK-DATA-STRATEGY](00-MOCK-DATA-STRATEGY.md), [00-UX-PRINCIPES](00-UX-PRINCIPES.md). Dépend des modules **chantiers** (lookup) et **rh** (employés).

## 1. Vue d'ensemble

Le module HSE permet de :
1. Déclarer les **incidents** (presque-accident, accident léger, accident grave) sur chantier.
2. Tracer les **non-conformités** (qualité, sécurité, environnement).
3. Planifier les **inspections** sécurité et qualité.
4. Gérer les **formations** obligatoires (CACES, habilitations, secourisme, conduite en sécurité).

Tous les éléments sont rattachés à un chantier et/ou à un employé pour analytique et reporting OPP-BTP / CNSS / inspecteur du travail.

## 2. Modèle

```ts
// applications/erp/hse/models/

export type IncidentType = 'PRESQUE_ACCIDENT' | 'ACCIDENT_LEGER' | 'ACCIDENT_GRAVE' | 'ACCIDENT_MORTEL' | 'INCIDENT_ENVIRONNEMENTAL' | 'DEGAT_MATERIEL';
export type IncidentSeverite = 'INFO' | 'MINEUR' | 'MAJEUR' | 'CRITIQUE';
export type IncidentStatus = 'DECLARE' | 'EN_INVESTIGATION' | 'ACTIONS_EN_COURS' | 'CLOS' | 'ARCHIVE';

export interface Incident {
  id: string;
  numero: string;                       // INC-2026-007
  type: IncidentType;
  severite: IncidentSeverite;
  
  // Quand & où
  dateEvent: string;
  heureEvent?: string;
  chantierId?: string;
  chantierName?: string;
  zonePrecise?: string;                 // 'Niveau R+2 — façade nord'
  
  // Personnes
  victimes: VictimeIncident[];
  temoinsIds?: string[];
  declarantId: string;
  declarantName?: string;
  
  // Description
  description: string;
  causesIdentifiees?: string[];         // 'EPI manquant', 'défaut sécurité collective'
  consequences?: string;
  
  // Actions
  actionsImmediates?: string;
  actionsCorrectives: ActionCorrective[];
  
  // Reporting
  declarationCnssRequise: boolean;
  declarationCnssFaite?: boolean;
  declarationInspecteurRequise: boolean;
  declarationInspecteurFaite?: boolean;
  
  // Pièces
  photos?: { url: string; caption?: string }[];
  documents?: { name: string; url: string }[];
  
  status: IncidentStatus;
  enqueteurId?: string;
  enqueteurName?: string;
  dateCloture?: string;
  notes?: string;
  createdAt: string;
}

export interface VictimeIncident {
  id: string;
  incidentId: string;
  employeId?: string;                   // si interne
  employeName?: string;
  nomExterne?: string;                  // si sous-traitant ou tiers
  qualite?: string;                     // 'Maçon', 'Sous-traitant ETB'
  natureBlessure?: string;
  partieCorps?: string;
  arretTravailJours?: number;
  hospitalisation?: boolean;
  bilan?: string;
}

export interface ActionCorrective {
  id: string;
  incidentId?: string;
  ncId?: string;
  inspectionId?: string;
  description: string;
  responsableId: string;
  responsableName?: string;
  dateEcheance: string;
  dateRealisation?: string;
  status: 'PLANIFIEE' | 'EN_COURS' | 'REALISEE' | 'EN_RETARD' | 'ANNULEE';
  preuveRealisation?: string;
  notes?: string;
}

export type NCType = 'QUALITE' | 'SECURITE' | 'ENVIRONNEMENT' | 'PROCESS' | 'CLIENT';
export type NCStatus = 'OUVERTE' | 'EN_TRAITEMENT' | 'TRAITEE' | 'CLOSE';

export interface NonConformite {
  id: string;
  numero: string;                       // NC-2026-018
  type: NCType;
  gravite: 'MINEURE' | 'MAJEURE' | 'CRITIQUE';
  
  dateDetection: string;
  detectee Par: string;
  chantierId?: string;
  origine?: string;                     // 'Audit interne', 'Plainte client', 'Inspection'
  
  description: string;
  exigenceNonRespectee?: string;        // référence document/norme
  
  causes Racines: string;
  actions: ActionCorrective[];
  
  controleEfficaciteFait?: boolean;
  controleEfficaciteDate?: string;
  controleEfficaciteResultat?: string;
  
  status: NCStatus;
  documents?: { name: string; url: string }[];
  notes?: string;
}

export type InspectionType = 'SECURITE_QUOTIDIENNE' | 'AUDIT_HEBDO' | 'INSPECTION_MENSUELLE' | 'AUDIT_INTERNE_QUALITE' | 'AUDIT_EXTERNE' | 'CONTROLE_REGLEMENTAIRE';
export type InspectionStatus = 'PLANIFIEE' | 'EN_COURS' | 'REALISEE' | 'ANNULEE';

export interface Inspection {
  id: string;
  numero: string;                       // INSP-2026-0089
  type: InspectionType;
  
  chantierId?: string;
  datePrevue: string;
  dateRealisee?: string;
  inspecteurInterneIds?: string[];
  inspecteurExterneNom?: string;
  inspecteurExterneOrganisme?: string;
  
  checklistId?: string;                 // référence à un template
  resultats: InspectionPoint[];
  
  ncDetectees: string[];                // ids NC créées suite à inspection
  
  scoreGlobalPercent?: number;          // ex 87% (points OK / total)
  
  rapportUrl?: string;
  signatureClientUrl?: string;
  
  status: InspectionStatus;
  notes?: string;
}

export interface InspectionPoint {
  id: string;
  inspectionId: string;
  ordre: number;
  rubrique: string;                     // 'EPI', 'Échafaudages', 'Stockage matériaux'
  pointControle: string;                // 'Casques portés par tous'
  resultat: 'CONFORME' | 'NON_CONFORME' | 'NON_APPLICABLE';
  observations?: string;
  photoUrl?: string;
  ncCreeeId?: string;
}

export interface ChecklistTemplate {
  id: string;
  code: string;
  libelle: string;
  type: InspectionType;
  rubriques: ChecklistRubrique[];
  isActive: boolean;
}

export interface ChecklistRubrique {
  id: string;
  templateId: string;
  ordre: number;
  rubrique: string;
  points: { id: string; ordre: number; libelle: string; obligatoire: boolean }[];
}

export type FormationType = 'CACES_R482' | 'CACES_R486' | 'CACES_R483' | 'HABILITATION_ELECTRIQUE' | 'TRAVAIL_HAUTEUR' | 'PORT_HARNAIS' | 'SECOURISTE_SST' | 'INCENDIE' | 'AMIANTE_SS3' | 'AMIANTE_SS4' | 'PRAP' | 'MANAGEMENT_HSE' | 'AUTRE';

export interface FormationSession {
  id: string;
  numero: string;                       // FORM-2026-024
  type: FormationType;
  intitule: string;
  organisme?: string;                   // 'OFPPT Casablanca', 'Bureau Veritas'
  formateurNom?: string;
  
  dateDebut: string;
  dateFin: string;
  dureeHeures: number;
  lieu?: string;
  
  participants: ParticipantFormation[];
  coutTotalHt?: number;
  
  status: 'PLANIFIEE' | 'EN_COURS' | 'REALISEE' | 'ANNULEE';
  attestationsEmises?: boolean;
  documents?: { name: string; url: string }[];
  notes?: string;
}

export interface ParticipantFormation {
  id: string;
  sessionId: string;
  employeId: string;
  employeName?: string;
  resultat?: 'REUSSI' | 'ECHEC' | 'ABSENT';
  scoreObtenu?: number;
  attestationUrl?: string;
  dateValidite?: string;                // si renouvelable (CACES 5 ans)
}
```

## 3. Routes

```ts
// applications/erp/hse/hse.routes.ts
export const HSE_ROUTES: Routes = [
  { path: 'hse/incidents', loadChildren: () => import('../pages/hse/incidents/incidents.routes').then(m => m.INCIDENTS_ROUTES) },
  { path: 'hse/non-conformites', loadChildren: () => import('../pages/hse/non-conformites/nc.routes').then(m => m.NC_ROUTES) },
  { path: 'hse/inspections', loadChildren: () => import('../pages/hse/inspections/inspections.routes').then(m => m.INSPECTIONS_ROUTES) },
  { path: 'hse/formations', loadChildren: () => import('../pages/hse/formations/formations.routes').then(m => m.FORMATIONS_ROUTES) },
];
```

## 4. `/hse/incidents`

### Listing

Colonnes : `numero`, `type`, `severite`, `dateEvent`, `chantierName`, `nbVictimes`, `arretTravailJoursTotal`, `status`, `nbActionsOuvertes`.

Filtres : type, severite, status, chantier, dateRange.

Chips : `Cette semaine`, `Critiques ouverts`, `Avec arrêt travail`, `Déclarations CNSS en attente`, `Mes investigations`.

CTA `+ Déclarer incident` (mode urgence — accessible mobile).

### Saisie incident — formulaire ergonomique mobile

```
┌──────────────────────────────────────────┐
│ Déclarer un incident          [Brouillon]│
├──────────────────────────────────────────┤
│ Type *                                   │
│ ◯ Presque-accident                       │
│ ◯ Accident léger                         │
│ ● Accident grave                         │
│ ◯ Incident environnemental               │
│ ◯ Dégât matériel                         │
│                                          │
│ Sévérité * ◯ Info ◯ Mineur ● Majeur ◯ Cri│
│                                          │
│ Date * 08/05/2026   Heure 14:35          │
│                                          │
│ Chantier * [▾ CH-2026-001 Yasmine     ]  │
│ Zone précise [Niveau R+2 — façade ouest] │
│                                          │
│ ─── Victimes ─────────────────────────   │
│ + Ajouter victime                        │
│ ┌─ S. Mansouri (EMP-031) ─────────────┐  │
│ │ Nature blessure : Fracture poignet  │  │
│ │ Partie corps : Avant-bras gauche    │  │
│ │ Arrêt prévu : [ 21 ] jours          │  │
│ │ Hospitalisé : ◯ Oui ● Non          │  │
│ └─────────────────────────────────────┘  │
│                                          │
│ Description de l'événement *              │
│ [...]                                    │
│                                          │
│ ─── Photos ────────────────────────────  │
│ [📷 Ajouter photo (max 10)]              │
│                                          │
│ ─── Témoins ──────────────────────────   │
│ [Ajouter témoins...]                     │
│                                          │
│ ─── Reporting ────────────────────────   │
│ ☑ Déclaration CNSS requise               │
│ ☐ Déclaration inspecteur travail requise │
│                                          │
│ [ Enregistrer brouillon ] [ Déclarer ]   │
└──────────────────────────────────────────┘
```

### Detail

Onglets :
1. **Synthèse** — récap déclaration.
2. **Victimes** — liste avec détails médicaux.
3. **Investigation** — causes identifiées (5 pourquoi, arbre causes), arbre cause-conséquence (V2).
4. **Actions correctives** — table actions avec responsable, échéance, status.
5. **Reporting** — checklist déclarations CNSS / inspecteur, attachements officiels.
6. **Photos & documents**.
7. **Activité** — timeline.

### Workflow

```
DECLARE ─► EN_INVESTIGATION ─► ACTIONS_EN_COURS ─(toutes actions REALISEE)─► CLOS ─► ARCHIVE
```

### Mock seed

15+ incidents répartis 6 mois :
- 8 PRESQUE_ACCIDENT.
- 4 ACCIDENT_LEGER.
- 2 ACCIDENT_GRAVE.
- 1 ENVIRONNEMENTAL.
- Statuts mix.

## 5. `/hse/non-conformites`

### Listing

Colonnes : `numero`, `type`, `gravite`, `dateDetection`, `chantierName`, `description`, `nbActionsOuvertes`, `status`.

Filtres : type, gravite, status, chantier, dateRange.

Chips : `Ouvertes`, `En traitement`, `Critiques`, `Avec contrôle efficacité prévu`.

### Saisie

Form similaire incident mais orienté qualité : type (qualité/sécurité/env/process/client), description, exigence non respectée (référence), causes racines, actions correctives.

### Workflow

```
OUVERTE ─► EN_TRAITEMENT ─(actions réalisées)─► TRAITEE ─(contrôle efficacité OK)─► CLOSE
```

### Mock seed

20+ NC réparties.

## 6. `/hse/inspections`

### Listing

Vue **calendrier + table** :

- **Calendrier** par défaut : événements colorés par type d'inspection.
- **Table** alternative : numero, type, datePrevue, chantier, scoreGlobal, ncDetecteesNb, status.

Filtres : type, status, chantier, dateRange.

CTA `+ Planifier inspection`.

### Detail / Réalisation

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← INSP-2026-0089  Inspection mensuelle CH-2026-001  [EN_COURS]      │
│                                                                      │
│ Inspecteur : H. Bennis   Prévue : 08/05/2026                        │
│                                                                      │
│ Score global : 23/26 = 88,5%                                         │
├──────────────────────────────────────────────────────────────────────┤
│ ▼ EPI (5/5)                                                          │
│   ✓ Casques portés par tous                                          │
│   ✓ Chaussures de sécurité                                           │
│   ✓ Gilets haute visibilité                                          │
│   ✓ Lunettes selon poste                                             │
│   ✓ Gants spécifiques                                                │
│ ▼ Échafaudages (4/5)                                                 │
│   ✓ Stabilité                                                        │
│   ✓ Garde-corps                                                      │
│   ✗ Plinthes de pied (NC-018) [créer NC]                            │
│   ✓ Accès sécurisé                                                   │
│   ✓ Affiche de vérification                                          │
│ ▼ Stockage matériaux (3/4)                                           │
│   ...                                                                │
│ ▼ Hygiène & sanitaires (5/5)                                         │
│ ▼ Signalisation (5/5)                                                │
│ ▼ Plan de circulation (1/2)                                          │
│   ...                                                                │
│                                                                      │
│ [Sauvegarder] [Finaliser & générer rapport] [Imprimer]              │
└──────────────────────────────────────────────────────────────────────┘
```

### Comportement

- Checklist depuis template (CHECKLIST_SECURITE_HEBDO, CHECKLIST_QUALITE_ECHAUFFAGE…).
- Pour chaque point : ✓ Conforme, ✗ Non conforme, n.a.
- Sur ✗ : ouverture rapide d'une NC pré-remplie.
- Photo possible par point.
- Score auto = points OK / (total - n.a.).

### Mock seed

40+ inspections réparties 6 mois (1-2 hebdo par chantier actif). 10 templates de checklist.

## 7. `/hse/formations`

### Listing

Colonnes : `numero`, `type`, `intitule`, `dateDebut`, `dateFin`, `dureeHeures`, `nbParticipants`, `organisme`, `coutTotalHt`, `status`.

Filtres : type, status, organisme, dateRange.

Chips : `Planifiées`, `Réalisées 30j`, `Habilitations expirent < 60j`, `À renouveler`.

### Detail

Sections :
1. **Identité session** — type formation, intitulé, organisme, formateur, dates, lieu.
2. **Participants** — table employés inscrits avec résultats.
3. **Coûts** — coût HT, par participant.
4. **Documents** — convocations, programme, support, attestations.

### Vue par employé (alternative)

`/hse/formations/employe/:id` — historique formations d'un employé avec dates de validité (CACES = 5 ans, habilitation élec = 3 ans, SST = 2 ans).

Alerte 60j avant expiration → ajoute à la liste de personnes à former.

### Mock seed

15+ sessions sur 12 mois, types variés. ~80 attestations actives reparties sur les 40 employés.

## 8. Composants

```
applications/erp/hse/components/
├── incident-status-badge/
├── nc-status-badge/
├── severite-badge/
├── action-corrective-card/
├── checklist-runner/                # exécution interactive checklist inspection
├── photo-uploader-multi/
├── attestation-validity-cell/       # date validité avec couleur
├── score-gauge/                     # jauge score inspection
└── declaration-tracker/             # tracker déclarations CNSS/inspecteur
```

## 9. UX details

- **Mode urgence mobile** : déclaration incident accessible via FAB rouge en bas de la nav, formulaire optimisé tactile.
- **Géolocalisation** (V2) : photo capturée avec coordonnées GPS automatiques.
- **Notifications** : à la création d'un incident GRAVE / CRITIQUE, notif au DG + DAF (V2 — V1 mock).
- **PDF rapport inspection** : généré automatiquement à la finalisation, avec score, points NC, photos, signature.
- **Alertes habilitations** : ajout au dashboard 60j avant échéance.
- **Lien vers chantier** : bidirectionnel — fiche chantier affiche compteur incidents/NC actifs.

## 10. Files to deliver

```
applications/erp/hse/
├── hse.routes.ts
├── components/...
├── mock/{hse-mock.service.ts, checklist-templates.ts, seeds.ts}
└── models/index.ts

applications/erp/pages/hse/
├── incidents/
│   ├── incidents.routes.ts
│   ├── incident-listing/, incident-detail/, incident-declare-mobile/
│   └── components/{victime-form, action-corrective-dialog}/
├── non-conformites/
│   ├── nc.routes.ts
│   ├── nc-listing/, nc-detail/, nc-form/
├── inspections/
│   ├── inspections.routes.ts
│   ├── inspection-listing/, inspection-detail/, inspection-realisation/
│   └── components/{checklist-runner, score-gauge}/
└── formations/
    ├── formations.routes.ts
    ├── formation-listing/, formation-detail/, formations-employe-vue/
    └── components/{participants-table, attestation-validity-card}/
```

## 11. DoD

- [ ] 4 features livrées avec listing + detail + workflow.
- [ ] Saisie incident mobile optimisée (test 360px).
- [ ] Création NC depuis inspection avec point non-conforme.
- [ ] Checklist runner interactif avec score auto.
- [ ] Suivi validité attestations + alertes 60j.
- [ ] Mock seed cohérent : tous incidents/NC liés à chantiers réels.
- [ ] PDF rapport inspection généré.
- [ ] `hse.routes.ts` injecté dans erp.routes.generated.ts.
- [ ] Permissions par entité.
- [ ] Lien retour fiche chantier (compteur incidents/NC actifs).
