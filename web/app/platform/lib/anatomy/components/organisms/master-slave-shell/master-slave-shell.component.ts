/**
 * Master–Slave Shell Component
 *
 * Two-pane layout: persistent list (master) on the left, detail (slave) on the right.
 * Single click on a row opens the slave pane (Master–Slave pattern).
 * Responsive: on narrow viewports the slave becomes an overlay (drawer-like).
 *
 * @example
 * <nf-master-slave-shell
 *   [selectedId]="selectedId()"
 *   (selectedIdChange)="onSelectedIdChange($event)">
 *   <ng-container master>...</ng-container>
 *   <ng-container slave>...</ng-container>
 * </nf-master-slave-shell>
 */

import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nf-master-slave-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="nf-master-slave-shell"
      [class.nf-master-slave-shell--has-selection]="hasSelection()">
      <!-- Backdrop when narrow and slave open (click to close) -->
      @if (hasSelection()) {
        <button
          type="button"
          class="nf-master-slave-shell__backdrop"
          aria-label="Close detail"
          (click)="onCloseSlave()"
        ></button>
      }

      <div class="nf-master-slave-shell__master" role="region" aria-label="List">
        <ng-content select="[master]"></ng-content>
      </div>
      @if (hasSelection()) {
        <div
          class="nf-master-slave-shell__slave nf-master-slave-shell__slave--open"
          role="region"
          aria-label="Detail">
          <ng-content select="[slave]"></ng-content>
        </div>
      }
    </div>
  `,
  styleUrls: ['./master-slave-shell.component.scss'],
})
export class MasterSlaveShellComponent {
  /** Currently selected entity id (drives URL in parent). Null = no selection. */
  selectedId = input<string | null>(null);

  /** Emitted when selection should change (parent updates URL). */
  selectedIdChange = output<string | null>();

  hasSelection = computed(() => !!this.selectedId());

  onCloseSlave(): void {
    this.selectedIdChange.emit(null);
  }
}
