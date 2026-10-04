# UI Nafura — règles pour les agents

> Un écran de BC est une **configuration** d’un archétype de la plateforme. On n’écrit pas de composant, on ne crée pas d’artefact.
> Exemple complet : `platform-host/bcs/demo/web` (configurations, plus l’écran déclaré `screens/supplier-overview`).

## Les trois règles

1. **Un BC n’écrit ni composant Angular, ni template, ni SCSS**, sauf écran spécifique (ci-dessous). Son dossier `web/` ne contient que des configurations (`*.ts` exportant des `ListingPageConfig` / `RecordPageConfig`), son `index.ts` et ses écrans spécifiques déclarés.
2. **On utilise l’existant.** Avant tout écran, trouver l’archétype et les options qui le couvrent (tableau ci-dessous, types dans `platform/listing/listing-page.types.ts` et `platform/record/record-page.types.ts`).
3. **On n’ajoute rien à la plateforme sans décision.** Si l’existant ne couvre pas le besoin : s’arrêter, décrire le manque (écran, donnée, interaction) et proposer **une option de configuration** sur l’artefact existant. Jamais un nouveau composant parallèle, jamais une copie adaptée. Un ajout accepté se fait dans l’artefact existant, pour tous les écrans, avec ses textes en français.

## Écran spécifique d’un BC

Un BC peut coder un écran trop spécifique pour un archétype (ex. arbre du bordereau d’une étude), aux quatre conditions suivantes :

1. **Manque réel** : aucun archétype ne le couvre, même avec une option ajoutée, et ce BC est le seul à en avoir besoin. Dès qu’un second BC en a besoin, il remonte dans la plateforme.
2. **Dans le cadre** : l’écran n’occupe que le contenu de la page. La route est `{ component: ScreenPageComponent, data: { screen } }` : en-tête, fil d’Ariane, chargement et erreur viennent de la plateforme. Le composant du BC est projeté dans le corps et peut injecter `ScreenState`.
3. **Avec les briques** : le composant importe `@platform/platform/screen-kit` (atomes, `nf-empty-state`, `nf-loading-state`, `nf-chart`, `nf-kpi-strip`, `nf-stat-card`, `PermissionService`, `ApiConfigService`), jamais `lib/anatomy`. Aucun SCSS, aucune couleur hexadécimale.
4. **Déclaré** : `bc.manifest.json` → `spec.screens: [{ id, label, reason }]`. Le composant vit dans `bcs/<bc>/web/screens/<id>/`. `architecture:check` refuse un composant hors de ces dossiers, un id sans dossier, un import d’anatomie, un style ou une couleur propre, et affiche le nombre d’écrans.

Exemple : synthèse fournisseur du BC démo (`supplier-overview`), ouverte depuis la fiche.

## Choisir l’archétype

| Besoin | Archétype | Configuration |
|---|---|---|
| Liste d’enregistrements (recherche, filtres, tri, pagination, segments, actions) | `nf-listing-page` | `ListingPageConfig`. Pagination `paging: 'server'` (défaut) : page, tri, recherche et filtres d’égalité partent à l’API (`page` commence à 0, `size` plafonné à 500). `paging: 'client'` pour une petite liste. Un arbre est toujours côté client. |
| Vue tableau (Kanban) | `nf-listing-page` | `board: { columns: 'lifecycle', card, defaultView? }`, exclusif avec `tree`. Une requête par état. Le glisser dépose tire la transition. `?view=board` ou `table`. |
| Hiérarchie (catégories, arborescences) | `nf-listing-page` en arbre | `ListingPageConfig.tree { parentField, create, edit }` |
| Action métier sur une fiche | `nf-record-page` | `actions[]` : même contrat qu’une action de liste (`PageAction`), plus `placement`, `result` (`record` ouvre la fiche renvoyée, `download` enregistre le fichier, `none`), `requiresSaved`. |
| Pièces jointes ou notes d’une fiche | section de fiche | `sections[].kind: 'attachments' \| 'comments'`. Lecture = permission de lecture du record, ajout et suppression = permission de mise à jour. Capability `cap.documents` ou `cap.comments` coupée : section masquée. |
| Champ mis en forme | champ `richtext` | Stockage Markdown, affichage HTML assaini (`renderMarkdown`). `toolbar: 'basic'` (défaut) ou `'full'`. |
| Créer une fiche depuis un document | bouton d’import à la création | `import: { docType: { endpoint }, map, accept, label }`. Le BC renvoie `{ fields: { source: { value, confidence? } } }`. Confiance &lt; 0,6 : « à vérifier ». Le fichier est joint après l’enregistrement. `{ domain, type }` (extraction IA) n’apparaît que si `cap.document-extraction` et `cap.ai` sont actifs. |
| Petite saisie dans une liste (contacts, lignes simples) | action de liste avec formulaire | `actions[].form` + `request` |
| Fiche d’un enregistrement | `nf-record-page` | `recordRoute(path, RecordPageConfig)` ; `layout.kind: 'sections'` |
| Fiche riche | idem | `layout.kind: 'tabs'` |
| Création guidée | idem | `createLayout: { kind: 'steps', … }` (assistant) |
| Parcours à statuts | idem | `lifecycle: true` + `layout.kind: 'steps'` avec `states` par étape |
| Sous-liste d’une fiche (1-N) | section de fiche | `sections[].listing: (record) => ListingPageConfig` |
| Liste de choix d’une relation | champ `select` | `lookupKey` + `lookups: { clé: '/api/v1/…/options' }` |
| Approbation | rien à faire | `approval` dans le cycle de vie JSON ; la boîte `/approvals` et la fiche le gèrent |
| Navigation | rien à faire | `navigation` du `bc.manifest.json` (filtrée par permission) |

