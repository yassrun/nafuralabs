# 13 — RH Terrain : pointage chantier mobile + offline

> **Sévérité** : P2 → P1 si différenciation commerciale
> **Estimation** : 1.5 sprint (S7–S8)
> **Dépendances** : `01-foundations`, `02-chantiers-bugs`, mobile/PWA setup

## Findings traités

- [ ] **F-32** Module RH : sous-routes manquantes (`/rh/pointage` redirige vers `/`, `/rh/planning-equipes` à vérifier)
- [ ] **MOB-01, MOB-02** PWA installable + offline-first pour pointage
- [ ] Carnet d'attachement (cf checklist marché marocain)
- [ ] Journal de chantier (cf checklist marché marocain)

## Goal

Module **différenciateur commercial** vs concurrents généralistes : pointage chantier digital sur mobile/tablette, avec photo + géoloc + saisie offline. Inclut carnet d'attachement et journal de chantier (livrables MOA exigés).

## Concepts BTP MA

- **Pointage** : présence ouvrier sur chantier par jour (entrée/sortie)
- **Carnet d'attachement** : journal quotidien des travaux exécutés (quantités, localisation, lots) → base de la facturation au prix unitaire (BPU)
- **Journal de chantier** : événements (visites MOA, intempéries, livraisons, incidents, ordres de service)

## Architecture cible

```
app/applications/erp/pages/rh/
├── pointage/                      # NOUVEAU
│   ├── pointage-saisie/           # vue saisie mobile (PWA)
│   ├── pointage-listing/          # vue cumul desktop
│   ├── pointage-validation/       # validation chef chantier
│   ├── config/
│   ├── models/
│   └── services/
├── planning-equipes/              # NOUVEAU
│   ├── planning-equipes.page/     # Gantt RH par chantier
│   └── ...
└── ...

app/applications/erp/pages/chantiers/
├── attachements/                  # NOUVEAU
│   ├── attachement-saisie/        # mobile-friendly
│   ├── attachement-listing/
│   └── ...
└── journal/                       # NOUVEAU
    ├── journal.page/              # timeline événements chantier
    └── ...
```

---

## Task 13.1 — Pointage chantier mobile

**UX cible** : tablette de chantier ou smartphone du chef chantier ; saisie matin (8h) et soir (17h) ; ~50 ouvriers.

**Modèle** :

```ts
export type PointageMode = 'PRESENT' | 'ABSENT' | 'CONGE' | 'MALADIE' | 'FORMATION' | 'AUTRE';

export interface Pointage {
  id: string;
  date: string;                          // YYYY-MM-DD
  chantierId: string;
  chantierCode: string;
  employeId: string;
  employeNom: string;
  mode: PointageMode;
  heureArrivee?: string;                  // HH:mm
  heureDepart?: string;
  heuresNormales?: number;                // calculé : 8 normalement
  heuresSup?: number;                      // si > 8 + accord
  pointePar: string;                       // chef chantier
  photoArrivee?: string;                   // url base64 ou blob ref
  photoDepart?: string;
  geoloc?: { lat: number; lng: number };
  notes?: string;
  status: 'BROUILLON' | 'VALIDE' | 'CONTESTE';
  syncStatus: 'LOCAL' | 'SYNCED' | 'CONFLICT';   // pour offline
}
```

