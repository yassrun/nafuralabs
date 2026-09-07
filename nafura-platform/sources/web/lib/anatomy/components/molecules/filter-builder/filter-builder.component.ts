import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { FilterFieldConfig, LookupContext } from '../../../types';
import { ButtonComponent } from '../../atoms/button';
import { NfSelectComponent } from '../../atoms/select';
import { LOOKUP_SEARCHERS } from '../../../tokens/lookup-searchers.token';
import type { LookupSearchFn } from '../../../tokens/lookup-searchers.token';
import { LOOKUP_PICKERS } from '../../../tokens/lookup-pickers.token';
import type { LookupPickerFn } from '../../../tokens/lookup-pickers.token';

/**
 * Filter Builder Component (nf-filter-builder)
 *
 * Compact form for building filters, intended for use inside a popup (e.g. mat-menu).
 * Renders fields from FilterFieldConfig, Apply and Clear actions.
 * Internal state is synced from values when openCount changes (e.g. when menu opens).
 */
@Component({
  selector: 'nf-filter-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
    ButtonComponent,
    NfSelectComponent,
  ],
  template: `
    <div class="nf-filter-builder" (click)="$event.stopPropagation()">
      <div class="nf-filter-builder__header">{{ 'Filters' | translate }}</div>
      <div class="nf-filter-builder__fields">
        @for (filter of filters(); track filter.key) {
          <div class="nf-filter-builder__field">
            @switch (filter.type) {
              @case ('select') {
                @if (isLookupPicker(filter)) {
                  <div class="nf-filter-builder__picker">
                    <span class="nf-filter-builder__picker-label">{{ filter.label | translate }}</span>
                    <div class="nf-filter-builder__picker-row">
                      <button
                        type="button"
                        class="nf-filter-builder__picker-btn"
                        data-testid="article-picker-open"
                        (click)="openLookupPicker(filter)"
                      >
                        {{ pickerLabel(filter) || ((filter.placeholder ?? 'All') | translate) }}
                      </button>
                      @if (getValue(filter.key)) {
                        <nf-button variant="ghost" size="sm" (clicked)="clearPicker(filter)">{{ 'Clear' | translate }}</nf-button>
                      }
                    </div>
                  </div>
                } @else if (isLookupCombobox(filter)) {
                  <nf-select
                    [label]="filter.label | translate"
                    [placeholder]="(filter.placeholder ?? 'All') | translate"
                    [lookupKey]="filter.lookupKey"
                    [lookupSearch]="lookupSearchFn(filter)"
                    [ngModel]="comboValue(filter.key)"
                    (ngModelChange)="setValue(filter.key, $event)"
                  />
                } @else {
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>{{ filter.label | translate }}</mat-label>
                  <mat-select
                    [ngModel]="getValue(filter.key)"
                    (ngModelChange)="setValue(filter.key, $event)"
                    [placeholder]="(filter.placeholder ?? 'All') | translate">
                    <mat-option [value]="null">{{ (filter.placeholder ?? 'All') | translate }}</mat-option>
                    @for (opt of getOptions(filter); track opt.value) {
                      <mat-option [value]="opt.value">{{ opt.label | translate }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                }
              }
              @case ('text') {
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>{{ filter.label | translate }}</mat-label>
                  <input
                    matInput
                    type="text"
                    [ngModel]="getValue(filter.key)"
                    (ngModelChange)="setValue(filter.key, $event)"
                    [placeholder]="(filter.placeholder ?? filter.label) | translate"
                  />
                </mat-form-field>
              }
              @case ('number') {
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>{{ filter.label | translate }}</mat-label>
                  <input
                    matInput
                    type="number"
                    [ngModel]="getValue(filter.key)"
                    (ngModelChange)="setValue(filter.key, $event != null ? +$event : null)"
                    [placeholder]="(filter.placeholder ?? filter.label) | translate"
                  />
                </mat-form-field>
              }
              @default {
                @if (isLookupPicker(filter)) {
                  <div class="nf-filter-builder__picker">
                    <span class="nf-filter-builder__picker-label">{{ filter.label | translate }}</span>
                    <div class="nf-filter-builder__picker-row">
                      <button
                        type="button"
                        class="nf-filter-builder__picker-btn"
                        data-testid="article-picker-open"
                        (click)="openLookupPicker(filter)"
                      >
                        {{ pickerLabel(filter) || ((filter.placeholder ?? 'All') | translate) }}
                      </button>
                      @if (getValue(filter.key)) {
                        <nf-button variant="ghost" size="sm" (clicked)="clearPicker(filter)">{{ 'Clear' | translate }}</nf-button>
                      }
                    </div>
                  </div>
                } @else if (isLookupCombobox(filter)) {
                  <nf-select
                    [label]="filter.label | translate"
                    [placeholder]="(filter.placeholder ?? 'All') | translate"
                    [lookupKey]="filter.lookupKey"
                    [lookupSearch]="lookupSearchFn(filter)"
                    [ngModel]="comboValue(filter.key)"
                    (ngModelChange)="setValue(filter.key, $event)"
                  />
                } @else {
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>{{ filter.label | translate }}</mat-label>
                  <mat-select
                    [ngModel]="getValue(filter.key)"
                    (ngModelChange)="setValue(filter.key, $event)"
                    [placeholder]="(filter.placeholder ?? 'All') | translate">
                    <mat-option [value]="null">{{ 'All' | translate }}</mat-option>
                    @for (opt of getOptions(filter); track opt.value) {
                      <mat-option [value]="opt.value">{{ opt.label | translate }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                }
              }
            }
          </div>
        }
      </div>
      <div class="nf-filter-builder__actions">
        <nf-button variant="tertiary" size="sm" (clicked)="onClear()">{{ 'Clear' | translate }}</nf-button>
        <nf-button variant="primary" size="sm" (clicked)="onApply()">{{ 'Apply' | translate }}</nf-button>
      </div>
    </div>
  `,
  styles: [`
    .nf-filter-builder {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: var(--nf-space-3, 12px);
      width: fit-content;
      min-width: 260px;
      max-width: min(560px, calc(100vw - 32px));
      box-sizing: border-box;
    }

    .nf-filter-builder__header {
      margin: 0 0 var(--nf-space-2, 8px) 0;
      padding: 0 0 var(--nf-space-2, 8px) 0;
      font-size: var(--nf-font-size-sm);
      font-weight: 600;
      color: var(--nf-text-primary);
      border-bottom: 1px solid var(--nf-border-default);
    }

    .nf-filter-builder__fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--nf-space-2, 8px) var(--nf-space-3, 12px);
      margin-bottom: var(--nf-space-3, 12px);
      width: 100%;
    }

    .nf-filter-builder__field {
      width: 100%;
      min-width: 0;
    }

    .nf-filter-builder__field mat-form-field,
    .nf-filter-builder__field nf-select {
      width: 100%;
      display: block;
    }

    .nf-filter-builder__picker {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      width: 100%;
    }
    .nf-filter-builder__picker-label {
      font-size: var(--nf-font-size-sm, 0.875rem);
      color: var(--nf-text-secondary, #6b7280);
    }
    .nf-filter-builder__picker-row {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .nf-filter-builder__picker-btn {
      flex: 1;
      min-width: 0;
      text-align: left;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--nf-border-default, #d1d5db);
      border-radius: 8px;
      background: var(--nf-color-surface, #fff);
      font: inherit;
      cursor: pointer;
    }

    .nf-filter-builder__actions {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: var(--nf-space-2, 8px);
      flex-shrink: 0;
      padding-top: var(--nf-space-2, 8px);
      border-top: 1px solid var(--nf-border-default);
    }
  `],
})
export class FilterBuilderComponent {
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });
  private readonly lookupPickers = inject(LOOKUP_PICKERS, { optional: true });

  filters = input.required<FilterFieldConfig[]>();
  values = input<Record<string, unknown>>({});
  lookups = input<LookupContext>({});
  /** When this changes (e.g. menu opened), pending state is synced from values(). */
  openCount = input<number>(0);

  apply = output<Record<string, unknown>>();
  clear = output<void>();

  private readonly pending = signal<Record<string, unknown>>({});
  private readonly pickerLabels = signal<Record<string, string>>({});

  constructor() {
    effect(() => {
      this.openCount();
      this.pending.set({ ...this.values() });
    });
  }

  getValue(key: string): unknown {
    return this.pending()[key] ?? null;
  }

  setValue(key: string, value: unknown): void {
    this.pending.update((prev) => ({
      ...prev,
      [key]: value === '' || value === undefined ? null : value,
    }));
  }

  isLookupPicker(filter: FilterFieldConfig): boolean {
    const key = filter.lookupKey?.trim();
    return !!key && !!this.lookupPickers?.[key];
  }

  isLookupCombobox(filter: FilterFieldConfig): boolean {
    const key = filter.lookupKey?.trim();
    if (!key || this.isLookupPicker(filter)) return false;
    // Article = overlay picker (LOOKUP_PICKERS). Never typeahead dump.
    if (key === 'items') return false;
    return true;
  }

  lookupSearchFn(filter: FilterFieldConfig): LookupSearchFn | undefined {
    const key = filter.lookupKey?.trim();
    if (!key || !this.lookupSearchers) return undefined;
    return this.lookupSearchers[key];
  }

  lookupPickerFn(filter: FilterFieldConfig): LookupPickerFn | undefined {
    const key = filter.lookupKey?.trim();
    if (!key || !this.lookupPickers) return undefined;
    return this.lookupPickers[key];
  }

  pickerLabel(filter: FilterFieldConfig): string {
    const value = this.getValue(filter.key);
    if (value == null || value === '') return '';
    return this.pickerLabels()[filter.key] || String(value);
  }

  async openLookupPicker(filter: FilterFieldConfig): Promise<void> {
    const pick = this.lookupPickerFn(filter);
    if (!pick) return;
    const current = this.getValue(filter.key);
    const result = await pick(current == null ? null : String(current));
    if (!result) return;
    this.setValue(filter.key, result.value);
    this.pickerLabels.update((prev) => ({ ...prev, [filter.key]: result.label }));
  }

  clearPicker(filter: FilterFieldConfig): void {
    this.setValue(filter.key, null);
    this.pickerLabels.update((prev) => {
      const next = { ...prev };
      delete next[filter.key];
      return next;
    });
  }

  comboValue(key: string): string {
    const value = this.getValue(key);
    return value == null ? '' : String(value);
  }

  getOptions(filter: FilterFieldConfig): Array<{ label: string; value: unknown }> {
    if (filter.lookupKey) {
      const items = this.lookups()[filter.lookupKey];
      if (Array.isArray(items)) {
        return items.map((item) => ({ label: String(item.value), value: item.key }));
      }
    }
    return filter.options ?? [];
  }

  onApply(): void {
    const current = this.pending();
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(current)) {
      if (v !== null && v !== undefined && v !== '') {
        cleaned[k] = v;
      }
    }
    this.apply.emit(cleaned);
  }

  onClear(): void {
    this.pending.set({});
    this.pickerLabels.set({});
    this.clear.emit();
  }
}
