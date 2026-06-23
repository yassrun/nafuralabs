# Conventions techniques — ERP Frontend Agents

> Pattern de référence : `web/app/applications/erp/pages/inventory/catalogue/articles/` (entité simple)
> et `web/app/applications/erp/pages/inventory/mouvements/receptions/` (entité avec workflow + lignes).

## Stack

- **Angular 19** standalone, signals (`signal`, `computed`, `effect`), `inject()`.
- **Pas de NgModule**. Pas de RxJS pour la state (signals only). RxJS toléré en facade pour http/mock observables.
- **Lib UI** : `@lib/anatomy` (config-driven listing/detail), Tailwind, lucide-angular icons.
- **i18n** : `@ngx-translate/core` — clés FR par défaut, AR-MA en V2.
- **Routes** : lazy `loadChildren` / `loadComponent`.

## Arborescence type d'une entité

```
pages/<module>/<section>/<entity>/
├── <entity>.routes.ts            # ROUTES exportées (lazy)
├── models/
│   ├── index.ts
│   └── <entity>.model.ts         # interfaces + List/Create/Update/Query
├── services/
│   ├── index.ts
│   ├── <entity>-api.service.ts   # API REST (placeholder — non utilisé en V1 mock)
│   └── <entity>.facade.ts        # extends GridFacade<T,Create,Update>
├── config/
│   ├── index.ts
│   ├── listing/
│   │   ├── index.ts
│   │   ├── columns.ts            # ColumnConfig[]
│   │   ├── filters.ts            # FilterFieldConfig[]
│   │   ├── routes.ts             # ListingRouteConfig<T>
│   │   └── config.ts             # buildListingConfig(...)
│   └── detail/
│       ├── index.ts
│       ├── fields.ts             # FieldConfig[]
│       ├── sections.ts           # SectionConfig[]
│       ├── routes.ts             # DetailRouteConfig<T>
│       └── config.ts             # buildDetailConfig(...)
├── <entity>-listing/
│   ├── index.ts
│   ├── <entity>-listing.page.ts  # extends ConfigDrivenListingPage<T>
│   ├── <entity>-listing.page.html
│   └── <entity>-listing.page.scss
└── <entity>-detail/
    ├── index.ts
    ├── <entity>-detail.page.ts   # extends ConfigDrivenDetailPage<T>
    ├── <entity>-detail.page.html
    └── <entity>-detail.page.scss
```

## Routes lazy d'une entité

```ts
// <entity>.routes.ts
import { Routes } from '@angular/router';

export const <ENTITY>_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./<entity>-listing/<entity>-listing.page').then(m => m.<Entity>ListingPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./<entity>-detail/<entity>-detail.page').then(m => m.<Entity>DetailPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./<entity>-detail/<entity>-detail.page').then(m => m.<Entity>DetailPage),
  },
];
```

## Routes module — branchement nav

Si le module est **nouveau** (chantiers, achats, ventes, finance, rh, hse, etudes, analytics, dashboard, materiel) :

1. Créer `web/app/applications/erp/<module>/<module>.routes.ts` (hand-written, suit `inventory.routes.ts`).
2. L'importer dans `erp.routes.generated.ts` avec `...<MODULE>_ROUTES`.

> **Note** : `erp.routes.generated.ts` est généré, mais on injecte les routes custom via spread (déjà fait pour inventory). Si re-génération, vérifier que le spread est conservé (sinon ajouter un `extras-erp-routes.ts` non généré).

## Mock service — pattern par feature

```ts
// services/<entity>-mock.service.ts (ou réutiliser un mock module-wide)
@Injectable({ providedIn: 'root' })
export class <Entity>MockService {
  private readonly data = signal<<Entity>[]>(SEED_DATA);

  list(query?: <Entity>Query): Observable<PageResult<<Entity>>> {
    // pagination, filtres, tri en mémoire
    return of(buildPage(this.data(), query));
  }
  get(id: string): Observable<<Entity>> { ... }
  create(input: <Entity>Create): Observable<<Entity>> { ... }
  update(id: string, input: <Entity>Update): Observable<<Entity>> { ... }
  delete(id: string): Observable<void> { ... }
}
```

> Pour un module composite, **un seul mock service par module** (ex: `ChantiersMockService`) qui sert toutes les entités liées (chantier, situation, avancement, sous-traitant). Pattern actuel : `InventoryMockService` au niveau `applications/erp/inventory/mock/`.

## API service — placeholder

```ts
@Injectable({ providedIn: 'root' })
export class <Entity>ApiService extends GridApiService<...> {
  protected override path = '<module>/<entities>';
  // override list/get/create/update/delete pour pointer vers le mock service en V1
  constructor() {
    super();
    const mock = inject(<Entity>MockService);
    this.list = (q) => mock.list(q);
    this.get = (id) => mock.get(id);
    this.create = (i) => mock.create(i);
    this.update = (id, i) => mock.update(id, i);
    this.delete = (id) => mock.delete(id);
  }
}
```

> Variante : injecter directement le mock dans la facade (pattern `ArticlesFacade`). Acceptable.

## Facade

```ts
@Injectable({ providedIn: 'root' })
export class <Entity>Facade extends GridFacade<<Entity>, <Entity>Create, <Entity>Update> {
  protected override api = inject(<Entity>ApiService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    // charger les lookups nécessaires (familles, fournisseurs, chantiers, employés…)
  }
}
```

