import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { FilterFieldConfig, LookupContext } from '../../../types';
import { ButtonComponent } from '../../atoms/button';

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
  ],
  template: `
    <div class="nf-filter-builder" (click)="$event.stopPropagation()">
      <div class="nf-filter-builder__header">{{ 'Filters' | translate }}</div>
      <div class="nf-filter-builder__fields">
        @for (filter of filters(); track filter.key) {
          <div class="nf-filter-builder__field">
            @switch (filter.type) {
              @case ('select') {
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
      padding: var(--nf-space-2, 8px) var(--nf-space-3, 12px);
      width: 100%;
      min-width: 480px;
      max-width: 100%;
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
      grid-template-columns: 1fr 1fr;
      gap: var(--nf-space-2, 8px) var(--nf-space-3, 12px);
      margin-bottom: var(--nf-space-3, 12px);
    }

    .nf-filter-builder__field {
      width: 100%;
      min-width: 0;
    }

    .nf-filter-builder__field mat-form-field {
      width: 100%;
    }

    .nf-filter-builder__actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--nf-space-2, 8px);
      padding-top: var(--nf-space-2, 8px);
      padding-bottom: var(--nf-space-2, 8px);
      border-top: 1px solid var(--nf-border-default);
    }
  `],
})
export class FilterBuilderComponent {
  filters = input.required<FilterFieldConfig[]>();
  values = input<Record<string, unknown>>({});
  lookups = input<LookupContext>({});
  /** When this changes (e.g. menu opened), pending state is synced from values(). */
  openCount = input<number>(0);

  apply = output<Record<string, unknown>>();
  clear = output<void>();

  private readonly pending = signal<Record<string, unknown>>({});

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
    this.clear.emit();
  }
}
