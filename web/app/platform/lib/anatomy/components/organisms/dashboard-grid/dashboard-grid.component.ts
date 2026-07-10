import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Dashboard Grid Component
 *
 * 12-column responsive grid container for dashboard panels.
 */
@Component({
  selector: 'nf-dashboard-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-content></ng-content>
  `,
  styles: [
    `
      :host {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: var(--nf-space-4, 16px);
        margin-top: var(--nf-space-4, 16px);
        width: 100%;
        min-width: 0;
      }
    `,
  ],
})
export class DashboardGridComponent {}
