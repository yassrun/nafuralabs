import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';
import { STATUS_MAPPING_CATALOG, resolveStatus } from './status-mapping';

/**
 * StatusBadge — entity-aware status badge.
 * Resolves label/variant/tooltip from product STATUS_MAPPING_CATALOG.
 */
@Component({
  selector: 'nf-status-badge',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  template: `
    <nf-badge [variant]="def().variant" [title]="def().tooltip">
      {{ def().label }}
    </nf-badge>
  `,
})
export class StatusBadgeComponent {
  private readonly catalog = inject(STATUS_MAPPING_CATALOG);

  readonly entityType = input.required<string>();
  readonly status = input.required<string>();

  readonly def = computed(() =>
    resolveStatus(this.entityType(), this.status(), this.catalog),
  );
}
