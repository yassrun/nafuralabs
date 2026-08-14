import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { BadgeComponent, ButtonComponent } from '@lib/anatomy/components';
import type { LotChantier } from '@app/chantiers/models';

import { buildPhaseCode, type ParsedPlanningTask } from '../../utils/planning-gantt-pdf.util';

export interface PhaseImportPreviewRow extends ParsedPlanningTask {
  selected: boolean;
  code: string;
}

export interface PhaseImportPreviewDialogData {
  tasks: ParsedPlanningTask[];
  lots: LotChantier[];
}

export interface PhaseImportPreviewDialogResult {
  tasks: PhaseImportPreviewRow[];
}

@Component({
  selector: 'app-phase-import-preview-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, TranslateModule, ButtonComponent, BadgeComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ 'chantiers.chantier.detail.phases.importPreviewTitle' | translate }}</h2>
        <nf-button variant="ghost" icon="x" (clicked)="close()" [attr.aria-label]="'common.close' | translate"></nf-button>
      </header>

      <p class="summary">
        {{ 'chantiers.chantier.detail.phases.importPreviewSummary' | translate:{ selected: selectedCount(), total: rows().length } }}
      </p>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="check-col">
                <input type="checkbox" [checked]="allSelected()" (change)="toggleAll($event)" />
              </th>
              <th>{{ 'chantiers.chantier.detail.columns.code' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.columns.designation' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.columns.debut' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.columns.fin' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.phases.importPreviewLot' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.numero) {
              <tr [class.row--payment]="row.isPaymentMilestone">
                <td class="check-col">
                  <input type="checkbox" [checked]="row.selected" (change)="toggleRow(row.numero, $event)" />
                </td>
                <td><strong>{{ row.code }}</strong></td>
                <td>{{ row.designation }}</td>
                <td class="date">{{ row.dateDebut | date:'dd/MM/yy' }}</td>
                <td class="date">{{ row.dateFin | date:'dd/MM/yy' }}</td>
                <td>
                  <select [ngModel]="row.lotId ?? ''" (ngModelChange)="setLotId(row.numero, $event)">
                    <option value="">{{ 'chantiers.chantier.detail.phases.importPreviewNoLot' | translate }}</option>
                    @for (lot of data.lots; track lot.id) {
                      <option [value]="lot.id">{{ lot.code }} — {{ lot.designation }}</option>
                    }
                  </select>
                </td>
                <td>
                  @if (row.isPaymentMilestone) {
                    <nf-badge variant="warning">{{ 'chantiers.chantier.detail.phases.importPreviewPaymentBadge' | translate }}</nf-badge>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <footer>
        <nf-button variant="ghost" (clicked)="close()">
          {{ 'chantiers.chantier.detail.cancel' | translate }}
        </nf-button>
        <nf-button variant="primary" [disabled]="selectedCount() === 0" (clicked)="confirm()">
          {{ 'chantiers.chantier.detail.phases.importPreviewConfirm' | translate:{ count: selectedCount() } }}
        </nf-button>
      </footer>
    </div>
  `,
  styles: [`
    .dialog-shell { display: flex; flex-direction: column; gap: 1rem; width: min(960px, 92vw); max-height: 85vh; }
    header, footer { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
    header h2 { margin: 0; font-size: 1.1rem; }
    .summary { margin: 0; color: var(--nf-color-text-secondary); }
    .table-wrap { overflow: auto; border: 1px solid var(--nf-color-border); border-radius: 8px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .data-table th, .data-table td { padding: 0.55rem 0.65rem; border-bottom: 1px solid var(--nf-color-bg-muted); vertical-align: middle; }
    .data-table th { text-align: left; background: var(--nf-color-bg-muted); position: sticky; top: 0; z-index: 1; }
    .check-col { width: 2.5rem; text-align: center; }
    .date { white-space: nowrap; }
    select { width: 100%; min-width: 9rem; }
    .row--payment { opacity: 0.75; }
    footer { justify-content: flex-end; }
  `],
})
export class PhaseImportPreviewDialogComponent {
  readonly data = inject<PhaseImportPreviewDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PhaseImportPreviewDialogComponent, PhaseImportPreviewDialogResult | undefined>);

  readonly rows = signal<PhaseImportPreviewRow[]>(
    this.data.tasks.map((task) => ({
      ...task,
      selected: !task.isPaymentMilestone,
      code: buildPhaseCode(task.numero),
    })),
  );

  readonly selectedCount = computed(() => this.rows().filter((row) => row.selected).length);

  readonly allSelected = computed(() => {
    const current = this.rows();
    return current.length > 0 && current.every((row) => row.selected);
  });

  close(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
    this.dialogRef.close({ tasks: this.rows().filter((row) => row.selected) });
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.rows.update((rows) => rows.map((row) => ({ ...row, selected: checked })));
  }

  toggleRow(numero: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.rows.update((rows) =>
      rows.map((row) => (row.numero === numero ? { ...row, selected: checked } : row)),
    );
  }

  setLotId(numero: number, lotId: string): void {
    this.rows.update((rows) =>
      rows.map((row) => (row.numero === numero ? { ...row, lotId: lotId || undefined } : row)),
    );
  }
}
