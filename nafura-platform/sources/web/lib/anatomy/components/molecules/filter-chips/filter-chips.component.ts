import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

import type { FilterClause, FilterFieldConfig, FilterGroup } from '../../../types';
import {
  collectLeaves,
  FILTER_OPERATOR_LABELS,
} from '../../organisms/listing-flat/listing-query-state.util';

/** One rendered chip: leaf index + translated label + display value. */
export interface FilterChipEntry {
  leafIndex: number;
  key: string;
  label: string;
  display: string;
}

/**
 * Filter Chips (`nf-filter-chips`)
 *
 * Renders active filter clauses as removable pills (« Status is Active × »).
 */
@Component({
  selector: 'nf-filter-chips',
  standalone: true,
  imports: [CommonModule, TranslateModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (chip of chips(); track chip.leafIndex) {
      <span class="nf-filter-chip" [attr.data-filter-key]="chip.key">
        <span class="nf-filter-chip__label">{{ chip.label | translate }}:</span>
        <span class="nf-filter-chip__value">{{ chip.display | translate }}</span>
        <button
          type="button"
          class="nf-filter-chip__remove"
          [attr.aria-label]="('Remove filter' | translate) + ' ' + (chip.label | translate)"
          (click)="removeLeaf.emit(chip.leafIndex)"
        >
          <lucide-icon name="x" [size]="12" />
        </button>
      </span>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .nf-filter-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 26px;
        padding: 0 6px 0 8px;
        border-radius: 6px;
        background: var(--nf-color-gray-50, #f9fafb);
        border: 1px solid var(--nf-border-default, #e5e7eb);
        font-size: 0.75rem;
        color: var(--nf-text-primary, #111827);
        white-space: nowrap;
        flex: 0 0 auto;
      }
      .nf-filter-chip__label {
        color: var(--nf-text-muted, #6b7280);
        font-weight: 400;
      }
      .nf-filter-chip__value {
        font-weight: 600;
        color: var(--nf-text-primary, #111827);
      }
      .nf-filter-chip__remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        padding: 0;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--nf-text-muted, #9ca3af);
        cursor: pointer;
      }
      .nf-filter-chip__remove:hover {
        background: var(--nf-color-gray-200, #e5e7eb);
        color: var(--nf-text-primary, #111827);
      }
    `,
  ],
})
export class FilterChipsComponent {
  readonly fields = input<FilterFieldConfig[]>([]);
  /** @deprecated Prefer `group`. */
  readonly values = input<Record<string, unknown>>({});
  readonly group = input<FilterGroup | null>(null);

  /** Chip × — remove leaf by depth-first index. */
  readonly removeLeaf = output<number>();
  /** @deprecated Prefer removeLeaf. */
  readonly remove = output<string>();

  readonly chips = computed((): FilterChipEntry[] => {
    const group = this.group();
    const fields = this.fields();
    if (group) {
      return collectLeaves(group).map((clause, leafIndex) => ({
        leafIndex,
        key: clause.field,
        label: this.fieldFor(clause.field)?.label ?? clause.field,
        display: this.clauseDisplay(clause),
      }));
    }
    // Legacy values map → eq chips
    const values = this.values();
    return Object.keys(values)
      .filter((key) => this.isActive(values[key]))
      .map((key, leafIndex) => ({
        leafIndex,
        key,
        label: this.fieldFor(key)?.label ?? key,
        display: this.displayValue(key, values[key]),
      }));
  });

  private fieldFor(key: string): FilterFieldConfig | undefined {
    return this.fields().find((f) => f.key === key);
  }

  private isActive(value: unknown): boolean {
    if (value == null || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  private clauseDisplay(clause: FilterClause): string {
    const opLabel = FILTER_OPERATOR_LABELS[clause.op] ?? clause.op;
    if (clause.op === 'isEmpty' || clause.op === 'isNotEmpty') {
      return opLabel;
    }
    const valueLabel = this.displayValue(clause.field, clause.value);
    // « Rôle : Éditeur » reads better than « Rôle : is Éditeur ».
    if (clause.op === 'eq' || clause.op === 'in') {
      return valueLabel;
    }
    return `${opLabel} ${valueLabel}`.trim();
  }

  private displayValue(key: string, value: unknown): string {
    const field = this.fieldFor(key);
    if (Array.isArray(value)) {
      return value.map((v) => this.optionLabel(field, v)).join(', ');
    }
    return this.optionLabel(field, value);
  }

  private optionLabel(field: FilterFieldConfig | undefined, value: unknown): string {
    const option = field?.options?.find((o) => o.value === value);
    return option?.label ?? String(value ?? '');
  }
}
