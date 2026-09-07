import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { LucideAngularModule } from 'lucide-angular';

import { ButtonComponent } from '@platform/lib/anatomy/components/atoms/button';

/**
 * Showroom stub of `nf-smart-import-action` (tooltip + mat-menu).
 * Real component lives in document-extraction; not wired to extraction APIs here.
 */
@Component({
  selector: 'sb-smart-import-stub',
  standalone: true,
  imports: [ButtonComponent, MatMenuModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-button
      variant="secondary"
      size="sm"
      icon="sparkles"
      iconLibrary="lucide"
      tooltip="Import magique — menu (info champs · unitaire · bulk)"
      [matMenuTriggerFor]="importMenu"
      aria-haspopup="menu"
      aria-label="Import magique"
    >
      <span class="label">
        Import magique
        <lucide-icon name="chevron-down" [size]="14" aria-hidden="true" />
      </span>
    </nf-button>

    <mat-menu #importMenu="matMenu" xPosition="before">
      <button mat-menu-item type="button" disabled>Info champs (help)</button>
      <button mat-menu-item type="button" disabled>Importer un fichier</button>
      <button mat-menu-item type="button" disabled>Import bulk</button>
    </mat-menu>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .label {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
      }
    `,
  ],
})
export class SmartImportStubComponent {}
