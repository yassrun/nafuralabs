# Anatomy Component Library

> Canonical frontend documentation now lives in [docs/frontend/README.md](docs/frontend/README.md). This library spec remains the detailed reference for Anatomy components.

Complete specification for all UI components.

---

## Overview

| Tier | Category | Purpose | Count |
|------|----------|---------|-------|
| **Atoms** | Smallest units | Independent, no dependencies | 8 |
| **Molecules** | Composed | Combine atoms | 20 |
| **Organisms** | Complex | Feature-level, config-driven | 19 |

**Total: 47 components**

---

## Atoms (Small, Independent)

### 1. Button (`nf-button`)

Wrapper around Material button with consistent styling.

```typescript
// Inputs
variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' = 'primary';
size: 'sm' | 'md' | 'lg' = 'md';
icon?: string;                    // Material icon name
iconPosition: 'left' | 'right' = 'left';
loading: boolean = false;
disabled: boolean = false;
fullWidth: boolean = false;

// Outputs
clicked: EventEmitter<MouseEvent>;
```

```html
<nf-button variant="primary" icon="add">Create Item</nf-button>
<nf-button variant="danger" [loading]="isSaving">Delete</nf-button>
<nf-button variant="ghost" icon="refresh" (clicked)="refresh()"></nf-button>
```

---

### 2. Badge (`nf-badge`)

Status indicators and labels.

```typescript
// Inputs
variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
size: 'sm' | 'md' = 'md';
rounded: boolean = false;         // Pill shape
icon?: string;

// Content projection for label
```

```html
<nf-badge variant="success">Active</nf-badge>
<nf-badge variant="danger" icon="error">Failed</nf-badge>
<nf-badge variant="info" rounded>New</nf-badge>
```

---

### 3. Icon (`nf-icon`)

Wrapper for Material Icons with size control.

```typescript
// Inputs
name: string;                     // Material icon name
size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
color?: string;                   // CSS color or theme color
spin: boolean = false;            // For loading icons
```

```html
<nf-icon name="check" size="sm" color="success"></nf-icon>
<nf-icon name="sync" [spin]="isLoading"></nf-icon>
```

---

### 4. Spinner (`nf-spinner`)

Loading indicator.

```typescript
// Inputs
size: 'sm' | 'md' | 'lg' = 'md';
color: 'primary' | 'secondary' | 'white' = 'primary';
```

```html
<nf-spinner size="sm"></nf-spinner>
```

---

### 5. Avatar (`nf-avatar`)

User/entity avatar with fallback.

```typescript
// Inputs
src?: string;                     // Image URL
name?: string;                    // For initials fallback
size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
shape: 'circle' | 'square' = 'circle';
```

```html
<nf-avatar [src]="user.avatar" [name]="user.name"></nf-avatar>
<nf-avatar name="John Doe" size="lg"></nf-avatar>
```

---

### 6. Tooltip (`nf-tooltip`)

Directive for tooltips.

```typescript
// Inputs (Directive)
nfTooltip: string;                // Tooltip text
position: 'top' | 'bottom' | 'left' | 'right' = 'top';
delay: number = 200;              // ms
```

```html
<button [nfTooltip]="'Edit item'" position="bottom">Edit</button>
```

---

### 7. Divider (`nf-divider`)

Visual separator.

```typescript
// Inputs
orientation: 'horizontal' | 'vertical' = 'horizontal';
spacing: 'sm' | 'md' | 'lg' = 'md';
label?: string;                   // Optional center label
```

```html
<nf-divider></nf-divider>
<nf-divider label="Or"></nf-divider>
```

---

### 8. Skeleton (`nf-skeleton`)

Loading placeholder.

```typescript
// Inputs
variant: 'text' | 'circle' | 'rect' = 'text';
width?: string;                   // CSS width
height?: string;                  // CSS height
lines: number = 1;                // For text variant
```

```html
<nf-skeleton variant="text" lines="3"></nf-skeleton>
<nf-skeleton variant="circle" width="40px" height="40px"></nf-skeleton>
```

---

## Molecules (Composed Components)

### 9. Page Title (`nf-page-title`)

Page header with title, subtitle, and actions.

**Deprecated:** Use `nf-page-header` instead.

