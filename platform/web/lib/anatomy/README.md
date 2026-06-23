# Anatomy Framework

> Canonical frontend documentation now lives in [docs/frontend/README.md](docs/frontend/README.md). This README remains the entry point for Anatomy implementation details.

**Anatomy** is Nafura's internal UI framework for building feature pages.

## Philosophy

- **Composable**: Small, independent components that work together
- **Convention over Configuration**: Standard patterns, less boilerplate
- **Flexible**: Abstractions that don't constrain

## Important: UI Component Rules

> **Feature code must use `nf-*` components only. Never use `mat-*` or `p-*` directly.**

See:
- [TOMIC_UI_CONSTITUTION.md](./TOMIC_UI_CONSTITUTION.md) - Architecture rules
- [WRAPPER_MAP.md](./WRAPPER_MAP.md) - Component mapping and policies

### Quick Reference

| You need... | Use this | NOT this |
|-------------|----------|----------|
| Button | `<nf-button>` | `<button mat-button>` |
| Table | `<nf-data-table>` | `<table mat-table>` |
| Dropdown | `<nf-filter-bar>` | `<p-select>` |
| Tooltip | `[nfTooltip]` | `[matTooltip]` |
| Modal | `<nf-modal>` | `<mat-dialog>` |

### Enforcement

```bash
# Run before committing
./infra/scripts/lint-tomic.sh
```

## Structure

```
anatomy/
├── pages/              # Base page classes
│   ├── feature-page.class.ts
│   ├── feature-list-page.class.ts
│   └── feature-detail-page.class.ts
│
├── data/               # Data layer abstractions
│   ├── feature-api.service.ts
│   └── feature-facade.class.ts
│
├── services/           # Cross-cutting services
│   ├── page-title.service.ts
│   ├── breadcrumb.service.ts
│   └── lookup.service.ts
│
├── components/         # UI components (legos)
│   ├── atoms/          # Small, independent (Button, Badge, etc.)
│   ├── molecules/      # Composed (ActionBar, PageTitle, etc.)
│   └── organisms/      # Complex (DataTable, Form, etc.)
│
├── types/              # Shared type definitions
│   └── index.ts
│
└── index.ts            # Public API exports
```

## ERP Archetypes (Ready)

Use the config-driven base classes for all new ERP pages.

| Archetype | Base Class | Purpose |
|-----------|------------|---------|
| RecordCollection | ConfigDrivenListingPage | Listing + search/filter/action |
| RecordForm | ConfigDrivenDetailPage | Create/edit/view detail |
| RecordPanel | ConfigDrivenMasterSlavePage | Master list + detail pane |
| OperationalDashboard | ConfigDrivenDashboardPage | KPI/alerts/activity overview |
| SettingsPage | ConfigDrivenSettingsPage | Configuration tabs + save/restore |
| RecordWizard | ConfigDrivenWizardPage | Step-based create flow |

Related config types live in anatomy types:
- ListingPageConfig / DetailPageConfig
- DashboardPageConfig / DashboardDataProvider
- SettingsPageConfig / WizardPageConfig

## Usage

```typescript
// Import from Anatomy
import {
  // Pages
  FeatureListPageClass,
  FeatureDetailPageClass,
  
  // Data
  FeatureApiService,
  FeatureFacade,
  
  // Services
  PageTitleService,
  BreadcrumbService,
  
  // Components
  DataTableComponent,
  PageTitleComponent,
  
  // Types
  ListQuery,
  ListResponse,
} from '@lib/anatomy';
```

## Creating a Feature

