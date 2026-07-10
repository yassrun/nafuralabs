import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../atoms/button';
import { BreadcrumbComponent } from '../breadcrumb';
import { BreadcrumbItem } from '../../../types';

/**
 * Page Header Action Configuration
 *
 * Defines a clickable action button in the page header.
 */
export interface PageHeaderAction {
  /** Button label text */
  label: string;
  /** Material icon name (optional) */
  icon?: string;
  /** Unique identifier for the action (used in event emission) */
  id?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button shows loading state */
  loading?: boolean;
}

/**
 * Page Header Configuration
 *
 * Single config object for all page header settings.
 */
export interface PageHeaderConfig {
  /** Page title (required) */
  title: string;
  /** Page subtitle/description (optional) */
  subtitle?: string;
  /** Material icon name (optional) */
  icon?: string;
  /** Breadcrumb trail (optional) */
  breadcrumbs?: BreadcrumbItem[];
  /** Primary action button (optional) */
  primaryAction?: PageHeaderAction;
  /** Secondary action button (optional) */
  secondaryAction?: PageHeaderAction;
}

/**
 * Page Header Component
 *
 * Page header with optional breadcrumbs, title, subtitle, icon, and actions.
 * Supports both config-driven actions (primaryAction/secondaryAction) and
 * custom content via ng-content for flexibility.
 *
 * @example Full config with breadcrumbs:
 * <nf-page-header
 *   [config]="{
 *     title: 'Products',
 *     subtitle: 'Manage your product catalog',
 *     icon: 'inventory_2',
 *     breadcrumbs: [
 *       { label: 'Home', route: '/' },
 *       { label: 'Sandbox', route: '/sandbox' },
 *       { label: 'Products' }
 *     ],
 *     primaryAction: { label: 'Add Product', icon: 'add', id: 'create' },
 *     secondaryAction: { label: 'Import', icon: 'upload', id: 'import' }
 *   }"
 *   (actionClick)="onAction($event)">
 * </nf-page-header>
 *
 * @example Individual inputs (backward compatible):
 * <nf-page-header
 *   title="Products"
 *   subtitle="Manage your catalog"
 *   icon="inventory_2"
 *   [primaryAction]="{ label: 'Add', icon: 'add' }"
 *   (actionClick)="onAction($event)">
 * </nf-page-header>
 *
 * @example Custom actions via ng-content:
 * <nf-page-header title="Products">
 *   <div actions>
 *     <nf-button variant="primary" icon="add">Add Product</nf-button>
 *   </div>
 * </nf-page-header>
 */