```typescript
// Inputs
title: string;
subtitle?: string;
icon?: string;

// Content projection
<ng-content select="[actions]"></ng-content>
```

```html
<nf-page-title title="Locations" subtitle="Manage warehouse locations" icon="location_on">
  <div actions>
    <nf-button variant="primary" icon="add">Add Location</nf-button>
  </div>
</nf-page-title>
```

---

### 10. Action Bar (`nf-action-bar`)

Horizontal action container with alignment.

```typescript
// Inputs
align: 'left' | 'right' | 'between' | 'center' = 'right';
spacing: 'sm' | 'md' | 'lg' = 'md';

// Content projection for actions
```

```html
<nf-action-bar align="between">
  <nf-button variant="ghost" icon="arrow_back">Back</nf-button>
  <div>
    <nf-button variant="secondary">Cancel</nf-button>
    <nf-button variant="primary" [loading]="isSaving">Save</nf-button>
  </div>
</nf-action-bar>
```

---

### 11. Search Input (`nf-search-input`)

Search field with debounce and clear.

```typescript
// Inputs
placeholder: string = 'Search...';
debounceMs: number = 300;
minLength: number = 0;
value: string = '';

// Outputs
search: EventEmitter<string>;
clear: EventEmitter<void>;
```

```html
<nf-search-input 
  placeholder="Search items..." 
  [debounceMs]="400"
  (search)="onSearch($event)">
</nf-search-input>
```

---

### 12. Empty State (`nf-empty-state`)

Placeholder when no data.

```typescript
// Inputs
icon?: string;
title: string;
message?: string;
actionLabel?: string;

// Outputs
action: EventEmitter<void>;
```

```html
<nf-empty-state 
  icon="inventory_2" 
  title="No items found"
  message="Create your first item to get started"
  actionLabel="Create Item"
  (action)="onCreate()">
</nf-empty-state>
```

---

### 13. Error State (`nf-error-state`)

Error display with retry.

```typescript
// Inputs
icon: string = 'error_outline';
title: string = 'Something went wrong';
message?: string;
retryLabel: string = 'Try again';
showRetry: boolean = true;

// Outputs
retry: EventEmitter<void>;
```

```html
<nf-error-state 
  [message]="error()"
  (retry)="loadData()">
</nf-error-state>
```

---

### 14. Loading State (`nf-loading-state`)

Full loading overlay or inline.

```typescript
// Inputs
message?: string;
variant: 'overlay' | 'inline' | 'skeleton' = 'inline';
size: 'sm' | 'md' | 'lg' = 'md';
```

```html
<nf-loading-state message="Loading items..."></nf-loading-state>
<nf-loading-state variant="overlay" *ngIf="isLoading()"></nf-loading-state>
```

---

### 15. Stat Card (`nf-stat-card`)

KPI/metric display.

```typescript
// Inputs
label: string;
value: string | number;
icon?: string;
trend?: { value: number; direction: 'up' | 'down' };
variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';
```

```html
<nf-stat-card 
  label="Total Items" 
  [value]="1234"
  icon="inventory"
  [trend]="{ value: 12, direction: 'up' }">
</nf-stat-card>
```

---

### 16. Breadcrumb (`nf-breadcrumb`)

Navigation breadcrumb trail.

```typescript
// Inputs
items: BreadcrumbItem[];
separator: string = '/';

// BreadcrumbItem { label, route?, icon?, queryParams? }
```

```html
<nf-breadcrumb [items]="[
  { label: 'Home', route: '/' },
  { label: 'Locations', route: '/locations' },
  { label: 'New Location' }
]"></nf-breadcrumb>
```

---

### 17. Alert (`nf-alert`)

Inline notification/banner.

```typescript
// Inputs
variant: 'info' | 'success' | 'warning' | 'danger' = 'info';
title?: string;
message: string;
dismissible: boolean = false;
icon?: string;                    // Auto-set based on variant

// Outputs
dismissed: EventEmitter<void>;
```

```html
<nf-alert variant="warning" title="Attention" message="This action cannot be undone" dismissible></nf-alert>
```

---

### 18. Tabs (`nf-tabs`)

Tab navigation.

```typescript
// Inputs
tabs: TabItem[];                  // { id, label, icon?, disabled?, badge? }
activeTab: string;

// Outputs
tabChange: EventEmitter<string>;
```

