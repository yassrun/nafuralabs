import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

import type { FilterFieldConfig } from '../../../types';

/** One rendered chip: field key + translated label + display value. */
export interface FilterChipEntry {
  key: string;
  label: string;
  display: string;
}

/**
 * Filter Chips (`nf-filter-chips`)
 *
 * Renders the currently active filter values as removable pills
 * (« Statut: Actif × »). The × emits `remove(key)` — the parent owns the
 * filter state. Select/multiselect values are mapped back to their option
 * labels when the field config provides options.
 *
 * @example
 * <nf-filter-chips
 *   [fields]="config.filters ?? []"
 *   [values]="filterValues()"
 *   (remove)="removeFilter($event)"
 * />
 */
@Component({
  selector: 'nf-filter-chips',
  standalone: true,
  imports: [CommonModule, TranslateModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (chip of chips(); track chip.key) {
      <span class="nf-filter-chip" [attr.data-filter-key]="chip.key">
        <span class="nf-filter-chip__label">{{ chip.label | translate }}:</span>
        <span class="nf-filter-chip__value">{{ chip.display | translate }}</span>
        <button
          type="button"
          class="nf-filter-chip__remove"
          [attr.aria-label]="('Remove filter' | translate) + ' ' + (chip.label | translate)"
          (click)="remove.emit(chip.key)"
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
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
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
        transition: all 0.1s ease;
      }
      .nf-filter-chip__remove:hover {
        background: var(--nf-color-gray-200, #e5e7eb);
        color: var(--nf-text-primary, #111827);
      }
    `,
  ],
})
export class FilterChipsComponent {
  /** Field configs — used for labels and option-label mapping. */
  readonly fields = input<FilterFieldConfig[]>([]);
  /** Active filter values (parent-owned). */
  readonly values = input<Record<string, unknown>>({});

  /** Chip × clicked — remove this filter key. */
  readonly remove = output<string>();

  readonly chips = computed((): FilterChipEntry[] => {
    const values = this.values();
    return Object.keys(values)
      .filter((key) => this.isActive(values[key]))
      .map((key) => ({
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

  private displayValue(key: string, value: unknown): string {
    const field = this.fieldFor(key);
    if (Array.isArray(value)) {
      return value.map((v) => this.optionLabel(field, v)).join(', ');
    }
    return this.optionLabel(field, value);
  }

  private optionLabel(field: FilterFieldConfig | undefined, value: unknown): string {
    const option = field?.options?.find((o) => o.value === value);
    return option?.label ?? String(value);
  }
}
