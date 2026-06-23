import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MatrixCellType = 'toggle' | 'text' | 'number';

export interface MatrixRow {
  id: string;
  label: string;
}

export interface MatrixColumn {
  id: string;
  label: string;
  type?: MatrixCellType;
}

export type MatrixValueMap = Record<string, Record<string, string | number | boolean | null>>;

export interface MatrixValueChangeEvent {
  rowId: string;
  columnId: string;
  value: string | number | boolean | null;
}

@Component({
  selector: 'nf-matrix-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nf-matrix-grid">
      @if (rows().length === 0 || columns().length === 0) {
        <p class="nf-matrix-grid__empty">{{ emptyLabel() }}</p>
      } @else {
        <div class="nf-matrix-grid__scroll">
          <table class="nf-matrix-grid__table">
            <thead>
              <tr>
                <th class="nf-matrix-grid__header nf-matrix-grid__header--row">{{ rowHeaderLabel() }}</th>
                @for (column of columns(); track column.id) {
                  <th class="nf-matrix-grid__header">{{ column.label }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.id) {
                <tr>
                  <th class="nf-matrix-grid__row-label">{{ row.label }}</th>
                  @for (column of columns(); track column.id) {
                    <td class="nf-matrix-grid__cell">
                      @switch (column.type || defaultType()) {
                        @case ('text') {
                          <input
                            class="nf-matrix-grid__input"
                            type="text"
                            [disabled]="!editable()"
                            [value]="textValue(row.id, column.id)"
                            (input)="onTextInput(row.id, column.id, $event)">
                        }
                        @case ('number') {
                          <input
                            class="nf-matrix-grid__input"
                            type="number"
                            [disabled]="!editable()"
                            [value]="numberValue(row.id, column.id)"
                            (input)="onNumberInput(row.id, column.id, $event)">
                        }
                        @default {
                          <input
                            class="nf-matrix-grid__toggle"
                            type="checkbox"
                            [disabled]="!editable()"
                            [checked]="booleanValue(row.id, column.id)"
                            (change)="onToggle(row.id, column.id, $event)">
                        }
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .nf-matrix-grid {
      border: 1px solid var(--nf-border-default);
      border-radius: 10px;
      background: var(--nf-surface-card);
    }
    .nf-matrix-grid__empty {
      margin: 0;
      padding: 12px;
      color: var(--nf-text-muted);
    }
    .nf-matrix-grid__scroll {
      overflow: auto;
      max-width: 100%;
    }
    .nf-matrix-grid__table {
      width: 100%;
      min-width: 560px;
      border-collapse: collapse;
    }
    .nf-matrix-grid__header,
    .nf-matrix-grid__row-label {
      background: var(--nf-surface-section);
      color: var(--nf-text-primary);
      border-bottom: 1px solid var(--nf-border-default);
      padding: 8px 10px;
      text-align: left;
      font-size: var(--nf-font-size-sm, 0.875rem);
    }
    .nf-matrix-grid__header { font-weight: var(--nf-font-weight-semibold, 600); }
    .nf-matrix-grid__header--row,
    .nf-matrix-grid__row-label {
      position: sticky;
      left: 0;
      z-index: 1;
      min-width: 180px;
    }
    .nf-matrix-grid__cell {
      border-bottom: 1px solid var(--nf-border-default);
      border-left: 1px solid var(--nf-border-default);
      padding: 6px 8px;
      text-align: center;
      background: var(--nf-surface-card);
    }
    .nf-matrix-grid__input {
      width: 100%;
      min-width: 80px;
      border: 1px solid var(--nf-border-default);
      border-radius: 6px;
      padding: 4px 6px;
      color: var(--nf-text-primary);
      background: var(--nf-surface-card);
    }
    .nf-matrix-grid__toggle { width: 16px; height: 16px; cursor: pointer; }
  `],
})
export class MatrixGridComponent {
  rows = input<MatrixRow[]>([]);
  columns = input<MatrixColumn[]>([]);
  values = input<MatrixValueMap>({});
  editable = input<boolean>(true);
  defaultType = input<MatrixCellType>('toggle');
  rowHeaderLabel = input<string>('Item');
  emptyLabel = input<string>('No matrix rows or columns configured.');

  valueChange = output<MatrixValueChangeEvent>();

  textValue(rowId: string, columnId: string): string {
    const value = this.values()?.[rowId]?.[columnId];
    return typeof value === 'string' ? value : '';
  }

  numberValue(rowId: string, columnId: string): number | null {
    const value = this.values()?.[rowId]?.[columnId];
    return typeof value === 'number' ? value : null;
  }

  booleanValue(rowId: string, columnId: string): boolean {
    const value = this.values()?.[rowId]?.[columnId];
    return Boolean(value);
  }

  onTextInput(rowId: string, columnId: string, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.valueChange.emit({ rowId, columnId, value: target?.value ?? '' });
  }

  onNumberInput(rowId: string, columnId: string, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const raw = target?.value?.trim() ?? '';
    this.valueChange.emit({ rowId, columnId, value: raw === '' ? null : Number(raw) });
  }

  onToggle(rowId: string, columnId: string, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.valueChange.emit({ rowId, columnId, value: Boolean(target?.checked) });
  }
}

