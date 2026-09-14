import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
 * Renders fields from FilterFieldConfig with clean Anatomy tokens, Apply and Clear actions.
 * Internal state is synced from values when openCount changes (e.g. when menu opens).
 */
@Component({
  selector: 'nf-filter-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
                        <nf-button variant="ghost" size="xs" (clicked)="clearPicker(filter)">{{ 'Clear' | translate }}</nf-button>
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
                  <div class="nf-filter-field">
                    <label class="nf-filter-field__label" [for]="'filter-' + filter.key">{{ filter.label | translate }}</label>
                    <select
                      [id]="'filter-' + filter.key"
                      class="nf-filter-field__control nf-filter-field__control--select"
                      [ngModel]="getValue(filter.key)"
                      (ngModelChange)="setValue(filter.key, $event)"
                    >
                      <option [ngValue]="null">{{ (filter.placeholder ?? 'All') | translate }}</option>
                      @for (opt of getOptions(filter); track opt.value) {
                        <option [ngValue]="opt.value">{{ opt.label | translate }}</option>
                      }
                    </select>
                  </div>
                }
              }
              @case ('text') {
                <div class="nf-filter-field">
                  <label class="nf-filter-field__label" [for]="'filter-' + filter.key">{{ filter.label | translate }}</label>
                  <input
                    [id]="'filter-' + filter.key"
                    type="text"
                    class="nf-filter-field__control"
                    [ngModel]="getValue(filter.key)"
                    (ngModelChange)="setValue(filter.key, $event)"
                    [placeholder]="(filter.placeholder ?? filter.label) | translate"
                  />
                </div>
              }
              @case ('number') {
                <div class="nf-filter-field">
                  <label class="nf-filter-field__label" [for]="'filter-' + filter.key">{{ filter.label | translate }}</label>
                  <input
                    [id]="'filter-' + filter.key"
                    type="number"
                    class="nf-filter-field__control"
                    [ngModel]="getValue(filter.key)"
                    (ngModelChange)="setValue(filter.key, $event != null && $event !== '' ? +$event : null)"
                    [placeholder]="(filter.placeholder ?? filter.label) | translate"
                  />
                </div>
              }
              @case ('date') {
                <div class="nf-filter-field">
                  <label class="nf-filter-field__label" [for]="'filter-' + filter.key">{{ filter.label | translate }}</label>
                  <input
                    [id]="'filter-' + filter.key"
                    type="date"
                    class="nf-filter-field__control"
                    [ngModel]="getValue(filter.key)"
                    (ngModelChange)="setValue(filter.key, $event)"
                  />
                </div>
              }
              @case ('boolean') {
                <div class="nf-filter-field">
                  <label class="nf-filter-field__label" [for]="'filter-' + filter.key">{{ filter.label | translate }}</label>
                  <select
                    [id]="'filter-' + filter.key"
                    class="nf-filter-field__control nf-filter-field__control--select"
                    [ngModel]="getValue(filter.key)"
                    (ngModelChange)="setValue(filter.key, $event)"
                  >
                    <option [ngValue]="null">{{ (filter.placeholder ?? 'All') | translate }}</option>
                    <option [ngValue]="true">{{ 'Yes' | translate }}</option>
                    <option [ngValue]="false">{{ 'No' | translate }}</option>
                  </select>
                </div>
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
                        <nf-button variant="ghost" size="xs" (clicked)="clearPicker(filter)">{{ 'Clear' | translate }}</nf-button>
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
                  <div class="nf-filter-field">
                    <label class="nf-filter-field__label" [for]="'filter-' + filter.key">{{ filter.label | translate }}</label>
                    <select
                      [id]="'filter-' + filter.key"
                      class="nf-filter-field__control nf-filter-field__control--select"
                      [ngModel]="getValue(filter.key)"
                      (ngModelChange)="setValue(filter.key, $event)"
                    >
                      <option [ngValue]="null">{{ (filter.placeholder ?? 'All') | translate }}</option>
                      @for (opt of getOptions(filter); track opt.value) {
                        <option [ngValue]="opt.value">{{ opt.label | translate }}</option>
                      }
                    </select>
                  </div>
                }
              }
            }
          </div>
        }
      </div>
      <div class="nf-filter-builder__actions">
        <nf-button variant="secondary" size="xs" (clicked)="onClear()">{{ 'Clear' | translate }}</nf-button>
        <nf-button variant="primary" size="xs" (clicked)="onApply()">{{ 'Apply' | translate }}</nf-button>
      </div>
    </div>
  `,
  styles: [`
    .nf-filter-builder {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 12px 14px;
      width: fit-content;
      min-width: 260px;
      max-width: min(560px, calc(100vw - 32px));
      box-sizing: border-box;
      background: var(--nf-surface-section, #ffffff);
    }

    .nf-filter-builder__header {
      margin: 0 0 10px 0;
      padding: 0 0 8px 0;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--nf-text-primary, #111827);
      border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
    }

    .nf-filter-builder__fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px 12px;
      margin-bottom: 12px;
      width: 100%;
    }

    .nf-filter-builder__field {
      width: 100%;
      min-width: 0;
    }

    /* ── Anatomy Pure Form Field ── */
    .nf-filter-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }

    .nf-filter-field__label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--nf-text-secondary, #4b5563);
      line-height: 1.25;
      cursor: pointer;
    }

    .nf-filter-field__control {
      width: 100%;
      height: 30px;
      padding: 0 8px;
      font-size: 0.8125rem;
      font-family: inherit;
      color: var(--nf-text-primary, #111827);
      background: var(--nf-surface-section, #ffffff);
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 6px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;

      &::placeholder {
        color: var(--nf-input-placeholder-color, var(--nf-text-muted, #9ca3af));
      }

      &:focus {
        border-color: var(--nf-primary, #2563eb);
        box-shadow: 0 0 0 2px var(--nf-primary-light, #eff6ff);
      }
    }

    .nf-filter-field__control--select {
      cursor: pointer;
      appearance: none;
      padding-right: 26px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-position: right 8px center;
      background-repeat: no-repeat;
    }

    .nf-filter-builder__picker {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .nf-filter-builder__picker-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--nf-text-secondary, #4b5563);
    }
    .nf-filter-builder__picker-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .nf-filter-builder__picker-btn {
      flex: 1;
      min-width: 0;
      text-align: left;
      height: 30px;
      padding: 0 8px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 6px;
      background: var(--nf-surface-section, #fff);
      font-size: 0.8125rem;
      font-family: inherit;
      color: var(--nf-text-primary, #111827);
      cursor: pointer;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
    }

    .nf-filter-builder__actions {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 6px;
      flex-shrink: 0;
      padding-top: 10px;
      border-top: 1px solid var(--nf-border-default, #e5e7eb);
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