```html
<nf-tabs 
  [tabs]="[
    { id: 'general', label: 'General', icon: 'info' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'history', label: 'History', badge: '3' }
  ]"
  [activeTab]="activeTab"
  (tabChange)="onTabChange($event)">
</nf-tabs>

---

## New Components (2026)

### Dashboard Panel (`nf-dashboard-panel`)

Card wrapper for dashboard widgets with title and span control.

```typescript
// Inputs
title: string = '';
span: 'full' | 'half' | 'third' = 'half';

// Slots
<ng-content></ng-content>
<ng-content select="[actions]"></ng-content>
<ng-content select="[footer]"></ng-content>
```

```html
<nf-dashboard-panel title="KPIs" span="full">
  <nf-kpi-strip [kpis]="kpis"></nf-kpi-strip>
</nf-dashboard-panel>
```

---

### KPI Strip (`nf-kpi-strip`)

Horizontal stat-card grid with optional secondary text.

```typescript
// Inputs
kpis: KpiItem[] = [];

// Outputs
kpiClick: EventEmitter<KpiItem>;
```

```html
<nf-kpi-strip [kpis]="kpis" (kpiClick)="onKpiClick($event)"></nf-kpi-strip>
```

---

### Dashboard Grid (`nf-dashboard-grid`)

12-column responsive grid container for dashboard panels.

```html
<nf-dashboard-grid>
  <nf-dashboard-panel title="Alerts" span="half"></nf-dashboard-panel>
  <nf-dashboard-panel title="Actions" span="half"></nf-dashboard-panel>
</nf-dashboard-grid>
```

---

### Activity Feed (`nf-activity-feed`)

Height-constrained data table for recent activity.

```typescript
// Inputs
items: T[] = [];
config: ActivityFeedConfig; // { columns, maxRows?, maxHeight?, rowClickable? }
sortColumn?: string;
sortDirection?: 'asc' | 'desc';

// Outputs
sortChange: EventEmitter<SortChangeEvent>;
rowClick: EventEmitter<T>;
```

```html
<nf-activity-feed
  [items]="items"
  [config]="activityConfig"
  (rowClick)="openItem($event)">
</nf-activity-feed>
```

---

### Wizard Shell (`nf-wizard-shell`) - labels

Wizard shell now accepts i18n-ready labels and icons.

```typescript
// Inputs
backLabel: string;
nextLabel: string;
submitLabel: string;
backIcon: string = 'arrow_back';
nextIcon: string = 'arrow_forward';
submitIcon: string = 'check';
```
```

---

## Organisms (Complex, Feature-Level)

### 19. Data Table (`nf-data-table`)

Full-featured data table (wraps Material Table).

```typescript
// Inputs
items: T[];
columns: ColumnConfig[];
loading: boolean = false;
selectable: boolean | 'single' | 'multiple' = false;
selection: T[] = [];
sortColumn?: string;
sortDirection?: 'asc' | 'desc';
stickyHeader: boolean = true;
rowClickable: boolean = false;
emptyMessage: string = 'No data available';
trackBy?: (item: T) => any;

// Outputs
selectionChange: EventEmitter<T[]>;
sortChange: EventEmitter<{ column: string; direction: 'asc' | 'desc' | null }>;
rowClick: EventEmitter<T>;
rowAction: EventEmitter<{ action: string; item: T }>;

// ColumnConfig
interface ColumnConfig {
  key: string;
  label: string;
  field: string;
  type?: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'currency' | 'badge' | 'custom';
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  cssClass?: string;
  transform?: (value: any, item: T) => string;
  template?: TemplateRef<any>;      // For custom rendering
  badgeConfig?: { [value: string]: { label: string; variant: string } };
}
```

```html
<nf-data-table
  [items]="items()"
  [columns]="columns"
  [loading]="isLoading()"
  [selectable]="'multiple'"
  [selection]="selectedItems()"
  [sortColumn]="sort()?.column"
  [sortDirection]="sort()?.direction"
  (selectionChange)="onSelectionChange($event)"
  (sortChange)="onSortChange($event)"
  (rowClick)="onRowClick($event)">
  
  <!-- Row actions template -->
  <ng-template #rowActions let-item>
    <nf-button variant="ghost" icon="edit" (clicked)="edit(item)"></nf-button>
    <nf-button variant="ghost" icon="delete" (clicked)="delete(item)"></nf-button>
  </ng-template>
</nf-data-table>
```

