# 02 — Chantiers : drill-down + routes manquantes

> **Sévérité** : P0
> **Estimation** : 1 sprint (S2, en parallèle de 01-foundations finalisation)
> **Dépendances** : `01-foundations` (Task 1.4 mock unifié)

## Findings traités

- [ ] **F-01** Détail chantier toujours « Chantier introuvable »
- [ ] **F-02** Lignes du tableau « Mes chantiers » non cliquables (⚠️ partiellement résolu : la nouvelle `chantiers-listing.page.ts` a `(click)="open(c)"`, à vérifier sur autres listings)
- [ ] **F-05** Routes `/chantiers/sous-traitance` et `/chantiers/documents` cassées

## Goal

Drill-down chantier 100% fonctionnel : depuis n'importe quelle liste, je clique → fiche détail s'ouvre avec les bonnes données. Routes ST et Documents existent et affichent au moins un placeholder propre.

## Context to read first

```
app/applications/erp/pages/chantiers/detail/chantier-detail-placeholder.page.ts   # actuel = placeholder
app/applications/erp/pages/chantiers/chantiers-listing/chantiers-listing.page.ts  # créé S1, drill-down (click)="open(c)"
app/applications/erp/chantiers/chantiers.routes.ts                                 # routing module
app/applications/erp/chantiers/mock/chantiers-mock.service.ts (ligne 409)         # getChantierById(id)
app/applications/erp/chantiers/mock/seeds.ts                                       # SEED canonique
app/applications/erp/shell/erp-nav.generated.ts (lignes 91, 107)                   # nav ST + Documents
```

---

## Task 2.1 — Remplacer le placeholder par une vraie fiche détail

**Fichier à créer** : `app/applications/erp/pages/chantiers/chantier-detail/chantier-detail.page.ts`

