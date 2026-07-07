# Agent — Matériel & Équipements

> **Objet** : gestion du parc matériel (engins, outillage), affectations chantier, locations externes, maintenance, carburant. ~30% existe déjà sous `pages/inventory/materiel/` — à compléter et durcir.
> **Routes** : `/materiel/*`
> **Permission** : `materiel.<entity>.*`

## 0. Pré-requis

[00-CONVENTIONS](00-CONVENTIONS.md), [00-MOCK-DATA-STRATEGY](00-MOCK-DATA-STRATEGY.md), [00-UX-PRINCIPES](00-UX-PRINCIPES.md). Lire `pages/inventory/materiel/` (existant). Modèle partiel déjà : `applications/erp/inventory/models/index.ts` → `CatalogueMateriel`, `AffectationChantier`, `LocationExterne`, `MaterielStatus`.

## 1. Routes nav (source : erp-nav.generated)

| Route | Description |
|-------|-------------|
| `/materiel/parc` | Parc matériel (instances) |
| `/materiel/affectations` | Affectations matériel × chantier |
| `/materiel/locations` | Locations externes (location auprès de tiers) |
| `/materiel/maintenance` | Plan & historique maintenance |
| `/materiel/carburant` | Suivi consommations carburant |

> Le **catalogue matériel** (nomenclature des modèles) reste sous `/inventory/catalogue/materiel` (cf. 04-stock-refinement §P1.3).

## 2. Modèle complémentaire

```ts
// applications/erp/materiel/models/

export interface MaintenanceEvent {
  id: string;
  materielId: string;
  materielName?: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'CONTROLE' | 'ACCIDENT';
  dateEvent: string;
  intervenant: 'INTERNE' | 'EXTERNE';
  fournisseurId?: string;            // si EXTERNE
  fournisseurName?: string;
  prestations: string[];             // ['Vidange', 'Filtres', 'Plaquettes...']
  pieces?: { articleId: string; articleName?: string; quantite: number; coutHt?: number }[];
  coutMoHt: number;
  coutPiecesHt: number;
  coutTotalHt: number;
  prochaineEcheance?: string;
  prochainCompteurHeure?: number;
  documents?: { name: string; url: string }[];
  notes?: string;
  status: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
}

export interface CarnetCompteur {
  id: string;
  materielId: string;
  date: string;
  compteurHeure?: number;            // pour engins (heures)
  compteurKm?: number;               // pour camions (km)
  saisieParId: string;
  saisieParName?: string;
  notes?: string;
}

export interface ConsommationCarburant {
  id: string;
  date: string;
  materielId: string;
  materielName?: string;
  conducteurId?: string;
  conducteurName?: string;
  chantierId?: string;
  chantierName?: string;
  type: 'GASOIL' | 'ESSENCE' | 'ADBLUE';
  litrage: number;
  prixUnitaire: number;
  totalHt: number;
  fournisseurId?: string;
  fournisseurName?: string;
  bonReference?: string;             // bon de carburant pompe
  compteurHeure?: number;
  consommationL100km?: number;        // calculé pour camions
  consommationLheure?: number;        // calculé pour engins
  notes?: string;
}
```

## 3. Routes module

```ts
// applications/erp/materiel/materiel.routes.ts
export const MATERIEL_ROUTES: Routes = [
  { path: 'materiel/parc', loadChildren: () => import('../pages/materiel/parc/parc.routes').then(m => m.PARC_ROUTES) },
  { path: 'materiel/affectations', loadComponent: () => import('../pages/materiel/affectations/affectations.page').then(m => m.AffectationsPage) },
  { path: 'materiel/locations', loadComponent: () => import('../pages/materiel/locations-externes/locations-externes.page').then(m => m.LocationsExternesPage) },
  { path: 'materiel/maintenance', loadChildren: () => import('../pages/materiel/maintenance/maintenance.routes').then(m => m.MAINTENANCE_ROUTES) },
  { path: 'materiel/carburant', loadComponent: () => import('../pages/materiel/carburant/carburant.page').then(m => m.CarburantPage) },
];
```

> **Note** : ces routes existent partiellement dans `inventory.routes.ts` actuel — à **migrer** dans le nouveau module `applications/erp/materiel/` pour cohérence.

## 4. `/materiel/parc` — Parc matériel

### Listing