@Component({
  selector: 'nf-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, ButtonComponent, BreadcrumbComponent],
  template: `
    <div class="nf-page-header">
      <!-- Row 1: one column (breadcrumbs) -->
      @if (effectiveBreadcrumbs().length > 0) {
        <div class="nf-page-header__row nf-page-header__row--one-col">
          <nf-breadcrumb
            class="nf-page-header__breadcrumbs"
            [items]="effectiveBreadcrumbs()">
          </nf-breadcrumb>
        </div>
      }

      <!-- Row 2: two columns (title + subtitle | actions) -->
      <div class="nf-page-header__row nf-page-header__row--two-cols">
        <div class="nf-page-header__content">
          @if (effectiveIcon()) {
            <mat-icon class="nf-page-header__icon">{{ effectiveIcon() }}</mat-icon>
          }
          <div class="nf-page-header__text">
            <h1 class="nf-page-header__title">{{ effectiveTitle() | translate }}</h1>
            @if (effectiveSubtitle()) {
              <p class="nf-page-header__subtitle">{{ effectiveSubtitle()! | translate }}</p>
            }
          </div>
        </div>
        <div class="nf-page-header__actions">
          <!-- Config-driven actions -->
          @if (effectiveSecondaryAction()) {
            <nf-button
              variant="secondary"
              [icon]="effectiveSecondaryAction()!.icon"
              [disabled]="effectiveSecondaryAction()!.disabled ?? false"
              [loading]="effectiveSecondaryAction()!.loading ?? false"
              (clicked)="onActionClick('secondary', effectiveSecondaryAction()!)">
              {{ effectiveSecondaryAction()!.label | translate }}
            </nf-button>
          }
          @if (effectivePrimaryAction()) {
            <nf-button
              variant="primary"
              [icon]="effectivePrimaryAction()!.icon"
              [disabled]="effectivePrimaryAction()!.disabled ?? false"
              [loading]="effectivePrimaryAction()!.loading ?? false"
              (clicked)="onActionClick('primary', effectivePrimaryAction()!)">
              {{ effectivePrimaryAction()!.label | translate }}
            </nf-button>
          }
          <!-- Custom actions via ng-content -->
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nf-page-header {
      display: flex;
      flex-direction: column;
      gap: var(--nf-space-2, 8px);
      padding-top: var(--nf-page-header-padding-top, 8px);
      padding-bottom: var(--nf-page-header-padding-bottom, 12px);
      padding-inline-start: 0;
      padding-inline-end: 0;
      margin-bottom: var(--nf-page-header-margin-bottom, 24px);
    }

    .nf-page-header__row {
      display: flex;
    }

    .nf-page-header__row--one-col {
      flex-direction: column;
    }

    .nf-page-header__row--two-cols {
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--nf-page-header-gap, 16px);
    }

    .nf-page-header__breadcrumbs {
      // Increased separation from title - breadcrumb is navigation context
      margin-bottom: var(--nf-page-header-breadcrumb-gap, 4px);
    }

    .nf-page-header__content {
      display: flex;
      align-items: flex-start;
      // Tighter gap for semantic icon - icon is part of title identity
      gap: var(--nf-page-header-icon-gap, 10px);
    }

    .nf-page-header__icon {
      // Semantic icon: same visual weight as title
      font-size: var(--nf-page-header-icon-size, 28px);
      width: var(--nf-page-header-icon-size, 28px);
      height: var(--nf-page-header-icon-size, 28px);
      color: var(--nf-page-header-icon-color, var(--nf-color-text, #111827));
      // Align with title baseline
      margin-top: var(--nf-page-header-icon-offset, 2px);
    }

    .nf-page-header__text {
      display: flex;
      flex-direction: column;
      gap: var(--nf-space-1, 4px);
    }

    .nf-page-header__title {
      margin: 0;
      font-size: var(--nf-page-header-title-size, var(--nf-text-2xl, var(--nf-font-size-2xl, 1.5rem)));
      font-weight: var(--nf-page-header-title-weight, var(--nf-font-weight-semibold, 600));
      color: var(--nf-page-header-title-color, var(--nf-color-text, #111827));
      line-height: var(--nf-line-height-tight, 1.25);
    }

    .nf-page-header__subtitle {
      margin: 0;
      font-size: var(--nf-page-header-subtitle-size, var(--nf-text-base, var(--nf-font-size-sm, 0.875rem)));
      color: var(--nf-page-header-subtitle-color, var(--nf-color-text-secondary, #6b7280));
    }

    .nf-page-header__actions {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 8px);
      flex-shrink: 0;
      margin-inline-start: auto;
    }

    @media (max-width: 768px) {
      .nf-page-header__row--two-cols {
        flex-direction: column;
        align-items: stretch;
      }

      .nf-page-header__actions {
        justify-content: flex-end;
      }
    }

    /* Design mode: show flex row/column borders when ancestor has .nf-listing-page--design */
    :host-context(.nf-listing-page--design) .nf-page-header__row {
      outline: 1px dashed rgba(59, 130, 246, 0.6);
      outline-offset: 2px;
    }
    :host-context(.nf-listing-page--design) .nf-page-header__row--one-col {
      outline-color: rgba(34, 197, 94, 0.6);
    }
    :host-context(.nf-listing-page--design) .nf-page-header__row--two-cols {
      outline-color: rgba(168, 85, 247, 0.6);
    }
    :host-context(.nf-listing-page--design) .nf-page-header__content {
      outline: 1px dashed rgba(234, 88, 12, 0.6);
      outline-offset: 1px;
    }
    :host-context(.nf-listing-page--design) .nf-page-header__actions {
      outline: 1px dashed rgba(236, 72, 153, 0.6);
      outline-offset: 1px;
    }

    /* No-spacing: balanced gaps and alignment; zero padding/margin except header cushion */
    :host-context(.nf-listing-page--no-spacing) {
      margin: 0;
      padding: 0;
    }
    :host-context(.nf-listing-page--no-spacing) .nf-page-header {
      padding: var(--nf-page-header-padding-top, 8px) 0 var(--nf-page-header-padding-bottom, 12px) 0 !important;
      margin: 0 !important;
      gap: var(--nf-page-header-row-gap, 8px) !important;
    }
    :host-context(.nf-listing-page--no-spacing) .nf-page-header__row--two-cols {
      align-items: flex-start;
      gap: var(--nf-page-header-gap, 16px) !important;
    }
    :host-context(.nf-listing-page--no-spacing) .nf-page-header__content {
      padding: 0 !important;
      margin: 0 !important;
      gap: var(--nf-page-header-icon-gap, 10px) !important;
    }
    :host-context(.nf-listing-page--no-spacing) .nf-page-header__actions {
      padding: 0 !important;
      margin: 0 !important;
      gap: var(--nf-page-header-actions-gap, 8px) !important;
    }
    :host-context(.nf-listing-page--no-spacing) .nf-page-header__row,
    :host-context(.nf-listing-page--no-spacing) .nf-page-header__text,
    :host-context(.nf-listing-page--no-spacing) .nf-page-header__icon {
      padding: 0 !important;
      margin: 0 !important;
      gap: 0 !important;
    }
    :host-context(.nf-listing-page--no-spacing) .nf-page-header__breadcrumbs {
      padding: 0 !important;
      margin: 0 0 var(--nf-page-header-breadcrumb-gap, 4px) 0 !important;
    }
  `],
})
export class PageHeaderComponent {
  // ═══════════════════════════════════════════════════════════════════════════
  // Inputs - Config object (recommended)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Single config object containing all header settings */
  config = input<PageHeaderConfig | undefined>(undefined);