---

### 20. Pagination (`nf-pagination`)

Page navigation (wraps Material Paginator).

```typescript
// Inputs
total: number;
page: number = 1;
pageSize: number = 20;
pageSizeOptions: number[] = [10, 20, 50, 100];
showFirstLast: boolean = true;
showPageSize: boolean = true;

// Outputs
pageChange: EventEmitter<{ page: number; pageSize: number }>;
```

```html
<nf-pagination
  [total]="pagination().total"
  [page]="pagination().page"
  [pageSize]="pagination().pageSize"
  (pageChange)="onPageChange($event)">
</nf-pagination>
```

---

### 21. Filter Bar (`nf-filter-bar`)

Search + filters container.

```typescript
// Inputs
filters: FilterFieldConfig[];
values: Record<string, any>;
searchPlaceholder: string = 'Search...';
showSearch: boolean = true;
collapsible: boolean = false;
lookups: LookupContext = {};

// Outputs
filterChange: EventEmitter<Record<string, any>>;
search: EventEmitter<string>;
reset: EventEmitter<void>;

// FilterFieldConfig
interface FilterFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'daterange' | 'select' | 'multiselect' | 'boolean';
  placeholder?: string;
  options?: { label: string; value: any }[];
  lookupKey?: string;
  defaultValue?: any;
}
```

```html
<nf-filter-bar
  [filters]="filterConfig"
  [values]="currentFilters"
  [lookups]="lookups()"
  (filterChange)="onFilterChange($event)"
  (search)="onSearch($event)"
  (reset)="onReset()">
</nf-filter-bar>
```

---

### 22. Form (`nf-form`)

Dynamic form generator.

```typescript
// Inputs
fields: FormFieldConfig[];
values: Record<string, any>;
layout: 'vertical' | 'horizontal' | 'grid' = 'vertical';
columns: number = 1;              // For grid layout
loading: boolean = false;
disabled: boolean = false;
lookups: LookupContext = {};

// Outputs
valueChange: EventEmitter<Record<string, any>>;
submit: EventEmitter<Record<string, any>>;
cancel: EventEmitter<void>;

// FormFieldConfig (from types)
```

```html
<nf-form
  [fields]="formFields"
  [values]="formValues"
  [layout]="'grid'"
  [columns]="2"
  [lookups]="lookups()"
  [loading]="isSaving()"
  (submit)="onSubmit($event)"
  (cancel)="onCancel()">
</nf-form>
```

---

### 23. Modal (`nf-modal`)

Dialog/modal wrapper (wraps Material Dialog).

```typescript
// Inputs (via ModalService or direct)
title?: string;
size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
closable: boolean = true;
closeOnBackdrop: boolean = true;
closeOnEscape: boolean = true;

// Content projection
<ng-content select="[body]"></ng-content>
<ng-content select="[footer]"></ng-content>

// Outputs
closed: EventEmitter<any>;
```

```html
<nf-modal title="Edit Location" size="lg" (closed)="onClose($event)">
  <div body>
    <nf-form [fields]="fields" [values]="item"></nf-form>
  </div>
  <div footer>
    <nf-button variant="secondary" (clicked)="cancel()">Cancel</nf-button>
    <nf-button variant="primary" (clicked)="save()">Save</nf-button>
  </div>
</nf-modal>
```

---

### 24. Confirm Dialog (`nf-confirm-dialog`)

Confirmation prompt (via service).

```typescript
// ConfirmDialogService
interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;          // Default: 'Confirm'
  cancelLabel?: string;           // Default: 'Cancel'
  variant?: 'default' | 'danger'; // Default: 'default'
  icon?: string;
}

// Service method
confirm(options: ConfirmOptions): Promise<boolean>;
```

```typescript
// Usage
const confirmed = await this.confirmDialog.confirm({
  title: 'Delete Item',
  message: 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmLabel: 'Delete',
  variant: 'danger',
  icon: 'delete'
});

if (confirmed) {
  await this.facade.deleteItem(id);
}
```

---

### 25. Toast (`nf-toast`)

