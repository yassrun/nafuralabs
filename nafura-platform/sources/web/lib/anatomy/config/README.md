# Entity Listing Configuration

Build listing pages with **two files**: standard defaults + custom overrides.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STANDARD CONFIG (lib/anatomy/config/)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  DEFAULT_LISTING_ACTIONS    │  New, Edit, Duplicate, Delete                │
│  DEFAULT_FEATURES           │  Search, filters, column toggle              │
│  DEFAULT_PAGINATION         │  20 items/page, [10,20,50,100]               │
│  DEFAULT_VIEW_MODES         │  Table only                                  │
│  + Auto-generated           │  Empty state, delete confirmation            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ buildListingConfig()
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CUSTOM CONFIG (your-entity/config/)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  REQUIRED                   │  entityName, columns, routes                 │
│  OPTIONAL                   │  filters, viewModes, actions overrides       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Minimal Config (4 fields)

```typescript
// orders/config/listing.config.ts
import { buildListingConfig } from '@lib/anatomy';

const COLUMNS = [
  { key: 'orderNumber', label: 'Order #', sortable: true },
  { key: 'customer', label: 'Customer' },
  { key: 'total', label: 'Total', type: 'currency' },
  { key: 'status', label: 'Status', type: 'badge' },
];

const ROUTES = {
  detail: (item) => ['/orders', item.id],
  create: ['/orders/new'],
  list: ['/orders'],
};

export const ORDER_LISTING_CONFIG = buildListingConfig({
  entityName: 'Order',
  entityNamePlural: 'Orders',
  columns: COLUMNS,
  routes: ROUTES,
});
```

That's it! You get:
- ✅ CRUD actions (New, Edit, Duplicate, Delete)
- ✅ Search, filters, column toggle
- ✅ Pagination (20 items)
- ✅ Empty state message
- ✅ Delete confirmation

### Page Component

```typescript
// orders/order-listing.page.ts
@Component({
  imports: [...ConfigDrivenListingPageImports],
  template: `
    <nf-page-header [config]="headerConfig"></nf-page-header>
    <nf-entity-listing #listing [config]="config" [facade]="facade" (action)="onAction($event)">
    </nf-entity-listing>
  `,
  styles: [ConfigDrivenListingPageStyles],
})
export class OrderListingPage extends ConfigDrivenListingPage<Order> {
  readonly facade = inject(OrderFacade);
  readonly config = ORDER_LISTING_CONFIG;
  readonly headerTitle = 'Orders';
}
```

---

## Customization Guide

### Toolbar Controls

```typescript
buildListingConfig(required, {
  features: {
    search: true,        // Search input (default: true)
    filters: false,      // Filter panel (default: true)
    columnToggle: true,  // Column visibility (default: true)
    viewModeToggle: true,// Table/Card switcher (default: false)
    importExport: true,  // Import/Export buttons (default: false)
    refresh: true,       // Refresh button (default: true)
    selectionMode: 'multiple', // 'none' | 'single' | 'multiple' | 'toggleable'
  },
});
```

### Actions

#### Hide Actions

```typescript
actions: {
  hideActions: ['edit', 'duplicate'],  // Remove from defaults
}
```

#### Override Action Properties

```typescript
actions: {
  overrideActions: {
    new: { label: '' },                    // Icon-only
    delete: { confirmMessage: 'Permanent!' }, // Custom message
  },
}
```

#### Add Custom Actions

```typescript
actions: {
  // Add before defaults
  prependActions: [{
    id: 'import-export',
    icon: 'upload',
    scope: 'global',
    variant: 'tertiary',
  }],
  
  // Add after defaults
  appendActions: [{
    id: 'archive',
    label: 'Archive',
    icon: 'archive',
    scope: 'single+bulk',
    // Dynamic visibility
    visible: (selection) => selection.every(i => i.status === 'active'),
  }],
}
```

#### Replace All Actions

```typescript
customActions: [
  { id: 'approve', label: 'Approve', scope: 'single', variant: 'primary' },
  { id: 'reject', label: 'Reject', scope: 'single', variant: 'danger' },
],
```

### View Modes

```typescript
viewModes: {
  available: ['table', 'cards', 'grid'],
  default: 'table',
  card: {
    imageField: 'thumbnailUrl',
    titleField: 'name',
    subtitleField: 'code',
    badgeField: 'status',
  },
},
```

### Filters

Filters are 100% custom (no defaults):

```typescript
filters: [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All statuses',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
      { label: 'Completed', value: 'completed' },
    ],
  },
  {
    key: 'dateRange',
    label: 'Date',
    type: 'dateRange',
  },
],
```

### Pagination

```typescript
pagination: {
  defaultPageSize: 50,
  pageSizeOptions: [25, 50, 100, 200],
},
```

### Empty State

```typescript
emptyState: {
  icon: 'shopping-cart',
  title: 'No orders yet',
  message: 'Orders will appear here when customers purchase',
  actionLabel: 'Create Order',
},
```

### Delete Confirmation

```typescript
delete: {
  title: 'Remove from Catalog',
  getMessage: (item) => `Remove "${item.name}"? Stock will be cleared.`,
  confirmLabel: 'Remove',
  successMessage: 'Product removed from catalog',
  errorMessage: 'Could not remove product',
},
```

### Import/Export

```typescript
features: { importExport: true },

importExport: {
  enableImportExport: true,
  entityName: 'Products',
  importExplanation: 'Upload CSV with product data',
  exportExplanation: 'Download all products as CSV',
  templateColumns: [
    { key: 'name' },
    { key: 'sku' },
    { key: 'price' },
  ],
},
```

---

## Action Scopes

| Scope | When Visible | Example Actions |
|-------|--------------|-----------------|
| `global` | Always | New, Import, Refresh |
| `single` | 1 item selected | Edit, View, Duplicate |
| `bulk` | 2+ items selected | Merge |
| `single+bulk` | 1+ items selected | Delete, Archive |

---

## Custom Action Handlers

Override in page component:

```typescript
export class ProductListingPage extends ConfigDrivenListingPage<Product> {
  // Override specific action
  override async onAction(event: ListingActionEvent<Product>) {
    if (event.actionId === 'archive') {
      await this.handleArchive(event.selection);
      return;
    }
    // Delegate to base for standard actions
    await super.onAction(event);
  }

  // Or use handleCustomAction for non-standard actions
  protected override async handleCustomAction(event) {
    switch (event.actionId) {
      case 'archive':
        await this.facade.archive(event.selection.map(p => p.id));
        this.showSuccess('Archived');
        await this.refresh();
        break;
    }
  }
}
```

---

## Complete Example

```typescript
// products/config/listing.config.ts
import { buildListingConfig } from '@lib/anatomy';
import type { ProductListItem } from '../models';

const COLUMNS = [...];
const ROUTES = {...};
const FILTERS = [...];

export const PRODUCT_LISTING_CONFIG = buildListingConfig<ProductListItem>(
  // Required
  {
    entityName: 'Product',
    entityNamePlural: 'Products',
    columns: COLUMNS,
    routes: ROUTES,
  },
  // Overrides (only what's different)
  {
    // Enable card view
    viewModes: {
      available: ['table', 'cards'],
      card: { titleField: 'name', subtitleField: 'sku', badgeField: 'status' },
    },

    // Customize toolbar
    features: { importExport: true },

    // Customize actions
    actions: {
      hideActions: ['edit'],
      overrideActions: { new: { label: '' } },
    },

    // Entity-specific filters
    filters: FILTERS,

    // Default sort
    defaultSort: { column: 'name', direction: 'asc' },
  }
);
```