  // ═══════════════════════════════════════════════════════════════════════════
  // Inputs - Individual (backward compatible)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Page title - use config.title or this input */
  title = input<string | undefined>(undefined);
  /** Page subtitle - use config.subtitle or this input */
  subtitle = input<string | undefined>(undefined);
  /** Material icon - use config.icon or this input */
  icon = input<string | undefined>(undefined);
  /** Breadcrumb items - use config.breadcrumbs or this input */
  breadcrumbs = input<BreadcrumbItem[] | undefined>(undefined);
  /** Primary action - use config.primaryAction or this input */
  primaryAction = input<PageHeaderAction | undefined>(undefined);
  /** Secondary action - use config.secondaryAction or this input */
  secondaryAction = input<PageHeaderAction | undefined>(undefined);

  // ═══════════════════════════════════════════════════════════════════════════
  // Outputs
  // ═══════════════════════════════════════════════════════════════════════════

  actionClick = output<{ type: 'primary' | 'secondary'; action: PageHeaderAction }>();

  // ═══════════════════════════════════════════════════════════════════════════
  // Computed - Effective values (config takes precedence over individual inputs)
  // ═══════════════════════════════════════════════════════════════════════════

  effectiveTitle(): string {
    return this.config()?.title ?? this.title() ?? '';
  }

  effectiveSubtitle(): string | undefined {
    return this.config()?.subtitle ?? this.subtitle();
  }

  effectiveIcon(): string | undefined {
    return this.config()?.icon ?? this.icon();
  }

  effectiveBreadcrumbs(): BreadcrumbItem[] {
    return this.config()?.breadcrumbs ?? this.breadcrumbs() ?? [];
  }

  effectivePrimaryAction(): PageHeaderAction | undefined {
    return this.config()?.primaryAction ?? this.primaryAction();
  }

  effectiveSecondaryAction(): PageHeaderAction | undefined {
    return this.config()?.secondaryAction ?? this.secondaryAction();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Event Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  onActionClick(type: 'primary' | 'secondary', action: PageHeaderAction): void {
    this.actionClick.emit({ type, action });
  }
}
