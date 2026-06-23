import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import type { LocationType } from '../../models';

/**
 * Pastille type d’emplacement stock (dépôt, chantier, transit…).
 */
@Component({
  selector: 'app-location-type-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="ltb" [class]="badgeClass()">
      {{ label() }}
    </span>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    .ltb {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .ltb--depot {
      background: color-mix(in srgb, var(--nf-info) 15%, transparent);
      color: var(--nf-info);
    }
    .ltb--chantier {
      background: color-mix(in srgb, var(--nf-warning) 15%, transparent);
      color: var(--nf-warning);
    }
    .ltb--muted {
      background: color-mix(in srgb, var(--nf-text-secondary, var(--nf-color-text-secondary)) 12%, transparent);
      color: var(--nf-text-secondary, var(--nf-color-text-secondary));
    }
  `,
})
export class LocationTypeBadgeComponent {
  readonly type = input.required<LocationType>();

  readonly label = computed(() => {
    switch (this.type()) {
      case 'DEPOT':
        return 'Dépôt';
      case 'ENTREPOT':
        return 'Entrepôt';
      case 'CHANTIER':
        return 'Chantier';
      case 'TRANSIT':
        return 'Transit';
      case 'VIRTUEL':
        return 'Virtuel';
      default:
        return this.type();
    }
  });

  readonly badgeClass = computed(() => {
    const t = this.type();
    if (t === 'CHANTIER') return 'ltb ltb--chantier';
    if (t === 'DEPOT' || t === 'ENTREPOT') return 'ltb ltb--depot';
    return 'ltb ltb--muted';
  });
}
