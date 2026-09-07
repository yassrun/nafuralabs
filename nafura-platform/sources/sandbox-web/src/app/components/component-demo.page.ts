import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { ButtonComponent } from '@platform/lib/anatomy/components/atoms/button';
import { BadgeComponent } from '@platform/lib/anatomy/components/atoms/badge';
import { NfInputComponent } from '@platform/lib/anatomy/components/atoms/input';
import { NfTextareaComponent } from '@platform/lib/anatomy/components/atoms/textarea';
import { NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy/components/atoms/select';
import { SpinnerComponent } from '@platform/lib/anatomy/components/atoms/spinner';
import type { LookupSearchFn } from '@platform/lib/anatomy/tokens/lookup-searchers.token';
import { AvatarComponent } from '@platform/lib/anatomy/components/atoms/avatar';
import { DividerComponent } from '@platform/lib/anatomy/components/atoms/divider';
import { SkeletonComponent } from '@platform/lib/anatomy/components/atoms/skeleton';
import { IconComponent } from '@platform/lib/anatomy/components/atoms/icon';
import { TooltipDirective } from '@platform/lib/anatomy/components/atoms/tooltip';
import { AlertComponent } from '@platform/lib/anatomy/components/molecules/alert';
import { PageHeaderComponent } from '@platform/lib/anatomy/components/molecules/page-header';
import { EmptyStateComponent } from '@platform/lib/anatomy/components/molecules/empty-state';
import { ErrorStateComponent } from '@platform/lib/anatomy/components/molecules/error-state';
import { LoadingStateComponent } from '@platform/lib/anatomy/components/molecules/loading-state';
import { BreadcrumbComponent } from '@platform/lib/anatomy/components/molecules/breadcrumb';
import {
  ButtonListComponent,
  type ButtonListItem,
} from '@platform/lib/anatomy/components/molecules/button-list';
import { ActionBarComponent } from '@platform/lib/anatomy/components/molecules/action-bar';
import {
  SelectionBarComponent,
  type SelectionAction,
} from '@platform/lib/anatomy/components/molecules/selection-bar';
import {
  ListingControlsComponent,
  type ListingControlsColumn,
} from '@platform/lib/anatomy/components/molecules/listing-controls';
import {
  ListingActionsComponent,
  type ListingActionItem,
} from '@platform/lib/anatomy/components/molecules/listing-actions';
import { DataTableComponent } from '@platform/lib/anatomy/components/organisms/data-table';
import { PageShellComponent } from '@platform/lib/anatomy/components/organisms/page-shell';
import type { ColumnConfig, FilterFieldConfig } from '@platform/lib/anatomy/types';

import { CATALOG_ALL, type CatalogEntry } from '../catalog/showroom-catalog';

const BUTTON_VARIANTS = ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'stroked'] as const;
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
const BADGE_VARIANTS = ['default', 'success', 'warning', 'danger', 'info'] as const;
const SPINNER_SIZES = ['sm', 'md', 'lg'] as const;
const SPINNER_COLORS = ['primary', 'secondary', 'white'] as const;
const AVATAR_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const ICON_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const ICON_COLORS = ['primary', 'success', 'warning', 'danger', 'info'] as const;

