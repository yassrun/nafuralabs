import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../../atoms/button';
import { ListingQueryStore } from '../listing-query.store';

/** « Views » button and menu of the toolbar; loaded on demand (`@defer`) since only lists with saved views show it. */
@Component({
  selector: 'nf-listing-saved-views',
  standalone: true,
  imports: [TranslateModule, MatMenuModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-button
      variant="secondary"
      size="xs"
      iconLibrary="lucide"
      icon="bookmark"
      [active]="store.viewDirty()"
      [matMenuTriggerFor]="viewsMenu"
      [tooltip]="'Saved views' | translate"
      [attr.aria-label]="'Saved views' | translate"
    >
      {{ 'Views' | translate }}
      @if (store.viewDirty()) {
        <span class="nf-listing-flat__dirty-dot" aria-hidden="true">•</span>
      }
    </nf-button>
    <mat-menu #viewsMenu="matMenu" class="nf-listing-flat-menu nf-listing-flat-menu--views">
      <div class="nf-views-menu" (click)="$event.stopPropagation()">
        @if (store.savedViews().length === 0) {
          <p class="nf-views-menu__empty">{{ 'No saved views yet' | translate }}</p>
        }
        @for (view of store.savedViews(); track view.id) {
          <button type="button" class="nf-views-menu__item" (click)="store.applySavedView(view)">
            <span>{{ view.name }}</span>
            @if (view.isDefault) {
              <span class="nf-views-menu__badge">{{ 'Default' | translate }}</span>
            }
            @if (store.activeSavedViewId() === view.id) {
              <span class="nf-views-menu__active">{{ 'Active' | translate }}</span>
            }
          </button>
        }
        <div class="nf-views-menu__actions">
          <button type="button" class="nf-views-menu__action" (click)="store.promptSaveView(false)">
            {{ 'Save current' | translate }}
          </button>
          @if (store.activeSavedViewId()) {
            <button type="button" class="nf-views-menu__action" (click)="store.promptSaveView(true)">
              {{ 'Update view' | translate }}
            </button>
            <button
              type="button"
              class="nf-views-menu__action nf-views-menu__action--danger"
              (click)="store.deleteActiveView()"
            >
              {{ 'Delete view' | translate }}
            </button>
          }
        </div>
      </div>
    </mat-menu>
  `,
  styles: `
    :host {
      display: contents;
    }
    .nf-listing-flat__dirty-dot {
      color: var(--nf-warning, #d97706);
      margin-left: 2px;
    }
    .nf-views-menu {
      min-width: 220px;
      padding: 8px;
    }
    .nf-views-menu__empty {
      margin: 0 0 8px;
      font-size: 0.75rem;
      color: var(--nf-text-muted, #6b7280);
    }
    .nf-views-menu__item {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      border: none;
      background: transparent;
      padding: 6px 8px;
      border-radius: 6px;
      font: inherit;
      font-size: 0.8125rem;
      text-align: left;
      cursor: pointer;
    }
    .nf-views-menu__item:hover {
      background: var(--nf-surface-hover, #f9fafb);
    }
    .nf-views-menu__badge,
    .nf-views-menu__active {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--nf-primary, #2563eb);
    }
    .nf-views-menu__actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--nf-border-default, #e5e7eb);
    }
    .nf-views-menu__action {
      border: none;
      background: transparent;
      padding: 4px 8px;
      font: inherit;
      font-size: 0.75rem;
      text-align: left;
      color: var(--nf-primary, #2563eb);
      cursor: pointer;
      border-radius: 4px;
    }
    .nf-views-menu__action:hover {
      background: var(--nf-primary-light, #eff6ff);
    }
    .nf-views-menu__action--danger {
      color: var(--nf-danger, #dc2626);
    }
  `,
})
export class ListingSavedViewsComponent {
  protected readonly store = inject(ListingQueryStore);
}