## Config-driven listing

```ts
// config/listing/config.ts
export const <ENTITY>_LISTING_CONFIG = buildListingConfig<<Entity>ListItem>(
  {
    entityName: '<EntitySingulier>',
    entityNamePlural: '<EntityPluriel>',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: '<module>.<entity>',
  },
  {
    filters: FILTERS,
    defaultSort: { column: 'code', direction: 'asc' },
    features: { /* bulk, export, scan, etc. */ },
    emptyState: { icon: 'package' },
  }
);

// page
@Component({
  selector: 'app-<entity>-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './<entity>-listing.page.html',
  styleUrls: ['./<entity>-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class <Entity>ListingPage extends ConfigDrivenListingPage<<Entity>ListItem> {
  readonly facade = inject(<Entity>Facade);
  readonly config = <ENTITY>_LISTING_CONFIG;
  readonly headerTitle = '<EntityPluriel>';
}
```

> Template HTML standard :
> ```html
> <nf-config-driven-listing [config]="config" [facade]="facade" [headerTitle]="headerTitle" />
> ```

## Config-driven detail

Pattern : `web/app/applications/erp/pages/inventory/mouvements/receptions/config/detail/`.

- `fields.ts` : `FieldConfig[]` — text, number, date, select (lookup), badge, currency, custom slot pour lignes.
- `sections.ts` : groupe de fields → `SectionConfig[]` (header, lignes, totaux, audit).
- `config.ts` : `buildDetailConfig(...)` avec `actions`, `statusMachine`, `actionBar`.

## State machine de workflow

Pour les entités à workflow (réception, BC, devis, situation, facture, incident…) :

- `status: 'BROUILLON' | 'VALIDE' | 'CONFIRME' | 'CLOTURE' | 'ANNULE'` (adapter par entité).
- `statusMachine` config-driven dans `detail/config.ts` :

```ts
statusMachine: {
  states: {
    BROUILLON: { label: 'Brouillon', variant: 'default', actions: ['valider', 'rejeter'] },
    VALIDE: { label: 'Validé', variant: 'success', actions: ['cloturer', 'annuler'] },
    ...
  },
  transitions: [
    { from: 'BROUILLON', to: 'VALIDE', actionId: 'valider', label: 'Valider', variant: 'primary' },
    ...
  ],
  position: 'header', // ou 'actionsBar'
}
```

## Permissions

Format : `<domain>.<entity>.<action>`.
Exemples : `chantiers.chantier.read`, `achats.bonCommande.valider`, `finance.facture.cloturer`.

> En V1 mock, utiliser le service `PermissionService` existant — par défaut tout autorisé (admin). Le pattern reste à respecter pour le V2 RBAC.

## i18n

- Toutes les labels nav et titres viennent de clés (`nav.<module>.<key>`).
- Champs : `<module>.fields.<key>` (ex: `chantiers.fields.codeChantier`).
- En V1 acceptable : labels FR en dur dans `columns.ts` / `fields.ts` si la clé i18n n'existe pas encore. Tout label en dur **doit** être en français BTP Maroc.

## Naming réflexes

- IDs : kebab-case (`chantier`, `bon-commande`, `situation-travaux`).
- Classes : PascalCase (`ChantierFacade`, `BonCommandeListingPage`).
- Constantes : SCREAMING_SNAKE (`CHANTIER_ROUTES`, `BC_LISTING_CONFIG`).
- Routes : kebab-case (`/chantiers/sous-traitance`, `/finance/factures-fournisseurs`).
- Permissions : kebab-case dans le path, camelCase dans le segment action (`achats.bonCommande.read`).

## Composants partagés à réutiliser

`web/app/applications/erp/inventory/components/` :
- `stock-qty-cell` — cell stock avec couleur seuil.
- `quantity-status-cell` — cell quantité + badge.
- `location-type-badge` — badge dépôt vs chantier.
- `*-lines-editor` — éditeurs de lignes (réception, transfert, retour, perte, inventaire).

> Pour un module qui manipule des lignes (devis, BC, facture, situation), s'inspirer fort de `reception-lines-editor`.

## Volumétrie cible mock par entité

- Référentiels (familles, types, motifs, devises) : 5–15 enregistrements.
- Tiers (fournisseurs, clients, sous-traitants, employés) : 25–40 enregistrements.
- Documents transactionnels (BC, factures, situations…) : 30–80 enregistrements répartis sur les 6 derniers mois.
- Lignes par document : moyenne 5, max 20.
- Articles : ≥ 80 (déjà mocké dans inventory).
- Chantiers : 8–12 chantiers actifs, 3–5 terminés, 1–2 suspendus.

## Anti-patterns interdits

- Ajout de `any` non justifié.
- Création d'une nouvelle lib UI (réutiliser `@lib/anatomy`).
- Templates inline > 30 lignes (séparer en `.html`).
- Logique métier dans le composant (mettre dans la facade).
- Fetch direct dans `ngOnInit` (passer par la facade signal-based).
- Routes en dur dans le code (toujours via `ROUTES` config).
- Re-générer `erp-nav.generated.ts` manuellement (généré depuis NAF spec).
- Modifier `erp.routes.generated.ts` pour ajouter du custom (utiliser le spread pattern de `inventory.routes.ts`).
