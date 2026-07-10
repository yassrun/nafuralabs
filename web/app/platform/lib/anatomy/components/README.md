# Anatomy Components

UI component library for building feature pages.

## Structure

```
components/
├── atoms/              # Small, independent components (8)
│   ├── button/         # nf-button
│   ├── badge/          # nf-badge
│   ├── icon/           # nf-icon
│   ├── spinner/        # nf-spinner
│   ├── avatar/         # nf-avatar
│   ├── tooltip/        # nfTooltip directive
│   ├── divider/        # nf-divider
│   └── skeleton/       # nf-skeleton
│
├── molecules/          # Composed components (10)
│   ├── page-title/     # nf-page-title
│   ├── action-bar/     # nf-action-bar
│   ├── search-input/   # nf-search-input
│   ├── empty-state/    # nf-empty-state
│   ├── error-state/    # nf-error-state
│   ├── loading-state/  # nf-loading-state
│   ├── stat-card/      # nf-stat-card
│   ├── breadcrumb/     # nf-breadcrumb
│   ├── alert/          # nf-alert
│   └── tabs/           # nf-tabs
│
├── organisms/          # Complex components (8)
│   ├── data-table/     # nf-data-table
│   ├── pagination/     # nf-pagination
│   ├── filter-bar/     # nf-filter-bar
│   ├── form/           # nf-form
│   ├── modal/          # nf-modal
│   ├── confirm-dialog/ # nf-confirm-dialog (via service)
│   ├── toast/          # nf-toast (via service)
│   └── drawer/         # nf-drawer
│
└── services/           # Component services
    ├── toast.service.ts
    └── confirm-dialog.service.ts
```

**Total: 26 components**

## Design Principles

1. **Standalone**: Each component is independent
2. **Composable**: Components work together like legos
3. **Configurable**: Config-driven where appropriate
4. **Accessible**: A11y built-in
5. **Wrapped**: Complex components wrap Angular Material
6. **Signal-based**: Uses Angular signals for reactivity

## Usage

```typescript
import {
  // Atoms
  ButtonComponent,
  BadgeComponent,
  IconComponent,
  SpinnerComponent,
  AvatarComponent,
  TooltipDirective,
  DividerComponent,
  SkeletonComponent,
  
  // Molecules
  PageTitleComponent,
  ActionBarComponent,
  SearchInputComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
  StatCardComponent,
  BreadcrumbComponent,
  AlertComponent,
  TabsComponent,
  
  // Organisms
  DataTableComponent,
  PaginationComponent,
  FilterBarComponent,
  FormComponent,
  ModalComponent,
  DrawerComponent,
  
  // Services
  ToastService,
  ConfirmDialogService,
} from '@lib/anatomy/components';
```

## Examples

### Button

```html
<nf-button variant="primary" icon="add">Create Item</nf-button>
<nf-button variant="danger" [loading]="isSaving">Delete</nf-button>
<nf-button variant="ghost" icon="refresh" (clicked)="refresh()"></nf-button>
```

### Data Table

```html
<nf-data-table
  [items]="items()"
  [columns]="columns"
  [loading]="isLoading()"
  [selectable]="'multiple'"
  (selectionChange)="onSelectionChange($event)"
  (sortChange)="onSortChange($event)"
  (rowClick)="onRowClick($event)">
</nf-data-table>
```

### Toast Service

```typescript
// In your component
this.toast.success('Item created successfully');
this.toast.error('Failed to save changes');
```

### Confirm Dialog Service

```typescript
const confirmed = await this.confirmDialog.confirm({
  title: 'Delete Item',
  message: 'Are you sure? This cannot be undone.',
  confirmLabel: 'Delete',
  variant: 'danger',
  icon: 'delete'
});

if (confirmed) {
  await this.facade.deleteItem(id);
}
```

## Selector Prefix

All components use the `nf-` prefix (Nafura).

## Full Specification

See [COMPONENTS.md](./COMPONENTS.md) for complete API documentation.
