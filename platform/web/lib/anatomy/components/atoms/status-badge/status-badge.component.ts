import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';
import { resolveStatus } from './status-mapping';

/**
 * StatusBadge — centralized entity-aware status badge.
 * Resolves label, variant, and tooltip from the central status mapping.
 *
 * @example
 * <nf-status-badge entityType="BC" [status]="bc.status"></nf-status-badge>
 * <nf-status-badge entityType="CHANTIER" [status]="chantier.status"></nf-status-badge>
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
  readonly entityType = input.required<string>();
  readonly status = input.required<string>();

  readonly def = computed(() => resolveStatus(this.entityType(), this.status()));
}