@Component({
  selector: 'sb-component-demo',
  standalone: true,
  imports: [
    FormsModule,
    JsonPipe,
    RouterLink,
    ButtonComponent,
    BadgeComponent,
    NfInputComponent,
    NfTextareaComponent,
    NfSelectComponent,
    SpinnerComponent,
    AvatarComponent,
    DividerComponent,
    SkeletonComponent,
    IconComponent,
    TooltipDirective,
    AlertComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    BreadcrumbComponent,
    ButtonListComponent,
    ActionBarComponent,
    SelectionBarComponent,
    ListingControlsComponent,
    ListingActionsComponent,
    DataTableComponent,
    PageShellComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo">
      <header class="demo__head">
        <h1>{{ entry()?.selector ?? kind() }}</h1>
        @if (entry(); as e) {
          <span
            class="pill"
            [class.pill--live]="e.status === 'live'"
            [class.pill--partial]="e.status === 'partial'"
            [class.pill--stub]="e.status === 'stub'"
          >
            {{ e.status }}
          </span>
        }
      </header>
      @if (entry()?.note) {
        <p class="muted">{{ entry()!.note }}</p>
      }

      @switch (kind()) {
        @case ('button') {
          <section class="block">
            <h2>Variants × sizes</h2>
            @for (v of buttonVariants; track v) {
              <div class="row">
                <span class="row__label">{{ v }}</span>
                @for (s of buttonSizes; track s) {
                  <nf-button [variant]="v" [size]="s">{{ s }}</nf-button>
                }
              </div>
            }
          </section>
          <section class="block">
            <h2>States</h2>
            <div class="row">
              <nf-button variant="primary" [loading]="true">Saving</nf-button>
              <nf-button variant="secondary" [disabled]="true">Disabled</nf-button>
              <nf-button variant="primary" [fullWidth]="true">Full width</nf-button>
              <nf-button variant="ghost" [active]="true">Active ghost</nf-button>
              <nf-button variant="tertiary" [active]="true">Active tertiary</nf-button>
            </div>
          </section>
          <section class="block">
            <h2>Icons</h2>
            <div class="row">
              <nf-button variant="primary" icon="plus">Add</nf-button>
              <nf-button variant="secondary" icon="refresh-cw">Refresh</nf-button>
              <nf-button variant="ghost" icon="settings" iconPosition="right">Settings</nf-button>
              <nf-button variant="secondary" icon="search" tooltip="Search catalog"></nf-button>
              <nf-button variant="danger" icon="trash-2">Delete</nf-button>
            </div>
          </section>
        }

        @case ('badge') {
          <section class="block">
            <h2>Variants × sizes</h2>
            @for (v of badgeVariants; track v) {
              <div class="row">
                <span class="row__label">{{ v }}</span>
                <nf-badge [variant]="v" size="sm">sm</nf-badge>
                <nf-badge [variant]="v" size="md">md</nf-badge>
                <nf-badge [variant]="v" [rounded]="true">pill</nf-badge>
              </div>
            }
          </section>
          <section class="block">
            <h2>With icon</h2>
            <div class="row">
              <nf-badge variant="success" icon="check">Active</nf-badge>
              <nf-badge variant="warning" icon="warning">Draft</nf-badge>
              <nf-badge variant="danger" icon="error">Failed</nf-badge>
              <nf-badge variant="info" icon="info">Info</nf-badge>
            </div>
          </section>
        }

        @case ('input') {
          <section class="block stack">
            <nf-input label="Default" [(ngModel)]="text" name="def" placeholder="Type…" />
            <nf-input label="Required" [(ngModel)]="text" name="req" [required]="true" />
            <nf-input label="With error" [(ngModel)]="text" name="err" error="This field is required" />
            <nf-input label="Disabled" [(ngModel)]="text" name="dis" [disabled]="true" />
            <nf-input label="Password" type="password" [(ngModel)]="password" name="pwd" />
            <nf-input label="Email" type="email" [(ngModel)]="email" name="em" placeholder="name@example.com" />
            <nf-input label="Max length 12" [(ngModel)]="short" name="max" [maxlength]="12" />
          </section>
        }

        @case ('select') {
          <section class="block stack">
            <h2>Native (options[])</h2>
            <nf-select
              label="Status"
              [(ngModel)]="selectStatus"
              name="status"
              [options]="selectStatusOptions"
              placeholder="Choose…"
            />
            <nf-select
              label="Required"
              [(ngModel)]="selectStatus"
              name="status-req"
              [options]="selectStatusOptions"
              [required]="true"
            />
            <nf-select
              label="With error"
              [(ngModel)]="selectStatus"
              name="status-err"
              [options]="selectStatusOptions"
              error="Pick a valid status"
            />
            <nf-select
              label="Disabled"
              [(ngModel)]="selectStatus"
              name="status-dis"
              [options]="selectStatusOptions"
              [disabled]="true"
            />
            <p class="muted">Value: {{ selectStatus || '—' }}</p>
          </section>
          <section class="block stack">
            <h2>Lookup combobox (lookupKey + lookupSearch mock)</h2>
            <p class="muted">Type ≥ 2 chars — mock typeahead (no ERP deps).</p>
            <nf-select
              label="Client"
              [(ngModel)]="selectClient"
              name="client"
              lookupKey="clients"
              [lookupSearch]="mockClientSearch"
              [options]="selectClientSeed"
              placeholder="Search client…"
            />
            <p class="muted">Value: {{ selectClient || '—' }}</p>
          </section>
          <section class="block stack">
            <h2>Lookup local filter (lookupKey, options only)</h2>
            <nf-select
              label="City"
              [(ngModel)]="selectCity"
              name="city"
              lookupKey="cities"
              [options]="selectCityOptions"
              placeholder="Filter cities…"
            />
            <p class="muted">Value: {{ selectCity || '—' }}</p>
          </section>
        }

        @case ('textarea') {
          <section class="block stack">
            <nf-textarea label="Notes" [(ngModel)]="notes" name="notes" [rows]="3" placeholder="Write…" />
            <nf-textarea label="Required" [(ngModel)]="notes" name="notes-req" [required]="true" [rows]="4" />
            <nf-textarea label="Error" [(ngModel)]="notes" name="notes-err" error="Too short" [rows]="2" />
            <nf-textarea label="Disabled" [(ngModel)]="notes" name="notes-dis" [disabled]="true" />
          </section>
        }

        @case ('spinner') {
          <section class="block">
            <h2>Sizes</h2>
            <div class="row">
              @for (s of spinnerSizes; track s) {
                <div class="cell">
                  <nf-spinner [size]="s" />
                  <span class="muted">{{ s }}</span>
                </div>
              }
            </div>
          </section>
          <section class="block">
            <h2>Colors</h2>
            <div class="row">
              @for (c of spinnerColors; track c) {
                <div class="cell" [class.cell--dark]="c === 'white'">
                  <nf-spinner [color]="c" />
                  <span class="muted">{{ c }}</span>
                </div>
              }
            </div>
          </section>
        }

        @case ('avatar') {
          <section class="block">
            <h2>Sizes (initials)</h2>
            <div class="row">
              @for (s of avatarSizes; track s) {
                <div class="cell">
                  <nf-avatar name="Amine Benali" [size]="s" />
                  <span class="muted">{{ s }}</span>
                </div>
              }
            </div>
          </section>
          <section class="block">
            <h2>Shapes</h2>
            <div class="row">
              <nf-avatar name="Sara K" shape="circle" size="lg" />
              <nf-avatar name="Sara K" shape="square" size="lg" />
              <nf-avatar size="lg" />
            </div>
          </section>
        }

        @case ('divider') {
          <section class="block">
            <p>Above</p>
            <nf-divider spacing="sm" />
            <p>sm spacing</p>
            <nf-divider spacing="md" />
            <p>md spacing</p>
            <nf-divider spacing="lg" />
            <p>lg spacing</p>
            <nf-divider label="Or continue with" />
            <div class="row row--vert">
              <span>Left</span>
              <nf-divider orientation="vertical" spacing="md" />
              <span>Right</span>
            </div>
          </section>
        }

        @case ('skeleton') {
          <section class="block stack">
            <h2>Text</h2>
            <nf-skeleton variant="text" [lines]="3" />
            <h2>Circle + rect</h2>
            <div class="row">
              <nf-skeleton variant="circle" width="48px" height="48px" />
              <nf-skeleton variant="rect" width="240px" height="80px" />
            </div>
          </section>
        }

        @case ('icon') {
          <section class="block">
            <h2>Sizes</h2>
            <div class="row">
              @for (s of iconSizes; track s) {
                <div class="cell">
                  <nf-icon name="check_circle" [size]="s" color="success" />
                  <span class="muted">{{ s }}</span>
                </div>
              }
            </div>
          </section>
          <section class="block">
            <h2>Theme colors</h2>
            <div class="row">
              @for (c of iconColors; track c) {
                <div class="cell">
                  <nf-icon name="favorite" [color]="c" />
                  <span class="muted">{{ c }}</span>
                </div>
              }
            </div>
          </section>
          <section class="block">
            <h2>Spin</h2>
            <div class="row">
              <nf-icon name="sync" [spin]="true" color="primary" />
              <nf-icon name="refresh" [spin]="true" size="lg" />
            </div>
          </section>
        }

        @case ('tooltip') {
          <section class="block">
            <p class="muted">Directive <code>[nfTooltip]</code> — also available via <code>nf-button[tooltip]</code>.</p>
            <div class="row">
              <nf-button variant="secondary" [nfTooltip]="'Top tooltip'" position="top">Top</nf-button>
              <nf-button variant="secondary" [nfTooltip]="'Bottom'" position="bottom">Bottom</nf-button>
              <nf-button variant="secondary" [nfTooltip]="'Left'" position="left">Left</nf-button>
              <nf-button variant="secondary" [nfTooltip]="'Right'" position="right">Right</nf-button>
              <nf-button variant="ghost" icon="info" tooltip="Via button input"></nf-button>
            </div>
          </section>
        }

        @case ('alert') {
          <section class="block stack">
            <nf-alert variant="info" title="Info" message="Informational banner for the showroom." />
            <nf-alert variant="success" title="Saved" message="Changes were persisted." />
            <nf-alert variant="warning" title="Attention" message="This action cannot be undone." [dismissible]="true" />
            <nf-alert variant="danger" message="Something went wrong — message only." />
          </section>
        }

        @case ('page-header') {
          <section class="block">
            <nf-page-header
              [config]="{
                title: 'Products',
                subtitle: 'Catalog preview',
                icon: 'inventory_2',
                breadcrumbs: [
                  { label: 'Home', route: '/' },
                  { label: 'Products' },
                ],
                primaryAction: { label: 'New', id: 'new', icon: 'plus' },
                secondaryAction: { label: 'Export', id: 'export' },
              }"
            />
          </section>
          <section class="block">
            <h2>Inputs only</h2>
            <nf-page-header title="Simple header" subtitle="No actions" />
          </section>
        }

        @case ('empty-state') {
          <nf-empty-state
            icon="inventory_2"
            title="No items found"
            message="Create your first item to get started."
            actionLabel="Create item"
          />
        }

        @case ('error-state') {
          <nf-error-state
            title="Failed to load"
            message="The network request timed out."
            retryLabel="Retry"
          />
          <nf-error-state title="Read-only error" message="No retry affordance." [showRetry]="false" />
        }

        @case ('loading-state') {
          <section class="block">
            <h2>Inline</h2>
            <nf-loading-state variant="inline" message="Loading items…" size="md" />
          </section>
          <section class="block">
            <h2>Skeleton</h2>
            <nf-loading-state variant="skeleton" />
          </section>
          <section class="block relative">
            <h2>Overlay</h2>
            <div class="overlay-box">
              <p>Content behind overlay</p>
              <nf-loading-state variant="overlay" message="Please wait…" />
            </div>
          </section>
        }

        @case ('breadcrumb') {
          <nf-breadcrumb
            [items]="[
              { label: 'Home', route: '/' },
              { label: 'Catalog', route: '/' },
              { label: 'Current page' },
            ]"
          />
          <nf-breadcrumb
            separator="›"
            [items]="[
              { label: 'Root', route: '/' },
              { label: 'Leaf' },
            ]"
          />
        }

        @case ('data-table') {
          <section class="block">
            <h2>Default</h2>
            <nf-data-table [items]="tableItems" [columns]="tableColumns" [rowClickable]="true" />
          </section>
          <section class="block">
            <h2>Loading</h2>
            <nf-data-table [items]="[]" [columns]="tableColumns" [loading]="true" />
          </section>
          <section class="block">
            <h2>Empty</h2>
            <nf-data-table [items]="[]" [columns]="tableColumns" emptyMessage="Nothing here yet" />
          </section>
          <section class="block">
            <h2>Selectable</h2>
            <nf-data-table [items]="tableItems" [columns]="tableColumns" selectable="multiple" />
          </section>
        }

        @case ('page-shell') {
          <section class="block">
            <p class="muted">Layout wrapper — padding / scroll variants. Full pages live under Archetypes.</p>
            <nf-page-shell>
              <div class="shell-inner">Default shell content</div>
            </nf-page-shell>
            <nf-page-shell [noPadding]="true">
              <div class="shell-inner shell-inner--flush">noPadding</div>
            </nf-page-shell>
          </section>
        }

        @case ('button-list') {
          <section class="block">
            <h2>Detail / toolbar actions</h2>
            <p class="muted">Sorted by variant (ghost → … → primary). Last click: {{ lastAction() || '—' }}</p>
            <nf-button-list
              [actions]="detailActions"
              size="md"
              (actionClick)="onListAction($event)"
            />
          </section>
          <section class="block">
            <h2>Sizes</h2>
            @for (s of buttonSizes; track s) {
              <div class="row">
                <span class="row__label">{{ s }}</span>
                <nf-button-list [actions]="compactActions" [size]="s" (actionClick)="onListAction($event)" />
              </div>
            }
          </section>
          <section class="block">
            <h2>States (disabled · loading · active · hidden)</h2>
            <nf-button-list [actions]="stateActions" size="md" (actionClick)="onListAction($event)" />
          </section>
          <section class="block">
            <h2>Icon-only</h2>
            <nf-button-list [actions]="iconOnlyActions" size="sm" (actionClick)="onListAction($event)" />
          </section>
        }

        @case ('action-bar') {
          <section class="block">
            <h2>align=between</h2>
            <nf-action-bar align="between" spacing="md">
              <nf-button variant="ghost" icon="arrow-left">Back</nf-button>
              <div class="row">
                <nf-button variant="secondary">Cancel</nf-button>
                <nf-button variant="primary">Save</nf-button>
              </div>
            </nf-action-bar>
          </section>
          <section class="block">
            <h2>align=left / right / center · spacing</h2>
            <nf-action-bar align="left" spacing="sm">
              <nf-button variant="secondary">Left sm</nf-button>
              <nf-button variant="primary">Go</nf-button>
            </nf-action-bar>
            <nf-action-bar align="right" spacing="lg">
              <nf-button variant="secondary">Right lg</nf-button>
              <nf-button variant="primary">Save</nf-button>
            </nf-action-bar>
            <nf-action-bar align="center" spacing="md">
              <nf-button variant="tertiary">Center</nf-button>
            </nf-action-bar>
          </section>
          <section class="block">
            <h2>With nf-button-list</h2>
            <nf-action-bar align="between">
              <nf-button-list [actions]="wizardLeft" size="sm" (actionClick)="onListAction($event)" />
              <nf-button-list [actions]="wizardRight" size="sm" (actionClick)="onListAction($event)" />
            </nf-action-bar>
          </section>
        }

        @case ('selection-bar') {
          <section class="block">
            <h2>Interactive count</h2>
            <div class="row">
              <nf-button variant="secondary" size="sm" (clicked)="selectionCount.set(0)">0</nf-button>
              <nf-button variant="secondary" size="sm" (clicked)="selectionCount.set(1)">1</nf-button>
              <nf-button variant="secondary" size="sm" (clicked)="selectionCount.set(3)">3</nf-button>
              <nf-button variant="secondary" size="sm" (clicked)="selectionCount.set(12)">12</nf-button>
            </div>
            <nf-selection-bar
              [count]="selectionCount()"
              [actions]="bulkActions"
              (actionClick)="onSelectionAction($event)"
              (clear)="selectionCount.set(0)"
            />
            <p class="muted">Last action: {{ lastAction() || '—' }}</p>
          </section>
        }

        @case ('listing-controls') {
          <section class="block">
            <h2>Toolbar (columns · filter · search · selection)</h2>
            <nf-listing-controls
              [showSelectionToggle]="true"
              [selectionModeActive]="listingSelectionMode()"
              [columns]="listingColumns()"
              [hiddenColumnsCount]="listingHiddenCount()"
              [filterActive]="listingFilterActive()"
              [filterFields]="listingFilterFields"
              [filterValues]="listingFilterValues()"
              [search]="listingSearch()"
              (selectionToggleClick)="listingSelectionMode.update((v) => !v)"
              (columnsChange)="onListingColumns($event)"
              (filterChange)="onListingFilters($event)"
              (searchChange)="listingSearch.set($event)"
            />
            <p class="muted">
              Hidden cols: {{ listingHiddenCount() }} ·
              Search: «{{ listingSearch() || '—' }}» ·
              Filters: {{ listingFilterActive() ? (listingFilterValues() | json) : 'none' }} ·
              Selection: {{ listingSelectionMode() ? 'on' : 'off' }}
            </p>
          </section>
        }

        @case ('listing-actions') {
          <section class="block">
            <h2>mode=list</h2>
            <div class="toolbar-demo">
              <span class="muted">nf-listing-controls …</span>
              <nf-listing-actions
                mode="list"
                [actions]="listingDemoActions"
                [selectionActions]="listingSelectionMode() ? listingDemoSelectionActions : []"
                (actionClick)="onListAction($event)"
              />
            </div>
          </section>
          <section class="block">
            <h2>mode=tree (expand · collapse · add node · add child · delete)</h2>
            <div class="row">
              <nf-button variant="secondary" size="sm" (clicked)="treeDemoSelected.set(null)">No selection</nf-button>
              <nf-button variant="secondary" size="sm" (clicked)="treeDemoSelected.set('lot')">Select folder</nf-button>
              <nf-button variant="secondary" size="sm" (clicked)="treeDemoSelected.set('art')">Select leaf</nf-button>
            </div>
            <div class="toolbar-demo">
              <nf-listing-actions
                mode="tree"
                [selectedId]="treeDemoSelected()"
                [canAddChild]="treeDemoSelected() === 'lot'"
                addNodeLabel="Ajouter un nœud"
                addChildLabel="Ajouter un enfant"
                (actionClick)="onListAction($event)"
              />
            </div>
            <p class="muted">Last action: {{ lastAction() || '—' }}</p>
          </section>
        }

        @default {
          <div class="stub">
            <p class="muted">
              Stub — not wired live in the sandbox yet
              @if (entry()?.note) {
                ({{ entry()!.note }}).
              } @else {
                .
              }
            </p>
            <p class="muted">
              Prefer an archetype demo when available:
              <a routerLink="/archetypes/listing">listing</a> ·
              <a routerLink="/archetypes/details/prd-01">details</a> ·
              <a routerLink="/archetypes/tree">tree</a> ·
              <a routerLink="/archetypes/master-slave">master-slave</a>
            </p>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .demo {
        display: grid;
        gap: 20px;
        max-width: 980px;
      }
      .demo__head {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      h1 {
        margin: 0;
        font-size: 1.35rem;
      }
      h2 {
        margin: 0 0 10px;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--nf-text-muted, #6b7280);
      }
      .block {
        display: grid;
        gap: 12px;
        padding: 14px;
        border: 1px solid var(--nf-border-subtle, #e5e7eb);
        border-radius: 8px;
        background: #fff;
      }
      .stack {
        gap: 14px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }
      .row--vert {
        align-items: stretch;
        min-height: 48px;
      }
      .row__label {
        width: 88px;
        flex-shrink: 0;
        font-size: 0.8rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        min-width: 48px;
      }
      .cell--dark {
        background: #1f2937;
        padding: 12px 16px;
        border-radius: 8px;
      }
      .cell--dark .muted {
        color: #d1d5db;
      }
      .muted {
        color: var(--nf-text-muted, #6b7280);
        font-size: 0.875rem;
      }
      .pill {
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid #d1d5db;
      }
      .pill--live {
        border-color: #86efac;
        color: #166534;
        background: #f0fdf4;
      }
      .pill--partial {
        border-color: #fcd34d;
        color: #92400e;
        background: #fffbeb;
      }
      .pill--stub {
        opacity: 0.85;
      }
      .overlay-box {
        position: relative;
        min-height: 120px;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        padding: 16px;
      }
      .shell-inner {
        padding: 12px;
        background: #f9fafb;
        border-radius: 6px;
      }
      .shell-inner--flush {
        border-radius: 0;
      }
      .stub {
        display: grid;
        gap: 8px;
      }
      .toolbar-demo {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        width: 100%;
      }
      code {
        font-size: 0.85em;
      }
    `,
  ],
})
export class ComponentDemoPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly kind = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.route.snapshot.paramMap.get('name') ?? 'button')
    ),
    { initialValue: this.route.snapshot.paramMap.get('name') ?? 'button' }
  );

  readonly entry = computed((): CatalogEntry | undefined => {
    const id = this.kind();
    return CATALOG_ALL.find((e) => e.id === id);
  });

  readonly buttonVariants = BUTTON_VARIANTS;
  readonly buttonSizes = BUTTON_SIZES;
  readonly badgeVariants = BADGE_VARIANTS;
  readonly spinnerSizes = SPINNER_SIZES;
  readonly spinnerColors = SPINNER_COLORS;
  readonly avatarSizes = AVATAR_SIZES;
  readonly iconSizes = ICON_SIZES;
  readonly iconColors = ICON_COLORS;

  text = 'Sample';
  password = 'secret';
  email = 'qa@nafuralabs.local';
  short = 'ABCDEFGHIJKL';
  notes = 'Showroom notes…';

  selectStatus = 'Active';
  selectClient = '';
  selectCity = '';

  readonly selectStatusOptions: NfSelectOption[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Archived', label: 'Archived', disabled: true },
  ];

  readonly selectClientSeed: NfSelectOption[] = [
    { value: 'c-01', label: 'BTP Atlas' },
    { value: 'c-02', label: 'Casa Travaux' },
  ];

  readonly selectCityOptions: NfSelectOption[] = [
    { value: 'casa', label: 'Casablanca' },
    { value: 'rabat', label: 'Rabat' },
    { value: 'marrakech', label: 'Marrakech' },
    { value: 'fes', label: 'Fès' },
    { value: 'tanger', label: 'Tanger' },
  ];

  readonly mockClientSearch: LookupSearchFn = async (query: string) => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const all = [
      { value: 'c-01', label: 'BTP Atlas' },
      { value: 'c-02', label: 'Casa Travaux' },
      { value: 'c-03', label: 'Nord Chantiers' },
      { value: 'c-04', label: 'Sud Béton' },
      { value: 'c-05', label: 'Maroc Prefab' },
    ];
    await new Promise((r) => setTimeout(r, 180));
    return all.filter((o) => o.label.toLowerCase().includes(q));
  };

  readonly lastAction = signal('');
  readonly selectionCount = signal(3);

  readonly detailActions: ButtonListItem[] = [
    { id: 'cancel', label: 'Cancel', variant: 'ghost' },
    { id: 'duplicate', label: 'Duplicate', variant: 'secondary', icon: 'copy' },
    { id: 'delete', label: 'Delete', variant: 'danger', icon: 'trash-2' },
    { id: 'save', label: 'Save', variant: 'primary', icon: 'check' },
  ];

  readonly compactActions: ButtonListItem[] = [
    { id: 'edit', label: 'Edit', variant: 'secondary', icon: 'pencil' },
    { id: 'new', label: 'New', variant: 'primary', icon: 'plus' },
  ];

  readonly stateActions: ButtonListItem[] = [
    { id: 'disabled', label: 'Disabled', variant: 'secondary', disabled: true },
    { id: 'loading', label: 'Saving', variant: 'primary', loading: true },
    { id: 'active', label: 'Active', variant: 'ghost', active: true },
    { id: 'hidden', label: 'Hidden', variant: 'secondary', visible: false },
    { id: 'ok', label: 'Visible', variant: 'secondary' },
  ];

  readonly iconOnlyActions: ButtonListItem[] = [
    { id: 'refresh', label: '', icon: 'refresh-cw', variant: 'ghost', ariaLabel: 'Refresh', tooltip: 'Refresh' },
    { id: 'filter', label: '', icon: 'filter', variant: 'ghost', ariaLabel: 'Filter', tooltip: 'Filter' },
    { id: 'more', label: '', icon: 'settings', variant: 'ghost', ariaLabel: 'More', tooltip: 'Settings' },
  ];

  readonly wizardLeft: ButtonListItem[] = [
    { id: 'back', label: 'Back', variant: 'ghost', icon: 'arrow-left' },
  ];
  readonly wizardRight: ButtonListItem[] = [
    { id: 'next', label: 'Next', variant: 'primary', icon: 'arrow-right' },
  ];

  readonly bulkActions: SelectionAction[] = [
    { id: 'export', label: 'Export', icon: 'download', variant: 'secondary' },
    { id: 'archive', label: 'Archive', icon: 'archive', variant: 'secondary' },
    { id: 'delete', label: 'Delete', icon: 'trash-2', variant: 'danger' },
  ];

  readonly listingDemoActions: ListingActionItem[] = [
    { id: 'export', label: 'Export', variant: 'secondary', icon: 'download' },
    { id: 'new', label: 'New', variant: 'primary', icon: 'plus' },
  ];
  readonly listingDemoSelectionActions: ListingActionItem[] = [
    { id: 'delete', label: 'Delete', variant: 'danger', icon: 'trash-2' },
  ];
  readonly treeDemoSelected = signal<string | null>('lot');

  onListAction(id: string): void {
    this.lastAction.set(id);
  }

  onSelectionAction(action: SelectionAction): void {
    this.lastAction.set(action.id);
  }

  readonly listingColumns = signal<ListingControlsColumn[]>([
    { key: 'code', label: 'Code', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'description', label: 'Description', visible: false },
  ]);
  readonly listingSearch = signal('');
  readonly listingFilterValues = signal<Record<string, unknown>>({});
  readonly listingSelectionMode = signal(false);

  readonly listingFilterFields: FilterFieldConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Draft', value: 'Draft' },
      ],
    },
    { key: 'name', label: 'Name contains', type: 'text' },
  ];

  readonly listingHiddenCount = computed(
    () => this.listingColumns().filter((c) => !c.visible).length
  );
  readonly listingFilterActive = computed(
    () => Object.keys(this.listingFilterValues()).length > 0
  );

  onListingColumns(cols: ListingControlsColumn[]): void {
    this.listingColumns.set(cols);
  }

  onListingFilters(values: Record<string, unknown>): void {
    this.listingFilterValues.set(values);
  }

  readonly tableColumns: ColumnConfig[] = [
    { key: 'code', field: 'code', label: 'Code' },
    { key: 'name', field: 'name', label: 'Name' },
    { key: 'status', field: 'status', label: 'Status', type: 'badge' },
  ];
  readonly tableItems = [
    { code: 'A1', name: 'Alpha', status: 'Active' },
    { code: 'B2', name: 'Bravo', status: 'Draft' },
    { code: 'C3', name: 'Charlie', status: 'Archived' },
  ];
}