**Architecture** : page avec onglets (Vue d'ensemble · Lots · Phases · Avancement · Budget · Situations · Documents). La page placeholder actuelle ne montre que les méta-données.

**Sections minimales** :

1. **Header** : code + nom + ville + badge statut + KPI avancement
2. **Onglet Vue d'ensemble** :
   - Carte d'identité (client, chef chantier, conducteur, dates clé, marché ref, ICE client)
   - KPIs : budget HT, factures émises, encaissements, marge projetée
   - Mini-Gantt phases (lien vers Planning complet)
3. **Onglet Lots** : tableau des `LotChantier[]` avec progression
4. **Onglet Phases** : tableau des `PhaseChantier[]` avec dépendances
5. **Onglet Avancement** : timeline des situations validées
6. **Onglet Budget** : lien vers `/chantiers/budget/:id` ou inline résumé
7. **Onglet Situations** : lien vers `/chantiers/situations` filtré sur `chantierId === :id`
8. **Onglet Documents** : grille fichiers (mock : marché, plans, PV, photos)

**Pattern à suivre** : voir `app/applications/erp/pages/chantiers/budget/budget-chantier-detail/budget-chantier-detail.page.ts` pour le pattern multi-onglets.

**Routing** : remplacer la dernière route de `chantiers.routes.ts` :

```ts
{
  path: 'chantiers/:id',
  loadComponent: () =>
    import('../pages/chantiers/chantier-detail/chantier-detail.page').then(
      (m) => m.ChantierDetailPage,
    ),
  data: { title: 'Chantier', breadcrumb: 'Détail' },
},
```

Et **supprimer** `chantier-detail-placeholder.page.ts` (ou le garder en `_archive/` au cas où).

**Acceptance criteria** :
- [ ] `/chantiers/CH-2026-003` affiche la fiche complète (header + onglets fonctionnels)
- [ ] Bouton retour navigue vers `/chantiers` (pas `/chantiers/planning`)
- [ ] Si `:id` introuvable : composant `<nf-empty-state>` avec message clair + bouton « Retour à la liste »
- [ ] Onglets persistent l'onglet actif dans l'URL : `/chantiers/CH-2026-003?tab=phases`
- [ ] Sticky header de l'onglet (titre + statut visible au scroll)

---

## Task 2.2 — Vérifier que TOUS les listings chantiers ont le drill-down

**Audit à faire** :

```bash
grep -rln "chantierCode\|chantier.code" app/applications/erp/pages/ | xargs grep -L "routerLink.*chantiers\|navigate.*chantiers"
```

Cibles probables :
- `app/applications/erp/pages/chantiers/avancements/avancements-listing/`
- `app/applications/erp/pages/chantiers/situations/situation-listing/`
- `app/applications/erp/pages/achats/demandes/demande-listing/` (colonne chantier)
- `app/applications/erp/pages/inventory/materiel/affectations/`

**Pattern à appliquer** : sur chaque cellule de code chantier, ajouter un lien :

```html
<a [routerLink]="['/chantiers', row.chantierId]" class="link-chantier">
  {{ row.chantierCode }}
</a>
```

Et pour les `<tr>` cliquables, garder l'événement de row click vers le détail principal de l'item, mais le code chantier doit drill DANS la cellule (event.stopPropagation).

**Acceptance criteria** :
- [ ] Sur 5+ écrans chantier-related, le code `CH-XXX` est un lien
- [ ] Au moins une e2e qui ouvre `/chantiers`, clique row 1, vérifie URL `/chantiers/:id`, vérifie titre

---

## Task 2.3 — Routes Sous-traitance et Documents (F-05)

**Findings** : sidebar pointe vers `/chantiers/sous-traitance` et `/chantiers/documents` mais ces routes n'existent pas → fallback sur `/chantiers/:id` → "Chantier introuvable".

**Fix** : déclarer les routes **AVANT** la route `:id` paramétrée dans `chantiers.routes.ts`.

**Implémentation minimale Sous-traitance** : page liste mock avec colonnes : Code BC ST · Sous-traitant · Chantier · Montant marché HT · Avancement · Statut · Date début · Date fin.

**Fichiers à créer** :

```
app/applications/erp/pages/chantiers/sous-traitance/
├── sous-traitance.routes.ts
├── sous-traitance-listing/
│   ├── sous-traitance-listing.page.ts
│   ├── sous-traitance-listing.page.html
│   └── sous-traitance-listing.page.scss
├── sous-traitance-detail/
│   └── sous-traitance-detail.page.ts
├── models/
│   └── index.ts                          # ContratSousTraitance, ...
├── services/
│   └── sous-traitance-mock.service.ts
└── config/
    ├── listing/columns.ts
    └── detail/{config,fields,sections,routes}.ts
```

**Modèle minimum** :

```ts
export type ContratSousTraitanceStatus = 'BROUILLON' | 'SIGNE' | 'EN_COURS' | 'TERMINE' | 'RESILIE';

export interface ContratSousTraitance {
  id: string;
  numero: string;             // ST-2026-001
  sousTraitantId: string;     // FK fournisseur
  sousTraitantNom: string;
  ice?: string;
  chantierId: string;
  chantierCode: string;
  objet: string;
  montantHt: number;
  retenueGarantieTaux: number;  // ex 7%
  dateSignature?: string;
  dateDebut: string;
  dateFin: string;
  avancementPercent: number;
  status: ContratSousTraitanceStatus;
  // Spec MA : déclaration art. 187 CGI
  declarationArt187: boolean;
}
```

**Implémentation minimale Documents** :

Page liste mock : grille de docs (BC, factures, PV, photos, plans) groupés par catégorie + filtre par chantier.

```ts
export type DocumentChantierType = 'MARCHE' | 'AVENANT' | 'PV_RECEPTION' | 'PLAN' | 'PHOTO' | 'BC' | 'FACTURE' | 'AUTRE';

export interface DocumentChantier {
  id: string;
  chantierId: string;
  type: DocumentChantierType;
  titre: string;
  fichier: string;       // url mock
  taille: number;        // bytes
  uploadeAt: string;
  uploadePar: string;
  tags?: string[];
}
```

**Routes à wirer** dans `chantiers.routes.ts` (AVANT `chantiers/:id`) :

```ts
{
  path: 'chantiers/sous-traitance',
  loadChildren: () =>
    import('../pages/chantiers/sous-traitance/sous-traitance.routes').then(
      (m) => m.SOUS_TRAITANCE_ROUTES,
    ),
},
{
  path: 'chantiers/documents',
  loadChildren: () =>
    import('../pages/chantiers/documents/documents.routes').then(
      (m) => m.CHANTIER_DOCUMENTS_ROUTES,
    ),
},
{ path: 'chantiers/:id', /* ... */ },
```

**Acceptance criteria** :
- [ ] `/chantiers/sous-traitance` n'affiche plus « Chantier introuvable » mais le listing
- [ ] `/chantiers/documents` n'affiche plus « Chantier introuvable »
- [ ] Sidebar « Sous-traitance » navigue correctement
- [ ] Sidebar « Documents » navigue correctement
- [ ] Mock seed cohérent : chaque doc/contrat ST référence un `chantierId` du seed unifié

---

## Task 2.4 — Drill-down depuis le Gantt Planning

**Fichier** : `app/applications/erp/pages/chantiers/planning/chantiers-planning.page.ts`

**Action** : sur clic d'une tâche `recordType: 'CHANTIER'` dans le Gantt, naviguer vers `/chantiers/:id`.

**Code** :

```ts
gantt.attachEvent('onTaskClick', (taskId) => {
  const task = gantt.getTask(taskId);
  if (task.recordType === 'CHANTIER') {
    this.router.navigate(['/chantiers', task.chantierId]);
    return false; // empêche le comportement par défaut
  }
  return true; // ouvre le drawer pour LOT/PHASE
});
```

**Acceptance criteria** :
- [ ] Click sur la barre racine d'un chantier dans le Gantt → navigue vers fiche détail
- [ ] Click sur un lot/phase ouvre le drawer existant (`PhaseDrawerComponent`)

---

## Testing

### Tests e2e Playwright

```ts
test('drill-down chantier depuis listing', async ({ page }) => {
  await page.goto('/chantiers');
  await page.locator('table tbody tr').first().click();
  await expect(page).toHaveURL(/\/chantiers\/CH-2026-/);
  await expect(page.locator('h1, h2')).toContainText(/CH-2026-/);
  await expect(page.getByText('Chantier introuvable')).toHaveCount(0);
});

test('routes sous-traitance et documents accessibles', async ({ page }) => {
  await page.goto('/chantiers/sous-traitance');
  await expect(page.getByText('Chantier introuvable')).toHaveCount(0);
  await expect(page.locator('h1, h2')).toBeVisible();

  await page.goto('/chantiers/documents');
  await expect(page.getByText('Chantier introuvable')).toHaveCount(0);
});

test('codes chantier cohérents entre /chantiers et /chantiers/planning', async ({ page }) => {
  await page.goto('/chantiers');
  const codes = await page.locator('table tbody tr td:first-child .code').allTextContents();
  expect(codes.every(c => /^CH-2026-\d+$/.test(c))).toBe(true);
});
```

### Tests unitaires

- `chantier-detail.page.spec.ts` : si id invalide, affiche empty state ; si id valide, affiche header avec code/nom
- Mock `getChantierById` retourne bien un chantier pour chaque id du seed

## Dépendances inverses

- 03-shell-ux (breadcrumb dépend de `data: { breadcrumb }` qu'on configure ici)
- 06-marches-facturation (les onglets situations/factures de la fiche chantier dépendent du module Marchés)
