# 09 — HSE & Conformité réglementaire MA

> **Sévérité** : P0 (manquant) → exigé MOA publics et grands MOA privés
> **Estimation** : 1.5 sprint (S7)
> **Dépendances** : `01-foundations`, `02-chantiers-bugs`

## Findings traités

- [ ] **F-09** Module Qualité & HSE manquant — actuellement pages stub `non-conformites`, `incidents`, `formations`, `inspections` mais redirige sidebar vers `/`

## Goal

Module HSE conforme aux exigences légales marocaines : registre AT/MP, NC, audits chantier, formations, EPI, inspections, registres légaux (DT déclaration travaux, CNSS accidents).

⚠️ **Note** : il existe déjà des pages stub dans `app/applications/erp/pages/hse/` (formations, incidents, inspections, non-conformites). Vérifier leur contenu et **les compléter** plutôt que recréer.

## Concepts HSE Maroc à connaître

- **AT/MP** : Accident du Travail / Maladie Professionnelle — déclaration CNSS obligatoire dans les 48h
- **DT** : Déclaration de Travaux — chantier > 30 jours OU effectif > 30 OU situation à risque → déclaration ITT (Inspection du Travail)
- **DUER** : Document Unique d'Évaluation des Risques (obligatoire toutes entreprises)
- **PPSPS** : Plan Particulier Sécurité Protection Santé (chantier > 760 hommes-jour)
- **PHS** : Plan Hygiène Sécurité (chantier hors PPSPS)
- **CHS** : Comité d'Hygiène et de Sécurité (entreprise > 50 salariés)
- **EPI** : Équipement de Protection Individuelle (registre + vérifications)
- **Formations obligatoires** : conduite engins (CACES), travail en hauteur, secouriste, électricité

## Context to read first

```
app/applications/erp/pages/hse/                                # base existante (~30%)
app/applications/erp/pages/hse/formations/                     # à compléter
app/applications/erp/pages/hse/incidents/                      # à compléter
app/applications/erp/pages/hse/inspections/                    # à compléter
app/applications/erp/pages/hse/non-conformites/                # à compléter
app/applications/erp/hse/hse.routes.ts                         # routing module
app/applications/erp/shell/erp-nav.generated.ts                # nav HSE
```

---

## Architecture cible

```
app/applications/erp/pages/hse/
├── tableau-bord-hse/                # KPIs HSE (TR fréquence, gravité, NC ouvertes…)
├── incidents/                        # AT, MP, presqu-accident → DÉJÀ STUBBÉ
│   └── declaration-cnss/             # à ajouter : module spécifique CNSS
├── non-conformites/                  # NC chantier → DÉJÀ STUBBÉ
├── inspections/                      # audits HSE chantier → DÉJÀ STUBBÉ
├── formations/                        # plan formations + suivi → DÉJÀ STUBBÉ
├── epi/                              # registre EPI + vérif périodiques (NOUVEAU)
├── duer/                             # document unique évaluation risques (NOUVEAU)
├── ppsps/                            # PPSPS par chantier (NOUVEAU)
├── visites-medicales/                # suivi visites médicales employés (NOUVEAU)
├── registres/                        # registres légaux exportables (NOUVEAU)
│   ├── ats/                          # registre AT/MP
│   ├── dt/                           # déclarations travaux ITT
│   └── chs/                          # PV CHS
└── shared/
```

---

## Task 9.1 — Audit/compléter les modules existants

**Action** :
1. Lire le contenu actuel des pages stub HSE (formations, incidents, inspections, NC).
2. Identifier ce qui est seulement scaffold vs ce qui fonctionne.
3. Compléter chaque module avec :
   - Champs métier corrects (cf modèles ci-dessous)
   - Workflow complet (BROUILLON → SOUMIS → CLOS)
   - Actions transverses (créer NC depuis inspection, créer AT depuis incident)
4. Wirer le routing dans `app/applications/erp/hse/hse.routes.ts`.

### Modèle Incident / AT