Notification toasts (via service).

```typescript
// ToastService
interface ToastOptions {
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  duration?: number;              // ms, default 3000
  action?: { label: string; callback: () => void };
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

// Service methods
show(options: ToastOptions): void;
success(message: string): void;
error(message: string): void;
warning(message: string): void;
info(message: string): void;
```

```typescript
// Usage
this.toast.success('Item created successfully');
this.toast.error('Failed to save changes');
this.toast.show({
  message: 'Item deleted',
  variant: 'info',
  action: { label: 'Undo', callback: () => this.undo() }
});
```

---

### 26. Drawer (`nf-drawer`)

Side panel for details/forms.

```typescript
// Inputs
position: 'left' | 'right' = 'right';
size: 'sm' | 'md' | 'lg' = 'md';
title?: string;
open: boolean = false;
closeOnBackdrop: boolean = true;
closeOnEscape: boolean = true;

// Content projection
<ng-content></ng-content>

// Outputs
openChange: EventEmitter<boolean>;
closed: EventEmitter<void>;
```

```html
<nf-drawer 
  [open]="showDetails" 
  title="Item Details"
  size="md"
  (closed)="closeDetails()">
  
  <div class="drawer-content">
    <!-- Detail content -->
  </div>
  
  <div class="drawer-footer">
    <nf-button variant="primary" (clicked)="edit()">Edit</nf-button>
  </div>
</nf-drawer>
```

---

## Component Implementation Priority

### Phase 1: Core (Essential for basic list/detail)
1. Button
2. Icon
3. Spinner
4. Badge
5. Page Title
6. Empty State
7. Error State
8. Loading State
9. Data Table
10. Pagination
11. Toast (service)

### Phase 2: Forms & Filters
12. Search Input
13. Filter Bar
14. Form
15. Modal
16. Confirm Dialog (service)

### Phase 3: Enhanced UX
17. Action Bar
18. Breadcrumb
19. Alert
20. Tabs
21. Drawer

### Phase 4: Polish
22. Avatar
23. Tooltip
24. Divider
25. Skeleton
26. Stat Card

---

## File Structure

```
components/
├── index.ts
├── COMPONENTS.md
│
├── atoms/
│   ├── button/
│   │   ├── button.component.ts
│   │   ├── button.component.html
│   │   ├── button.component.scss
│   │   └── index.ts
│   ├── badge/
│   ├── icon/
│   ├── spinner/
│   ├── avatar/
│   ├── tooltip/
│   ├── divider/
│   ├── skeleton/
│   └── index.ts
│
├── molecules/
│   ├── page-title/
│   ├── action-bar/
│   ├── search-input/
│   ├── empty-state/
│   ├── error-state/
│   ├── loading-state/
│   ├── stat-card/
│   ├── breadcrumb/
│   ├── alert/
│   ├── tabs/
│   └── index.ts
│
├── organisms/
│   ├── data-table/
│   ├── pagination/
│   ├── filter-bar/
│   ├── form/
│   ├── modal/
│   ├── confirm-dialog/
│   ├── toast/
│   ├── drawer/
│   └── index.ts
│
└── services/
    ├── confirm-dialog.service.ts
    ├── toast.service.ts
    └── index.ts
```

---

## Naming Conventions

- **Selector prefix**: `nf-` (Nafura)
- **Component files**: `{name}.component.ts`
- **Service files**: `{name}.service.ts`
- **Class names**: `{Name}Component`, `{Name}Service`
- **Exports**: Barrel exports via `index.ts`

---

## Wrapping Strategy

| Component | Strategy | Reason |
|-----------|----------|--------|
| Button | Wrap Material | Complex states, ripple |
| Data Table | Wrap Material | Virtual scroll, sorting |
| Pagination | Wrap Material | A11y, i18n |
| Modal | Wrap Material | Portal, animations |
| Form Fields | Wrap Material | Validation, theming |
| Badge | Custom | Simple, specific needs |
| Icon | Wrap Material | Icon registry |
| Toast | Wrap Material Snackbar | Animations |
| Others | Custom | Simpler requirements |

---

## Quick Edit Patterns

Quick edit allows creating/editing items without navigating away from the list page. The `FeatureListPageClass` provides built-in state management for this pattern.