Colonnes : `code`, `name`, `marque`, `modele`, `numeroSerie`, `anneeMiseEnService`, `compteurHeure`/`compteurKm`, `chantierActuelName`, `status`, `prochaineMaintenance`.

Filtres : `status` (DISPONIBLE, AFFECTE, MAINTENANCE, HORS_SERVICE), `famille`, `marque`, `chantierActuel`, `maintenanceDuesAvant` (date).

Chips : `Disponibles`, `En chantier`, `Maintenance prévue < 30j`, `Hors service`.

### Detail à onglets

1. **Identité** — code, désignation, catalogue lié, marque, modèle, n° série, année MES, photos.
2. **Caractéristiques** — puissance, capacité, dimensions, poids (depuis catalogue + overrides).
3. **Compteurs** — heure / km, dernière saisie, courbe d'utilisation 12 mois.
4. **Affectations** — historique chantiers (table avec date début/fin).
5. **Maintenance** — historique + planning (lien vers /materiel/maintenance filtré).
6. **Carburant** — synthèse conso L/100 ou L/h, dernier plein, lien vers /materiel/carburant.
7. **Coûts** — coût total propriété (achat + maintenance + carburant) sur période, € par heure utilisé, comparaison aux prix de location externe.
8. **Documents** — carte grise, assurance, contrôle technique, garanties.
9. **Activité** — timeline.

### Actions sur fiche

- `Affecter à chantier` — crée `AffectationChantier`.
- `Mettre en maintenance` — crée `MaintenanceEvent` PLANIFIE.
- `Mettre hors service` — change status, motif obligatoire.

## 5. `/materiel/affectations`

### Listing

Vue mixte : table + mini-Gantt selon toggle `Liste / Planning`.

Table colonnes : `materielName`, `chantierName`, `dateDebut`, `dateFin`, `status`, `dureeJours`.

Planning : barres horizontales par engin, avec affectations colorées par chantier.

### Création

Wizard 1 page :
- Matériel (filtre : disponible).
- Chantier (autocomplete chantiers actifs).
- Date début / fin prévue.
- Conducteur engin (autocomplete employés).
- Compteur début (lecture compteur de départ).
- Notes.

À la création, status matériel passe `DISPONIBLE → AFFECTE`.

### Clôture affectation

Bouton `Clôturer` :
- Saisie date fin réelle + compteur fin.
- Calcul `heuresUtilisees = compteurFin - compteurDebut` (ou km).
- Bascule materiel `AFFECTE → DISPONIBLE`.

## 6. `/materiel/locations`

### Listing

Locations externes (matériel loué auprès de tiers).

Colonnes : `reference`, `fournisseurName`, `materielDescription`, `chantierName`, `dateDebut`, `dateFin`, `prixJournalier`, `dureeJours`, `coutTotalHt`, `status`.

Filtres : fournisseur, chantier, status, dateRange.

### Detail