Ce que l’archétype fait déjà, ne pas le refaire : en-tête et fil d’Ariane, barre d’enregistrement (Ctrl+S, garde de sortie), confirmation, toasts, états vide/erreur/chargement, filtrage des actions par permission, statut et transitions depuis le backend, responsive.

## Champs, colonnes, filtres

- Champs (`FormFieldConfig.type`) : `text`, `textarea`, `richtext`, `number`, `email`, `password`, `date`, `datetime`, `select`, `multiselect`, `checkbox`, `radio`, `file`, `autocomplete`. Options : `required`, `validation`, `options`, `lookupKey`, `wide`, `placeholder`, `toolbar` (`richtext`).
- Colonnes (`ColumnConfig.type`) : `text`, `number`, `date`, `datetime`, `relative`, `boolean`, `currency`, `badge` (+ `badgeVariant`). `lifecycle: true` sur un badge lit le libellé et le ton depuis `GET {endpoint}/lifecycle`. Préférer un type à un `transform`.
- Filtres (`FilterFieldConfig.type`) : `text`, `number`, `date`, `daterange`, `select`, `multiselect`, `boolean`. Vues rapides : `segments`.
- Icônes : noms Lucide (`building-2`, `package`, …) enregistrés dans `core/icons/app-lucide-icons.ts` ; une icône absente s’y ajoute (garde-fou).
- Permissions : chaque `permission` d’une configuration existe dans le manifeste du BC (garde-fou).

## Composants de la bibliothèque (`lib/anatomy`)

Utilisés **par la plateforme** pour construire ses archétypes et ses écrans. Un BC n’en importe aucun. Les connaître évite de réinventer :

| Famille | Composants |
|---|---|
| Atomes | `nf-button`, `nf-input`, `nf-select`, `nf-tree-select`, `nf-switch`, `nf-textarea`, `nf-badge`, `nf-status-badge`, `nf-icon`, `nf-avatar`, `nf-spinner`, `nf-skeleton`, `nf-divider` ; Maroc : `nf-money-input`, `nf-ice-input`, `nf-rib-input`, `nf-phone-ma-input`, `nf-ville-ma-select` |
| Molécules | `nf-page-header`, `nf-breadcrumb`, `nf-toolbar`, `nf-action-bar`, `nf-action-menu`, `nf-save-bar`, `nf-status-action-bar`, `nf-status-machine`, `nf-tabs`, `nf-search-input`, `nf-filter-chips`, `nf-pagination`, `nf-empty-state`, `nf-error-state`, `nf-loading-state`, `nf-alert`, `nf-kpi-strip`, `nf-stat-card`, `nf-address-form` |
| Organismes | `nf-listing-flat` (**la** liste), `nf-listing-board` (colonnes de la liste), `nf-listing-tree`, `nf-form`, `nf-form-dialog`, `nf-confirm-dialog`, `nf-drawer`, `nf-modal`, `nf-screen`, `nf-wizard-shell`, `nf-master-slave-shell`, `nf-comment-thread`, `nf-attachment-manager`, `nf-audit-trail`, `nf-activity-feed`, `nf-document-preview`, `nf-print-dialog`, `nf-send-email-dialog`, `nf-import-export-modal`, `nf-chart`, `nf-dashboard-grid`, `nf-permission-picker`, `nf-workflow-editor`, `nf-map-picker` |
| Shell | `nf-app-shell`, `nf-sidebar-nav` (une seule sidebar), barre du haut, menu utilisateur — configurés par `app.nafura.json` `spec.shell` |

Vitrine visuelle : `sandbox/` (voir son README).

## Ce que Sektor a fait et qu’on ne refait pas

| Erreur Sektor | Règle |
|---|---|
| Composants de liste et de fiche écrits dans le produit, un par écran | Une configuration d’archétype |
| `nf-entity-listing` à côté de `nf-listing-flat`, deux sidebars, deux formats de manifeste | Un seul artefact par besoin ; on enrichit l’existant |
| Barres d’actions, chips de filtres, boutons retour faits main par écran | Actions, segments, filtres et fil d’Ariane de l’archétype |
| `socle` : une plateforme-bis dans le produit (approbations, admin, invitations, chrome) | Le générique est dans la plateforme, une fois |
| Vérifications de rôle (`OWNER`, `SUPER_ADMIN`) dans les écrans | Permissions uniquement |
| Configuration codée en dur (id d’app, nom, routes du shell) | `app.nafura.json` |
| Styles et couleurs ad hoc | Jetons et classes de la plateforme ; aucun SCSS dans un BC |

## Avant de rendre la main

```bash
cd nafura-platform/sources/web && npm run -s architecture:check
node <produit>/ops/run.mjs lab      # puis ouvrir l’écran, se connecter avec un utilisateur sans droits et un avec
```

Vérifier aussi l’écran en largeur mobile.
