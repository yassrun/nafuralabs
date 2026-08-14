import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export type DashboardPanelSpan = 'full' | 'half' | 'third' | 'two-thirds';

/**
 * Dashboard Panel Component
 *
 * Card container with title, optional actions, and footer slot.
 */
@Component({
  selector: 'nf-dashboard-panel',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  host: {
    '[class.nf-dashboard-panel]': 'true',
    '[class.nf-dashboard-panel--full]': "span() === 'full'",
    '[class.nf-dashboard-panel--half]': "span() === 'half'",
    '[class.nf-dashboard-panel--third]': "span() === 'third'",
    '[class.nf-dashboard-panel--two-thirds]': "span() === 'two-thirds'",
  },
  template: `
    <header class="nf-dashboard-panel__header">
      <h2 class="nf-dashboard-panel__title">{{ title() | translate }}</h2>
      <div class="nf-dashboard-panel__actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </header>

    <div class="nf-dashboard-panel__content">
      <ng-content></ng-content>
    </div>

    <footer class="nf-dashboard-panel__footer">
      <ng-content select="[footer]"></ng-content>
    </footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--nf-space-3, 12px);
        padding: var(--nf-space-4, 16px);
        border: 1px solid var(--nf-border-default);
        border-radius: var(--nf-radius-lg, 12px);
        background: var(--nf-surface-section);
        min-width: 0;
      }

      :host(.nf-dashboard-panel--half) {
        grid-column: span 6;
      }

      :host(.nf-dashboard-panel--third) {
        grid-column: span 4;
      }

      :host(.nf-dashboard-panel--two-thirds) {
        grid-column: span 8;
      }

      :host(.nf-dashboard-panel--full) {
        grid-column: span 12;
      }

      @media (max-width: 1200px) {
        :host(.nf-dashboard-panel--half),
        :host(.nf-dashboard-panel--third),
        :host(.nf-dashboard-panel--two-thirds) {
          grid-column: span 12;
        }
      }

      .nf-dashboard-panel__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--nf-space-3, 12px);
      }

      .nf-dashboard-panel__title {
        margin: 0;
        font-size: var(--nf-font-size-lg, 1.125rem);
        font-weight: var(--nf-font-weight-semibold, 600);
        color: var(--nf-text-primary);
      }

      .nf-dashboard-panel__actions {
        display: flex;
        align-items: center;
        gap: var(--nf-space-2, 8px);
      }

      .nf-dashboard-panel__footer:empty {
        display: none;
      }
    `,
  ],
})
export class DashboardPanelComponent {
  title = input<string>('');
  span = input<DashboardPanelSpan>('half');
}