### Pattern 1: Drawer Quick Edit (Recommended)

Best for: Detail-heavy forms, side-by-side comparison with list.

```html
<!-- List Page Template -->
<nf-page-title title="Locations" subtitle="Manage warehouse locations">
  <div actions>
    <nf-button variant="primary" icon="add" (clicked)="openCreate()">
      Add Location
    </nf-button>
  </div>
</nf-page-title>

<nf-data-table
  [items]="items()"
  [columns]="columns"
  [loading]="isLoading()"
  (rowClick)="openEdit($event)">
  
  <ng-template #rowActions let-item>
    <nf-button variant="ghost" icon="visibility" (clicked)="openView(item)"></nf-button>
    <nf-button variant="ghost" icon="edit" (clicked)="openEdit(item)"></nf-button>
  </ng-template>
</nf-data-table>

<!-- Quick Edit Drawer -->
<nf-drawer
  [open]="isQuickEditOpen()"
  [title]="quickEditTitle()"
  size="md"
  (closed)="closeQuickEdit()">
  
  @if (isViewing()) {
    <!-- View Mode -->
    <div class="detail-view">
      <dl>
        <dt>Name</dt>
        <dd>{{ editingItem()?.name }}</dd>
        <dt>Code</dt>
        <dd>{{ editingItem()?.code }}</dd>
      </dl>
      <nf-action-bar>
        <nf-button variant="primary" icon="edit" (clicked)="openEdit(editingItem()!)">
          Edit
        </nf-button>
      </nf-action-bar>
    </div>
  } @else {
    <!-- Edit/Create Mode -->
    <nf-form
      [fields]="formFields"
      [values]="editingItem() ?? defaultValues"
      [loading]="isQuickEditSaving()"
      [lookups]="lookups()"
      (submit)="performQuickEditSave($event)"
      (cancel)="closeQuickEdit()">
    </nf-form>
  }
  
  @if (quickEditError()) {
    <nf-alert variant="danger" [message]="quickEditError()!" dismissible (dismissed)="clearQuickEditError()"></nf-alert>
  }
</nf-drawer>
```

### Pattern 2: Modal Quick Edit

Best for: Focused editing, blocking other interactions.

```html
<!-- Trigger from table row action -->
<nf-data-table [items]="items()" [columns]="columns">
  <ng-template #rowActions let-item>
    <nf-button variant="ghost" icon="edit" (clicked)="openEdit(item)"></nf-button>
  </ng-template>
</nf-data-table>

<!-- Quick Edit Modal -->
@if (isQuickEditOpen()) {
  <nf-modal
    [title]="isCreating() ? 'New Item' : 'Edit Item'"
    size="lg"
    (closed)="closeQuickEdit()">
    
    <div body>
      <nf-form
        [fields]="formFields"
        [values]="editingItem() ?? {}"
        [loading]="isQuickEditSaving()"
        (valueChange)="onFormChange($event)">
      </nf-form>
      
      @if (quickEditError()) {
        <nf-alert variant="danger" [message]="quickEditError()!"></nf-alert>
      }
    </div>
    
    <div footer>
      @if (isEditing()) {
        <nf-button variant="danger" icon="delete" (clicked)="confirmDelete()">
          Delete
        </nf-button>
      }
      <div class="spacer"></div>
      <nf-button variant="secondary" (clicked)="closeQuickEdit()">Cancel</nf-button>
      <nf-button 
        variant="primary" 
        [loading]="isQuickEditSaving()" 
        (clicked)="performQuickEditSave(formValues)">
        Save
      </nf-button>
    </div>
  </nf-modal>
}
```

### Pattern 3: Inline Edit

Best for: Simple edits, single field changes.

```html
<nf-data-table [items]="items()" [columns]="columns">
  <!-- Custom cell template for inline edit -->
  <ng-template #nameCell let-item let-value="value">
    @if (isEditingInline(item)) {
      <input 
        type="text" 
        [value]="value" 
        (blur)="saveInlineEdit(item, 'name', $event.target.value)"
        (keydown.enter)="saveInlineEdit(item, 'name', $event.target.value)"
        (keydown.escape)="cancelInlineEdit()">
    } @else {
      <span (dblclick)="startInlineEdit(item, 'name')">{{ value }}</span>
    }
  </ng-template>
</nf-data-table>
```