Sections :
1. **Identité** — référence, fournisseur (lookup), description matériel.
2. **Affectation** — chantier, dates.
3. **Conditions financières** — prix journalier, durée, coût total HT.
4. **Compteurs** — heures utilisées (factura. à l'usage), si applicable.
5. **Documents** — contrat location, BL, factures.

Workflow : `EN_COURS → TERMINEE` ou `ANNULEE`.

## 7. `/materiel/maintenance`

### Listing

Vue calendrier par défaut + toggle table.

Calendrier : événements maintenance positionnés sur la date, code couleur par type (préventive vert, corrective orange, contrôle bleu, accident rouge).

Table colonnes : `date`, `materielName`, `type`, `intervenant`, `prestations`, `coutTotalHt`, `status`.

Filtres : materiel, type, intervenant, dateRange, status.

Chips : `À planifier` (PLANIFIE futur), `En cours`, `Terminées 30j`, `En retard` (PLANIFIE passé).

### Detail

Sections :
1. **Identité** — matériel (lookup), date, type, intervenant.
2. **Prestations** — multi-input : libellé prestation.
3. **Pièces** — table éditable : article (lookup catalogue articles), quantité, coût.
4. **Coûts** — sticky : coût MO + coût pièces + total.
5. **Compteurs** — compteur à l'event + prochain compteur prévu.
6. **Documents** — bon de travaux, factures intervenant externe, photos.

Workflow : `PLANIFIE → EN_COURS → TERMINE` ou `ANNULE`.

À la fin (`TERMINE`), bascule matériel `MAINTENANCE → DISPONIBLE`.

## 8. `/materiel/carburant`

### Listing

Colonnes : `date`, `materielName`, `conducteurName`, `chantierName`, `type`, `litrage`, `prixUnitaire`, `totalHt`, `consommationL100km`/`Lheure`, `bonReference`.

Filtres : matériel, chantier, conducteur, type carburant, dateRange.

Chips : `Aujourd'hui`, `Cette semaine`, `Ce mois`.

### Saisie

Form simple :
- Date (défaut today).
- Matériel (autocomplete).
- Conducteur (autocomplete employés conducteurs).
- Chantier (lookup, depuis affectation courante du matériel).
- Type carburant.
- Litrage.
- Prix unitaire (auto-rempli depuis dernière saisie ou config).
- Total HT (calc).
- Compteur (heure/km à la prise).
- Référence bon.

À la sauvegarde :
- Crée `ConsommationCarburant`.
- Met à jour compteur du matériel (`CarnetCompteur`).
- Calcule `consommationL100km` / `Lheure` (si compteur précédent connu).

### Synthèse

Carte en haut listing : `Total ce mois : N L · X K MAD HT · variation vs mois précédent`.

Graph : courbe litrage / mois × type, sur 12 mois.

## 9. Composants module

```
applications/erp/materiel/components/
├── materiel-status-badge/
├── materiel-link/
├── compteur-display/                # affiche heures + variation
├── maintenance-calendar/            # calendrier événements
├── affectations-gantt/              # planning Gantt mini
├── conso-carburant-chart/           # courbe consommations
└── coup-propriete-card/             # synthèse TCO matériel
```

## 10. Mock seed

- 25 engins / matériels au parc (cf. MOCK-DATA §Articles/Engins étendu) :
  - 3 pelles (CAT 320, JCB JS220, Volvo EC210).
  - 2 chargeurs (Volvo L60, CAT 938).
  - 2 grues à tour Potain.
  - 4 camions benne (Renault Kerax, MAN TGS).
  - 3 bétonnières.
  - 4 compresseurs.
  - 3 vibreurs.
  - 4 lots échafaudages.
- 30 affectations (mix actives / terminées) sur 6 mois.
- 12 locations externes actives.
- 50+ événements maintenance (préventives planifiées + correctives historiques).
- 200+ saisies carburant sur 6 mois.

## 11. UX details

- **Calendrier maintenance** : drag-drop pour replanifier (avec confirm).
- **Mini-graph compteur** : courbe d'évolution du compteur sur 12 mois pour pilotage utilisation.
- **Coût propriété** : carte synthèse `TCO HT/heure utilisée` à comparer au prix location externe → recommandation `Plus rentable que location` ou inverse.
- **Affectations conflictuelles** : alerte si on affecte un matériel déjà en chantier sur dates qui se chevauchent.
- **Saisie carburant mobile** : interface ergonomique smartphone pour conducteurs (peu de champs, gros boutons).

## 12. Files to deliver

```
applications/erp/materiel/
├── materiel.routes.ts
├── components/...
├── mock/{materiel-mock.service.ts, seeds.ts}
└── models/index.ts

applications/erp/pages/materiel/
├── parc/                         # MIGRER depuis pages/inventory/materiel/parc/
├── affectations/                 # MIGRER depuis pages/inventory/materiel/affectations/
├── locations-externes/           # MIGRER
├── maintenance/                  # NEW
└── carburant/                    # NEW
```

## 13. DoD

- [ ] Pages parc, affectations, locations migrées proprement (pas de doublon avec `pages/inventory/materiel/`).
- [ ] Maintenance : vue calendrier + table + workflow complet.
- [ ] Carburant : saisie ergonomique mobile + synthèses graphiques.
- [ ] Calculs TCO et conso L/100 ou L/h corrects.
- [ ] Affectations détectent les conflits.
- [ ] Mock seed riche et cohérent (engins crédibles BTP Maroc).
- [ ] `materiel.routes.ts` injecté dans erp.routes.generated.ts (et anciennes routes inventory matériel retirées de `inventory.routes.ts` pour éviter les doublons).
- [ ] Permissions par entité.
- [ ] Performance : calendrier maintenance avec 50+ events rendu < 500ms.