**UX saisie mobile** :
1. Sélecteur chantier en haut
2. Liste ouvriers affectés au chantier
3. Pour chaque ouvrier : icône preset (Présent/Absent/etc.) + boutons +Photo +Note
4. Bouton « Photo arrivée groupe » (capture toute l'équipe en une fois)
5. Bouton « Géolocaliser le pointage »
6. Bouton « Valider la journée »

**Implémentation tech** :
- Capacitor ou Native API browser (`navigator.geolocation`, `<input type="file" capture>`)
- IndexedDB pour stockage local
- Service Worker avec stratégie « offline-first » sur la route `/rh/pointage/*`
- Sync background quand réseau revient

**Acceptance criteria** :
- [ ] Saisie possible sans réseau
- [ ] Photo capturée et stockée localement (compressée à 800px max)
- [ ] Géoloc capturée si autorisée
- [ ] Sync automatique au retour réseau
- [ ] Conflit visible si sync échoue
- [ ] Test E2E avec viewport mobile + offline mode

---

## Task 13.2 — Validation et cumul desktop

**Pages** :
- `/rh/pointage` : listing par mois (vue chef chantier + RH)
- `/rh/pointage/:date` : détail jour (validation/contestation)
- `/rh/pointage/cumul` : pivot par employé/chantier/mois (préparation paie)

**Acceptance criteria** :
- [ ] Cumul mensuel par employé alimente le calcul paie (variables `heuresNormales`, `heuresSup`)
- [ ] Workflow : `BROUILLON → VALIDE` par chef chantier puis acceptation RH

---

## Task 13.3 — Planning équipes

**Page** : `/rh/planning-equipes`

**Vue** : Gantt-like à la semaine, lignes = ouvriers, colonnes = jours, cases = chantier affecté.

**Drag & drop** : déplacer un ouvrier d'un chantier à l'autre (modifier affectation).

**Modèle complémentaire** :

```ts
export interface AffectationEmploye {
  id: string;
  employeId: string;
  chantierId: string;
  dateDebut: string;
  dateFin?: string;
  fonctionSurChantier?: string;     // 'Maçon', 'Électricien', etc.
}
```

**Acceptance criteria** :
- [ ] Vue semaine + mois togglable
- [ ] Drag & drop fonctionnel (mock)
- [ ] Click ouvrier → fiche employé
- [ ] Click chantier → fiche chantier

---

## Task 13.4 — Carnet d'attachement

**Concept** : journal quotidien obligatoire pour BPU/Régie. Capture quantités exécutées par poste/lot, signé MOE.

**Modèle** :

```ts
export interface Attachement {
  id: string;
  numero: string;                        // ATT-CH-2026-003-2026-05-09
  chantierId: string;
  date: string;
  meteoCode?: 'SOLEIL' | 'NUAGEUX' | 'PLUIE' | 'VENT' | 'NEIGE';
  temperatureC?: number;
  effectifPresent: number;
  lignes: AttachementLigne[];
  sigleMoe?: string;                      // signature MOE (image base64)
  sigleMoa?: string;
  status: 'BROUILLON' | 'SIGNE_MOE' | 'CONTRESIGNE_MOA' | 'CONTESTE';
  documents: string[];                    // photos
}

export interface AttachementLigne {
  id: string;
  attachementId: string;
  posteCode: string;                      // ex. '02.01.03 - Béton C25/30'
  designation: string;
  quantiteExecutee: number;
  unite: string;
  zone?: string;                          // 'Niveau 3 - Aile Est'
  notes?: string;
  photos?: string[];
}
```

**UX** :
- Saisie quotidienne sur tablette chantier
- Pré-remplir lignes depuis BPU marché + saisir quantités
- Photo géolocalisée par ligne
- Signature électronique MOE puis MOA via webcam ou stylet
- Génération PDF imprimable conforme

**Acceptance criteria** :
- [ ] Saisie offline + sync
- [ ] Signature électronique sur écran tactile
- [ ] PDF généré conforme avec photos
- [ ] Cumul attachements alimente le calcul situation BPU

---

## Task 13.5 — Journal de chantier

**Concept** : journal d'événements (visites MOA, intempéries, ordres de service, incidents…).

**Modèle** :

```ts
export type EvenementChantierType =
  | 'VISITE_MOA' | 'VISITE_BET' | 'VISITE_HSE'
  | 'OS_RECU' | 'OS_EMIS'                   // ordres de service
  | 'INTEMPERIE' | 'INCIDENT'
  | 'LIVRAISON' | 'COULAGE_BETON'
  | 'CONTROL_QUALITE'
  | 'AUTRE';

export interface EvenementChantier {
  id: string;
  chantierId: string;
  date: string;                            // YYYY-MM-DD
  heure?: string;                          // HH:mm
  type: EvenementChantierType;
  titre: string;
  description?: string;
  participants?: string[];
  documents: string[];
  photos: string[];
  saisiePar: string;
  // Pour intempéries : impact sur délais
  joursArretChantier?: number;
}
```

**Page** : `/chantiers/:id/journal` (onglet de la fiche chantier) + `/chantiers/journal` (vue globale multi-chantiers).

**UX** : timeline verticale + filtres par type + recherche.

**Acceptance criteria** :
- [ ] Timeline lisible avec icônes par type
- [ ] Saisie rapide depuis fiche chantier
- [ ] Cumul intempéries → propose extension délai marché (avenant prolongation)

---

## Task 13.6 — Setup PWA + offline-first

**Configuration Angular** :

```bash
ng add @angular/pwa
```

**Service worker strategy** :
- Routes `/rh/pointage/*`, `/chantiers/attachements/*` : `freshness` puis `performance` (offline-first)
- Routes `/dashboard`, listings : `freshness`
- Assets statiques : `performance`

**Manifest** (cf F-41) :

```json
{
  "name": "Nafura ERP",
  "short_name": "Nafura",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "display": "standalone",
  "icons": [...],
  "start_url": "/dashboard",
  "scope": "/"
}
```

**Acceptance criteria** :
- [ ] Installation PWA disponible sur mobile (Add to Home Screen)
- [ ] Pointage fonctionne en mode avion
- [ ] Sync au retour réseau visible (badge « X éléments à synchroniser »)

---

## Routing à wirer

**Fichier** : `app/applications/erp/rh/rh.routes.ts` (compléter)

```ts
{
  path: 'rh/pointage',
  loadChildren: () => import('../pages/rh/pointage/pointage.routes').then(m => m.POINTAGE_ROUTES),
},
{
  path: 'rh/planning-equipes',
  loadComponent: () => import('../pages/rh/planning-equipes/planning-equipes.page').then(m => m.PlanningEquipesPage),
},
```

**Fichier** : `app/applications/erp/chantiers/chantiers.routes.ts` (ajouter)

```ts
{
  path: 'chantiers/attachements',
  loadChildren: () => import('../pages/chantiers/attachements/attachements.routes').then(m => m.ATTACHEMENTS_ROUTES),
},
{
  path: 'chantiers/journal',
  loadComponent: () => import('../pages/chantiers/journal/journal.page').then(m => m.JournalPage),
},
```

## Tests

### E2E mobile + offline

```ts
test.use({ viewport: { width: 375, height: 667 } });

test('pointage offline puis sync', async ({ page, context }) => {
  await page.goto('/rh/pointage');
  // ... saisir 5 ouvriers présents
  await context.setOffline(true);
  await page.locator('button', { name: 'Valider' }).click();
  await expect(page.getByText(/Synchronisation/)).toBeVisible();
  await context.setOffline(false);
  await page.waitForTimeout(1000); // laisser sync
  await expect(page.getByText(/Synchronisé/)).toBeVisible();
});
```