### Quick Edit with Confirmation

```typescript
// In your page class
private confirmDialog = inject(ConfirmDialogService);

async confirmDelete(): Promise<void> {
  const item = this.editingItem();
  if (!item) return;
  
  const confirmed = await this.confirmDialog.confirm({
    title: 'Delete Item',
    message: `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
    confirmLabel: 'Delete',
    variant: 'danger',
    icon: 'delete'
  });
  
  if (confirmed) {
    await this.performQuickEditDelete();
  }
}
```

### Quick Edit Computed Title

```typescript
// Common pattern: computed title based on operation
readonly quickEditTitle = computed(() => {
  switch (this.quickEditOperation()) {
    case 'create': return 'New Location';
    case 'edit': return `Edit: ${this.editingItem()?.name ?? ''}`;
    case 'view': return this.editingItem()?.name ?? 'Details';
  }
});
```

### Quick Edit with Related Data Loading

```typescript
// Load lookups or related data when quick edit opens
protected override onQuickEditOpen(operation: QuickEditOperation, item: Item | null): void {
  // Load categories for dropdown
  this.loadCategories();
  
  // Load item history for edit mode
  if (operation === 'edit' && item) {
    this.loadItemHistory(item.id);
  }
}

protected override onQuickEditClose(): void {
  // Clear any temporary data
  this.clearItemHistory();
}
```

### Best Practices

1. **Choose the right mode**:
   - **Drawer**: Complex forms, viewing details alongside list
   - **Modal**: Simple forms, focused attention required
   - **Inline**: Single field edits, bulk edits

2. **Provide visual feedback**:
   - Show loading state during save
   - Display errors clearly with dismiss option
   - Use toast for success messages

3. **Handle edge cases**:
   - Unsaved changes warning
   - Concurrent edit conflicts
   - Network errors with retry

4. **Optimize UX**:
   - Auto-focus first field
   - Keyboard shortcuts (Escape to close)
   - Remember scroll position in list

### Component Composition Example

```html
<!-- Complete Quick Edit Drawer -->
<nf-drawer
  [open]="isQuickEditOpen()"
  [title]="quickEditTitle()"
  size="lg"
  (closed)="closeQuickEdit()">
  
  <!-- Tabs for complex items -->
  @if (isEditing() || isViewing()) {
    <nf-tabs
      [tabs]="detailTabs"
      [activeTab]="activeTab()"
      (tabChange)="setActiveTab($event)">
    </nf-tabs>
  }
  
  <div class="drawer-content">
    @switch (activeTab()) {
      @case ('general') {
        <nf-form
          [fields]="generalFields"
          [values]="editingItem() ?? {}"
          [disabled]="isViewing()"
          [loading]="isQuickEditSaving()"
          (submit)="performQuickEditSave($event)">
        </nf-form>
      }
      @case ('settings') {
        <nf-form
          [fields]="settingsFields"
          [values]="editingItem() ?? {}"
          [disabled]="isViewing()">
        </nf-form>
      }
      @case ('history') {
        <div class="history-list">
          @for (entry of itemHistory(); track entry.id) {
            <div class="history-entry">
              <nf-avatar [name]="entry.user" size="sm"></nf-avatar>
              <span>{{ entry.action }} - {{ entry.date | date }}</span>
            </div>
          }
        </div>
      }
    }
  </div>
  
  <!-- Footer Actions -->
  @if (!isViewing()) {
    <div class="drawer-footer">
      @if (isEditing()) {
        <nf-button variant="danger" icon="delete" (clicked)="confirmDelete()">
          Delete
        </nf-button>
      }
      <div class="spacer"></div>
      <nf-button variant="secondary" (clicked)="closeQuickEdit()">Cancel</nf-button>
      <nf-button 
        variant="primary" 
        [loading]="isQuickEditSaving()"
        (clicked)="submitForm()">
        {{ isCreating() ? 'Create' : 'Save Changes' }}
      </nf-button>
    </div>
  }
  
  <!-- Error Display -->
  @if (quickEditError()) {
    <nf-alert 
      variant="danger" 
      [message]="quickEditError()!" 
      dismissible 
      (dismissed)="clearQuickEditError()">
    </nf-alert>
  }
</nf-drawer>
```
