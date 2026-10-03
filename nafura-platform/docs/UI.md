# UI Nafura — règles pour les agents

> Un écran de BC est une **configuration** d’un archétype de la plateforme. On n’écrit pas de composant, on ne crée pas d’artefact.
> Exemple complet : `platform-host/bcs/demo/web` (aucun composant, aucun style, aucun HTML).

## Les trois règles

1. **Un BC n’écrit ni composant Angular, ni template, ni SCSS.** Son dossier `web/` ne contient que des configurations (`*.ts` exportant des `ListingPageConfig` / `RecordPageConfig`) et son `index.ts`.
2. **On utilise l’existant.** Avant tout écran, trouver l’archétype et les options qui le couvrent (tableau ci-dessous, types dans `platform/listing/listing-page.types.ts` et `platform/record/record-page.types.ts`).
3. **On n’ajoute rien à la plateforme sans décision.** Si l’existant ne couvre pas le besoin : s’arrêter, décrire le manque (écran, donnée, interaction) et proposer **une option de configuration** sur l’artefact existant. Jamais un nouveau composant parallèle, jamais une copie adaptée. Un ajout accepté se fait dans l’artefact existant, pour tous les écrans, avec ses textes en français.

## Choisir l’archétype

| Besoin | Archétype | Configuration |
|---|---|---|
| Liste d’enregistrements (recherche, filtres, tri, pagination, segments, actions) | `nf-listing-page` | `ListingPageConfig` + route `{ component: ListingPageComponent, data: { listing } }` |
| Hiérarchie (catégories, arborescences) | `nf-listing-page` en arbre | `ListingPageConfig.tree { parentField, create, edit }` |
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

- Champs (`FormFieldConfig.type`) : `text`, `textarea`, `number`, `email`, `password`, `date`, `datetime`, `select`, `multiselect`, `checkbox`, `radio`, `file`, `autocomplete`. Options : `required`, `validation`, `options`, `lookupKey`, `wide`, `placeholder`.
- Colonnes (`ColumnConfig.type`) : `text`, `number`, `date`, `datetime`, `relative`, `boolean`, `currency`, `badge` (+ `badgeVariant`). Préférer un type à un `transform`.
- Filtres (`FilterFieldConfig.type`) : `text`, `number`, `date`, `daterange`, `select`, `multiselect`, `boolean`. Vues rapides : `segments`.
- Icônes : noms Lucide (`building-2`, `package`, …) enregistrés dans `core/icons/app-lucide-icons.ts` ; une icône absente s’y ajoute (garde-fou).
- Permissions : chaque `permission` d’une configuration existe dans le manifeste du BC (garde-fou).

## Composants de la bibliothèque (`lib/anatomy`)

Utilisés **par la plateforme** pour construire ses archétypes et ses écrans. Un BC n’en importe aucun. Les connaître évite de réinventer :

| Famille | Composants |
|---|---|
| Atomes | `nf-button`, `nf-input`, `nf-select`, `nf-tree-select`, `nf-switch`, `nf-textarea`, `nf-badge`, `nf-status-badge`, `nf-icon`, `nf-avatar`, `nf-spinner`, `nf-skeleton`, `nf-divider` ; Maroc : `nf-money-input`, `nf-ice-input`, `nf-rib-input`, `nf-phone-ma-input`, `nf-ville-ma-select` |
| Molécules | `nf-page-header`, `nf-breadcrumb`, `nf-toolbar`, `nf-action-bar`, `nf-action-menu`, `nf-save-bar`, `nf-status-action-bar`, `nf-status-machine`, `nf-tabs`, `nf-search-input`, `nf-filter-chips`, `nf-pagination`, `nf-empty-state`, `nf-error-state`, `nf-loading-state`, `nf-alert`, `nf-kpi-strip`, `nf-stat-card`, `nf-address-form` |
| Organismes | `nf-listing-flat` (**la** liste), `nf-listing-tree`, `nf-form`, `nf-form-dialog`, `nf-confirm-dialog`, `nf-drawer`, `nf-modal`, `nf-screen`, `nf-wizard-shell`, `nf-master-slave-shell`, `nf-comment-thread`, `nf-attachment-manager`, `nf-audit-trail`, `nf-activity-feed`, `nf-document-preview`, `nf-print-dialog`, `nf-send-email-dialog`, `nf-import-export-modal`, `nf-chart`, `nf-dashboard-grid`, `nf-permission-picker`, `nf-workflow-editor`, `nf-map-picker` |
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