```ts
export type IncidentType = 'PRESQUE_ACCIDENT' | 'ACCIDENT_MATERIEL' | 'AT_BENIN' | 'AT_GRAVE' | 'AT_MORTEL' | 'MP';
export type IncidentGravite = '1_BENIN' | '2_MODERE' | '3_GRAVE' | '4_MORTEL';

export interface Incident {
  id: string;
  numero: string;                        // INC-2026-001
  type: IncidentType;
  gravite: IncidentGravite;
  dateHeure: string;
  chantierId: string;
  chantierCode: string;
  victimeEmployeId?: string;             // si AT/MP
  victimeNom?: string;
  victimeCnssMatricule?: string;
  partieDuCorpsAtteinte?: string;
  natureLesion?: string;
  arretTravailJours?: number;
  description: string;
  causesProbables?: string[];
  actionsCorrectives?: string[];
  declarationCnssEnvoyee: boolean;
  declarationCnssDate?: string;
  declarationCnssNumero?: string;
  documents: string[];
  status: 'OUVERT' | 'EN_INVESTIGATION' | 'CLOS';
}
```

**Action critique** : si `IncidentType in ['AT_*', 'MP']` → bouton « Déclarer CNSS » + génération PDF de déclaration conforme + alerte 48h.

### Modèle Non-Conformité

```ts
export type NCSource = 'AUDIT_INTERNE' | 'INSPECTION_MOA' | 'PLAINTE_RIVERAIN' | 'AUTOCONTROLE' | 'AUTRE';
export type NCSeverite = 'MINEURE' | 'MAJEURE' | 'CRITIQUE';

export interface NonConformite {
  id: string;
  numero: string;
  source: NCSource;
  severite: NCSeverite;
  dateConstat: string;
  chantierId: string;
  zone?: string;
  description: string;
  actionImmediate?: string;
  actionsCorrectives: ActionCorrective[];
  responsableId: string;
  delaiCloture?: string;
  status: 'OUVERTE' | 'EN_TRAITEMENT' | 'CLOTUREE' | 'ANNULEE';
}

export interface ActionCorrective {
  description: string;
  responsableId: string;
  delai: string;
  status: 'A_FAIRE' | 'EN_COURS' | 'FAITE' | 'VERIFIEE';
  preuves: string[];
}
```

**Acceptance criteria** :
- [ ] 4 modules existants complétés avec workflows
- [ ] Drill-down chantier (lien `chantierCode → /chantiers/:id`)
- [ ] Création NC depuis Inspection (relation directe)

---

## Task 9.2 — Registre EPI + vérifications

**Modèle** :

```ts
export interface EpiReference {
  id: string;
  code: string;                          // EPI-001
  designation: string;                    // "Casque de chantier ABS"
  categorie: 'TETE' | 'YEUX' | 'AUDITIF' | 'RESPIRATOIRE' | 'MAINS' | 'PIEDS' | 'CORPS' | 'CHUTE';
  norme: string;                          // "EN 397"
  fournisseurPrefereId?: string;
  prixAchatUnitaire: number;
  dureeRenouvellementMois: number;        // 24, 36, etc.
}

export interface EpiAttribution {
  id: string;
  employeId: string;
  epiId: string;
  dateAttribution: string;
  dateRenouvellementPrevu: string;
  retournePar?: string;
  retournDate?: string;
  status: 'EN_USAGE' | 'RETOURNE' | 'PERDU' | 'ENDOMMAGE';
}

export interface EpiVerification {
  id: string;
  epiAttributionId: string;
  dateVerification: string;
  resultat: 'CONFORME' | 'A_REMPLACER' | 'HORS_USAGE';
  verificateurId: string;
  observations?: string;
}
```

**Pages** :
- `/hse/epi/references` : catalogue EPI
- `/hse/epi/attributions` : qui a quoi
- `/hse/epi/verifications` : campagne de vérif + alerte renouvellement

**Acceptance criteria** :
- [ ] Alerte « EPI à renouveler » si `dateRenouvellementPrevu < J+30`
- [ ] Sortie automatique de stock à attribution (lien vers Stock)

---

## Task 9.3 — DUER + PPSPS

**DUER** : grille d'évaluation par poste/zone : risque × probabilité × gravité = criticité.

**PPSPS** : par chantier, regroupe DUER + procédures + organigramme HSE.

**Pages** :
- `/hse/duer` : éditeur DUER par société
- `/hse/duer/templates` : modèles par activité (gros œuvre, étanchéité, électricité…)
- `/hse/ppsps/:chantierId` : génération PDF PPSPS chantier

**Acceptance criteria** :
- [ ] Templates DUER seedés par activité BTP
- [ ] PPSPS PDF avec sommaire conforme art. R4532-65 (équivalent MA via CCAG-T)