```typescript
// 1. API Service
@Injectable({ providedIn: 'root' })
export class ItemApiService extends FeatureApiService<Item> {
  protected basePath = '/api/items';
}

// 2. Facade
@Injectable({ providedIn: 'root' })
export class ItemsFacade extends FeatureFacade<Item, ItemApiService> {
  protected override api = inject(ItemApiService);
}

// 3. List Page
@Component({
  template: `
    <app-breadcrumb [items]="breadcrumbs" />
    <app-page-title title="Items" subtitle="Manage inventory" />
    <app-data-table [items]="items()" [columns]="columns" />
    <app-pagination [pagination]="pagination()" />
  `
})
export class ItemsListPage extends FeatureListPageClass<Item> {
  protected facade = inject(ItemsFacade);
  
  protected override async fetchData() {
    return this.facade.loadItems(this.buildQuery());
  }
}
```

## Quick Edit Pattern

The `FeatureListPageClass` includes built-in support for quick-edit operations via drawer, modal, or inline editing.

### Enabling Quick Edit

```typescript
@Component({
  template: `
    <nf-page-title title="Items">
      <div actions>
        <nf-button variant="primary" icon="add" (clicked)="openCreate()">
          Add Item
        </nf-button>
      </div>
    </nf-page-title>

    <nf-data-table
      [items]="items()"
      [columns]="columns"
      (rowClick)="openEdit($event)">
    </nf-data-table>

    <!-- Quick Edit Drawer -->
    <nf-drawer
      [open]="isQuickEditOpen()"
      [title]="isCreating() ? 'New Item' : 'Edit Item'"
      (closed)="closeQuickEdit()">
      
      <nf-form
        [fields]="formFields"
        [values]="editingItem() ?? {}"
        [loading]="isQuickEditSaving()"
        (submit)="performQuickEditSave($event)"
        (cancel)="closeQuickEdit()">
      </nf-form>

      @if (quickEditError()) {
        <nf-alert variant="danger" [message]="quickEditError()!" />
      }
    </nf-drawer>
  `
})
export class ItemsListPage extends FeatureListPageClass<Item> {
  protected facade = inject(ItemsFacade);
  protected toast = inject(ToastService);
  
  // Enable quick edit mode
  protected override quickEditMode: QuickEditMode = 'drawer';
  
  protected override async fetchData() {
    return this.facade.loadItems(this.buildQuery());
  }
  
  // Implement save logic
  protected override async saveQuickEdit(data: Partial<Item>): Promise<void> {
    const item = this.editingItem();
    if (item) {
      await this.facade.updateItem(item.id, data);
      this.toast.success('Item updated');
    } else {
      await this.facade.createItem(data);
      this.toast.success('Item created');
    }
    await this.refresh();
  }
  
  // Optional: implement delete
  protected override async deleteQuickEditItem(): Promise<void> {
    const item = this.editingItem();
    if (item) {
      await this.facade.deleteItem(item.id);
      this.toast.success('Item deleted');
    }
  }
}
```

### Quick Edit Signals

| Signal | Type | Description |
|--------|------|-------------|
| `isQuickEditOpen()` | `boolean` | Whether panel is open |
| `editingItem()` | `T \| null` | Item being edited |
| `quickEditOperation()` | `QuickEditOperation` | 'create', 'edit', or 'view' |
| `isCreating()` | `boolean` | Creating new item |
| `isEditing()` | `boolean` | Editing existing item |
| `isViewing()` | `boolean` | Viewing item (read-only) |
| `isQuickEditSaving()` | `boolean` | Save in progress |
| `quickEditError()` | `string \| null` | Error message |

### Quick Edit Methods

| Method | Description |
|--------|-------------|
| `openCreate()` | Open panel for new item |
| `openEdit(item)` | Open panel to edit item |
| `openView(item)` | Open panel to view item (read-only) |
| `closeQuickEdit()` | Close panel and reset state |
| `performQuickEditSave(data)` | Save with state management |
| `performQuickEditDelete()` | Delete with state management |

### Quick Edit Hooks

```typescript
// Called when panel opens
protected onQuickEditOpen(operation: QuickEditOperation, item: T | null): void {
  // Load related data, set up form, etc.
}

// Called when panel closes
protected onQuickEditClose(): void {
  // Cleanup, reset form, etc.
}
```
