import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Page Title Component
 *
 * Page header with title, subtitle, and actions.
 *
 * @deprecated Use nf-page-header instead.
 *
 * @example
 * <nf-page-title title="Locations" subtitle="Manage warehouse locations" icon="location_on">
 *   <div actions>
 *     <nf-button variant="primary" icon="add">Add Location</nf-button>
 *   </div>
 * </nf-page-title>
 */
@Component({
  selector: 'nf-page-title',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="nf-page-title">
      <div class="nf-page-title__content">
        @if (icon()) {
          <mat-icon class="nf-page-title__icon">{{ icon() }}</mat-icon>
        }
        <div class="nf-page-title__text">
          <h1 class="nf-page-title__title">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="nf-page-title__subtitle">{{ subtitle() }}</p>
          }
        </div>
      </div>
      <div class="nf-page-title__actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .nf-page-title {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 0;
      margin-bottom: 24px;
    }

    .nf-page-title__content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .nf-page-title__icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--nf-color-primary, #1976d2);
      margin-top: 4px;
    }

    .nf-page-title__text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nf-page-title__title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--nf-color-text, #333);
      line-height: 1.3;
    }

    .nf-page-title__subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: var(--nf-color-text-secondary, #666);
    }

    .nf-page-title__actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .nf-page-title {
        flex-direction: column;
        align-items: stretch;
      }

      .nf-page-title__actions {
        justify-content: flex-end;
      }
    }
  `],
})
export class PageTitleComponent {
  // Inputs
  title = input.required<string>();
  subtitle = input<string | undefined>(undefined);
  icon = input<string | undefined>(undefined);
}