---

## Task 9.4 — Visites médicales

**Modèle** :

```ts
export type TypeVisite = 'EMBAUCHE' | 'PERIODIQUE' | 'REPRISE' | 'SURVEILLANCE_SPECIALE';

export interface VisiteMedicale {
  id: string;
  employeId: string;
  type: TypeVisite;
  datePrevue: string;
  dateRealisee?: string;
  medecinNom?: string;
  aptitude: 'APTE' | 'APTE_AVEC_RESTRICTION' | 'INAPTE_TEMPORAIRE' | 'INAPTE_DEFINITIF' | null;
  restrictions?: string;
  prochaineVisitePrevue?: string;
  documents: string[];
}
```

**Page** : `/hse/visites-medicales` listing + alertes prochaines visites.

**Périodicité légale MA** :
- Embauche : avant prise de poste
- Périodique : tous les 12 mois (24 mois pour cadres administratifs sans risque)
- Reprise : après arrêt > 21 jours

**Acceptance criteria** :
- [ ] Alerte automatique si visite à programmer < J+30
- [ ] Statut employé bloqué si « INAPTE » → ne peut être planifié sur chantier

---

## Task 9.5 — Registres légaux exportables

**Page** : `/hse/registres`

**Sous-pages** :
1. **Registre AT/MP** : tous les AT déclarés CNSS, exportable (PDF officiel CNSS)
2. **Registre DT** : déclarations Inspection du Travail, archivées
3. **Registre CHS** : PV des comités d'Hygiène et Sécurité (si applicable)

**Format export** : PDF tamponnable avec en-tête société (cf 12-exports).

---

## Task 9.6 — Tableau de bord HSE

**Page** : `/hse` (root) ou `/hse/tableau-bord`

**KPIs** :
- **Taux Fréquence** : `(nb AT × 1 000 000) / heures travaillées`
- **Taux Gravité** : `(jours arrêt × 1 000) / heures travaillées`
- NC ouvertes par sévérité
- EPI à renouveler J+30
- Visites médicales en retard
- Formations expirées

**Graphiques** :
- Pyramide de Bird (presque-accidents → AT bénin → AT grave → AT mortel)
- Évolution AT 12 derniers mois
- NC par chantier

**Acceptance criteria** :
- [ ] KPIs cohérents avec mock data
- [ ] Drill-down chaque KPI vers la liste filtrée

---

## Routing à wirer

**Fichier** : `app/applications/erp/hse/hse.routes.ts`

```ts
export const HSE_ROUTES: Routes = [
  { path: 'hse', pathMatch: 'full', loadComponent: () => import('../pages/hse/tableau-bord-hse/tableau-bord-hse.page').then(m => m.TableauBordHsePage) },
  { path: 'hse/incidents', loadChildren: () => import('../pages/hse/incidents/incidents.routes').then(m => m.INCIDENTS_ROUTES) },
  { path: 'hse/non-conformites', loadChildren: () => import('../pages/hse/non-conformites/nc.routes').then(m => m.NC_ROUTES) },
  { path: 'hse/inspections', loadChildren: () => import('../pages/hse/inspections/inspections.routes').then(m => m.INSPECTIONS_ROUTES) },
  { path: 'hse/formations', loadChildren: () => import('../pages/hse/formations/formations.routes').then(m => m.FORMATIONS_ROUTES) },
  { path: 'hse/epi', loadChildren: () => import('../pages/hse/epi/epi.routes').then(m => m.EPI_ROUTES) },
  { path: 'hse/duer', loadChildren: () => import('../pages/hse/duer/duer.routes').then(m => m.DUER_ROUTES) },
  { path: 'hse/ppsps', loadChildren: () => import('../pages/hse/ppsps/ppsps.routes').then(m => m.PPSPS_ROUTES) },
  { path: 'hse/visites-medicales', loadComponent: () => import('../pages/hse/visites-medicales/visites-medicales.page').then(m => m.VisitesMedicalesPage) },
  { path: 'hse/registres', loadChildren: () => import('../pages/hse/registres/registres.routes').then(m => m.REGISTRES_ROUTES) },
];
```

## Dépendances inverses

- 12-exports-impressions : PDF déclaration CNSS, PPSPS, registres
- 13-rh-terrain : checkbox HSE sur pointage chantier (port EPI, etc.)
